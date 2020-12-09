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

import { github, log, repository, secret, slack } from "@atomist/skill";
import { createContext } from "@atomist/skill/lib/context";
import { EventContext } from "@atomist/skill/lib/handler";
import { EventIncoming } from "@atomist/skill/lib/payload";
import * as k8s from "@kubernetes/client-node";
import * as fs from "fs-extra";
import * as os from "os";
import * as path from "path";
import {
	BuildOnPushSubscription,
	BuildOnTagSubscription,
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
	const payload = (await fs.readJson(
		process.env.ATOMIST_PAYLOAD || "/atm/payload.json",
	)) as EventIncoming;
	log.info(
		"Starting %s/%s:%s image-link",
		payload.skill.namespace,
		payload.skill.name,
		payload.skill.version,
	);

	const home = process.env.ATOMIST_HOME || "/atm/home";
	const imageName = process.env.DOCKER_BUILD_IMAGE_NAME;
	const providerId = process.env.DOCKER_PROVIDER_ID;
	const dockerfile = process.env.DOCKER_FILE;

	// Check if Dockerfile exists
	if (!(await fs.pathExists(path.join(home, dockerfile)))) {
		log.info(`Dockerfile '${dockerfile}' not found. Exiting...`);
		return 0;
	}

	const ctx: EventContext<
		BuildOnPushSubscription | BuildOnTagSubscription
	> = createContext(payload, {} as any) as any;
	const container = payload.skill.artifacts[0].name;
	const namespace = await readNamespace();
	const name = os.hostname();

	const repo =
		(ctx.data as BuildOnPushSubscription)?.Push?.[0]?.repo ||
		(ctx.data as BuildOnTagSubscription)?.Tag?.[0]?.commit?.repo;
	const push = {
		sha:
			(ctx.data as BuildOnPushSubscription)?.Push?.[0]?.after.sha ||
			(ctx.data as BuildOnTagSubscription)?.Tag?.[0]?.commit?.sha,
		url:
			(ctx.data as BuildOnPushSubscription)?.Push?.[0]?.after.url ||
			(ctx.data as BuildOnTagSubscription)?.Tag?.[0]?.commit?.url,
		branch:
			(ctx.data as BuildOnPushSubscription)?.Push?.[0]?.branch ||
			(ctx.data as BuildOnTagSubscription)?.Tag?.[0]?.name,
	};

	const slackMessageCb = await slackMessage(repo, push, ctx);
	const checkCb = await gitHubCheck(repo, push, ctx);

	log.debug("Watching container '%s'", container);
	const status = await containerWatch(name, namespace, container);
	log.debug("Container exited with '%s'", status);

	if (!!imageName && status === 0) {
		await ctx.graphql.mutate<
			CreateDockerImageMutation,
			CreateDockerImageMutationVariables
		>(
			{
				root: __dirname,
				path: "graphql/mutation/createDockerImage.graphql",
			},
			{
				sha: push.sha,
				branch: push.branch,
				image: imageName,
				providerId,
			},
		);
	}

	await slackMessageCb.close(status);
	await checkCb.close(status);

	log.info("Completed processing. Exiting...");
	return 0;
}

async function slackMessage(
	repo: BuildOnPushSubscription["Push"][0]["repo"],
	push: { sha: string; branch: string; url: string },
	ctx: EventContext,
): Promise<{ close: (status: number) => Promise<void> }> {
	const imageName = process.env.DOCKER_BUILD_IMAGE_NAME;

	const start = Date.now();
	const title = "Docker Build";
	const ticks = "```";

	let slackMsg = await slack.progressMessage(
		title,
		`${ticks}
Building image ${imageName}
${ticks}`,
		{
			state: "in_process",
			total: 1,
			count: 0,
			counter: false,
		},
		ctx,
		{
			title: undefined,
			title_link: undefined,
			footer: slack.url(ctx.audit.url, "Docker Build"),
			footer_icon: undefined,
			ts: undefined,
			thumb_url: undefined,
		},
	);

	await ctx.message.attach(
		slackMsg.attachments[0],
		"push",
		{ sha: push.sha, branch: push.branch },
		"docker",
		start,
	);

	return {
		close: async (status): Promise<void> => {
			if (status === 0) {
				slackMsg = await slack.progressMessage(
					title,
					`${ticks}
Successfully built and pushed image ${imageName}
${ticks}`,
					{
						state: "success",
						total: 1,
						count: 1,
						counter: false,
					},
					ctx,
					{
						title: undefined,
						title_link: undefined,
						footer: slack.url(ctx.audit.url, "Docker Build"),
						footer_icon: undefined,
						ts: undefined,
						thumb_url: undefined,
					},
				);

				await ctx.message.attach(
					slackMsg.attachments[0],
					"push",
					{ sha: push.sha, branch: push.branch },
					"docker",
					start,
				);
			} else {
				slackMsg = await slack.progressMessage(
					title,
					`${ticks}
Failed to build image ${imageName}
${ticks}`,
					{
						state: "failure",
						total: 1,
						count: 0,
						counter: false,
					},
					ctx,
					{
						title: undefined,
						title_link: undefined,
						footer: slack.url(ctx.audit.url, "Docker Build"),
						footer_icon: undefined,
						ts: undefined,
						thumb_url: undefined,
					},
				);

				await ctx.message.attach(
					slackMsg.attachments[0],
					"push",
					{ sha: push.sha, branch: push.branch },
					"docker",
					start,
				);
			}
		},
	};
}

async function gitHubCheck(
	repo: BuildOnPushSubscription["Push"][0]["repo"],
	push: { sha: string; branch: string; url: string },
	ctx: EventContext,
): Promise<{ close: (status: number) => Promise<void> }> {
	if (!ctx.configuration?.parameters?.githubCheck) {
		return {
			close: async (): Promise<void> => {
				// Intentionally left empty
			},
		};
	}

	const imageName = process.env.DOCKER_BUILD_IMAGE_NAME;

	const credential = await ctx.credential.resolve(
		secret.gitHubAppToken({
			owner: repo.owner,
			repo: repo.name,
			apiUrl: repo.org.provider.apiUrl,
		}),
	);
	const check = await github.createCheck(
		ctx,
		repository.gitHub({
			owner: repo.owner,
			repo: repo.name,
			credential,
			sha: push.sha,
			branch: push.branch,
		}),
		{
			name: ctx.skill.name,
			sha: push.sha,
			startedAt: new Date().toISOString(),
			title: "Docker Build",
			body: `Building image \`${imageName}\``,
		},
	);

	return {
		close: async (status): Promise<void> => {
			if (status === 0) {
				await check.update({
					conclusion: "success",
					body: `Successfully built and pushed image \`${imageName}\``,
				});
			} else {
				await check.update({
					conclusion: "failure",
					body: `Failed to build image \`${imageName}\``,
				});
			}
		},
	};
}

/**
 * Watch the provided container in the pod supplied by name
 * and namespace. Once the container exits.
 *
 * @param name The name of the pod to watch
 * @param namespace The namespace of the pod to watch
 * @param container The container name to watch
 */
function containerWatch(
	name: string,
	namespace: string,
	container: string,
): Promise<number> {
	// eslint-disable-next-line no-async-promise-executor
	return new Promise(async (resolve, reject) => {
		const kc = loadKubeConfig();

		const watcher = new k8s.Watch(kc);
		const watchPath = `/api/v1/watch/namespaces/${namespace}/pods/${name}`;
		await watcher.watch(
			watchPath,
			{},
			async (phase, obj) => {
				const pod = obj as k8s.V1Pod;
				if (pod?.status?.containerStatuses) {
					const containerStatus = pod.status.containerStatuses.find(
						c => c.name === container,
					);
					if (containerStatus?.state?.terminated) {
						log.debug("Container exited");
						resolve(containerStatus.state.terminated.exitCode);
					}
				}
			},
			err => {
				if (err) {
					err.message = `Error watching container: ${err.message}`;
					reject(err);
				} else {
					resolve(0);
				}
			},
		);
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

export const K8sNamespaceFile =
	"/var/run/secrets/kubernetes.io/serviceaccount/namespace";

async function readNamespace(): Promise<string> {
	let podNs =
		process.env.ATOMIST_POD_NAMESPACE ||
		process.env.ATOMIST_DEPLOYMENT_NAMESPACE;
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
