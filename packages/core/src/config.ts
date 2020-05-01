/*
 * © Copyright 2020 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

export default {
	PORT: process.env.PORT || 3000,
	PROTOCOL: process.env.NODE_ENV === 'local' ? 'http' : 'https'
};
