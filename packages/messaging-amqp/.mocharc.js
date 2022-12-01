/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

/**
 *
 * @type {import('mocha').MochaOptions}
 */
module.exports = {
	color: true,
	reporter: 'spec',
	ui: 'bdd',
	bail: true,
	checkLeaks: true,
	require: ['ts-node/register', 'source-map-support/register'],
	file: ['test/support/env'],
	spec: 'test/**/*.{js,ts}'
};
