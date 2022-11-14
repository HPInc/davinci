"use strict";(self.webpackChunk_davinci_docs=self.webpackChunk_davinci_docs||[]).push([[226],{3905:(e,n,t)=>{t.d(n,{Zo:()=>s,kt:()=>m});var r=t(7294);function o(e,n,t){return n in e?Object.defineProperty(e,n,{value:t,enumerable:!0,configurable:!0,writable:!0}):e[n]=t,e}function a(e,n){var t=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);n&&(r=r.filter((function(n){return Object.getOwnPropertyDescriptor(e,n).enumerable}))),t.push.apply(t,r)}return t}function i(e){for(var n=1;n<arguments.length;n++){var t=null!=arguments[n]?arguments[n]:{};n%2?a(Object(t),!0).forEach((function(n){o(e,n,t[n])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(t)):a(Object(t)).forEach((function(n){Object.defineProperty(e,n,Object.getOwnPropertyDescriptor(t,n))}))}return e}function p(e,n){if(null==e)return{};var t,r,o=function(e,n){if(null==e)return{};var t,r,o={},a=Object.keys(e);for(r=0;r<a.length;r++)t=a[r],n.indexOf(t)>=0||(o[t]=e[t]);return o}(e,n);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);for(r=0;r<a.length;r++)t=a[r],n.indexOf(t)>=0||Object.prototype.propertyIsEnumerable.call(e,t)&&(o[t]=e[t])}return o}var l=r.createContext({}),c=function(e){var n=r.useContext(l),t=n;return e&&(t="function"==typeof e?e(n):i(i({},n),e)),t},s=function(e){var n=c(e.components);return r.createElement(l.Provider,{value:n},e.children)},u={inlineCode:"code",wrapper:function(e){var n=e.children;return r.createElement(r.Fragment,{},n)}},d=r.forwardRef((function(e,n){var t=e.components,o=e.mdxType,a=e.originalType,l=e.parentName,s=p(e,["components","mdxType","originalType","parentName"]),d=c(t),m=o,f=d["".concat(l,".").concat(m)]||d[m]||u[m]||a;return t?r.createElement(f,i(i({ref:n},s),{},{components:t})):r.createElement(f,i({ref:n},s))}));function m(e,n){var t=arguments,o=n&&n.mdxType;if("string"==typeof e||o){var a=t.length,i=new Array(a);i[0]=d;var p={};for(var l in n)hasOwnProperty.call(n,l)&&(p[l]=n[l]);p.originalType=e,p.mdxType="string"==typeof e?e:o,i[1]=p;for(var c=2;c<a;c++)i[c]=t[c];return r.createElement.apply(null,i)}return r.createElement.apply(null,t)}d.displayName="MDXCreateElement"},2427:(e,n,t)=>{t.r(n),t.d(n,{assets:()=>l,contentTitle:()=>i,default:()=>u,frontMatter:()=>a,metadata:()=>p,toc:()=>c});var r=t(7462),o=(t(7294),t(3905));const a={},i="OpenAPI",p={unversionedId:"modules/openapi/openapi",id:"modules/openapi/openapi",title:"OpenAPI",description:"The OpenAPI module allows to expose an OpenAPI definition document and a Swagger UI.",source:"@site/docs/modules/openapi/openapi.md",sourceDirName:"modules/openapi",slug:"/modules/openapi/",permalink:"/davinci/docs/2.0.0/modules/openapi/",draft:!1,tags:[],version:"current",frontMatter:{},sidebar:"mySidebar",previous:{title:"Context",permalink:"/davinci/docs/2.0.0/modules/http-server/context"},next:{title:"Mongoose",permalink:"/davinci/docs/2.0.0/modules/mongoose/"}},l={},c=[{value:"Installation",id:"installation",level:2},{value:"Register the module",id:"register-the-module",level:2}],s={toc:c};function u(e){let{components:n,...t}=e;return(0,o.kt)("wrapper",(0,r.Z)({},s,t,{components:n,mdxType:"MDXLayout"}),(0,o.kt)("h1",{id:"openapi"},"OpenAPI"),(0,o.kt)("p",null,"The OpenAPI module allows to expose an OpenAPI definition document and a Swagger UI."),(0,o.kt)("h2",{id:"installation"},"Installation"),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-bash"},"npm i --save @davinci/openapi\n")),(0,o.kt)("h2",{id:"register-the-module"},"Register the module"),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-diff"},"import { createApp } from '@davinci/core';\nimport { ExpressHttpServer } from '@davinci/http-server-express';\n+import { OpenAPIModule } from '@davinci/openapi';\n\nconst app = createApp();\n\napp.registerModule(\n    new ExpressHttpServer(),\n+   new OpenAPIModule({\n+       explorer: {\n+           path: '/explorer'\n+       },\n+       document: {\n+           path: '/openapi',\n+           spec: {\n+               info: { version: '1.0.0', title: 'Customer API', description: 'My nice Customer API' }\n+           }\n+       }\n+   })\n);\n\nif (require.main === module) {\n    app.init();\n}\n\nexport default app;\n\n")))}u.isMDXComponent=!0}}]);