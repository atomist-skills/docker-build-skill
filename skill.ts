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

import {
	Category,
	parameter,
	ParameterType,
	ParameterVisibility,
	resourceProvider,
	skill,
} from "@atomist/skill";

const KanikoVersion = "v1.3.0";

export const Skill = skill({
	displayName: "Docker Build",
	description: "Build Docker images and push them to a Docker registry",
	categories: [Category.DevOps],
	iconUrl:
		"https://raw.githubusercontent.com/atomist-skills/docker-build-skill/main/docs/images/icon.svg",

	resourceProviders: {
		github: resourceProvider.gitHub({ minRequired: 1 }),
		docker_push_registry: resourceProvider.dockerRegistry({
			description: "Docker registry to push to",
			displayName: "Push registry",
			minRequired: 1,
			maxAllowed: 1,
		}),
		docker_pull_registries: resourceProvider.dockerRegistry({
			description: "Additional Docker registries to pull from",
			displayName: "Pull registries",
			minRequired: 0,
		}),
		secret: resourceProvider.secretProvider({
			minRequired: 0,
			maxAllowed: undefined,
		} as any),
	},

	parameters: {
		env_map: {
			type: ParameterType.String,
			displayName: "",
			description:
				"Map selected secrets to environment variables that will be available in the running container." +
				"You must also declare the environment variable as an `ARG` in your " +
				"Dockerfile and provide it as a `--build-arg` to kaniko.",
			required: false,
		},
		docker_env: {
			type: ParameterType.StringArray,
			displayName: "Environment variables",
			description:
				"Environment variables to be set on the container (format `KEY=VALUE`). " +
				"You must also declare the environment variable as an `ARG` in your " +
				"Dockerfile and provide it as a `--build-arg` to kaniko.",
			required: false,
		},
		subscription_filter: {
			type: ParameterType.SingleChoice,
			displayName: "Build trigger",
			description:
				"Determine when to run the Docker build; on Git pushes or tags or both",
			defaultValue: "buildOnPush",
			options: [
				{
					text: "Pushes",
					value: "buildOnPush",
				},
				{
					text: "Tags",
					value: "buildOnTag",
				},
			],
			required: false,
		},
		name: {
			type: ParameterType.String,
			displayName: "Image name",
			description:
				"Name of the Docker image after the registry (defaults to repository name)",
			required: false,
		},
		tag: {
			type: ParameterType.String,
			displayName: "Image tag",
			description:
				"Tag to use when pushing the Docker image (defaults to Git SHA for pushes and Git tag name for tags)",
			required: false,
		},
		dockerfile: {
			type: ParameterType.String,
			displayName: "Dockerfile path",
			description:
				"Path to the Dockerfile within the project (defaults to Dockerfile)",
			required: false,
		},
		docker_args: {
			type: ParameterType.StringArray,
			displayName: "Kaniko arguments",
			description:
				"Additional [arguments](https://github.com/GoogleContainerTools/kaniko/blob/master/README.md#additional-flags) to be passed to Kaniko when building the image",
			required: false,
		},
		githubCheck: {
			type: ParameterType.Boolean,
			displayName: "Create GitHub check",
			description:
				"Automatically create a GitHub check on the commit triggering this Docker build",
			required: false,
			defaultValue: true,
			visibility: ParameterVisibility.Advanced,
		},
		version: {
			type: ParameterType.String,
			displayName: "Kaniko version",
			description: "Version of Kaniko to use",
			placeHolder: KanikoVersion,
			required: false,
			visibility: ParameterVisibility.Advanced,
		},
		cache: {
			type: ParameterType.Boolean,
			displayName: "Kaniko cache",
			description:
				"Enable Kaniko's support for Docker image layer caching",
			defaultValue: true,
			required: false,
			visibility: ParameterVisibility.Advanced,
		},
		repos: parameter.repoFilter({ required: false }),
	},

	containers: {
		"kaniko": {
			image:
				"gcr.io/kaniko-project/executor:${configuration.parameters.version:" +
				KanikoVersion +
				"}",
			args: [
				"--context=dir:///atm/home",
				"--destination=#{configuration.resourceProviders.docker_push_registry | provider('registryName') | replace('https://','')}/#{configuration.parameters.name | orValue(data | get('Push[0].repo.name'), data | get('Tag[0].commit.repo.name'))}:#{configuration.parameters.tag | orValue(data | get('Push[0].after.sha'), data | get('Tag[0].name'))}",
				"--dockerfile=${configuration.parameters.dockerfile:Dockerfile}",
				"--cache=${configuration.parameters.cache:false}",
				"--cache-repo=#{configuration.resourceProviders.docker_push_registry | provider('registryName') | replace('https://','')}/#{configuration.parameters.name | orValue(data | get('Push[0].repo.name'), data | get('Tag[0].commit.repo.name'))}-cache",
				"--label=org.label-schema.schema-version=1.0",
				"--label=org.label-schema.name=#{data | get('Push[0].repo.name') | orValue(data | get('Tag[0].commit.repo.name'))}",
				"--label=org.label-schema.vendor=#{data | get('Push[0].repo.owner') | orValue(data | get('Tag[0].commit.repo.owner'))}",
				"--label=org.label-schema.vcs-url=#{data | get('Push[0].repo.org.provider.gitUrl') | orValue(data | get('Tag[0].commit.repo.org.provider.gitUrl'))}:#{data | get('Push[0].repo.owner') | orValue(data | get('Tag[0].commit.repo.owner'))}/#{data | get('Push[0].repo.name') | orValue(data | get('Tag[0].commit.repo.name'))}.git",
				"--label=org.label-schema.vcs-ref=#{data | get('Push[0].after.sha') | orValue(data | get('Tag[0].name'))}",
				"--label=org.label-schema.build-date=#{data | get('Push[0].after.timestamp') | orValue(data | get('Tag[0].commit.timestamp'))}",
				"--force",
			],
			env: [
				{
					name: "DOCKER_CONFIG",
					value: "/atm/input/.docker/",
				},
			],
			resources: {
				limit: {
					cpu: 2,
					memory: 5000,
				},
				request: {
					cpu: 2,
					memory: 5000,
				},
			},
		},
		"image-link": {
			image: "gcr.io/atomist-container-skills/docker-build-skill",
			args: ["/sdm/bin/start.js", "image-link"],
			env: [
				{
					name: "DOCKER_BUILD_IMAGE_NAME",
					value:
						"#{configuration.resourceProviders.docker_push_registry | provider('registryName') | replace('https://','')}/#{configuration.parameters.name | orValue(data | get('Push[0].repo.name'), data | get('Tag[0].commit.repo.name'))}:#{configuration.parameters.tag | orValue(data | get('Push[0].after.sha'), data | get('Tag[0].name'))}",
				},
				{
					name: "DOCKER_PROVIDER_ID",
					value:
						"${configuration.resourceProviders.docker_push_registry.selectedResourceProviders[0].id}",
				},
				{
					name: "DOCKER_FILE",
					value: "${configuration.parameters.dockerfile:Dockerfile}",
				},
			],
			resources: {
				limit: {
					cpu: 0.5,
					memory: 1000,
				},
				request: {
					cpu: 0.5,
					memory: 1000,
				},
			},
		},
	},
});
