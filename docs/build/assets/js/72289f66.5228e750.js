"use strict";(self.webpackChunk_davinci_docs=self.webpackChunk_davinci_docs||[]).push([[141],{3905:(e,n,t)=>{t.d(n,{Zo:()=>l,kt:()=>m});var r=t(7294);function o(e,n,t){return n in e?Object.defineProperty(e,n,{value:t,enumerable:!0,configurable:!0,writable:!0}):e[n]=t,e}function i(e,n){var t=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);n&&(r=r.filter((function(n){return Object.getOwnPropertyDescriptor(e,n).enumerable}))),t.push.apply(t,r)}return t}function a(e){for(var n=1;n<arguments.length;n++){var t=null!=arguments[n]?arguments[n]:{};n%2?i(Object(t),!0).forEach((function(n){o(e,n,t[n])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(t)):i(Object(t)).forEach((function(n){Object.defineProperty(e,n,Object.getOwnPropertyDescriptor(t,n))}))}return e}function s(e,n){if(null==e)return{};var t,r,o=function(e,n){if(null==e)return{};var t,r,o={},i=Object.keys(e);for(r=0;r<i.length;r++)t=i[r],n.indexOf(t)>=0||(o[t]=e[t]);return o}(e,n);if(Object.getOwnPropertySymbols){var i=Object.getOwnPropertySymbols(e);for(r=0;r<i.length;r++)t=i[r],n.indexOf(t)>=0||Object.prototype.propertyIsEnumerable.call(e,t)&&(o[t]=e[t])}return o}var c=r.createContext({}),p=function(e){var n=r.useContext(c),t=n;return e&&(t="function"==typeof e?e(n):a(a({},n),e)),t},l=function(e){var n=p(e.components);return r.createElement(c.Provider,{value:n},e.children)},d={inlineCode:"code",wrapper:function(e){var n=e.children;return r.createElement(r.Fragment,{},n)}},u=r.forwardRef((function(e,n){var t=e.components,o=e.mdxType,i=e.originalType,c=e.parentName,l=s(e,["components","mdxType","originalType","parentName"]),u=p(t),m=o,f=u["".concat(c,".").concat(m)]||u[m]||d[m]||i;return t?r.createElement(f,a(a({ref:n},l),{},{components:t})):r.createElement(f,a({ref:n},l))}));function m(e,n){var t=arguments,o=n&&n.mdxType;if("string"==typeof e||o){var i=t.length,a=new Array(i);a[0]=u;var s={};for(var c in n)hasOwnProperty.call(n,c)&&(s[c]=n[c]);s.originalType=e,s.mdxType="string"==typeof e?e:o,a[1]=s;for(var p=2;p<i;p++)a[p]=t[p];return r.createElement.apply(null,a)}return r.createElement.apply(null,t)}u.displayName="MDXCreateElement"},9703:(e,n,t)=>{t.r(n),t.d(n,{assets:()=>c,contentTitle:()=>a,default:()=>d,frontMatter:()=>i,metadata:()=>s,toc:()=>p});var r=t(7462),o=(t(7294),t(3905));const i={},a="Migration from V1",s={unversionedId:"migration-from-v1",id:"migration-from-v1",title:"Migration from V1",description:"The following guide is a starting point for developers that want to migrate and old DaVinci V1 app, into the new V2.",source:"@site/docs/migration-from-v1.md",sourceDirName:".",slug:"/migration-from-v1",permalink:"/davinci/docs/2.0.0/migration-from-v1",draft:!1,tags:[],version:"current",frontMatter:{},sidebar:"mySidebar",previous:{title:"Interceptors",permalink:"/davinci/docs/2.0.0/interceptors"}},c={},p=[{value:"Rewrite App initialization code",id:"rewrite-app-initialization-code",level:2},{value:"Before (V1)",id:"before-v1",level:3},{value:"After (V2)",id:"after-v2",level:3},{value:"Replace legacy decorators",id:"replace-legacy-decorators",level:2},{value:"Moved route and httpErrors to <code>http-server</code>",id:"moved-route-and-httperrors-to-http-server",level:2},{value:"Before (V1)",id:"before-v1-1",level:3},{value:"After (V2)",id:"after-v2-1",level:3},{value:"Rewrite boot scripts as Modules",id:"rewrite-boot-scripts-as-modules",level:2},{value:"Before (V1)",id:"before-v1-2",level:3},{value:"After (V1)",id:"after-v1",level:3},{value:"Rewrite express middlewares as Interceptors",id:"rewrite-express-middlewares-as-interceptors",level:2},{value:"Before (V!)",id:"before-v",level:3},{value:"After (V2)",id:"after-v2-2",level:3}],l={toc:p};function d(e){let{components:n,...t}=e;return(0,o.kt)("wrapper",(0,r.Z)({},l,t,{components:n,mdxType:"MDXLayout"}),(0,o.kt)("h1",{id:"migration-from-v1"},"Migration from V1"),(0,o.kt)("p",null,"The following guide is a starting point for developers that want to migrate and old DaVinci V1 app, into the new V2.",(0,o.kt)("br",{parentName:"p"}),"\n","Few steps are required as some breaking changes have been introduced."),(0,o.kt)("h2",{id:"rewrite-app-initialization-code"},"Rewrite App initialization code"),(0,o.kt)("p",null,"The App initialization code has undergone radical changes.",(0,o.kt)("br",{parentName:"p"}),"\n","The monolithic initialization and configuration of DaVinci V1 has been removed\nin favour of a more modular, configurable approach.",(0,o.kt)("br",{parentName:"p"}),"\n","All the functionalities have been taken out from the 'core' package, into more\ndedicated and specialized packages (e.g. http-server, http-server-fastify, openapi, health-checks)"),(0,o.kt)("h3",{id:"before-v1"},"Before (V1)"),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-ts"},"import { createApp, createRouter, DaVinciExpress } from '@davinci/core';\nimport cors from 'cors';\nimport express from 'express';\nimport mongoose from 'mongoose';\nimport packageJson from '../package.json';\nimport DashboardController from './api/dashboard/DashboardController';\nimport config from './config';\nimport aclCheck from './middlewares/aclCheck';\nimport createContext from './lib/createContext';\n\nconst expressApp = express();\nconst bootOptions = {\n    version: packageJson.version,\n    boot: {\n        dirPath: './build/src/boot'\n    },\n    healthChecks: {\n        readynessEndpoint: '/.ah/ready',\n        livenessEndpoint: '/.ah/live'\n    }\n};\n\ncreateApp(expressApp, bootOptions, (app: any) => {\n    if (config.env === 'local') {\n        app.use(\n            cors({\n                credentials: true,\n                origin: true\n            })\n        );\n    }\n    app.use(aclCheck);\n    app.use(createRouter(DashboardController, null, createContext));\n});\n\nif (require.main === module) {\n    // this module was run directly from the command line as in node xxx.js\n    (expressApp as DaVinciExpress).start();\n}\n\nexport default expressApp;\n")),(0,o.kt)("h3",{id:"after-v2"},"After (V2)"),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-ts"},"import { createApp } from '@davinci/core';\nimport { FastifyHttpServer } from '@davinci/http-server-fastify';\nimport { MongooseModule } from '@davinci/mongoose';\nimport { HealthChecksModule } from '@davinci/health-checks';\nimport { OpenAPIModule } from '@davinci/openapi';\nimport DashboardController from './api/dashboard/DashboardController';\nimport packageJson from '../package.json';\nimport config from './config';\nimport { createContext } from './lib/createContext';\nimport { AuthModule } from './auth/AuthModule';\n\nconst app = createApp();\n\napp.registerController([DashboardController]).registerModule(\n    new FastifyHttpServer({\n        port: 8080,\n        contextFactory: createContext,\n        middlewares: {\n            cors: {\n                ...(config.env === 'local' ? { credentials: true, origin: true } : {})\n            }\n        }\n    }),\n\n    // the MongoDB initialization and connection is now handled by the mongoose module.\n    // In V1 a boot script was required\n    new MongooseModule({\n        connection: { uri: config.mongodb }\n    }),\n\n    // the health checks endpoints configuration is now handled by the dedicated and separate module\n    new HealthChecksModule({\n        healthChecks: [\n            { name: 'liveness', endpoint: '/.ah/live' },\n            { name: 'readiness', endpoint: '/.ah/ready' }\n        ]\n    }),\n\n    // the OpenAPI configuration is now handled by the dedicated and separate module\n    new OpenAPIModule({\n        document: {\n            spec: {\n                info: { version: packageJson.version, title: 'Dashboard API' },\n                components: {\n                    securitySchemes: {\n                        bearerAuth: {\n                            type: 'http',\n                            scheme: 'bearer',\n                            bearerFormat: 'JWT'\n                        }\n                    }\n                },\n                security: [\n                    {\n                        bearerAuth: []\n                    }\n                ]\n            }\n        }\n    }),\n\n    // All the V1 boot scripts, must be rewritten as Modules and registered here.\n    new AuthModule()\n);\n\nif (require.main === module) {\n    app.init();\n}\n\nexport default app;\n")),(0,o.kt)("h2",{id:"replace-legacy-decorators"},"Replace legacy decorators"),(0,o.kt)("p",null,"The openapi decorators have been removed in favour of a more generic entity ones.",(0,o.kt)("br",{parentName:"p"}),"\n","Specifically"),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-diff"},"-import { openapi } from '@davinci/core';\n+import { entity } from '@davinci/core';\n\n\n-@openapi.definition({ title: 'Dashboard' })\n+@entity({ name: 'Dashboard' })\nexport default class DashboardSchema {\n-   @openapi.prop({ required: true })\n+   @entity.prop({ required: true })\n    name: string;\n\n-   @openapi.prop()\n+   @entity.prop()\n    accountId: string;\n\n-   @openapi.prop()\n+   @entity.prop()\n    userId: string;\n\n-   @openapi.prop()\n+   @entity.prop()\n    theme: string;\n}\n")),(0,o.kt)("h2",{id:"moved-route-and-httperrors-to-http-server"},"Moved route and httpErrors to ",(0,o.kt)("inlineCode",{parentName:"h2"},"http-server")),(0,o.kt)("p",null,"As DaVinci is now a generic App container, all the functionalities specific to web servers\nhave been moved inside the ",(0,o.kt)("inlineCode",{parentName:"p"},"http-server")," package."),(0,o.kt)("h3",{id:"before-v1-1"},"Before (V1)"),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-ts"},"import { context, route, httpErrors, openapi } from '@davinci/core';\n")),(0,o.kt)("h3",{id:"after-v2-1"},"After (V2)"),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-ts"},"import { context, entity } from '@davinci/core';\nimport { httpErrors, route } from '@davinci/http-server';\n")),(0,o.kt)("h2",{id:"rewrite-boot-scripts-as-modules"},"Rewrite boot scripts as Modules"),(0,o.kt)("p",null,"The new DaVinci V2 is implemented around the concept of modules, typescript classes where specific\nfunctionalities are implemented.\nModules also integrates some app lifecycle hooks ",(0,o.kt)("inlineCode",{parentName:"p"},"onRegister"),", ",(0,o.kt)("inlineCode",{parentName:"p"},"onInit")," and ",(0,o.kt)("inlineCode",{parentName:"p"},"onDestroy"),".\nThose hooks will be used to rewrite the legacy boot scripts present in V1, into Modules."),(0,o.kt)("h3",{id:"before-v1-2"},"Before (V1)"),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-ts"},"// src/boot/initAuthSubscriber.js\nimport AuthApiService from '../auth/AuthSubscriber';\nimport config from '../config';\n\nconst { sqsConfig } = config;\n\nmodule.exports = async () => {\n    const credentials = sqsConfig.aws.credentials;\n    if (!credentials.accessKeyId || !credentials.secretAccessKey) {\n        return console.warn('Missing aws credentials, AuthEventSubscriber not started');\n    }\n    const authEventsSubscriber = new AuthApiService(sqsConfig);\n    await authEventsSubscriber.listen();\n\n    app.registerOnSignalJob(() => {\n        // do cleanup if necessary\n    });\n};\n")),(0,o.kt)("h3",{id:"after-v1"},"After (V1)"),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-ts"},"// src/auth/AuthModule.js\nimport { App, Module } from '@davinci/core';\nimport AuthApiService from '../auth/AuthSubscriber';\nimport config from '../config';\n\nconst { sqsConfig } = config;\n\nexport class AuthModule extends Module {\n    logger: App['logger'];\n\n    getModuleId() {\n        return 'auth';\n    }\n\n    onRegister(app: App) {\n        this.logger = app.logger.child({ name: 'AuthModule' });\n    }\n\n    onInit(): unknown | Promise<unknown> {\n        const credentials = sqsConfig.aws.credentials;\n        if (!credentials.accessKeyId || !credentials.secretAccessKey) {\n            return this.logger.warn('Missing aws credentials, AuthEventSubscriber not started');\n        }\n        const authEventsSubscriber = new AuthApiService(sqsConfig);\n        return authEventsSubscriber.listen();\n    }\n\n    onDestroy() {\n        // do cleanup if necessary\n    }\n}\n")),(0,o.kt)("h2",{id:"rewrite-express-middlewares-as-interceptors"},"Rewrite express middlewares as Interceptors"),(0,o.kt)("p",null,"The V2 of DaVinci implements an internal interceptors' system, that is capable to hook into the request lifecycle\nto augment or even replace the standard request flow."),(0,o.kt)("h3",{id:"before-v"},"Before (V!)"),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-ts"},"import { httpErrors } from '@davinci/core';\n\nexport default function aclCheck(req, _res, next) {\n    const context = req.context;\n    const accountId = context.accountId;\n\n    const grantedRoles = ['admin', 'service'];\n    const isRoleAdmin = context.aclGroups.find(g => grantedRoles.includes(g));\n    const isUserAllowed = context.ofAuth || context.userAccounts.includes(accountId);\n\n    if (!isRoleAdmin && !isUserAllowed) {\n        return next(new httpErrors.NotAuthenticated('Unauthorized'));\n    }\n\n    return next();\n}\n")),(0,o.kt)("h3",{id:"after-v2-2"},"After (V2)"),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-ts"},"import { httpErrors, HttpServerInterceptor } from '@davinci/http-server';\nimport { FastifyRequest } from 'fastify';\nimport { Context } from '../types';\n\nexport const aclCheck: HttpServerInterceptor<{ Context: Context }, FastifyRequest> = (next, { context }) => {\n    const accountId = context.accountId;\n\n    const grantedRoles = ['admin', 'service'];\n    const isRoleAdmin = context.aclGroups.find(g => grantedRoles.includes(g));\n    const isUserAllowed = context.ofAuth || context.userAccounts.includes(accountId);\n\n    if (!isRoleAdmin && !isUserAllowed) {\n        throw new httpErrors.NotAuthenticated('Unauthorized');\n    }\n\n    // remember to always return the next function call\n    return next();\n};\n")))}d.isMDXComponent=!0}}]);