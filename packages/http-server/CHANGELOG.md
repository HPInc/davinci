# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [3.2.0](https://github.com/HPInc/davinci/compare/@davinci/http-server@3.1.0...@davinci/http-server@3.2.0) (2022-12-16)


### Features

* entity definition json walker ([#172](https://github.com/HPInc/davinci/issues/172)) ([da0a80d](https://github.com/HPInc/davinci/commit/da0a80dde0dee79bb3a21407afc0ea70909fd30b))





# [3.1.0](https://github.com/HPInc/davinci/compare/@davinci/http-server@3.0.0...@davinci/http-server@3.1.0) (2022-12-15)


### Features

* allow multiple http method decorators ([bf843aa](https://github.com/HPInc/davinci/commit/bf843aa30941c1e98af1a41db6556b85bd4c3513))
* **http-server:** createRoutes method now handle multiple decorations ([80e48bd](https://github.com/HPInc/davinci/commit/80e48bd7f67e435f16bfd6541e9eec309320ea53))





# [3.0.0](https://github.com/HPInc/davinci/compare/@davinci/http-server@2.3.1...@davinci/http-server@3.0.0) (2022-12-15)


### Features

* remove support for passing ajv instances to AjvValidator ([7538413](https://github.com/HPInc/davinci/commit/7538413ef454350bf22c38e6c3559a3ddae35c20))


### BREAKING CHANGES

* AjvValidator does not support ajv instances anymore
AjvValidator instances can be configured fully through the options





## [2.3.1](https://github.com/HPInc/davinci/compare/@davinci/http-server@2.3.0...@davinci/http-server@2.3.1) (2022-12-13)


### Bug Fixes

* do not check if addFormats plugin is duplicated ([903de94](https://github.com/HPInc/davinci/commit/903de947c31c7955daa4c7d974e104e26f63fbc2))
* register ajv plugins once per ajv instance ([27a3813](https://github.com/HPInc/davinci/commit/27a381349e1014d4efedfebc2e78739f0abd033e))





# [2.3.0](https://github.com/HPInc/davinci/compare/@davinci/http-server@2.2.0...@davinci/http-server@2.3.0) (2022-12-12)


### Bug Fixes

* check plugins is not undefined before foreach ([f8f06e1](https://github.com/HPInc/davinci/commit/f8f06e19da649d28cc3b186b82e0a4be87934039))
* options can be undefined in registerPlugins ([f9b153c](https://github.com/HPInc/davinci/commit/f9b153c1c5809c6cad9b6bbbdca7c6fe005c9c2c))


### Features

* register ajv plugins on init for all ajv instances ([483beca](https://github.com/HPInc/davinci/commit/483beca46bb1b84edcdf9f04bf0680443fa44d8e))





# [2.2.0](https://github.com/HPInc/davinci/compare/@davinci/http-server@2.1.2...@davinci/http-server@2.2.0) (2022-12-12)


### Features

* added parameter that enables jsonified querystring parsing ([#180](https://github.com/HPInc/davinci/issues/180)) ([990647f](https://github.com/HPInc/davinci/commit/990647f1d38cb674a42da56d699055afa7b61714))





## [2.1.2](https://github.com/HPInc/davinci/compare/@davinci/http-server@2.1.1...@davinci/http-server@2.1.2) (2022-12-09)

**Note:** Version bump only for package @davinci/http-server





## [2.1.1](https://github.com/HPInc/davinci/compare/@davinci/http-server@2.1.0...@davinci/http-server@2.1.1) (2022-12-02)


### Performance Improvements

* optimizing dependencies and compiled code for size ([#170](https://github.com/HPInc/davinci/issues/170)) ([9b7bd96](https://github.com/HPInc/davinci/commit/9b7bd96654479b8dd03faeb56e70476b15d4420f))





# 2.1.0 (2022-12-01)


### Features

* DaVinci v2 ([6a10e09](https://github.com/HPInc/davinci/commit/6a10e09e22c8561ee8d54c93d4fb8c7fe0d564a9))





## [2.0.1](https://github.com/HPInc/davinci/compare/@davinci/http-server@2.0.0-next.24...@davinci/http-server@2.0.1) (2022-12-01)

**Note:** Version bump only for package @davinci/http-server





# [2.0.0](https://github.com/HPInc/davinci/compare/@davinci/http-server@2.0.0-next.24...@davinci/http-server@2.0.0) (2022-12-01)

**Note:** Version bump only for package @davinci/http-server
