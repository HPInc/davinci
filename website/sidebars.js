/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */

// @ts-check

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
	// By default, Docusaurus generates a sidebar from the docs folder structure
	mySidebar: [
		'intro',
		'getting-started',
		/*	{
			type: 'category',
			label: 'Basics',
			items: ['basics/context', 'basics/directory-structure']
		},*/
		{
			type: 'category',
			label: 'Modules',
			items: [
				'modules/modules',
				{
					type: 'category',
					label: 'Http Server',
					items: [
						'modules/http-server/intro',
						'modules/http-server/fastify',
						'modules/http-server/express',
						'modules/http-server/controllers',
						'modules/http-server/context',
						'modules/openapi/openapi'
					]
				},
				'modules/mongoose/mongoose',
				'modules/health-checks/health-checks'
			]
		},
		'interceptors',
		'migration-from-v1'
		// { type: 'autogenerated', dirName: '.' }
	]
	// mySidebar: [{ type: 'autogenerated', dirName: '.' }]

	// But you can create a sidebar manually
	/*
  tutorialSidebar: [
    'intro',
    'hello',
    {
      type: 'category',
      label: 'Tutorial',
      items: ['tutorial-basics/create-a-document'],
    },
  ],
   */
};

module.exports = sidebars;
