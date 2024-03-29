# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).

## [Unreleased](https://github.com/atomist-skills/docker-build-skill/compare/2.0.3...HEAD)

### Removed

*   Remove Dockerfile path from source label. [c719dc2](https://github.com/atomist-skills/docker-build-skill/commit/c719dc21c706485654a0d0a5f72490722dc7bc49)

## [2.0.3](https://github.com/atomist-skills/docker-build-skill/compare/2.0.2...2.0.3) - 2021-09-24

### Added

*   Add com.atomist.containers.image.dockerfile annotation. [50900ca](https://github.com/atomist-skills/docker-build-skill/commit/50900ca442cb28c314ef62bfaafee772ee10332f)

## [2.0.2](https://github.com/atomist-skills/docker-build-skill/compare/2.0.1...2.0.2) - 2021-05-06

### Changed

*   Upgrade Kaniko to 1.6.2. [df98fc4](https://github.com/atomist-skills/docker-build-skill/commit/df98fc4ed06b7469d8e544adea49e7c17f8d2b2f)
*   Upgrade cosign to 0.4.0. [8376b79](https://github.com/atomist-skills/docker-build-skill/commit/8376b794bfc7be1ae34a9e1ec268c019fe7f6060)

## [2.0.1](https://github.com/atomist-skills/docker-build-skill/compare/2.0.0...2.0.1) - 2021-04-21

### Changed

*   Update cosign to 0.3.1. [1d76d8a](https://github.com/atomist-skills/docker-build-skill/commit/1d76d8a685d3c3a79a4c4d06ce64600bd57d38cc)

## [2.0.0](https://github.com/atomist-skills/docker-build-skill/compare/1.6.5...2.0.0) - 2021-04-20

### Added

*   Add parameter metadata. [fb0861f](https://github.com/atomist-skills/docker-build-skill/commit/fb0861fefd9e1ca905fa3b63fcbfde4c98efbf26)
*   Add image signing. [#278](https://github.com/atomist-skills/docker-build-skill/issues/278)

## [1.6.5](https://github.com/atomist-skills/docker-build-skill/compare/1.6.4...1.6.5) - 2021-04-01

### Changed

*   Update category. [d44d9ad](https://github.com/atomist-skills/docker-build-skill/commit/d44d9ad1e34217291dc5ed77e1102badb5006d49)

## [1.6.4](https://github.com/atomist-skills/docker-build-skill/compare/1.6.3...1.6.4) - 2021-03-29

### Fixed

*   Fix failing check and slack update when build fails. [f525dd1](https://github.com/atomist-skills/docker-build-skill/commit/f525dd13b6259784edc46c86006c8a70b7cfccbb)

## [1.6.3](https://github.com/atomist-skills/docker-build-skill/compare/1.6.2...1.6.3) - 2021-03-25

### Added

*   Add cacheTtl parameter. [86364ac](https://github.com/atomist-skills/docker-build-skill/commit/86364ace7d1757f1c337ca0c8ab1497bfa2c9885)

## [1.6.2](https://github.com/atomist-skills/docker-build-skill/compare/1.6.1...1.6.2) - 2021-03-10

### Added

*   Support for using git branch name as tag suffix. [#220](https://github.com/atomist-skills/docker-build-skill/issues/220)
*   Add path to Dockerfile to vcs-url. [94c6949](https://github.com/atomist-skills/docker-build-skill/commit/94c694919afde939a9405011c9bf030b3aeba9d1)
*   Add org.opencontainers.image image labels. [899721f](https://github.com/atomist-skills/docker-build-skill/commit/899721f3a5ba24c9ee8b554b9b0be5f9c01a4350)

### Changed

*   Improve kaniko arguments docs. [#191](https://github.com/atomist-skills/docker-build-skill/issues/191)
*   Update kaniko to 1.5.1. [f2a68b3](https://github.com/atomist-skills/docker-build-skill/commit/f2a68b38481873db1f739ade163f2fe105b90e6d)

## [1.6.1](https://github.com/atomist-skills/docker-build-skill/compare/1.6.0...1.6.1) - 2020-11-20

### Changed

*   Add chat message parameter. [e3a2272](https://github.com/atomist-skills/docker-build-skill/commit/e3a2272614be9f2a477992d45eb5553cad777ebc)

## [1.6.0](https://github.com/atomist-skills/docker-build-skill/compare/1.5.0...1.6.0) - 2020-11-16

### Changed

*   Update skill icon. [4af9bbe](https://github.com/atomist-skills/docker-build-skill/commit/4af9bbe5a00db5c94fee0093ac906fd69fdc4aaf)

## [1.5.0](https://github.com/atomist-skills/docker-build-skill/compare/1.4.3...1.5.0) - 2020-11-12

### Removed

*   Remove optional chat provider. [#138](https://github.com/atomist-skills/docker-build-skill/issues/138)

## [1.4.3](https://github.com/atomist-skills/docker-build-skill/compare/1.4.2...1.4.3) - 2020-11-10

### Changed

*   Update to kaniko 1.3.0. [ce33263](https://github.com/atomist-skills/docker-build-skill/commit/ce33263424351d8ff6ef0bd2824478556ad06871)
*   Remove single quotes from label values. [264e1c1](https://github.com/atomist-skills/docker-build-skill/commit/264e1c16e7104935eaea20cad2beca81c2446b2d)

## [1.4.2](https://github.com/atomist-skills/docker-build-skill/compare/1.4.1...1.4.2) - 2020-11-04

### Changed

*   Make kaniko args a regular parameter. [4811a0f](https://github.com/atomist-skills/docker-build-skill/commit/4811a0fddba72af161d6a94e26070b930dfd4e17)

## [1.4.1](https://github.com/atomist-skills/docker-build-skill/compare/1.4.0...1.4.1) - 2020-11-02

### Fixed

*   Set secret resource provider to unbound. [d4d1365](https://github.com/atomist-skills/docker-build-skill/commit/d4d1365f6b5560a3123739ae4c439f454c730ede)

## [1.4.0](https://github.com/atomist-skills/docker-build-skill/compare/1.3.0...1.4.0) - 2020-11-02

### Added

*   Add environment variables. [#118](https://github.com/atomist-skills/docker-build-skill/issues/118)

### Changed

*   Switch to use advanced parameters for version, cache and args. [670db05](https://github.com/atomist-skills/docker-build-skill/commit/670db052507a00cd1d898e6a6a06d5292b78018c)
*   Reorder parameters, update docs. [6889e88](https://github.com/atomist-skills/docker-build-skill/commit/6889e88b8ee7fff78a388f33cd7e2fb845b943b0)

## [1.3.0](https://github.com/atomist-skills/docker-build-skill/compare/1.2.4...1.3.0) - 2020-10-16

### Changed

*   Update skill category. [0513a93](https://github.com/atomist-skills/docker-build-skill/commit/0513a93802000ad323204138d64a8c34e52b8926)

## [1.2.4](https://github.com/atomist-skills/docker-build-skill/compare/1.2.3...1.2.4) - 2020-10-14

### Changed

*   Update to kaniko 1.2.0. [73237f9](https://github.com/atomist-skills/docker-build-skill/commit/73237f9eae9a827825801853de79cb763a16f7b7)
*   Remove single dispatch. [3e99678](https://github.com/atomist-skills/docker-build-skill/commit/3e996787226f81faa788c95848e755eaa7cad162)

## [1.2.3](https://github.com/atomist-skills/docker-build-skill/compare/1.2.2...1.2.3) - 2020-10-01

### Changed

*   Improve the resource provider descriptions. [4866082](https://github.com/atomist-skills/docker-build-skill/commit/4866082dadd3fa17e862aa29cd6afdd1aab7f076)

## [1.2.2](https://github.com/atomist-skills/docker-build-skill/compare/1.2.1...1.2.2) - 2020-10-01

### Changed

*   Switch to single dispatch. [c70910b](https://github.com/atomist-skills/docker-build-skill/commit/c70910b2313e5ed304fe481f855aa04947e88561)

## [1.2.1](https://github.com/atomist-skills/docker-build-skill/compare/1.2.0...1.2.1) - 2020-07-28

### Changed

*   Update category . [#28](https://github.com/atomist-skills/docker-build-skill/issues/28)

## [1.2.0](https://github.com/atomist-skills/docker-build-skill/compare/1.1.9...1.2.0) - 2020-07-06

### Changed

*   Update to new skill package. [154f782](https://github.com/atomist-skills/docker-build-skill/commit/154f782823bbe9de396c44d53a28bf6c5ddcc262)
*   Update to use check and progressMessage from skill. [92d3904](https://github.com/atomist-skills/docker-build-skill/commit/92d39045d88a3daab2c0e942ca7403edbcf805ab)
*   Use image name in message id. [1da59cc](https://github.com/atomist-skills/docker-build-skill/commit/1da59cc107a02b9c0b4bbed6a1ac8c1b3a2ed68c)
*   Update to Kaniko v0.24.0. [a041468](https://github.com/atomist-skills/docker-build-skill/commit/a041468c1abbe662dc14b43e1ba67af02a6f9728)

### Fixed

*   Fix issue with image name expression for image-link. [1f7c1c6](https://github.com/atomist-skills/docker-build-skill/commit/1f7c1c66cc74ffa14e75601842ea19402acd1934)

## [1.1.9](https://github.com/atomist-skills/docker-build-skill/compare/1.1.8...1.1.9) - 2020-06-29

### Changed

*   Update description. [203f5c7](https://github.com/atomist-skills/docker-build-skill/commit/203f5c736587a3b97471cfe7513b4e054c541a7c)

## [1.1.8](https://github.com/atomist-skills/docker-build-skill/compare/1.1.7...1.1.8) - 2020-06-24

### Added

*   Add support for Git tag building. [05f42d7](https://github.com/atomist-skills/docker-build-skill/commit/05f42d77081841918233e12c302295d1be53013e)

## [1.1.7](https://github.com/atomist-skills/docker-build-skill/compare/1.1.6...1.1.7) - 2020-06-16

### Fixed

*   Fix some typos in chat messages. [82684d1](https://github.com/atomist-skills/docker-build-skill/commit/82684d15f36dbfa752a2b337272b3d208da5ebe6)

## [1.1.6](https://github.com/atomist-skills/docker-build-skill/compare/1.1.5...1.1.6) - 2020-06-11

### Added

*   Set output on GitHub check. [16a3129](https://github.com/atomist-skills/docker-build-skill/commit/16a31292afa6bf19c4f698c5667be6a45fa43f71)

### Changed

*   Remove counter from progress image. [6b31d8a](https://github.com/atomist-skills/docker-build-skill/commit/6b31d8a6f82818d6efe2e0d07f8d96542d2722fa)

## [1.1.5](https://github.com/atomist-skills/docker-build-skill/compare/1.1.4...1.1.5) - 2020-06-11

### Changed

*   Show docker_args in configuration. [14d31d6](https://github.com/atomist-skills/docker-build-skill/commit/14d31d692201744e79d4dc47c4fe51cb09ac37db)

## [1.1.4](https://github.com/atomist-skills/docker-build-skill/compare/1.1.3...1.1.4) - 2020-06-11

### Fixed

*   Add resourceProvider description. [d80d226](https://github.com/atomist-skills/docker-build-skill/commit/d80d2263759c1c7788149d0b06d844478f79ab30)

## [1.1.3](https://github.com/atomist-skills/docker-build-skill/compare/1.1.2...1.1.3) - 2020-06-11

### Added

*   Add MavenRepositoryProvider to list of optional integrations. [41c1854](https://github.com/atomist-skills/docker-build-skill/commit/41c1854e35faf845ea8c69c789c0170853f46c56)

### Changed

*   Update kaniko to 0.23.0. [5292844](https://github.com/atomist-skills/docker-build-skill/commit/5292844a28c235549d825b6a0e6a7b0497846313)

## [1.1.2](https://github.com/atomist-skills/docker-build-skill/compare/1.1.1...1.1.2) - 2020-05-11

## [1.1.1](https://github.com/atomist-skills/docker-build-skill/compare/1.1.0...1.1.1) - 2020-05-08

## [1.1.0](https://github.com/atomist-skills/docker-build-skill/compare/0.4.0...1.1.0) - 2020-05-08

### Added

*   Add image-link. [7e3c4e9](https://github.com/atomist-skills/docker-build-skill/commit/7e3c4e90a11a7464f7b0d64d536d8da6b1346048)
*   Render chat progress update during docker build. [#5](https://github.com/atomist-skills/docker-build-skill/issues/5)
*   Raise the new Docker Image events. [#4](https://github.com/atomist-skills/docker-build-skill/issues/4)

## [0.4.0](https://github.com/atomist-skills/docker-build-skill/tree/0.4.0) - 2020-04-01

### Added

*   Add support for common labels. [#1](https://github.com/atomist-skills/docker-build-skill/issues/1)
*   Single Repos with multiple Dockerfiles. [#2](https://github.com/atomist-skills/docker-build-skill/issues/2)
