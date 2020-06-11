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
    dockerRegistryProvider,
    gitHubResourceProvider,
    mavenRepositoryProvider,
    slackResourceProvider,
} from "@atomist/skill/lib/resource_providers";
import {
    LineStyle,
    ParameterType,
    ParameterVisibility,
    skill,
} from "@atomist/skill/lib/skill";

export const Skill = skill({

    resourceProviders: {
        github: gitHubResourceProvider({ minRequired: 1 }),
        slack: slackResourceProvider(),
        "docker_push_registry": dockerRegistryProvider({
            description: "Docker registry to push to",
            displayName: "Push Registry",
            minRequired: 1,
            maxAllowed: 1,
        }),
        "docker_pull_registries": dockerRegistryProvider({
            description: "Additional Docker registries to pull from",
            displayName: "Pull Registries",
            minRequired: 0,
        }),
        maven: mavenRepositoryProvider({ minRequired: 0 }),
    },

    parameters: {
        name: {
            type: ParameterType.String,
            displayName: "Image name",
            description: "Name of the Docker Image after the registry (defaults to repository name)",
            required: false,
        },
        tag: {
            type: ParameterType.String,
            displayName: "Image tag",
            description: "Tag to use when pushing the Docker image (defaults to Git SHA)",
            required: false,
        },
        dockerfile: {
            type: ParameterType.String,
            displayName: "Dockerfile path",
            description: "Path to the Dockerfile within the project (defaults to Dockerfile)",
            required: false,
        },
        githubCheck: {
            type: ParameterType.Boolean,
            displayName: "Create GitHub check",
            description: "Automatically create a GitHub check on the commit triggering this Docker build",
            required: false,
            defaultValue: true,
        },
        version: {
            type: ParameterType.String,
            displayName: "Kaniko version",
            description: "Version of Kaniko to use",
            placeHolder: "v0.23.0",
            required: false,
            visibility: ParameterVisibility.Hidden,
        },
        cache: {
            type: ParameterType.Boolean,
            displayName: "Kaniko cache",
            description: "Enable Kaniko's support for Docker image layer caching",
            defaultValue: true,
            required: false,
            visibility: ParameterVisibility.Hidden,
        },
        "docker_args": {
            type: ParameterType.StringArray,
            displayName: "Kaniko arguments",
            description: "Additional [arguments](https://github.com/GoogleContainerTools/kaniko/blob/master/README.md#additional-flags) to be passed to Kaniko when building the image",
            required: false,
            visibility: ParameterVisibility.Hidden,
        },
        "docker_provider_secrets": {
            type: ParameterType.String,
            displayName: "Provider secrets",
            description: "Provider secrets spec",
            required: false,
            lineStyle: LineStyle.Multiple,
            visibility: ParameterVisibility.Hidden,
        },
        repos: {
            type: ParameterType.RepoFilter,
            displayName: "Which repositories",
            description: "",
            required: false,
        },
    },

    containers: {
        kaniko: {
            image: "gcr.io/kaniko-project/executor:${configuration[0].parameters.version:v0.23.0}",
            args: [
                "--context=dir:///atm/home",
                "--destination=#{configuration[0].resourceProviders.docker_push_registry | loadProvider('registryName') | replace('https://','')}/${configuration[0].parameters.name:${data.Push[0].repo.name}}:${configuration[0].parameters.tag:${data.Push[0].after.sha}}",
                "--dockerfile=${configuration[0].parameters.dockerfile:Dockerfile}",
                "--cache=${configuration[0].parameters.cache:false}",
                "--cache-repo=#{configuration[0].resourceProviders.docker_push_registry | loadProvider('registryName') | replace('https://','')}/${configuration[0].parameters.name:${data.Push[0].repo.name}}-cache",
                "--label=org.label-schema.schema-version='1.0'",
                "--label=org.label-schema.name='${data.Push[0].repo.name}'",
                "--label=org.label-schema.vendor='${data.Push[0].repo.owner}'",
                "--label=org.label-schema.vcs-url='${data.Push[0].repo.org.provider.gitUrl}:${data.Push[0].repo.owner}/${data.Push[0].repo.name}.git'",
                "--label=org.label-schema.vcs-ref='${data.Push[0].after.sha}'",
                "--label=org.label-schema.build-date='${data.Push[0].after.timestamp}'",
                "--force",
            ],
            env: [{
                name: "DOCKER_CONFIG",
                value: "/atm/input/.docker/",
            }],
        },
        "image-link": {
            image: "gcr.io/atomist-container-skills/docker-build-skill",
            args: [
                "/sdm/bin/start.js",
                "image-link",
            ],
            env: [{
                name: "DOCKER_BUILD_IMAGE_NAME",
                value: "#{configuration[0].resourceProviders.docker_push_registry | loadProvider('registryName') | replace('https://','')}/${configuration[0].parameters.name:${data.Push[0].repo.name}}:${configuration[0].parameters.tag:${data.Push[0].after.sha}}",
            }, {
                name: "DOCKER_PROVIDER_ID",
                value: "${configuration[0].resourceProviders.docker_push_registry.selectedResourceProviders[0].id}",
            }, {
                name: "DOCKER_FILE",
                value: "${configuration[0].parameters.dockerfile:Dockerfile}",
            }],
        },
    },

    subscriptions: [
        "file://lib/graphql/subscription/*.graphql",
    ],
});
           
