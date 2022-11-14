"use strict";(self.webpackChunk_davinci_docs=self.webpackChunk_davinci_docs||[]).push([[139],{3905:(e,r,t)=>{t.d(r,{Zo:()=>l,kt:()=>y});var n=t(7294);function o(e,r,t){return r in e?Object.defineProperty(e,r,{value:t,enumerable:!0,configurable:!0,writable:!0}):e[r]=t,e}function c(e,r){var t=Object.keys(e);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(e);r&&(n=n.filter((function(r){return Object.getOwnPropertyDescriptor(e,r).enumerable}))),t.push.apply(t,n)}return t}function a(e){for(var r=1;r<arguments.length;r++){var t=null!=arguments[r]?arguments[r]:{};r%2?c(Object(t),!0).forEach((function(r){o(e,r,t[r])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(t)):c(Object(t)).forEach((function(r){Object.defineProperty(e,r,Object.getOwnPropertyDescriptor(t,r))}))}return e}function i(e,r){if(null==e)return{};var t,n,o=function(e,r){if(null==e)return{};var t,n,o={},c=Object.keys(e);for(n=0;n<c.length;n++)t=c[n],r.indexOf(t)>=0||(o[t]=e[t]);return o}(e,r);if(Object.getOwnPropertySymbols){var c=Object.getOwnPropertySymbols(e);for(n=0;n<c.length;n++)t=c[n],r.indexOf(t)>=0||Object.prototype.propertyIsEnumerable.call(e,t)&&(o[t]=e[t])}return o}var s=n.createContext({}),u=function(e){var r=n.useContext(s),t=r;return e&&(t="function"==typeof e?e(r):a(a({},r),e)),t},l=function(e){var r=u(e.components);return n.createElement(s.Provider,{value:r},e.children)},p={inlineCode:"code",wrapper:function(e){var r=e.children;return n.createElement(n.Fragment,{},r)}},d=n.forwardRef((function(e,r){var t=e.components,o=e.mdxType,c=e.originalType,s=e.parentName,l=i(e,["components","mdxType","originalType","parentName"]),d=u(t),y=o,f=d["".concat(s,".").concat(y)]||d[y]||p[y]||c;return t?n.createElement(f,a(a({ref:r},l),{},{components:t})):n.createElement(f,a({ref:r},l))}));function y(e,r){var t=arguments,o=r&&r.mdxType;if("string"==typeof e||o){var c=t.length,a=new Array(c);a[0]=d;var i={};for(var s in r)hasOwnProperty.call(r,s)&&(i[s]=r[s]);i.originalType=e,i.mdxType="string"==typeof e?e:o,a[1]=i;for(var u=2;u<c;u++)a[u]=t[u];return n.createElement.apply(null,a)}return n.createElement.apply(null,t)}d.displayName="MDXCreateElement"},6791:(e,r,t)=>{t.r(r),t.d(r,{assets:()=>s,contentTitle:()=>a,default:()=>p,frontMatter:()=>c,metadata:()=>i,toc:()=>u});var n=t(7462),o=(t(7294),t(3905));const c={},a="Directory Structure",i={unversionedId:"basics/directory-structure",id:"basics/directory-structure",title:"Directory Structure",description:"DaVinci doesn't require a particular directory structure.",source:"@site/docs/basics/directory-structure.md",sourceDirName:"basics",slug:"/basics/directory-structure",permalink:"/davinci/docs/2.0.0/basics/directory-structure",draft:!1,tags:[],version:"current",frontMatter:{}},s={},u=[],l={toc:u};function p(e){let{components:r,...t}=e;return(0,o.kt)("wrapper",(0,n.Z)({},l,t,{components:r,mdxType:"MDXLayout"}),(0,o.kt)("h1",{id:"directory-structure"},"Directory Structure"),(0,o.kt)("p",null,"DaVinci doesn't require a particular directory structure.\nHowever, the following structure may be considered scalable and\nto be following the best practices."),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre"},".\n\u251c\u2500\u2500 src\n\u2502   \u251c\u2500\u2500 boot _(optional)_\n\u2502   \u251c\u2500\u2500 api\n\u2502   \u2502   \u251c\u2500\u2500 `customer`\n\u2502   \u2502   \u2502   \u2514\u2500\u2500 index.ts _`(main entry for the resource. It should export the modules needed externally)`_\n\u2502   \u2502   \u2502   \u2514\u2500\u2500 CustomerController.ts _`(define endpoints and handlers for the 'customer' resource)`_\n\u2502   \u2502   \u2502   \u2514\u2500\u2500 CustomerSchema.ts _`(it may contain schemas for the database layer as well as schemas for payloads and parameters used by the controller)`_\n\u2502   \u2502   \u2502   \u2514\u2500\u2500 CustomerModel.ts _`(it may contain the logic to create the model, using the above schema (ex: mongoose))`_\n\u2502   \u2502   \u251c\u2500\u2500 `[...]`\n\u2502   \u251c\u2500\u2500 lib _`(it may contain shared libraries or logic)`_\n\u2502   \u251c\u2500\u2500 index.ts _`(it contain the logic to read the controllers and start the server)`_\n\u2502\n\u2514\u2500\u2500 package.json\n\u2514\u2500\u2500 [...]\n")))}p.isMDXComponent=!0}}]);