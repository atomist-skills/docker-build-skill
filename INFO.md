Creating consistent, reliable Docker builds across all your repositories can be
a pain. This skill greatly simplifies that process by standardizing your Docker
build configuration across all your repositories. No more hacky build scripts
copied from repository to repository, no more enabling builds one at a time, no
more setting up a Docker daemon and environment variables, just consistent,
reliable Docker builds every time. All you have to worry about if your
Dockerfile.

This skill uses
[kaniko](https://github.com/GoogleContainerTools/kaniko#readme "kaniko - Build Images In Kubernetes")
to build container images from your Dockerfiles and push them to your Docker
registry. Container image builds can be triggered by pushes of commits and/or
tags to a GitHub repository. The code associated with the commit or tag is
checked out and the container image is built using the Dockerfile. Once the
build is complete, the container image is pushed to your configured Docker
registry.

-   Reliable, consistent builds on every push
-   Pull and push container images from multiple Docker registries
-   Automatic image naming and tag creation
-   Easily customize the Docker build to your needs
-   GitHub commit check indicates success of failure of build

See the
[Container Skills documentation](https://docs.atomist.com/authoring/container-skills/ "Container Skills - Atomist Documentation")
for more detailed information.

### Build Docker images on every push

![Docker build on push](docs/images/docker-build.png)

### Push Docker images to Docker Hub

![Push images to Docker Hub](docs/images/docker-hub.png)

### GitHub commit check

![GitHub commit check](docs/images/github-commit-check.png)

### Build status and logs

![Docker build status and logs](docs/images/status-log.png)
