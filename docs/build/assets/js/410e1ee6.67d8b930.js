"use strict";(self.webpackChunk_davinci_docs=self.webpackChunk_davinci_docs||[]).push([[555],{3905:(e,t,r)=>{r.d(t,{Zo:()=>u,kt:()=>h});var n=r(7294);function o(e,t,r){return t in e?Object.defineProperty(e,t,{value:r,enumerable:!0,configurable:!0,writable:!0}):e[t]=r,e}function a(e,t){var r=Object.keys(e);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(e);t&&(n=n.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),r.push.apply(r,n)}return r}function l(e){for(var t=1;t<arguments.length;t++){var r=null!=arguments[t]?arguments[t]:{};t%2?a(Object(r),!0).forEach((function(t){o(e,t,r[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(r)):a(Object(r)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(r,t))}))}return e}function i(e,t){if(null==e)return{};var r,n,o=function(e,t){if(null==e)return{};var r,n,o={},a=Object.keys(e);for(n=0;n<a.length;n++)r=a[n],t.indexOf(r)>=0||(o[r]=e[r]);return o}(e,t);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);for(n=0;n<a.length;n++)r=a[n],t.indexOf(r)>=0||Object.prototype.propertyIsEnumerable.call(e,r)&&(o[r]=e[r])}return o}var c=n.createContext({}),s=function(e){var t=n.useContext(c),r=t;return e&&(r="function"==typeof e?e(t):l(l({},t),e)),r},u=function(e){var t=s(e.components);return n.createElement(c.Provider,{value:t},e.children)},p={inlineCode:"code",wrapper:function(e){var t=e.children;return n.createElement(n.Fragment,{},t)}},d=n.forwardRef((function(e,t){var r=e.components,o=e.mdxType,a=e.originalType,c=e.parentName,u=i(e,["components","mdxType","originalType","parentName"]),d=s(r),h=o,m=d["".concat(c,".").concat(h)]||d[h]||p[h]||a;return r?n.createElement(m,l(l({ref:t},u),{},{components:r})):n.createElement(m,l({ref:t},u))}));function h(e,t){var r=arguments,o=t&&t.mdxType;if("string"==typeof e||o){var a=r.length,l=new Array(a);l[0]=d;var i={};for(var c in t)hasOwnProperty.call(t,c)&&(i[c]=t[c]);i.originalType=e,i.mdxType="string"==typeof e?e:o,l[1]=i;for(var s=2;s<a;s++)l[s]=r[s];return n.createElement.apply(null,l)}return n.createElement.apply(null,r)}d.displayName="MDXCreateElement"},4470:(e,t,r)=>{r.r(t),r.d(t,{assets:()=>c,contentTitle:()=>l,default:()=>p,frontMatter:()=>a,metadata:()=>i,toc:()=>s});var n=r(7462),o=(r(7294),r(3905));const a={},l="GraphQL Controllers",i={unversionedId:"graphql/controllers",id:"version-0.x/graphql/controllers",title:"GraphQL Controllers",description:"A Controller defines the shape of the GraphQL queries and mutations.",source:"@site/versioned_docs/version-0.x/graphql/controllers.md",sourceDirName:"graphql",slug:"/graphql/controllers",permalink:"/docs/0.x/graphql/controllers",draft:!1,tags:[],version:"0.x",frontMatter:{},sidebar:"mySidebar",previous:{title:"@davinci/mongoose",permalink:"/docs/0.x/database/mongoose"},next:{title:"Getting Started",permalink:"/docs/0.x/graphql/getting-started"}},c={},s=[{value:"Implements GraphQL controller methods",id:"implements-graphql-controller-methods",level:2}],u={toc:s};function p(e){let{components:t,...r}=e;return(0,o.kt)("wrapper",(0,n.Z)({},u,r,{components:t,mdxType:"MDXLayout"}),(0,o.kt)("h1",{id:"graphql-controllers"},"GraphQL Controllers"),(0,o.kt)("p",null,"A Controller defines the shape of the GraphQL ",(0,o.kt)("inlineCode",{parentName:"p"},"queries")," and ",(0,o.kt)("inlineCode",{parentName:"p"},"mutations"),".\nEach decorated method in the controller acts as a resolver."),(0,o.kt)("h2",{id:"implements-graphql-controller-methods"},"Implements GraphQL controller methods"),(0,o.kt)("p",null,"A controller method is a decorated class method that takes parameter and return a result."),(0,o.kt)("p",null,"The ",(0,o.kt)("inlineCode",{parentName:"p"},"@grapqhl.[query|mutation]()")," decorators mark a class method as a query or mutation resolver."),(0,o.kt)("p",null,"A resolver can accept arguments, that can be defined using the ",(0,o.kt)("inlineCode",{parentName:"p"},"@graphql.arg()")," decorator.\nThe type of each argument will be inferred and inspected, and validated against the value provided.\\\nYou can even supply complex types, like schema classes.",(0,o.kt)("br",{parentName:"p"}),"\n","Please note that due to a limitation on the typescript reflection mechanism, there are cases\nwhere you need to pass the type explicitly."),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-typescript"},"// file: ./AuthorController.ts\nimport { graphql } from '@davinci/graphql';\nimport { context } from '@davinci/core';\nimport model from './AuthorModel';\nimport AuthorSchema, { AuthorQuery } from './AuthorSchema';\nimport { BookSchema } from '../book';\n\nconst { query, parent, mutation, fieldResolver, arg } = graphql;\n\nexport default class AuthorController {\n    model = model;\n\n    @query(AuthorSchema, 'authorById')\n    getAuthorById(@arg({ required: true }) id: string) {\n        return this.model.findById(id);\n    }\n\n    @query([AuthorSchema], 'authors')\n    findAuthors(@arg() query: AuthorQuery, @context() context: any) {\n        return this.model.find(query, {}, { context });\n    }\n\n    @mutation(AuthorSchema)\n    createAuthor(@arg({ required: true }) data: AuthorSchema) {\n        return this.model.create(data);\n    }\n\n    @mutation(AuthorSchema)\n    updateAuthorById(@arg({ required: true }) id: string, @arg({ required: true }) data: AuthorSchema) {\n        return this.model.findByIdAndUpdate(id, data, { new: true });\n    }\n\n    @fieldResolver<BookSchema>(BookSchema, 'authors', [AuthorSchema])\n    getBookAuthors(@parent() book: BookSchema, @arg() query: AuthorQuery, @context() context: any) {\n        console.log(query);\n        // @ts-ignore\n        return this.findAuthors({ ...query, _id: { $in: book.authorIds } }, context);\n    }\n}\n")))}p.isMDXComponent=!0}}]);