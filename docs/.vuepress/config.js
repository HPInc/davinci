module.exports = {
	title: 'DaVinci',
	description: 'Declarative, Code-First, Typescript API Framework based on Express. Supports REST and GraphQL.',
	base: '/davinci/',
	head: [
		['link', { rel: 'icon', href: '/images/logo.svg' }],
		['link', { rel: 'manifest', href: '/manifest.json' }],
		['meta', { name: 'theme-color', content: '#3eaf7c' }],
		['meta', { name: 'apple-mobile-web-app-capable', content: 'yes' }],
		['meta', { name: 'apple-mobile-web-app-status-bar-style', content: 'black' }],
		['script', { async: true, src: `https://www.googletagmanager.com/gtag/js?id=${process.env.GA_ID}` }],
		[
			'script',
			{},
			`
			window.dataLayer = window.dataLayer || [];
		  	function gtag(){dataLayer.push(arguments);}
		  	gtag('js', new Date());
		  	gtag('config', '${process.env.GA_ID}');`
		]
	],
	themeConfig: {
		nav: [
			{ text: 'Home', link: '/' },
			{ text: 'Guide', link: '/guide/' }
		],
		sidebar: {
			'/guide/': [
				{
					title: 'Basics',
					collapsable: false,
					children: [
						'',
						'basics/directory-structure',
						'basics/controllers',
						'basics/openapi-definitions',
						'basics/swagger-ui',
						'basics/context'
					]
				},
				{
					title: 'Database',
					collapsable: false,
					children: ['database/mongoose']
				},
				{
					title: 'GraphQL',
					collapsable: false,
					children: ['graphql/getting-started', 'graphql/controllers']
				}
			]
		},
		editLinks: true,
		docsDir: 'docs',
		lastUpdated: true
	},
	plugins: [
		[
			'@vuepress/pwa',
			{
				serviceWorker: true,
				updatePopup: true
			}
		],
		[
			'container',
			{
				type: 'vue',
				before: '<pre class="vue-container"><code>',
				after: '</code></pre>'
			}
		],
		[
			'@vuepress/google-analytics',
			{
				ga: process.env.GA_ID
			}
		]
	]
};
