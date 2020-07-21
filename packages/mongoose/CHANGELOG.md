# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [0.14.9](https://github.com/HPInc/davinci/compare/@davinci/mongoose@0.14.8...@davinci/mongoose@0.14.9) (2020-07-21)


### Bug Fixes

* update lodash due to security vulnerability ([f41eb8f](https://github.com/HPInc/davinci/commit/f41eb8f7d5c6958288508a51427b8fb1083de11c))





## [0.14.8](https://github.com/HPInc/davinci/compare/@davinci/mongoose@0.14.7...@davinci/mongoose@0.14.8) (2020-07-03)

**Note:** Version bump only for package @davinci/mongoose





## [0.14.7](https://github.com/HPInc/davinci/compare/@davinci/mongoose@0.14.6...@davinci/mongoose@0.14.7) (2020-07-03)

**Note:** Version bump only for package @davinci/mongoose





## [0.14.6](https://github.com/HPInc/davinci/compare/@davinci/mongoose@0.14.5...@davinci/mongoose@0.14.6) (2020-07-03)

**Note:** Version bump only for package @davinci/mongoose





## [0.14.5](https://github.com/HPInc/davinci/compare/@davinci/mongoose@0.14.4...@davinci/mongoose@0.14.5) (2020-07-02)

**Note:** Version bump only for package @davinci/mongoose





## [0.14.4](https://github.com/HPInc/davinci/compare/@davinci/mongoose@0.14.3...@davinci/mongoose@0.14.4) (2020-07-01)

**Note:** Version bump only for package @davinci/mongoose





## [0.14.3](https://github.com/HPInc/davinci/compare/@davinci/mongoose@0.14.2...@davinci/mongoose@0.14.3) (2020-05-08)

**Note:** Version bump only for package @davinci/mongoose





## [0.14.2](https://github.com/HPInc/davinci/compare/@davinci/mongoose@0.14.1...@davinci/mongoose@0.14.2) (2020-05-06)

**Note:** Version bump only for package @davinci/mongoose





## [0.14.1](https://github.com/HPInc/davinci/compare/@davinci/mongoose@0.14.0...@davinci/mongoose@0.14.1) (2020-05-06)

**Note:** Version bump only for package @davinci/mongoose





# 0.14.0 (2020-05-06)


### Bug Fixes

* **mongoose:** generate model function now checks Mixed type ([d3d531d](https://github.com/HPInc/davinci/commit/d3d531d5f7eff0de8f14326588e04a03198d898d))
* configureExpress, method parameter replacement, mongoose controller factory ([#8](https://github.com/HPInc/davinci/issues/8)) ([2268a4f](https://github.com/HPInc/davinci/commit/2268a4fc37209e2a79fc8123a46d034820cae8b8))
* correctly passing the context in the updateById method ([ce21207](https://github.com/HPInc/davinci/commit/ce2120779cda440f9592f47eb107a08ad4bf59e7))
* decorators now decorate the class constructor ([49fb513](https://github.com/HPInc/davinci/commit/49fb513a70d27a8062972cd2f4e4cd98d11009ab))
* **mongoose:** sub-schemas now get correctly attached indexes, virtuals, etc ([48802e5](https://github.com/HPInc/davinci/commit/48802e505ee1366820caecd8054989c76f073717))
* fixed mongoose controller findById ([#10](https://github.com/HPInc/davinci/issues/10)) ([dc1e52e](https://github.com/HPInc/davinci/commit/dc1e52e2e49f000469c488b8a7a52480ecbcb77d))
* **validation:** safer check for validationOptions ([b51ced2](https://github.com/HPInc/davinci/commit/b51ced2f2407d7df71cbf7b1b8fb4644b427ccdb))
* fixed mongoose crud model document count ([9eed0c5](https://github.com/HPInc/davinci/commit/9eed0c5c58cbbb3c2fccc33c24b281b5b698d431))
* fixed swagger ids by using {id} convention ([a6f23c0](https://github.com/HPInc/davinci/commit/a6f23c0a418f3e772b6a5eff2a65d84644013666))
* handle excluded methods properly in createRouter ([e9e2997](https://github.com/HPInc/davinci/commit/e9e299711f456aa93737055da86db96360d77632))
* loose check on ObjectId schema type ([#13](https://github.com/HPInc/davinci/issues/13)) ([f25645d](https://github.com/HPInc/davinci/commit/f25645d7535ae718178712cdcfb348e7711c0b22))
* population ([#9](https://github.com/HPInc/davinci/issues/9)) ([7a82853](https://github.com/HPInc/davinci/commit/7a82853ea301367f6321958e0a1e6aeefd13f5bb))
* reinstall whole rope to fix circleci sync error ([9d3c733](https://github.com/HPInc/davinci/commit/9d3c733cbd72b179fd2b6ce3c795e61ebb01b925))
* use optional chaining operator and update typescript to 3.7.5 ([6b5d97f](https://github.com/HPInc/davinci/commit/6b5d97faa6d7ad8df3a87906ce21e589a30827fd))


### Features

* centralised Reflector package ([1b05c32](https://github.com/HPInc/davinci/commit/1b05c325d66c590856a3310b14e3b820a89d2474))
* davinci ([3e477ff](https://github.com/HPInc/davinci/commit/3e477ffdef95b0177d164da110d13bd2243d8a73))
* **partialValidation:** added partial validation for schemas in route decorators ([d485871](https://github.com/HPInc/davinci/commit/d485871ab5afb3ecf694cfe86d9df829d1f31f5f))
* lerna conventional commits ([#3](https://github.com/HPInc/davinci/issues/3)) ([ebbfecb](https://github.com/HPInc/davinci/commit/ebbfecb0a6dc41c5ee43de2d891d8f7301bb9590))
* merged with master ([327c2da](https://github.com/HPInc/davinci/commit/327c2dacf4c84c863c584f20be7c7019add101ba))
* Reflector, added method getParameterNames ([868e3a8](https://github.com/HPInc/davinci/commit/868e3a831aa779a595e0af9faf1b9fe8e691c28b))
* **decoratorFactory:** added factory functions to the openapi prop decorator ([fdc5cdf](https://github.com/HPInc/davinci/commit/fdc5cdf8006ced4f896b19263fe13d2f910ef5a5))
* **eslint:** added eslint, removed tslint (deprecated) ([50d4038](https://github.com/HPInc/davinci/commit/50d4038b62fb95fa208259941f70c5dd2a3874cb))
* **mgoose:** added support for rawMongooseOptions in prop decorator ([fc58778](https://github.com/HPInc/davinci/commit/fc5877872c0fec534e0649691fb28bb514220f72))
* **mongoose:** added countDocuments to the list of supported hook events ([e016894](https://github.com/HPInc/davinci/commit/e01689432f349b62d6d4e7fbcf41fa5b8d2d4e04))
* **mongoose:** prop decorator now has a simpler api ([03f9f22](https://github.com/HPInc/davinci/commit/03f9f22a0e8c86449205b80933fc9b1186e17cfb))
* **mongooseController:** added $select support ([02d008a](https://github.com/HPInc/davinci/commit/02d008a1c820d0648310bf26e2474eab9e0b267a))
* **mongooseErrorMiddleware:** now correctly returning 400 ([04e4fc8](https://github.com/HPInc/davinci/commit/04e4fc8fe296c60edd29c5928facb025ddef129a))





## [0.13.1](https://github.com/Oneflow/davinci/compare/@davinci/mongoose@0.13.0...@davinci/mongoose@0.13.1) (2020-04-22)

**Note:** Version bump only for package @davinci/mongoose





# [0.13.0](https://github.com/Oneflow/davinci/compare/@davinci/mongoose@0.12.5...@davinci/mongoose@0.13.0) (2020-04-01)


### Features

* **mongooseErrorMiddleware:** now correctly returning 400 ([04e4fc8](https://github.com/Oneflow/davinci/commit/04e4fc8fe296c60edd29c5928facb025ddef129a))





## [0.12.5](https://github.com/Oneflow/davinci/compare/@davinci/mongoose@0.12.4...@davinci/mongoose@0.12.5) (2020-03-30)

**Note:** Version bump only for package @davinci/mongoose





## [0.12.4](https://github.com/Oneflow/davinci/compare/@davinci/mongoose@0.12.3...@davinci/mongoose@0.12.4) (2020-03-30)


### Bug Fixes

* correctly passing the context in the updateById method ([ce21207](https://github.com/Oneflow/davinci/commit/ce2120779cda440f9592f47eb107a08ad4bf59e7))





## [0.12.3](https://github.com/Oneflow/davinci/compare/@davinci/mongoose@0.12.2...@davinci/mongoose@0.12.3) (2020-03-24)


### Bug Fixes

* fixed swagger ids by using {id} convention ([a6f23c0](https://github.com/Oneflow/davinci/commit/a6f23c0a418f3e772b6a5eff2a65d84644013666))





## [0.12.2](https://github.com/Oneflow/davinci/compare/@davinci/mongoose@0.12.1...@davinci/mongoose@0.12.2) (2020-02-28)

**Note:** Version bump only for package @davinci/mongoose





## [0.12.1](https://github.com/Oneflow/davinci/compare/@davinci/mongoose@0.12.0...@davinci/mongoose@0.12.1) (2020-02-28)


### Bug Fixes

* **mongoose:** sub-schemas now get correctly attached indexes, virtuals, etc ([48802e5](https://github.com/Oneflow/davinci/commit/48802e505ee1366820caecd8054989c76f073717))





# [0.12.0](https://github.com/Oneflow/davinci/compare/@davinci/mongoose@0.11.4...@davinci/mongoose@0.12.0) (2020-02-28)


### Features

* **mongooseController:** added $select support ([02d008a](https://github.com/Oneflow/davinci/commit/02d008a1c820d0648310bf26e2474eab9e0b267a))





## [0.11.4](https://github.com/Oneflow/davinci/compare/@davinci/mongoose@0.11.3...@davinci/mongoose@0.11.4) (2020-02-18)


### Bug Fixes

* reinstall whole rope to fix circleci sync error ([9d3c733](https://github.com/Oneflow/davinci/commit/9d3c733cbd72b179fd2b6ce3c795e61ebb01b925))
* use optional chaining operator and update typescript to 3.7.5 ([6b5d97f](https://github.com/Oneflow/davinci/commit/6b5d97faa6d7ad8df3a87906ce21e589a30827fd))





## [0.11.3](https://github.com/Oneflow/davinci/compare/@davinci/mongoose@0.11.2...@davinci/mongoose@0.11.3) (2020-02-07)

**Note:** Version bump only for package @davinci/mongoose





## [0.11.2](https://github.com/Oneflow/davinci/compare/@davinci/mongoose@0.11.1...@davinci/mongoose@0.11.2) (2020-02-07)


### Bug Fixes

* fixed mongoose crud model document count ([9eed0c5](https://github.com/Oneflow/davinci/commit/9eed0c5))





## [0.11.1](https://github.com/Oneflow/davinci/compare/@davinci/mongoose@0.11.0...@davinci/mongoose@0.11.1) (2020-01-09)

**Note:** Version bump only for package @davinci/mongoose





# [0.11.0](https://github.com/Oneflow/davinci/compare/@davinci/mongoose@0.10.0...@davinci/mongoose@0.11.0) (2019-11-22)


### Features

* **mongoose:** added countDocuments to the list of supported hook events ([e016894](https://github.com/Oneflow/davinci/commit/e016894))





# [0.10.0](https://github.com/Oneflow/davinci/compare/@davinci/mongoose@0.9.0...@davinci/mongoose@0.10.0) (2019-11-19)


### Features

* **mgoose:** added support for rawMongooseOptions in prop decorator ([fc58778](https://github.com/Oneflow/davinci/commit/fc58778))
* **mongoose:** prop decorator now has a simpler api ([03f9f22](https://github.com/Oneflow/davinci/commit/03f9f22))





# [0.9.0](https://github.com/Oneflow/davinci/compare/@davinci/mongoose@0.8.1...@davinci/mongoose@0.9.0) (2019-11-18)


### Features

* **eslint:** added eslint, removed tslint (deprecated) ([50d4038](https://github.com/Oneflow/davinci/commit/50d4038))





## [0.8.1](https://github.com/Oneflow/davinci/compare/@davinci/mongoose@0.8.0...@davinci/mongoose@0.8.1) (2019-11-01)


### Bug Fixes

* **validation:** safer check for validationOptions ([b51ced2](https://github.com/Oneflow/davinci/commit/b51ced2))





# [0.8.0](https://github.com/Oneflow/davinci/compare/@davinci/mongoose@0.7.2...@davinci/mongoose@0.8.0) (2019-11-01)


### Features

* **partialValidation:** added partial validation for schemas in route decorators ([d485871](https://github.com/Oneflow/davinci/commit/d485871))





## [0.7.2](https://github.com/Oneflow/davinci/compare/@davinci/mongoose@0.7.1...@davinci/mongoose@0.7.2) (2019-10-31)

**Note:** Version bump only for package @davinci/mongoose





## [0.7.1](https://github.com/Oneflow/davinci/compare/@davinci/mongoose@0.7.0...@davinci/mongoose@0.7.1) (2019-10-30)

**Note:** Version bump only for package @davinci/mongoose





# [0.7.0](https://github.com/Oneflow/davinci/compare/@davinci/mongoose@0.6.1...@davinci/mongoose@0.7.0) (2019-10-30)


### Bug Fixes

* **mongoose:** generate model function now checks Mixed type ([d3d531d](https://github.com/Oneflow/davinci/commit/d3d531d))


### Features

* **decoratorFactory:** added factory functions to the openapi prop decorator ([fdc5cdf](https://github.com/Oneflow/davinci/commit/fdc5cdf))





## [0.6.1](https://github.com/Oneflow/davinci/compare/@davinci/mongoose@0.6.0...@davinci/mongoose@0.6.1) (2019-10-03)

**Note:** Version bump only for package @davinci/mongoose





# 0.6.0 (2019-09-13)


### Bug Fixes

* decorators now decorate the class constructor ([49fb513](https://github.com/Oneflow/davinci/commit/49fb513))



# 0.5.0 (2019-08-29)


### Features

* centralised Reflector package ([1b05c32](https://github.com/Oneflow/davinci/commit/1b05c32))
* Reflector, added method getParameterNames ([868e3a8](https://github.com/Oneflow/davinci/commit/868e3a8))



## 0.4.2 (2019-08-13)



# 0.4.0 (2019-07-24)



# 0.3.0 (2019-07-18)


### Features

* davinci ([3e477ff](https://github.com/Oneflow/davinci/commit/3e477ff))
* merged with master ([327c2da](https://github.com/Oneflow/davinci/commit/327c2da))



## 0.2.1 (2019-07-18)


### Bug Fixes

* handle excluded methods properly in createRouter ([e9e2997](https://github.com/Oneflow/davinci/commit/e9e2997))



# 0.2.0 (2019-07-18)



## 0.1.7 (2019-06-25)


### Bug Fixes

* loose check on ObjectId schema type ([#13](https://github.com/Oneflow/davinci/issues/13)) ([f25645d](https://github.com/Oneflow/davinci/commit/f25645d))



## 0.1.6 (2019-06-21)



## 0.1.5 (2019-06-18)



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



# 0.1.0 (2019-06-07)


### Features

* lerna conventional commits ([#3](https://github.com/Oneflow/davinci/issues/3)) ([ebbfecb](https://github.com/Oneflow/davinci/commit/ebbfecb))





# [0.5.0](https://github.com/Oneflow/davinci/compare/v0.4.2...v0.5.0) (2019-08-29)


### Features

* centralised Reflector package ([1b05c32](https://github.com/Oneflow/davinci/commit/1b05c32))
* Reflector, added method getParameterNames ([868e3a8](https://github.com/Oneflow/davinci/commit/868e3a8))





## [0.4.2](https://github.com/Oneflow/davinci/compare/v0.4.1...v0.4.2) (2019-08-13)

**Note:** Version bump only for package @davinci/mongoose





# [0.4.0](https://github.com/Oneflow/davinci/compare/v0.3.0...v0.4.0) (2019-07-24)

**Note:** Version bump only for package @davinci/mongoose





# [0.3.0](https://github.com/Oneflow/davinci/compare/v0.2.1...v0.3.0) (2019-07-18)


### Features

* davinci ([3e477ff](https://github.com/Oneflow/davinci/commit/3e477ff))
* merged with master ([327c2da](https://github.com/Oneflow/davinci/commit/327c2da))





## [0.2.1](https://github.com/Oneflow/substrate/compare/v0.2.0...v0.2.1) (2019-07-18)


### Bug Fixes

* handle excluded methods properly in createRouter ([e9e2997](https://github.com/Oneflow/substrate/commit/e9e2997))





# [0.2.0](https://github.com/Oneflow/substrate/compare/v0.1.7...v0.2.0) (2019-07-18)

**Note:** Version bump only for package @oneflow/substrate-mongoose





## [0.1.7](https://github.com/Oneflow/substrate/compare/v0.1.6...v0.1.7) (2019-06-25)


### Bug Fixes

* loose check on ObjectId schema type ([#13](https://github.com/Oneflow/substrate/issues/13)) ([f25645d](https://github.com/Oneflow/substrate/commit/f25645d))





## [0.1.6](https://github.com/Oneflow/substrate/compare/v0.1.5...v0.1.6) (2019-06-21)

**Note:** Version bump only for package @oneflow/substrate-mongoose





## [0.1.5](https://github.com/Oneflow/substrate/compare/v0.1.4...v0.1.5) (2019-06-18)

**Note:** Version bump only for package @oneflow/substrate-mongoose





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

**Note:** Version bump only for package @oneflow/substrate-mongoose





# 0.1.0 (2019-06-07)


### Features

* lerna conventional commits ([#3](https://github.com/Oneflow/substrate/issues/3)) ([ebbfecb](https://github.com/Oneflow/substrate/commit/ebbfecb))





## [0.0.3](https://github.com/Oneflow/substrate/compare/v0.0.2...v0.0.3) (2019-06-07)

**Note:** Version bump only for package @oneflow/substrate-mongoose





## [0.0.2](https://github.com/Oneflow/substrate/compare/v0.0.1...v0.0.2) (2019-06-07)

**Note:** Version bump only for package @oneflow/substrate-mongoose





## 0.0.1 (2019-06-07)

**Note:** Version bump only for package @oneflow/substrate-mongoose
