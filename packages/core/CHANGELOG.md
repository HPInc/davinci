# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

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
