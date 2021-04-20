/*
 * Copyright © 2021 Atomist, Inc.
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

import {
	AttachmentTarget,
	childProcess,
	github,
	guid,
	log,
	repository,
	secret,
	slack,
} from "@atomist/skill";
import { createContext } from "@atomist/skill/lib/context";
import { ContextualLifecycle, EventContext } from "@atomist/skill/lib/handler";
import { EventIncoming } from "@atomist/skill/lib/payload";
import * as k8s from "@kubernetes/client-node";
import * as fs from "fs-extra";
import * as _ from "lodash";
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

	const home = process.env.ATOMIST_HOME || "/atm/home";
	const imageName = process.env.DOCKER_BUILD_IMAGE_NAME;
	const providerId = process.env.DOCKER_PROVIDER_ID;
	const dockerfile = process.env.DOCKER_FILE;

	const ctx: EventContext<
		BuildOnPushSubscription | BuildOnTagSubscription
	> = createContext(payload, {
		eventId: process.env.ATOMIST_EVENT_ID,
	}) as any;

	// Check if Dockerfile exists
	if (!(await fs.pathExists(path.join(home, dockerfile)))) {
		log.info(`Dockerfile '${dockerfile}' not found. Exiting...`);
		return 0;
	}

	log.debug(
		"Starting %s/%s:%s image-link",
		payload.skill.namespace,
		payload.skill.name,
		payload.skill.version,
	);

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
		owner:
			(ctx.data as BuildOnPushSubscription)?.Push?.[0]?.repo?.owner ||
			(ctx.data as BuildOnTagSubscription)?.Tag?.[0]?.commit.repo?.owner,
		repo:
			(ctx.data as BuildOnPushSubscription)?.Push?.[0]?.repo?.name ||
			(ctx.data as BuildOnTagSubscription)?.Tag?.[0]?.commit.repo?.name,
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

	// Check if digest file exists
	const digests: Array<{ digest: string; tag: string }> = [];
	if (await fs.pathExists(path.join(home, "digest"))) {
		digests.push(
			...(await fs.readFile(path.join(home, "digest")))
				.toString()
				.trim()
				.split("\n")
				.map(d => {
					const parts = d.split("@");
					const digest = parts[1];
					const tag = parts[0].split(":")[1];
					return {
						digest,
						tag,
					};
				}),
		);
	}

	// Sign image and upload signature
	let publicKey;
	let verifyCommand;
	if (
		status === 0 &&
		digests.length > 0 &&
		ctx.configuration.parameters.sign &&
		ctx.configuration.parameters.password &&
		ctx.configuration.parameters.key
	) {
		const privateKey = path.join(os.tmpdir(), guid());
		const imageNameWithDigest = `${
			process.env.DOCKER_BUILD_IMAGE_NAME.split(":")[0]
		}@${digests[0].digest}`;
		// Store key in file
		await fs.writeFile(
			privateKey,
			Buffer.from(ctx.configuration.parameters.key, "base64"),
		);
		// Public key
		await childProcess.execPromise(
			"cosign",
			["public-key", "-key", privateKey],
			{
				env: {
					...process.env,
					COSIGN_PASSWORD: ctx.configuration.parameters.password,
				},
			},
		);
		publicKey = (await fs.readFile("cosign.pub")).toString().trim();
		verifyCommand = `$ cosign verify \\
    -key cosign.pub \\
    -a 'com.atomist.git.slug=${push.owner}/${push.repo}' \\
    -a 'com.atomist.git.sha=${push.sha}' \\
    -a 'com.atomist.docker.tag=${digests.map(d => d.tag).join(",")}' \\
    ${imageNameWithDigest}`;
		// Sign
		await childProcess.execPromise(
			"cosign",
			[
				"sign",
				"-key",
				privateKey,
				"-a",
				`com.atomist.git.slug=${push.owner}/${push.repo}`,
				"-a",
				`com.atomist.git.sha=${push.sha}`,
				"-a",
				`com.atomist.docker.tag=${digests.map(d => d.tag).join(",")}`,
				imageNameWithDigest,
			],
			{
				env: {
					...process.env,
					COSIGN_PASSWORD: ctx.configuration.parameters.password,
				},
			},
		);
	}

	await slackMessageCb.close(status, digests);
	await checkCb.close(status, digests, verifyCommand, publicKey);

	log.debug("Completed processing. Exiting...");
	await ((ctx as any) as ContextualLifecycle).close();
	return 0;
}

async function slackMessage(
	repo: BuildOnPushSubscription["Push"][0]["repo"],
	push: {
		owner: string;
		repo: string;
		sha: string;
		branch: string;
		url: string;
	},
	ctx: EventContext,
): Promise<{
	close: (
		status: number,
		digests: Array<{ digest: string; tag: string }>,
	) => Promise<void>;
}> {
	const imageName = process.env.DOCKER_BUILD_IMAGE_NAME.split(":")[0];
	const dockerfile = `\`${slack.url(
		`https://github.com/${push.owner}/${push.repo}/blob/${push.sha}/${process.env.DOCKER_FILE}`,
		process.env.DOCKER_FILE,
	)}\``;

	const start = Date.now();
	const title = "Docker Build";

	let slackMsg = await slack.progressMessage(
		title,
		`Building image \`${imageName}\` from ${dockerfile}`,
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
			footer: slack.url(log.url(ctx), "Docker Build"),
			footer_icon: undefined,
			ts: undefined,
			thumb_url: undefined,
		},
	);

	await ctx.message.attach(
		slackMsg.attachments[0],
		AttachmentTarget.Push,
		`${push.sha}#${push.branch}`,
		"docker",
		start,
	);

	return {
		close: async (status, digests): Promise<void> => {
			if (status === 0) {
				const tags = _.uniqBy(digests, "tag").map(d => d.tag);
				const digest = _.uniqBy(digests, "digest")[0].digest;
				slackMsg = await slack.progressMessage(
					title,
					`Built and pushed image \`${imageName}\` from ${dockerfile}

${tags.length === 1 ? "Tag" : "Tags"} ${tags.map(t => `\`${t}\``).join(", ")}
Digest \`${digest}\``,
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
						footer: slack.url(log.url(ctx), "Docker Build"),
						footer_icon: undefined,
						ts: undefined,
						thumb_url: undefined,
					},
				);

				await ctx.message.attach(
					slackMsg.attachments[0],
					AttachmentTarget.Push,
					`${push.sha}#${push.branch}`,
					"docker",
					start,
				);
			} else {
				slackMsg = await slack.progressMessage(
					title,
					`Failed to build image \`${imageName}\` from ${dockerfile}`,
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
						footer: slack.url(log.url(ctx), "Docker Build"),
						footer_icon: undefined,
						ts: undefined,
						thumb_url: undefined,
					},
				);

				await ctx.message.attach(
					slackMsg.attachments[0],
					AttachmentTarget.Push,
					`${push.sha}#${push.branch}`,
					"docker",
					start,
				);
			}
		},
	};
}

async function gitHubCheck(
	repo: BuildOnPushSubscription["Push"][0]["repo"],
	push: {
		sha: string;
		branch: string;
		url: string;
		owner: string;
		repo: string;
	},
	ctx: EventContext,
): Promise<{
	close: (
		status: number,
		digests: Array<{ digest: string; tag: string }>,
		command: string,
		publicKey: string,
	) => Promise<void>;
}> {
	if (!ctx.configuration?.parameters?.githubCheck) {
		return {
			close: async (): Promise<void> => {
				// Intentionally left empty
			},
		};
	}

	const imageName = process.env.DOCKER_BUILD_IMAGE_NAME.split(":")[0];
	const dockerfile = `[\`${process.env.DOCKER_FILE}\`](https://github.com/${push.owner}/${push.repo}/blob/${push.sha}/${process.env.DOCKER_FILE})`;

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
			title: "Docker build",
			body: `Building image \`${imageName}\` from ${dockerfile}`,
		},
	);

	return {
		close: async (status, digests, command, publicKey): Promise<void> => {
			if (status === 0) {
				const tags = _.uniqBy(digests, "tag").map(d => d.tag);
				const digest = _.uniqBy(digests, "digest")[0].digest;
				await check.update({
					conclusion: "success",
					body: `Built and pushed image \`${imageName}\` from ${dockerfile}

${tags.length === 1 ? "Tag" : "Tags"} ${tags.map(t => `\`${t}\``).join(", ")}
Digest \`${digest}\`${
						publicKey
							? `

---

### Image Signature 

The Docker image has been signed. Verified the signature with the following commands:

\`\`\`shell
$ echo \\
'${publicKey}' \\
> cosign.pub
\`\`\`

\`\`\`shell
${command}
\`\`\``
							: ""
					}`,
				});
			} else {
				await check.update({
					conclusion: "failure",
					body: `Failed to build image \`${imageName}\` from ${dockerfile}`,
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
