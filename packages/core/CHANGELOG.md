# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [2.2.0](https://github.com/HPInc/davinci/compare/@davinci/core@2.1.2...@davinci/core@2.2.0) (2022-12-16)


### Features

* entity definition json walker ([#172](https://github.com/HPInc/davinci/issues/172)) ([da0a80d](https://github.com/HPInc/davinci/commit/da0a80dde0dee79bb3a21407afc0ea70909fd30b))





## [2.1.2](https://github.com/HPInc/davinci/compare/@davinci/core@2.1.1...@davinci/core@2.1.2) (2022-12-09)

**Note:** Version bump only for package @davinci/core





## [2.1.1](https://github.com/HPInc/davinci/compare/@davinci/core@2.1.0...@davinci/core@2.1.1) (2022-12-02)


### Performance Improvements

* optimizing dependencies and compiled code for size ([#170](https://github.com/HPInc/davinci/issues/170)) ([9b7bd96](https://github.com/HPInc/davinci/commit/9b7bd96654479b8dd03faeb56e70476b15d4420f))





# [2.1.0](https://github.com/HPInc/davinci/compare/@davinci/core@1.11.0...@davinci/core@2.1.0) (2022-12-01)


### Features

* DaVinci v2 ([6a10e09](https://github.com/HPInc/davinci/commit/6a10e09e22c8561ee8d54c93d4fb8c7fe0d564a9))





## [2.0.1](https://github.com/HPInc/davinci/compare/@davinci/core@2.0.0-next.18...@davinci/core@2.0.1) (2022-12-01)

**Note:** Version bump only for package @davinci/core





# [2.0.0](https://github.com/HPInc/davinci/compare/@davinci/core@2.0.0-next.18...@davinci/core@2.0.0) (2022-12-01)

**Note:** Version bump only for package @davinci/core





# [1.11.0](https://github.com/HPInc/davinci/compare/@davinci/core@1.10.3...@davinci/core@1.11.0) (2022-10-05)


### Features

* **mongoose:** upgraded mongoose dependency from v5 to v6 and renamed context to davinciContext to avoid type collisions with mongoose context ([4c91957](https://github.com/HPInc/davinci/commit/4c919577e9fb17aa216bed24f60e99778ba17d7f))





## [1.10.3](https://github.com/HPInc/davinci/compare/@davinci/core@1.10.2...@davinci/core@1.10.3) (2022-10-03)

**Note:** Version bump only for package @davinci/core





## [1.10.2](https://github.com/HPInc/davinci/compare/@davinci/core@1.10.1...@davinci/core@1.10.2) (2022-04-13)


### Bug Fixes

* added nullish check ([491d585](https://github.com/HPInc/davinci/commit/491d585ba351901ef6e703fe075c403e5a41a3ec))
* createMongooseController now produces definitions with prefixed names ([d778d11](https://github.com/HPInc/davinci/commit/d778d11a907884eb19e421bd783ceb7ecbc8a88f))





## [1.10.1](https://github.com/HPInc/davinci/compare/@davinci/core@1.10.0...@davinci/core@1.10.1) (2022-04-08)


### Bug Fixes

* ajv custom instance parameters ([d9a2cfb](https://github.com/HPInc/davinci/commit/d9a2cfb02e4366a79f5b294c14cb32de6a34f626))
* cache key to include definitions ([80151ad](https://github.com/HPInc/davinci/commit/80151ada17a48691fcac5b770b73de90e52f44fe))


### Reverts

* no need to include definitions (schemas should not share same name) ([2e3e6de](https://github.com/HPInc/davinci/commit/2e3e6de3bd415203d26b73cb00ee841f88fdadad))





# [1.10.0](https://github.com/HPInc/davinci/compare/@davinci/core@1.9.2...@davinci/core@1.10.0) (2022-04-07)


### Bug Fixes

* davinciHandler now is a named function ([f2b6cb5](https://github.com/HPInc/davinci/commit/f2b6cb585189440d7b27a18da1f1ab41567ca945))
* fixed tests ([6b568f3](https://github.com/HPInc/davinci/commit/6b568f3b12a2530282ba64b694e13c84fb493412))
* include parameter in cache ([0db15a8](https://github.com/HPInc/davinci/commit/0db15a8c9d13911ec82ca4e2ebafd21223f13bcf))
* tests ([d7554fb](https://github.com/HPInc/davinci/commit/d7554fbb8097a5ee46398994a5771f96a3a7b668))


### Features

* added ajv instance and schema caching ([0ff3edc](https://github.com/HPInc/davinci/commit/0ff3edc708518ee4155597cc9d780b9e5c852946))
* delay ajv instantiation ([fa964ad](https://github.com/HPInc/davinci/commit/fa964ad896a280e79c22b7181809668af4087a52))





## [1.9.2](https://github.com/HPInc/davinci/compare/@davinci/core@1.9.1...@davinci/core@1.9.2) (2022-03-24)


### Bug Fixes

* test ([a0ddcc8](https://github.com/HPInc/davinci/commit/a0ddcc82e79d605cf5a6b03f32897c0b9bcfde59))
* typo ([1deca06](https://github.com/HPInc/davinci/commit/1deca0693db8adca937909d03e9a35c2c316ff2f))
* typo ([ecee118](https://github.com/HPInc/davinci/commit/ecee1185383e6b288cb57f7a8cd29eb8c274a48b))
* use latest createRouter in examples and update doc ([4a9c56b](https://github.com/HPInc/davinci/commit/4a9c56b4e59898e1a9b5d0955e8ede7aefd4c87a))





## [1.9.1](https://github.com/HPInc/davinci/compare/@davinci/core@1.9.0...@davinci/core@1.9.1) (2022-01-21)


### Bug Fixes

* update mongoose ([e738307](https://github.com/HPInc/davinci/commit/e7383075fb9482c1bc408decab3c53682fc60342))





# [1.9.0](https://github.com/HPInc/davinci/compare/@davinci/core@1.8.0...@davinci/core@1.9.0) (2021-11-19)


### Features

* adding port configuration on davinci options ([79408f6](https://github.com/HPInc/davinci/commit/79408f63e7d24b73d64df618b4f29a4db50698da))





# [1.8.0](https://github.com/HPInc/davinci/compare/@davinci/core@1.7.5...@davinci/core@1.8.0) (2021-11-11)


### Features

* davinci with https support ([ea72d7b](https://github.com/HPInc/davinci/commit/ea72d7b910c319309a57c1975cadb13ed3c96463))





## [1.7.5](https://github.com/HPInc/davinci/compare/@davinci/core@1.7.4...@davinci/core@1.7.5) (2021-09-24)


### Bug Fixes

* open generate swagger use the same urlJoin library ([9e813d6](https://github.com/HPInc/davinci/commit/9e813d636ba26322a6d81d2dd2156fb4b9c6b86d))
* use url join instead path join to fix OS coupled api paths ([2d1b7fc](https://github.com/HPInc/davinci/commit/2d1b7fc8590ad1f48f9f19b3364fc4c6aed40a09))





## [1.7.4](https://github.com/HPInc/davinci/compare/@davinci/core@1.7.3...@davinci/core@1.7.4) (2021-07-14)


### Bug Fixes

* default basepath to / instead of resource name ([152822b](https://github.com/HPInc/davinci/commit/152822b66897de7d68f140da6a50eca10bc605f1))
* handle one more edge case with / basepath ([998b57e](https://github.com/HPInc/davinci/commit/998b57e4ac7e22d6e7128477f5117529437d25bd))





## [1.7.3](https://github.com/HPInc/davinci/compare/@davinci/core@1.7.2...@davinci/core@1.7.3) (2021-07-13)


### Bug Fixes

* correctly handle controllers with no basepath ([b7b67e1](https://github.com/HPInc/davinci/commit/b7b67e1f30613856d55a6eb60f813dd4c688e9bd))





## [1.7.2](https://github.com/HPInc/davinci/compare/@davinci/core@1.7.1...@davinci/core@1.7.2) (2021-07-12)


### Bug Fixes

* express middleware decorator signature ([a6677df](https://github.com/HPInc/davinci/commit/a6677df6a6200314cf24ca1a67140e77a4d7e871))





## [1.7.1](https://github.com/HPInc/davinci/compare/@davinci/core@1.7.0...@davinci/core@1.7.1) (2021-07-06)

**Note:** Version bump only for package @davinci/core





# [1.7.0](https://github.com/HPInc/davinci/compare/@davinci/core@1.6.3...@davinci/core@1.7.0) (2021-07-05)


### Bug Fixes

* small changes to eslintrc ([518ec9f](https://github.com/HPInc/davinci/commit/518ec9f6018bf038a785a136f4e30995104d4603))


### Features

* update to newest typescript, tslib & tslint ([1936fce](https://github.com/HPInc/davinci/commit/1936fce45b979c9689979afc2f6eb970b2059312))





## [1.6.3](https://github.com/HPInc/davinci/compare/@davinci/core@1.6.2...@davinci/core@1.6.3) (2021-07-01)

**Note:** Version bump only for package @davinci/core





## [1.6.2](https://github.com/HPInc/davinci/compare/@davinci/core@1.6.1...@davinci/core@1.6.2) (2021-06-18)


### Bug Fixes

* do not declare as optional in type signature ([9381db7](https://github.com/HPInc/davinci/commit/9381db7431c765f76b88a720cb2b3ea3a4a8e64e))
* export types used in creation ([fa971f2](https://github.com/HPInc/davinci/commit/fa971f21f7dde35193a18c7f77648b3ccf9795f0))
* section name to ajv instance / update example ([14a9dcc](https://github.com/HPInc/davinci/commit/14a9dcc4ac1a693f9f60f1d0b4fd788d47f9e0ce))





## [1.6.1](https://github.com/HPInc/davinci/compare/@davinci/core@1.6.0...@davinci/core@1.6.1) (2021-06-16)


### Bug Fixes

* pass ajv instance on json parsing ([2aa39b3](https://github.com/HPInc/davinci/commit/2aa39b3f956932fea4b4eaa34b60b36bf3b157dd))





# [1.6.0](https://github.com/HPInc/davinci/compare/@davinci/core@1.5.5...@davinci/core@1.6.0) (2021-06-16)


### Features

* added processParameter function, added rest-custom-ajv example pkg ([1f6c6cf](https://github.com/HPInc/davinci/commit/1f6c6cf93be9e279cb08ab72fe3fd092e12d9c3f))
* pass ajv instance and use ajv-errors ([4ce46d0](https://github.com/HPInc/davinci/commit/4ce46d02c2a08b83be8aec4e4bb32eb9e9d656e9))





## [1.5.5](https://github.com/HPInc/davinci/compare/@davinci/core@1.5.4...@davinci/core@1.5.5) (2021-05-12)

**Note:** Version bump only for package @davinci/core





## [1.5.4](https://github.com/HPInc/davinci/compare/@davinci/core@1.5.3...@davinci/core@1.5.4) (2021-04-28)


### Bug Fixes

* use correct 'debug' namespace ([42c5141](https://github.com/HPInc/davinci/commit/42c51413a7849eee7d2d25a105d6de5c0667abbe))





## [1.5.3](https://github.com/HPInc/davinci/compare/@davinci/core@1.5.2...@davinci/core@1.5.3) (2021-04-15)


### Bug Fixes

* **openapi:** filter out 'hidden' prop before ajv validation ([c3161d8](https://github.com/HPInc/davinci/commit/c3161d885a3c0303c5a0b8272a40862aed45edf3))
* removed console.log ([485d533](https://github.com/HPInc/davinci/commit/485d53382cb2ddcd03a96b22a683d6517c66928c))





## [1.5.2](https://github.com/HPInc/davinci/compare/@davinci/core@1.5.1...@davinci/core@1.5.2) (2021-04-14)


### Bug Fixes

* **swagger:** added ability to hide definitions ([036593b](https://github.com/HPInc/davinci/commit/036593bd44e010d571e2e076b73ea439598509f3))





## [1.5.1](https://github.com/HPInc/davinci/compare/@davinci/core@1.5.0...@davinci/core@1.5.1) (2021-04-13)


### Bug Fixes

* **openapi:** fixed the function that handle the 'hidden' property ([ecb59f8](https://github.com/HPInc/davinci/commit/ecb59f8fc059d03523394549b07f9a0411358f0b))





# [1.5.0](https://github.com/HPInc/davinci/compare/@davinci/core@1.4.0...@davinci/core@1.5.0) (2021-04-13)


### Bug Fixes

* tests ([a1b93fb](https://github.com/HPInc/davinci/commit/a1b93fba852e496c8b8d589784428311615dc648))


### Features

* **openapi:** added the ability to hide endpoints from swagger ([7e61607](https://github.com/HPInc/davinci/commit/7e6160736eb88ef34f4f90d1b7f0bfdb94a1563b))





# [1.4.0](https://github.com/HPInc/davinci/compare/@davinci/core@1.3.0...@davinci/core@1.4.0) (2021-04-09)


### Features

* **openapi:** expose function to generate openapi definitions ([#57](https://github.com/HPInc/davinci/issues/57)) ([77ee485](https://github.com/HPInc/davinci/commit/77ee4854fc3352210a5075b41172777da2781b4f))





# [1.3.0](https://github.com/HPInc/davinci/compare/@davinci/core@1.2.1...@davinci/core@1.3.0) (2021-02-22)


### Features

* **mongoose:** better handling of schema options ([#53](https://github.com/HPInc/davinci/issues/53)) ([968d7f0](https://github.com/HPInc/davinci/commit/968d7f0f9308e8ab46dfb3073b801b9f03df36ac))





## [1.2.1](https://github.com/HPInc/davinci/compare/@davinci/core@1.2.0...@davinci/core@1.2.1) (2021-02-16)


### Bug Fixes

* install and use ajv-formats ([#52](https://github.com/HPInc/davinci/issues/52)) ([4e93a39](https://github.com/HPInc/davinci/commit/4e93a398975a68bce18ef5ce75ef2e948e59f85a))





# [1.2.0](https://github.com/HPInc/davinci/compare/@davinci/core@1.1.3...@davinci/core@1.2.0) (2021-02-16)


### Features

* more upgrades ([#51](https://github.com/HPInc/davinci/issues/51)) ([b38a7a8](https://github.com/HPInc/davinci/commit/b38a7a88e5696f41b17b81c0d6b832ba65501157))





## [1.1.3](https://github.com/HPInc/davinci/compare/@davinci/core@1.1.2...@davinci/core@1.1.3) (2021-01-26)

**Note:** Version bump only for package @davinci/core





## [1.1.2](https://github.com/HPInc/davinci/compare/@davinci/core@1.1.1...@davinci/core@1.1.2) (2021-01-26)


### Bug Fixes

* update licenses ([98c76b7](https://github.com/HPInc/davinci/commit/98c76b72d8fdea0cb13fed0afd3b95f2890a345f))





## [1.1.1](https://github.com/HPInc/davinci/compare/@davinci/core@1.1.0...@davinci/core@1.1.1) (2021-01-22)


### Bug Fixes

* upgrade mongoose version to 5.11.13 ([6820d3f](https://github.com/HPInc/davinci/commit/6820d3ffcad04379e430826385ac555e10ca8611))





# [1.1.0](https://github.com/HPInc/davinci/compare/@davinci/core@1.0.2...@davinci/core@1.1.0) (2020-12-03)


### Features

* allow additional fields in openapi definition ([#41](https://github.com/HPInc/davinci/issues/41)) ([374785c](https://github.com/HPInc/davinci/commit/374785c0122008386a791074a21e40890a93dfb3))





## [1.0.2](https://github.com/HPInc/davinci/compare/@davinci/core@1.0.1...@davinci/core@1.0.2) (2020-12-03)


### Bug Fixes

* change errors type ([#42](https://github.com/HPInc/davinci/issues/42)) ([fb3b477](https://github.com/HPInc/davinci/commit/fb3b4779fb04007523cc8c63727dbf57070ae66c))





## [1.0.1](https://github.com/HPInc/davinci/compare/@davinci/core@1.0.0...@davinci/core@1.0.1) (2020-11-02)

**Note:** Version bump only for package @davinci/core





# [1.0.0](https://github.com/HPInc/davinci/compare/@davinci/core@0.19.6...@davinci/core@1.0.0) (2020-10-15)


### chore

* swagger-ui-dist as peer and optional dependency ([795cf05](https://github.com/HPInc/davinci/commit/795cf0595c37ed42af1159cd90c9095c7838a710))


### BREAKING CHANGES

* the main app must install swagger-ui-dist





## [0.19.6](https://github.com/HPInc/davinci/compare/@davinci/core@0.19.5...@davinci/core@0.19.6) (2020-10-14)


### Bug Fixes

* responseHandler is now inline in the router middleware stack ([737f687](https://github.com/HPInc/davinci/commit/737f687c799c30db5cb23d0bf4fad5316865b371))





## [0.19.5](https://github.com/HPInc/davinci/compare/@davinci/core@0.19.4...@davinci/core@0.19.5) (2020-09-29)


### Bug Fixes

* respect parameters position ([8f699c4](https://github.com/HPInc/davinci/commit/8f699c42caf13464e3754ac77b86fe3a45d373ba))
* tests ([99a08ba](https://github.com/HPInc/davinci/commit/99a08ba553143f933cf33a14e6eb085145b6c562))





## [0.19.4](https://github.com/HPInc/davinci/compare/@davinci/core@0.19.3...@davinci/core@0.19.4) (2020-08-27)


### Bug Fixes

* moved @types/mocha to devDependencies ([54b51fd](https://github.com/HPInc/davinci/commit/54b51fdeaaf9099e956773181b5f4899d14052af))





## [0.19.3](https://github.com/HPInc/davinci/compare/@davinci/core@0.19.2...@davinci/core@0.19.3) (2020-07-21)


### Bug Fixes

* update lodash due to security vulnerability ([f41eb8f](https://github.com/HPInc/davinci/commit/f41eb8f7d5c6958288508a51427b8fb1083de11c))





## [0.19.2](https://github.com/HPInc/davinci/compare/@davinci/core@0.19.1...@davinci/core@0.19.2) (2020-07-03)


### Bug Fixes

* **core:** moved express to peerDependencies ([e6e5341](https://github.com/HPInc/davinci/commit/e6e5341a03bba09ea52348a63f9260ed5307005e))





## [0.19.1](https://github.com/HPInc/davinci/compare/@davinci/core@0.19.0...@davinci/core@0.19.1) (2020-07-03)


### Bug Fixes

* don't use console ([5ee0bda](https://github.com/HPInc/davinci/commit/5ee0bda2f42f981e840f56530b4cafb3385221ea))





# [0.19.0](https://github.com/HPInc/davinci/compare/@davinci/core@0.18.1...@davinci/core@0.19.0) (2020-07-03)


### Bug Fixes

* using the common Router interface as type of the parameter ([8eab484](https://github.com/HPInc/davinci/commit/8eab48438053853bf15fb6676ba9e2deadd7758b))


### Features

* allow passing the express instance as parameter ([89f410e](https://github.com/HPInc/davinci/commit/89f410e04ba65f52177868b000dbf10243f62281))





## [0.18.1](https://github.com/HPInc/davinci/compare/@davinci/core@0.18.0...@davinci/core@0.18.1) (2020-07-02)


### Bug Fixes

* parameters type inference ([5c6c4e9](https://github.com/HPInc/davinci/commit/5c6c4e9497eeed8a20593e1e16cc4b9529eeedc5))





# [0.18.0](https://github.com/HPInc/davinci/compare/@davinci/core@0.17.2...@davinci/core@0.18.0) (2020-07-01)


### Bug Fixes

* added enum initializer ([fbe23a7](https://github.com/HPInc/davinci/commit/fbe23a7c7b86c2617d571a003958f86d5e64b661))
* added safety check ([622c10d](https://github.com/HPInc/davinci/commit/622c10d040df6fb0275362405a75bbc8de6c158c))
* allow metho parameters to pass an explicit type ([3973fd9](https://github.com/HPInc/davinci/commit/3973fd9aa06e72e3d66866c1ad886f264a35b6f8))
* fixing tests ([56f80cb](https://github.com/HPInc/davinci/commit/56f80cb1db4f7450aa472494281c03a60e832b42))


### Features

* added the ability to specify enum parameter types ([987c4e1](https://github.com/HPInc/davinci/commit/987c4e1c75cdfd4e8f17208d9a701add4dc8a05b))





## [0.17.2](https://github.com/HPInc/davinci/compare/@davinci/core@0.17.1...@davinci/core@0.17.2) (2020-05-08)

**Note:** Version bump only for package @davinci/core





## [0.17.1](https://github.com/HPInc/davinci/compare/@davinci/core@0.17.0...@davinci/core@0.17.1) (2020-05-06)


### Bug Fixes

* error type detection from the errorHandler MW ([83a16b8](https://github.com/HPInc/davinci/commit/83a16b8ca6f4f0326522a218e80de43000b9c103))





# 0.17.0 (2020-05-06)


### Bug Fixes

* **typing:** removed all the [@ts-ignore](https://github.com/ts-ignore), better typing ([764d267](https://github.com/HPInc/davinci/commit/764d2672ecf9e8c91f918df3c5a3877a9a55c493))
* allow multiple health checks ([#4](https://github.com/HPInc/davinci/issues/4)) ([682676f](https://github.com/HPInc/davinci/commit/682676fc9dc458b6c25d887a43933fbbf78274fc))
* allow to override based on same path and verb ([#11](https://github.com/HPInc/davinci/issues/11)) ([60ba233](https://github.com/HPInc/davinci/commit/60ba23346cfe03da1c9b461bc503197254391354))
* commit all package-lock ([1208431](https://github.com/HPInc/davinci/commit/12084317ba2e35eb7a648400e8e28cdeb3ce79a7))
* configureExpress, method parameter replacement, mongoose controller factory ([#8](https://github.com/HPInc/davinci/issues/8)) ([2268a4f](https://github.com/HPInc/davinci/commit/2268a4fc37209e2a79fc8123a46d034820cae8b8))
* decorators now decorate the class constructor ([49fb513](https://github.com/HPInc/davinci/commit/49fb513a70d27a8062972cd2f4e4cd98d11009ab))
* deep merge and add unit test ([690f9e5](https://github.com/HPInc/davinci/commit/690f9e50e0cfacdfcd8f8662fe5a476e2b83a31b))
* eslint fixes ([26ec606](https://github.com/HPInc/davinci/commit/26ec60686121f0112965b7966fd0215767df1fd6))
* fixed mongoose controller findById ([#10](https://github.com/HPInc/davinci/issues/10)) ([dc1e52e](https://github.com/HPInc/davinci/commit/dc1e52e2e49f000469c488b8a7a52480ecbcb77d))
* **validation:** safer check for validationOptions ([b51ced2](https://github.com/HPInc/davinci/commit/b51ced2f2407d7df71cbf7b1b8fb4644b427ccdb))
* handle excluded methods properly in createRouter ([e9e2997](https://github.com/HPInc/davinci/commit/e9e299711f456aa93737055da86db96360d77632))
* merge schema from type with raw schema ([2b4029a](https://github.com/HPInc/davinci/commit/2b4029adf7da48b3b51ede5fdc5b572c38b7919b))
* population ([#9](https://github.com/HPInc/davinci/issues/9)) ([7a82853](https://github.com/HPInc/davinci/commit/7a82853ea301367f6321958e0a1e6aeefd13f5bb))
* reinstall whole rope to fix circleci sync error ([9d3c733](https://github.com/HPInc/davinci/commit/9d3c733cbd72b179fd2b6ce3c795e61ebb01b925))
* tslint errors ([cbec105](https://github.com/HPInc/davinci/commit/cbec105d7406d36950b27bfbbe282f2e23838136))
* use optional chaining operator and update typescript to 3.7.5 ([6b5d97f](https://github.com/HPInc/davinci/commit/6b5d97faa6d7ad8df3a87906ce21e589a30827fd))
* using correct ajv format for `Dates` ([868c397](https://github.com/HPInc/davinci/commit/868c3975ee9b4de7032d92bc7b1e2d7a5561e1a0))


### Features

* add 'statusCode' (assigned same as 'code') ([fd4dcf4](https://github.com/HPInc/davinci/commit/fd4dcf43fa097b41ea818dd22c785160c16569d4))
* add keepAliveTimeout to createApp ([d06fd75](https://github.com/HPInc/davinci/commit/d06fd7556a04006b4b2230335ac4574c26eca043))
* added swagger UI, simplified swagger doc serving ([391cdd6](https://github.com/HPInc/davinci/commit/391cdd69236ea2f18ba5783159459a0cb649c9ad))
* centralised Reflector package ([1b05c32](https://github.com/HPInc/davinci/commit/1b05c325d66c590856a3310b14e3b820a89d2474))
* configurable swagger path ([5cf46c8](https://github.com/HPInc/davinci/commit/5cf46c8b0142a1ffb3f9b52d4dc0d30513c3075b))
* davinci ([3e477ff](https://github.com/HPInc/davinci/commit/3e477ffdef95b0177d164da110d13bd2243d8a73))
* exposing DaVinci options ([3cdb77e](https://github.com/HPInc/davinci/commit/3cdb77ee2738c4b0766ae3bf05d4357e95ca43ca))
* **decoratorFactory:** added factory functions to the openapi prop decorator ([fdc5cdf](https://github.com/HPInc/davinci/commit/fdc5cdf8006ced4f896b19263fe13d2f910ef5a5))
* lerna conventional commits ([#3](https://github.com/HPInc/davinci/issues/3)) ([ebbfecb](https://github.com/HPInc/davinci/commit/ebbfecb0a6dc41c5ee43de2d891d8f7301bb9590))
* **core:** added rawSchemaOptions support for openapi.prop decorator ([d105d5a](https://github.com/HPInc/davinci/commit/d105d5a70383bdbf5a8c9d089155134815385417))
* merged with master ([327c2da](https://github.com/HPInc/davinci/commit/327c2dacf4c84c863c584f20be7c7019add101ba))
* **eslint:** added eslint, removed tslint (deprecated) ([50d4038](https://github.com/HPInc/davinci/commit/50d4038b62fb95fa208259941f70c5dd2a3874cb))
* **mongooseController:** added $select support ([02d008a](https://github.com/HPInc/davinci/commit/02d008a1c820d0648310bf26e2474eab9e0b267a))
* **mongooseErrorMiddleware:** now correctly returning 400 ([04e4fc8](https://github.com/HPInc/davinci/commit/04e4fc8fe296c60edd29c5928facb025ddef129a))
* **partialValidation:** added partial validation for schemas in route decorators ([d485871](https://github.com/HPInc/davinci/commit/d485871ab5afb3ecf694cfe86d9df829d1f31f5f))
* Reflector, added method getParameterNames ([868e3a8](https://github.com/HPInc/davinci/commit/868e3a831aa779a595e0af9faf1b9fe8e691c28b))
* switched to express-graphql instead of apollo-server-express ([51e6548](https://github.com/HPInc/davinci/commit/51e654882af46c43d743a165988136991bce7f2c))





## [0.16.1](https://github.com/Oneflow/davinci/compare/@davinci/core@0.16.0...@davinci/core@0.16.1) (2020-04-22)


### Bug Fixes

* eslint fixes ([26ec606](https://github.com/Oneflow/davinci/commit/26ec60686121f0112965b7966fd0215767df1fd6))





# [0.16.0](https://github.com/Oneflow/davinci/compare/@davinci/core@0.15.0...@davinci/core@0.16.0) (2020-04-01)


### Features

* **mongooseErrorMiddleware:** now correctly returning 400 ([04e4fc8](https://github.com/Oneflow/davinci/commit/04e4fc8fe296c60edd29c5928facb025ddef129a))





# [0.15.0](https://github.com/Oneflow/davinci/compare/@davinci/core@0.14.0...@davinci/core@0.15.0) (2020-03-30)


### Features

* add keepAliveTimeout to createApp ([d06fd75](https://github.com/Oneflow/davinci/commit/d06fd7556a04006b4b2230335ac4574c26eca043))





# [0.14.0](https://github.com/Oneflow/davinci/compare/@davinci/core@0.13.0...@davinci/core@0.14.0) (2020-02-28)


### Features

* configurable swagger path ([5cf46c8](https://github.com/Oneflow/davinci/commit/5cf46c8b0142a1ffb3f9b52d4dc0d30513c3075b))





# [0.13.0](https://github.com/Oneflow/davinci/compare/@davinci/core@0.12.0...@davinci/core@0.13.0) (2020-02-28)


### Features

* exposing DaVinci options ([3cdb77e](https://github.com/Oneflow/davinci/commit/3cdb77ee2738c4b0766ae3bf05d4357e95ca43ca))





# [0.12.0](https://github.com/Oneflow/davinci/compare/@davinci/core@0.11.3...@davinci/core@0.12.0) (2020-02-28)


### Features

* **mongooseController:** added $select support ([02d008a](https://github.com/Oneflow/davinci/commit/02d008a1c820d0648310bf26e2474eab9e0b267a))





## [0.11.3](https://github.com/Oneflow/davinci/compare/@davinci/core@0.11.2...@davinci/core@0.11.3) (2020-02-18)


### Bug Fixes

* commit all package-lock ([1208431](https://github.com/Oneflow/davinci/commit/12084317ba2e35eb7a648400e8e28cdeb3ce79a7))
* deep merge and add unit test ([690f9e5](https://github.com/Oneflow/davinci/commit/690f9e50e0cfacdfcd8f8662fe5a476e2b83a31b))
* merge schema from type with raw schema ([2b4029a](https://github.com/Oneflow/davinci/commit/2b4029adf7da48b3b51ede5fdc5b572c38b7919b))
* reinstall whole rope to fix circleci sync error ([9d3c733](https://github.com/Oneflow/davinci/commit/9d3c733cbd72b179fd2b6ce3c795e61ebb01b925))
* use optional chaining operator and update typescript to 3.7.5 ([6b5d97f](https://github.com/Oneflow/davinci/commit/6b5d97faa6d7ad8df3a87906ce21e589a30827fd))





## [0.11.2](https://github.com/Oneflow/davinci/compare/@davinci/core@0.11.1...@davinci/core@0.11.2) (2020-02-07)

**Note:** Version bump only for package @davinci/core





## [0.11.1](https://github.com/Oneflow/davinci/compare/@davinci/core@0.11.0...@davinci/core@0.11.1) (2020-01-09)

**Note:** Version bump only for package @davinci/core





# [0.11.0](https://github.com/Oneflow/davinci/compare/@davinci/core@0.10.0...@davinci/core@0.11.0) (2019-11-19)


### Features

* **core:** added rawSchemaOptions support for openapi.prop decorator ([d105d5a](https://github.com/Oneflow/davinci/commit/d105d5a))





# [0.10.0](https://github.com/Oneflow/davinci/compare/@davinci/core@0.9.1...@davinci/core@0.10.0) (2019-11-18)


### Features

* **eslint:** added eslint, removed tslint (deprecated) ([50d4038](https://github.com/Oneflow/davinci/commit/50d4038))





## [0.9.1](https://github.com/Oneflow/davinci/compare/@davinci/core@0.9.0...@davinci/core@0.9.1) (2019-11-01)


### Bug Fixes

* **validation:** safer check for validationOptions ([b51ced2](https://github.com/Oneflow/davinci/commit/b51ced2))





# [0.9.0](https://github.com/Oneflow/davinci/compare/@davinci/core@0.8.2...@davinci/core@0.9.0) (2019-11-01)


### Features

* **partialValidation:** added partial validation for schemas in route decorators ([d485871](https://github.com/Oneflow/davinci/commit/d485871))





## [0.8.2](https://github.com/Oneflow/davinci/compare/@davinci/core@0.8.1...@davinci/core@0.8.2) (2019-10-31)


### Bug Fixes

* **typing:** removed all the [@ts-ignore](https://github.com/ts-ignore), better typing ([764d267](https://github.com/Oneflow/davinci/commit/764d267))
* tslint errors ([cbec105](https://github.com/Oneflow/davinci/commit/cbec105))





## [0.8.1](https://github.com/Oneflow/davinci/compare/@davinci/core@0.8.0...@davinci/core@0.8.1) (2019-10-30)


### Bug Fixes

* using correct ajv format for `Dates` ([868c397](https://github.com/Oneflow/davinci/commit/868c397))





# [0.8.0](https://github.com/Oneflow/davinci/compare/@davinci/core@0.7.0...@davinci/core@0.8.0) (2019-10-30)


### Features

* **decoratorFactory:** added factory functions to the openapi prop decorator ([fdc5cdf](https://github.com/Oneflow/davinci/commit/fdc5cdf))





# [0.7.0](https://github.com/Oneflow/davinci/compare/@davinci/core@0.6.0...@davinci/core@0.7.0) (2019-10-03)


### Features

* switched to express-graphql instead of apollo-server-express ([51e6548](https://github.com/Oneflow/davinci/commit/51e6548))





# 0.6.0 (2019-09-13)


### Bug Fixes

* decorators now decorate the class constructor ([49fb513](https://github.com/Oneflow/davinci/commit/49fb513))



# 0.5.0 (2019-08-29)


### Features

* centralised Reflector package ([1b05c32](https://github.com/Oneflow/davinci/commit/1b05c32))
* Reflector, added method getParameterNames ([868e3a8](https://github.com/Oneflow/davinci/commit/868e3a8))



# 0.4.0 (2019-07-24)


### Features

* added swagger UI, simplified swagger doc serving ([391cdd6](https://github.com/Oneflow/davinci/commit/391cdd6))



# 0.3.0 (2019-07-18)


### Features

* davinci ([3e477ff](https://github.com/Oneflow/davinci/commit/3e477ff))
* merged with master ([327c2da](https://github.com/Oneflow/davinci/commit/327c2da))



## 0.2.1 (2019-07-18)


### Bug Fixes

* handle excluded methods properly in createRouter ([e9e2997](https://github.com/Oneflow/davinci/commit/e9e2997))



# 0.2.0 (2019-07-18)


### Features

* add 'statusCode' (assigned same as 'code') ([fd4dcf4](https://github.com/Oneflow/davinci/commit/fd4dcf4))



## 0.1.6 (2019-06-21)



## 0.1.5 (2019-06-18)


### Bug Fixes

* allow to override based on same path and verb ([#11](https://github.com/Oneflow/davinci/issues/11)) ([60ba233](https://github.com/Oneflow/davinci/commit/60ba233))



## 0.1.4 (2019-06-18)


### Bug Fixes

* fixed mongoose controller findById ([#10](https://github.com/Oneflow/davinci/issues/10)) ([dc1e52e](https://github.com/Oneflow/davinci/commit/dc1e52e))



## 0.1.3 (2019-06-18)


### Bug Fixes

* population ([#9](https://github.com/Oneflow/davinci/issues/9)) ([7a82853](https://github.com/Oneflow/davinci/commit/7a82853))



## 0.1.2 (2019-06-17)


### Bug Fixes

* configureExpress, method parameter replacement, mongoose controller factory ([#8](https://github.com/Oneflow/davinci/issues/8)) ([2268a4f](https://github.com/Oneflow/davinci/commit/2268a4f))



## 0.1.1 (2019-06-07)


### Bug Fixes

* allow multiple health checks ([#4](https://github.com/Oneflow/davinci/issues/4)) ([682676f](https://github.com/Oneflow/davinci/commit/682676f))



# 0.1.0 (2019-06-07)


### Features

* lerna conventional commits ([#3](https://github.com/Oneflow/davinci/issues/3)) ([ebbfecb](https://github.com/Oneflow/davinci/commit/ebbfecb))





# [0.5.0](https://github.com/Oneflow/davinci/compare/v0.4.2...v0.5.0) (2019-08-29)


### Features

* centralised Reflector package ([1b05c32](https://github.com/Oneflow/davinci/commit/1b05c32))
* Reflector, added method getParameterNames ([868e3a8](https://github.com/Oneflow/davinci/commit/868e3a8))





# [0.4.0](https://github.com/Oneflow/davinci/compare/v0.3.0...v0.4.0) (2019-07-24)


### Features

* added swagger UI, simplified swagger doc serving ([391cdd6](https://github.com/Oneflow/davinci/commit/391cdd6))





# [0.3.0](https://github.com/Oneflow/davinci/compare/v0.2.1...v0.3.0) (2019-07-18)


### Features

* davinci ([3e477ff](https://github.com/Oneflow/davinci/commit/3e477ff))
* merged with master ([327c2da](https://github.com/Oneflow/davinci/commit/327c2da))





## [0.2.1](https://github.com/Oneflow/substrate/compare/v0.2.0...v0.2.1) (2019-07-18)


### Bug Fixes

* handle excluded methods properly in createRouter ([e9e2997](https://github.com/Oneflow/substrate/commit/e9e2997))





# [0.2.0](https://github.com/Oneflow/substrate/compare/v0.1.7...v0.2.0) (2019-07-18)


### Features

* add 'statusCode' (assigned same as 'code') ([fd4dcf4](https://github.com/Oneflow/substrate/commit/fd4dcf4))





## [0.1.6](https://github.com/Oneflow/substrate/compare/v0.1.5...v0.1.6) (2019-06-21)

**Note:** Version bump only for package @oneflow/substrate-core





## [0.1.5](https://github.com/Oneflow/substrate/compare/v0.1.4...v0.1.5) (2019-06-18)


### Bug Fixes

* allow to override based on same path and verb ([#11](https://github.com/Oneflow/substrate/issues/11)) ([60ba233](https://github.com/Oneflow/substrate/commit/60ba233))





## [0.1.4](https://github.com/Oneflow/substrate/compare/v0.1.3...v0.1.4) (2019-06-18)


### Bug Fixes

* fixed mongoose controller findById ([#10](https://github.com/Oneflow/substrate/issues/10)) ([dc1e52e](https://github.com/Oneflow/substrate/commit/dc1e52e))





## [0.1.3](https://github.com/Oneflow/substrate/compare/v0.1.2...v0.1.3) (2019-06-18)


### Bug Fixes

* population ([#9](https://github.com/Oneflow/substrate/issues/9)) ([7a82853](https://github.com/Oneflow/substrate/commit/7a82853))





## [0.1.2](https://github.com/Oneflow/substrate/compare/v0.1.1...v0.1.2) (2019-06-17)


### Bug Fixes

* configureExpress, method parameter replacement, mongoose controller factory ([#8](https://github.com/Oneflow/substrate/issues/8)) ([2268a4f](https://github.com/Oneflow/substrate/commit/2268a4f))





## [0.1.1](https://github.com/Oneflow/substrate/compare/v0.1.0...v0.1.1) (2019-06-07)


### Bug Fixes

* allow multiple health checks ([#4](https://github.com/Oneflow/substrate/issues/4)) ([682676f](https://github.com/Oneflow/substrate/commit/682676f))





# 0.1.0 (2019-06-07)


### Features

* lerna conventional commits ([#3](https://github.com/Oneflow/substrate/issues/3)) ([ebbfecb](https://github.com/Oneflow/substrate/commit/ebbfecb))





## [0.0.3](https://github.com/Oneflow/substrate/compare/v0.0.2...v0.0.3) (2019-06-07)

**Note:** Version bump only for package @oneflow/substrate-core





## [0.0.2](https://github.com/Oneflow/substrate/compare/v0.0.1...v0.0.2) (2019-06-07)

**Note:** Version bump only for package @oneflow/substrate-core





## 0.0.1 (2019-06-07)

**Note:** Version bump only for package @oneflow/substrate-core
