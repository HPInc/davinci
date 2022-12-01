/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

// Set up the environment needed for running the unit tests

process.env.NODE_ENV = 'unittest';
process.env.MONGODB_URL = 'mongodb://127.0.0.1:27017/davinci-tests';
