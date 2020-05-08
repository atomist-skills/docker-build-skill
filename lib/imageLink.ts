/*
* Copyright © 2020 Atomist, Inc.
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*     http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/

import { createContext } from "@atomist/skill/lib/context";
import { EventContext } from "@atomist/skill/lib/handler";
import {
    debug,
    info,
} from "@atomist/skill/lib/log";
import { EventIncoming } from "@atomist/skill/lib/payload";
import {
    bold,
    SlackMessage,
    url,
} from "@atomist/slack-messages";
import * as k8s from "@kubernetes/client-node";
import * as fs from "fs-extra";
import * as os from "os";
import {
    BuildOnPushSubscription,
    CreateDockerImageMutation,
    CreateDockerImageMutationVariables,
} from "./typings/types";

/**
 * Script to raise ImageLink events
 *
 * This is used as a side-car container to the user-provided containers
 * to monitor the container at index 0 for termination. Once the
 * container is terminated, an ImageLink event is raised.
 */
export async function imageLink(): Promise<number> {
    const payload = await fs.readJson(process.env.ATOMIST_PAYLOAD || "/atm/payload.json") as EventIncoming;
    info("Starting %s/%s:%s image-link", payload.skill.namespace, payload.skill.name, payload.skill.version);

    const imageName = process.env.DOCKER_BUILD_IMAGE_NAME;
    const providerId = process.env.DOCKER_PROVIDER_ID;

    const ctx: EventContext<BuildOnPushSubscription> = createContext(payload, {} as any) as any;
    const push = ctx.data.Push[0];
    const repo = push?.repo;
    const container = payload.skill.artifacts[0].name;
    const namespace = await readNamespace();
    const name = os.hostname();

    const title = "Docker Build";
    const id = `${payload.skill.namespace}/${payload.skill.name}/${push.after.sha}`;
    const ticks = "```";
    const slackMsg: SlackMessage = {
        attachments: [{
            mrkdwn_in: ["text"], // eslint-disable-line @typescript-eslint/camelcase
            fallback: title,
            title,
            title_link: `https://preview.atomist.${process.env.ATOMIST_GRAPHQL_ENDPOINT.includes("staging") ? "services" : "com"}/log/${ctx.workspaceId}/${ctx.correlationId}`, // eslint-disable-line @typescript-eslint/camelcase
            text: `${bold(`${repo.owner}/${repo.name}/${push.branch}`)} at ${url(push.after.url, `\`${push.after.sha.slice(0, 7)}\``)}\n
${ticks}
Building image ${imageName}
${ticks}`,
            thumb_url: `https://badge.atomist.com/v2/progress/in_process/0/1`, // eslint-disable-line @typescript-eslint/camelcase
            color: "#2A7D7D",
            footer: url(repo.url, `${repo.owner}/${repo.name}`),
            footer_icon: "https://images.atomist.com/rug/github_grey.png", // eslint-disable-line @typescript-eslint/camelcase
            ts: Math.floor(Date.now() / 1000),
        }],
    };
    await ctx.message.send(slackMsg, { channels: repo.channels.map(c => c.name), users: [] }, { id });

    debug("Watching container '%s'", container);
    const status = await containerWatch(name, namespace, container);
    debug("Container exited with '%s'", status);

    if (!!imageName && status === 0) {
        const push = ctx.data.Push[0];
        await ctx.graphql.mutate<CreateDockerImageMutation, CreateDockerImageMutationVariables>({
                root: __dirname,
                path: "graphql/mutation/createDockerImage.graphql",
            },
            {
                sha: push.after.sha,
                branch: push.branch,
                image: imageName,
                providerId,
            });
        slackMsg.attachments[0].color = "#37A745";
        slackMsg.attachments[0].thumb_url = `https://badge.atomist.com/v2/progress/success/1/1`; // eslint-disable-line @typescript-eslint/camelcase
        slackMsg.attachments[0].text = `${bold(`${repo.owner}/${repo.name}/${push.branch}`)} at ${url(push.after.url, `\`${push.after.sha.slice(0, 7)}\``)}\n
${ticks}
Successfully built and pushed image ${imageName}
${ticks}`;
        await ctx.message.send(slackMsg, { channels: repo.channels.map(c => c.name), users: [] }, { id });
    } else if (status !== 0) {
        slackMsg.attachments[0].color = "#BC3D33";
        slackMsg.attachments[0].thumb_url = `https://badge.atomist.com/v2/progress/failure/0/1`; // eslint-disable-line @typescript-eslint/camelcase
        slackMsg.attachments[0].text = `${bold(`${repo.owner}/${repo.name}/${push.branch}`)} at ${url(push.after.url, `\`${push.after.sha.slice(0, 7)}\``)}\n
${ticks}
Failed to built image ${imageName}
${ticks}`;
        await ctx.message.send(slackMsg, { channels: repo.channels.map(c => c.name), users: [] }, { id });
    }

    info("Completed processing. Exiting...");
    return 0;
}

/**
 * Watch the provided container in the pod supplied by name
 * and namespace. Once the container exits.
 *
 * @param name The name of the pod to watch
 * @param namespace The namespace of the pod to watch
 * @param container The container name to watch
 */
function containerWatch(name: string,
                        namespace: string,
                        container: string): Promise<number> {
    return new Promise(async (resolve, reject) => {  // eslint-disable-line no-async-promise-executor

        const kc = loadKubeConfig();

        const watcher = new k8s.Watch(kc);
        const watchPath = `/api/v1/watch/namespaces/${namespace}/pods/${name}`;
        await watcher.watch(watchPath, {}, async (phase, obj) => {
            const pod = obj as k8s.V1Pod;
            if (pod?.status?.containerStatuses) {
                const containerStatus = pod.status.containerStatuses.find(c => c.name === container);
                if (containerStatus?.state?.terminated) {
                    debug("Container exited");
                    resolve(containerStatus.state.terminated.exitCode);
                }
            }
        }, err => {
            err.message = `Error watching container: ${err.message}`;
            reject(err);
        });
    });
}

function loadKubeConfig(): k8s.KubeConfig {
    const kc = new k8s.KubeConfig();
    try {
        kc.loadFromDefault();
    } catch (e) {
        kc.loadFromCluster();
    }
    return kc;
}

export const K8sNamespaceFile = "/var/run/secrets/kubernetes.io/serviceaccount/namespace";

export async function readNamespace(): Promise<string> {
    let podNs = process.env.ATOMIST_POD_NAMESPACE || process.env.ATOMIST_DEPLOYMENT_NAMESPACE;
    if (podNs) {
        return podNs;
    }

    if (await fs.pathExists(K8sNamespaceFile)) {
        podNs = (await fs.readFile(K8sNamespaceFile)).toString().trim();
    }
    if (podNs) {
        return podNs;
    }

    return "default";
}
