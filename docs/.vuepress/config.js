module.exports = {
	title: 'DaVinci',
	description: 'Declarative, Code-First, Typescript API Framework based on Express. Supports REST and GraphQL.',
	base: '/davinci/',
	head: [
		['link', { rel: 'manifest', href: '/manifest.json' }],
		['meta', { name: 'theme-color', content: '#3eaf7c' }],
		['meta', { name: 'apple-mobile-web-app-capable', content: 'yes' }],
		['meta', { name: 'apple-mobile-web-app-status-bar-style', content: 'black' }],
		['meta', { name: 'msapplication-TileImage', content: '/icons/msapplication-icon-144x144.png' }],
		['meta', { name: 'msapplication-TileColor', content: '#000000' }]
	],
	themeConfig: {
		nav: [{ text: 'Home', link: '/' }, { text: 'Guide', link: '/guide/' }],
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
		'vuepress-plugin-element-tabs',
		[
			'@vuepress/pwa',
			{
				serviceWorker: true,
				updatePopup: true
			}
		],
		['@vuepress/medium-zoom', true],
		[
			'container',
			{
				type: 'vue',
				before: '<pre class="vue-container"><code>',
				after: '</code></pre>'
			}
		]
	]
};
