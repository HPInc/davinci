"use strict";(self.webpackChunk_davinci_docs=self.webpackChunk_davinci_docs||[]).push([[162],{3905:(e,t,r)=>{r.d(t,{Zo:()=>p,kt:()=>m});var n=r(7294);function a(e,t,r){return t in e?Object.defineProperty(e,t,{value:r,enumerable:!0,configurable:!0,writable:!0}):e[t]=r,e}function o(e,t){var r=Object.keys(e);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(e);t&&(n=n.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),r.push.apply(r,n)}return r}function i(e){for(var t=1;t<arguments.length;t++){var r=null!=arguments[t]?arguments[t]:{};t%2?o(Object(r),!0).forEach((function(t){a(e,t,r[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(r)):o(Object(r)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(r,t))}))}return e}function l(e,t){if(null==e)return{};var r,n,a=function(e,t){if(null==e)return{};var r,n,a={},o=Object.keys(e);for(n=0;n<o.length;n++)r=o[n],t.indexOf(r)>=0||(a[r]=e[r]);return a}(e,t);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(e);for(n=0;n<o.length;n++)r=o[n],t.indexOf(r)>=0||Object.prototype.propertyIsEnumerable.call(e,r)&&(a[r]=e[r])}return a}var s=n.createContext({}),c=function(e){var t=n.useContext(s),r=t;return e&&(r="function"==typeof e?e(t):i(i({},t),e)),r},p=function(e){var t=c(e.components);return n.createElement(s.Provider,{value:t},e.children)},u={inlineCode:"code",wrapper:function(e){var t=e.children;return n.createElement(n.Fragment,{},t)}},d=n.forwardRef((function(e,t){var r=e.components,a=e.mdxType,o=e.originalType,s=e.parentName,p=l(e,["components","mdxType","originalType","parentName"]),d=c(r),m=a,f=d["".concat(s,".").concat(m)]||d[m]||u[m]||o;return r?n.createElement(f,i(i({ref:t},p),{},{components:r})):n.createElement(f,i({ref:t},p))}));function m(e,t){var r=arguments,a=t&&t.mdxType;if("string"==typeof e||a){var o=r.length,i=new Array(o);i[0]=d;var l={};for(var s in t)hasOwnProperty.call(t,s)&&(l[s]=t[s]);l.originalType=e,l.mdxType="string"==typeof e?e:a,i[1]=l;for(var c=2;c<o;c++)i[c]=r[c];return n.createElement.apply(null,i)}return n.createElement.apply(null,r)}d.displayName="MDXCreateElement"},9390:(e,t,r)=>{r.r(t),r.d(t,{assets:()=>s,contentTitle:()=>i,default:()=>u,frontMatter:()=>o,metadata:()=>l,toc:()=>c});var n=r(7462),a=(r(7294),r(3905));const o={},i="Getting Started",l={unversionedId:"getting-started",id:"getting-started",title:"Getting Started",description:"Installation",source:"@site/docs/getting-started.md",sourceDirName:".",slug:"/getting-started",permalink:"/davinci/docs/2.0.0/getting-started",draft:!1,tags:[],version:"current",frontMatter:{},sidebar:"mySidebar",previous:{title:"Introduction",permalink:"/davinci/docs/2.0.0/intro"},next:{title:"Intro",permalink:"/davinci/docs/2.0.0/modules/"}},s={},c=[{value:"Installation",id:"installation",level:2},{value:"Install HTTP Server module",id:"install-http-server-module",level:2},{value:"Create a controller",id:"create-a-controller",level:3},{value:"Create the main file",id:"create-the-main-file",level:3},{value:"Start the app",id:"start-the-app",level:3}],p={toc:c};function u(e){let{components:t,...r}=e;return(0,a.kt)("wrapper",(0,n.Z)({},p,r,{components:t,mdxType:"MDXLayout"}),(0,a.kt)("h1",{id:"getting-started"},"Getting Started"),(0,a.kt)("h2",{id:"installation"},"Installation"),(0,a.kt)("p",null,"DaVinci can be installed with either ",(0,a.kt)("inlineCode",{parentName:"p"},"npm")," or ",(0,a.kt)("inlineCode",{parentName:"p"},"yarn"),"."),(0,a.kt)("pre",null,(0,a.kt)("code",{parentName:"pre",className:"language-bash"},"npm i --save @davinci/http-server-fastify @davinci/http-server ajv ajv-formats fastify @fastify/cors @fastify/static qs\n")),(0,a.kt)("br",null),(0,a.kt)("h2",{id:"install-http-server-module"},"Install HTTP Server module"),(0,a.kt)("p",null,"In this example, we are going to implement a basic HTTP Server, defining with API endpoints and handlers declaratively, using classes and decorators."),(0,a.kt)("h3",{id:"create-a-controller"},"Create a controller"),(0,a.kt)("pre",null,(0,a.kt)("code",{parentName:"pre",className:"language-typescript"},"// file: ./CustomerController.ts\nimport { context } from '@davinci/core';\nimport { route } from '@davinci/http-server';\n\n@route.controller({ basepath: '/api/customers' })\nexport class CustomerController {\n    @route.get({ path: '/hello', summary: 'This is a hello method' })\n    hello(@route.query() firstname: string, @context() context) {\n        console.log(firstname, context);\n        return firstname;\n    }\n\n    @route.post({ path: '/create', summary: 'This is a create method' })\n    create(@route.body() data: object) {\n        console.log(data);\n        return { success: true };\n    }\n}\n")),(0,a.kt)("h3",{id:"create-the-main-file"},"Create the main file"),(0,a.kt)("pre",null,(0,a.kt)("code",{parentName:"pre",className:"language-typescript"},"// file: ./index.ts\nimport { createApp } from '@davinci/core';\nimport { FastifyHttpServer } from '@davinci/http-server-fastify';\nimport { CustomerController } from './customer.controller.ts';\n\nconst app = createApp();\n\napp.registerController(CustomerController).registerModule(new FastifyHttpServer());\n\nif (require.main === module) {\n    app.init();\n}\n\nexport default app;\n")),(0,a.kt)("br",null),(0,a.kt)("h3",{id:"start-the-app"},"Start the app"),(0,a.kt)("p",null,"In your terminal, run:"),(0,a.kt)("pre",null,(0,a.kt)("code",{parentName:"pre"},"ts-node ./index.ts\n")),(0,a.kt)("p",null,"The app is now serving requests at ",(0,a.kt)("a",{parentName:"p",href:"http://localhost:3000"},"http://localhost:3000")))}u.isMDXComponent=!0}}]);