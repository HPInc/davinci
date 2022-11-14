/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const lightCodeTheme = require('prism-react-renderer/themes/github');
const darkCodeTheme = require('prism-react-renderer/themes/dracula');

/** @type {import('@docusaurus/types').Config} */
const config = {
	title: 'DaVinci',
	tagline: 'Declarative, Code-First, Typescript Framework for APIs and message-based systems.',
	url: 'https://your-docusaurus-test-site.com',
	baseUrl: '/',
	onBrokenLinks: 'throw',
	onBrokenMarkdownLinks: 'warn',
	favicon: 'img/favicon.ico',

	// GitHub pages deployment config.
	// If you aren't using GitHub pages, you don't need these.
	organizationName: 'DaVinci', // Usually your GitHub org/user name.
	projectName: 'DaVinci', // Usually your repo name.

	// Even if you don't use internalization, you can use this field to set useful
	// metadata like html lang. For example, if your site is Chinese, you may want
	// to replace "en" with "zh-Hans".
	i18n: {
		defaultLocale: 'en',
		locales: ['en']
	},

	presets: [
		[
			'classic',
			/** @type {import('@docusaurus/preset-classic').Options} */
			({
				docs: {
					sidebarPath: require.resolve('./sidebars.js'),
					// Please change this to your repo.
					// Remove this to remove the "edit this page" links.
					// editUrl: 'https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/',
					sidebarCollapsed: false,
					lastVersion: '0.x',
					versions: {
						current: {
							label: '2.0.0',
							path: '2.0.0'
						},
						'0.x': {
							label: '0.x',
							path: '0.x'
						}
					}
				},
				blog: {
					showReadingTime: true,
					// Please change this to your repo.
					// Remove this to remove the "edit this page" links.
					editUrl:
						'https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/'
				},
				theme: {
					customCss: require.resolve('./src/css/custom.css')
				}
			})
		]
	],

	themeConfig:
		/** @type {import('@docusaurus/preset-classic').ThemeConfig} */
		({
			navbar: {
				title: 'DaVinci',
				logo: {
					alt: 'My Site Logo',
					src: 'img/logo.svg'
				},
				items: [
					{
						type: 'docsVersionDropdown',
						position: 'left',
						dropdownActiveClassDisabled: true
					},
					{
						type: 'docsVersion',
						position: 'left',
						label: 'Documentation'
					},
					// { to: '/blog', label: 'Blog', position: 'left' },
					{
						href: 'https://github.com/HPInc/davinci',
						label: 'GitHub',
						position: 'right'
					}
				]
			},
			footer: {
				style: 'dark',
				copyright: `MIT Licensed | Copyright © HP Inc.`
			},
			prism: {
				theme: lightCodeTheme,
				darkTheme: darkCodeTheme
			}
		})
};

module.exports = config;
