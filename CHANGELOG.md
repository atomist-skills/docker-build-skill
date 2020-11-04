# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).

## [Unreleased](https://github.com/atomist-skills/docker-build-skill/compare/1.4.1...HEAD)

### Changed

-    Made kaniko args a regular parameter. [4811a0f](https://github.com/atomist-skills/docker-build-skill/commit/4811a0fddba72af161d6a94e26070b930dfd4e17)

## [1.4.1](https://github.com/atomist-skills/docker-build-skill/compare/1.4.0...1.4.1) - 2020-11-02

### Fixed

-    Set secret resource provider to unbound. [d4d1365](https://github.com/atomist-skills/docker-build-skill/commit/d4d1365f6b5560a3123739ae4c439f454c730ede)

## [1.4.0](https://github.com/atomist-skills/docker-build-skill/compare/1.3.0...1.4.0) - 2020-11-02

### Added

-   Add environment variables. [#118](https://github.com/atomist-skills/docker-build-skill/issues/118)

### Changed

-   Switch to use advanced parameters for version, cache and args. [670db05](https://github.com/atomist-skills/docker-build-skill/commit/670db052507a00cd1d898e6a6a06d5292b78018c)
-   Reorder parameters, update docs. [6889e88](https://github.com/atomist-skills/docker-build-skill/commit/6889e88b8ee7fff78a388f33cd7e2fb845b943b0)

## [1.3.0](https://github.com/atomist-skills/docker-build-skill/compare/1.2.4...1.3.0) - 2020-10-16

### Changed

-   Update skill category. [0513a93](https://github.com/atomist-skills/docker-build-skill/commit/0513a93802000ad323204138d64a8c34e52b8926)

## [1.2.4](https://github.com/atomist-skills/docker-build-skill/compare/1.2.3...1.2.4) - 2020-10-14

### Changed

-   Update to kaniko 1.2.0. [73237f9](https://github.com/atomist-skills/docker-build-skill/commit/73237f9eae9a827825801853de79cb763a16f7b7)
-   Remove single dispatch. [3e99678](https://github.com/atomist-skills/docker-build-skill/commit/3e996787226f81faa788c95848e755eaa7cad162)

## [1.2.3](https://github.com/atomist-skills/docker-build-skill/compare/1.2.2...1.2.3) - 2020-10-01

### Changed

-   Improve the resource provider descriptions. [4866082](https://github.com/atomist-skills/docker-build-skill/commit/4866082dadd3fa17e862aa29cd6afdd1aab7f076)

## [1.2.2](https://github.com/atomist-skills/docker-build-skill/compare/1.2.1...1.2.2) - 2020-10-01

### Changed

-   Switch to single dispatch. [c70910b](https://github.com/atomist-skills/docker-build-skill/commit/c70910b2313e5ed304fe481f855aa04947e88561)

## [1.2.1](https://github.com/atomist-skills/docker-build-skill/compare/1.2.0...1.2.1) - 2020-07-28

### Changed

-   Update category . [#28](https://github.com/atomist-skills/docker-build-skill/issues/28)

## [1.2.0](https://github.com/atomist-skills/docker-build-skill/compare/1.1.9...1.2.0) - 2020-07-06

### Changed

-   Update to new skill package. [154f782](https://github.com/atomist-skills/docker-build-skill/commit/154f782823bbe9de396c44d53a28bf6c5ddcc262)
-   Update to use check and progressMessage from skill. [92d3904](https://github.com/atomist-skills/docker-build-skill/commit/92d39045d88a3daab2c0e942ca7403edbcf805ab)
-   Use image name in message id. [1da59cc](https://github.com/atomist-skills/docker-build-skill/commit/1da59cc107a02b9c0b4bbed6a1ac8c1b3a2ed68c)
-   Update to Kaniko v0.24.0. [a041468](https://github.com/atomist-skills/docker-build-skill/commit/a041468c1abbe662dc14b43e1ba67af02a6f9728)

### Fixed

-   Fix issue with image name expression for image-link. [1f7c1c6](https://github.com/atomist-skills/docker-build-skill/commit/1f7c1c66cc74ffa14e75601842ea19402acd1934)

## [1.1.9](https://github.com/atomist-skills/docker-build-skill/compare/1.1.8...1.1.9) - 2020-06-29

### Changed

-   Update description. [203f5c7](https://github.com/atomist-skills/docker-build-skill/commit/203f5c736587a3b97471cfe7513b4e054c541a7c)

## [1.1.8](https://github.com/atomist-skills/docker-build-skill/compare/1.1.7...1.1.8) - 2020-06-24

### Added

-   Add support for Git tag building. [05f42d7](https://github.com/atomist-skills/docker-build-skill/commit/05f42d77081841918233e12c302295d1be53013e)

## [1.1.7](https://github.com/atomist-skills/docker-build-skill/compare/1.1.6...1.1.7) - 2020-06-16

### Fixed

-   Fix some typos in chat messages. [82684d1](https://github.com/atomist-skills/docker-build-skill/commit/82684d15f36dbfa752a2b337272b3d208da5ebe6)

## [1.1.6](https://github.com/atomist-skills/docker-build-skill/compare/1.1.5...1.1.6) - 2020-06-11

### Added

-   Set output on GitHub check. [16a3129](https://github.com/atomist-skills/docker-build-skill/commit/16a31292afa6bf19c4f698c5667be6a45fa43f71)

### Changed

-   Remove counter from progress image. [6b31d8a](https://github.com/atomist-skills/docker-build-skill/commit/6b31d8a6f82818d6efe2e0d07f8d96542d2722fa)

## [1.1.5](https://github.com/atomist-skills/docker-build-skill/compare/1.1.4...1.1.5) - 2020-06-11

### Changed

-   Show docker_args in configuration. [14d31d6](https://github.com/atomist-skills/docker-build-skill/commit/14d31d692201744e79d4dc47c4fe51cb09ac37db)

## [1.1.4](https://github.com/atomist-skills/docker-build-skill/compare/1.1.3...1.1.4) - 2020-06-11

### Fixed

-   Add resourceProvider description. [d80d226](https://github.com/atomist-skills/docker-build-skill/commit/d80d2263759c1c7788149d0b06d844478f79ab30)

## [1.1.3](https://github.com/atomist-skills/docker-build-skill/compare/1.1.2...1.1.3) - 2020-06-11

### Added

-   Add MavenRepositoryProvider to list of optional integrations. [41c1854](https://github.com/atomist-skills/docker-build-skill/commit/41c1854e35faf845ea8c69c789c0170853f46c56)

### Changed

-   Update kaniko to 0.23.0. [5292844](https://github.com/atomist-skills/docker-build-skill/commit/5292844a28c235549d825b6a0e6a7b0497846313)

## [1.1.2](https://github.com/atomist-skills/docker-build-skill/compare/1.1.1...1.1.2) - 2020-05-11

## [1.1.1](https://github.com/atomist-skills/docker-build-skill/compare/1.1.0...1.1.1) - 2020-05-08

## [1.1.0](https://github.com/atomist-skills/docker-build-skill/compare/0.4.0...1.1.0) - 2020-05-08

### Added

-   Add image-link. [7e3c4e9](https://github.com/atomist-skills/docker-build-skill/commit/7e3c4e90a11a7464f7b0d64d536d8da6b1346048)
-   Render chat progress update during docker build. [#5](https://github.com/atomist-skills/docker-build-skill/issues/5)
-   Raise the new Docker Image events. [#4](https://github.com/atomist-skills/docker-build-skill/issues/4)

## [0.4.0](https://github.com/atomist-skills/docker-build-skill/tree/0.4.0) - 2020-04-01

### Added

-   Add support for common labels. [#1](https://github.com/atomist-skills/docker-build-skill/issues/1)
-   Single Repos with multiple Dockerfiles. [#2](https://github.com/atomist-skills/docker-build-skill/issues/2)
