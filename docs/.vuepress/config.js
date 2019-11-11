module.exports = {
	title: 'DaVinci',
	description: 'Declarative, Code-First, Typescript API Framework based on Express. Supports REST and GraphQL.',
	base: '/davinci/',
	head: [
		['link', { rel: 'icon', href: '/logo.png' }],
		['link', { rel: 'manifest', href: '/manifest.json' }],
		['meta', { name: 'theme-color', content: '#3eaf7c' }],
		['meta', { name: 'apple-mobile-web-app-capable', content: 'yes' }],
		['meta', { name: 'apple-mobile-web-app-status-bar-style', content: 'black' }],
		['link', { rel: 'apple-touch-icon', href: '/icons/apple-touch-icon-152x152.png' }],
		['link', { rel: 'mask-icon', href: '/icons/safari-pinned-tab.svg', color: '#3eaf7c' }],
		['meta', { name: 'msapplication-TileImage', content: '/icons/msapplication-icon-144x144.png' }],
		['meta', { name: 'msapplication-TileColor', content: '#000000' }]
	],
	themeConfig: {
		nav: [{ text: 'Home', link: '/' }, { text: 'Guide', link: '/guide/' }],
		/*sidebar: {
			'/guide/': [
				{
					title: 'asd',
					collapsable: false,
					children: [
						'',
						'getting-started',
						'directory-structure',
						'basic-config',
						'assets',
						'markdown',
						'using-vue',
						'i18n',
						'deploy'
					]
				}
			]
		},*/
		sidebar: 'auto',
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
		['@vuepress/medium-zoom', true]
	]
};
