/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import type { SwaggerConfigs } from 'swagger-ui-dist';
import h from 'hyperscript';

export const generateSwaggerUiHtml = ({ path, spec }: { path?: string; spec?: object }) => {
	const options: SwaggerConfigs = {
		dom_id: '#swagger-ui',
		deepLinking: true,
		layout: 'StandaloneLayout'
	};
	if (path) {
		options.url = path;
	}
	if (spec) {
		options.spec = spec;
	}

	const head = h(
		'head',
		h('meta', { charset: 'utf-8' }),
		h('meta', {
			name: 'viewport',
			content: 'width=device-width, initial-scale=1'
		}),
		h('meta', {
			name: 'description',
			content: 'SwaggerUI'
		}),
		h('title', 'SwaggerUI'),
		h(
			'style',
			`{
		  box-sizing: border-box;
		  overflow: -moz-scrollbars-vertical;
		  overflow-y: scroll;
		}
		*,
		*:before,
		*:after
		{
		  box-sizing: inherit;
		}

		body {
		  margin:0;
		  background: #fafafa;
		}`
		),
		h('link', {
			rel: 'stylesheet',
			href: 'https://unpkg.com/swagger-ui-dist@4.14.0/swagger-ui.css'
		})
	);

	const body = h(
		'body',
		h('div#swagger-ui'),
		h('script', { src: 'https://unpkg.com/swagger-ui-dist@4.14.0/swagger-ui-standalone-preset.js' }),
		h('script', { src: 'https://unpkg.com/swagger-ui-dist@4.14.0/swagger-ui-bundle.js', crossorigin: true }),
		h('script', {
			innerHTML: `window.onload = () => {
				window.ui = SwaggerUIBundle({
					...(${JSON.stringify(options)}),
					presets: [
						SwaggerUIBundle.presets.apis,
						SwaggerUIStandalonePreset
					],
				});
			};`
		})
	);

	const page = h('html', { lang: 'en' }, head, body);
	return page.outerHTML;
};
