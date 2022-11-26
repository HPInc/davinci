/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */
import { app } from './app';

(async () => {
	await app.init();

	const result = await app.injectHttpRequest({
		url: '/api/customers?customer[lastname]=johnson',
		method: 'GET',
		headers: { 'x-accountid': '123' }
	});

	console.log(result);
})();
