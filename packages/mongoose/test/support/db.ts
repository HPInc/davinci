/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import mongoose from 'mongoose';

before(() => {
	return mongoose.connect(process.env.MONGODB_URL);
});

after(() => {
	return mongoose.disconnect();
});
