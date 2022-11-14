"use strict";(self.webpackChunk_davinci_docs=self.webpackChunk_davinci_docs||[]).push([[383],{3905:(e,r,t)=>{t.d(r,{Zo:()=>s,kt:()=>h});var n=t(7294);function o(e,r,t){return r in e?Object.defineProperty(e,r,{value:t,enumerable:!0,configurable:!0,writable:!0}):e[r]=t,e}function a(e,r){var t=Object.keys(e);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(e);r&&(n=n.filter((function(r){return Object.getOwnPropertyDescriptor(e,r).enumerable}))),t.push.apply(t,n)}return t}function l(e){for(var r=1;r<arguments.length;r++){var t=null!=arguments[r]?arguments[r]:{};r%2?a(Object(t),!0).forEach((function(r){o(e,r,t[r])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(t)):a(Object(t)).forEach((function(r){Object.defineProperty(e,r,Object.getOwnPropertyDescriptor(t,r))}))}return e}function i(e,r){if(null==e)return{};var t,n,o=function(e,r){if(null==e)return{};var t,n,o={},a=Object.keys(e);for(n=0;n<a.length;n++)t=a[n],r.indexOf(t)>=0||(o[t]=e[t]);return o}(e,r);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);for(n=0;n<a.length;n++)t=a[n],r.indexOf(t)>=0||Object.prototype.propertyIsEnumerable.call(e,t)&&(o[t]=e[t])}return o}var c=n.createContext({}),u=function(e){var r=n.useContext(c),t=r;return e&&(t="function"==typeof e?e(r):l(l({},r),e)),t},s=function(e){var r=u(e.components);return n.createElement(c.Provider,{value:r},e.children)},p={inlineCode:"code",wrapper:function(e){var r=e.children;return n.createElement(n.Fragment,{},r)}},d=n.forwardRef((function(e,r){var t=e.components,o=e.mdxType,a=e.originalType,c=e.parentName,s=i(e,["components","mdxType","originalType","parentName"]),d=u(t),h=o,m=d["".concat(c,".").concat(h)]||d[h]||p[h]||a;return t?n.createElement(m,l(l({ref:r},s),{},{components:t})):n.createElement(m,l({ref:r},s))}));function h(e,r){var t=arguments,o=r&&r.mdxType;if("string"==typeof e||o){var a=t.length,l=new Array(a);l[0]=d;var i={};for(var c in r)hasOwnProperty.call(r,c)&&(i[c]=r[c]);i.originalType=e,i.mdxType="string"==typeof e?e:o,l[1]=i;for(var u=2;u<a;u++)l[u]=t[u];return n.createElement.apply(null,l)}return n.createElement.apply(null,t)}d.displayName="MDXCreateElement"},5351:(e,r,t)=>{t.r(r),t.d(r,{assets:()=>c,contentTitle:()=>l,default:()=>p,frontMatter:()=>a,metadata:()=>i,toc:()=>u});var n=t(7462),o=(t(7294),t(3905));const a={},l="GraphQL Controllers",i={unversionedId:"graphql/controllers",id:"graphql/controllers",title:"GraphQL Controllers",description:"A Controller defines the shape of the GraphQL queries and mutations.",source:"@site/docs/graphql/controllers.md",sourceDirName:"graphql",slug:"/graphql/controllers",permalink:"/docs/2.0.0/graphql/controllers",draft:!1,tags:[],version:"current",frontMatter:{}},c={},u=[{value:"Implements GraphQL controller methods",id:"implements-graphql-controller-methods",level:2}],s={toc:u};function p(e){let{components:r,...t}=e;return(0,o.kt)("wrapper",(0,n.Z)({},s,t,{components:r,mdxType:"MDXLayout"}),(0,o.kt)("h1",{id:"graphql-controllers"},"GraphQL Controllers"),(0,o.kt)("p",null,"A Controller defines the shape of the GraphQL ",(0,o.kt)("inlineCode",{parentName:"p"},"queries")," and ",(0,o.kt)("inlineCode",{parentName:"p"},"mutations"),".\nEach decorated method in the controller acts as a resolver."),(0,o.kt)("h2",{id:"implements-graphql-controller-methods"},"Implements GraphQL controller methods"),(0,o.kt)("p",null,"A controller method is a decorated class method that takes parameter and return a result."),(0,o.kt)("p",null,"The ",(0,o.kt)("inlineCode",{parentName:"p"},"@grapqhl.[query|mutation]()")," decorators mark a class method as a query or mutation resolver."),(0,o.kt)("p",null,"A resolver can accept arguments, that can be defined using the ",(0,o.kt)("inlineCode",{parentName:"p"},"@graphql.arg()")," decorator.\nThe type of each argument will be inferred and inspected, and validated against the value provided.\\\nYou can even supply complex types, like schema classes.\nPlease note that due to a limitation on the typescript reflection mechanism, there are cases\nwhere you need to pass the type explicitly."),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-typescript"},"// file: ./AuthorController.ts\nimport { graphql } from '@davinci/graphql';\nimport { context } from '@davinci/core';\nimport model from './AuthorModel';\nimport AuthorSchema, { AuthorQuery } from './AuthorSchema';\nimport { BookSchema } from '../book';\n\nconst { query, parent, mutation, fieldResolver, arg } = graphql;\n\nexport default class AuthorController {\n    model = model;\n\n    @query(AuthorSchema, 'authorById')\n    getAuthorById(@arg({ required: true }) id: string) {\n        return this.model.findById(id);\n    }\n\n    @query([AuthorSchema], 'authors')\n    findAuthors(@arg() query: AuthorQuery, @context() context: any) {\n        return this.model.find(query, {}, { context });\n    }\n\n    @mutation(AuthorSchema)\n    createAuthor(@arg({ required: true }) data: AuthorSchema) {\n        return this.model.create(data);\n    }\n\n    @mutation(AuthorSchema)\n    updateAuthorById(@arg({ required: true }) id: string, @arg({ required: true }) data: AuthorSchema) {\n        return this.model.findByIdAndUpdate(id, data, { new: true });\n    }\n\n    @fieldResolver<BookSchema>(BookSchema, 'authors', [AuthorSchema])\n    getBookAuthors(@parent() book: BookSchema, @arg() query: AuthorQuery, @context() context: any) {\n        console.log(query);\n        // @ts-ignore\n        return this.findAuthors({ ...query, _id: { $in: book.authorIds } }, context);\n    }\n}\n")))}p.isMDXComponent=!0}}]);