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

import { loadKubeConfig } from "@atomist/sdm/lib/core/pack/k8s/kubernetes/config";
import { readNamespace } from "@atomist/sdm/lib/core/pack/k8s/scheduler/KubernetesGoalScheduler";
import { createContext } from "@atomist/skill/lib/context";
import { EventContext } from "@atomist/skill/lib/handler";
import {
    debug,
    info,
} from "@atomist/skill/lib/log";
import { EventIncoming } from "@atomist/skill/lib/payload";
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

    const context: EventContext<BuildOnPushSubscription> = createContext(payload, {} as any) as any;
    const container = payload.skill.artifacts[0].name;
    const namespace = await readNamespace();
    const name = os.hostname();

    debug("Watching container '%s'", container);
    const status = await containerWatch(name, namespace, container);
    debug("Container exited with '%s'", status);

    if (!!imageName && status === 0) {
        const push = context.data.Push[0];
        await context.graphql.mutate<CreateDockerImageMutation, CreateDockerImageMutationVariables>({
                root: __dirname,
                path: "graphql/mutation/createDockerImage.graphql",
            },
            {
                sha: push.after.sha,
                branch: push.branch,
                image: imageName,
                providerId,
            });
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
    return new Promise(async (resolve, reject) => {

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
