/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import chaiSubset from 'chai-subset';

chai.use(chaiAsPromised);
chai.use(chaiSubset);

const expect = chai.expect;

process.env.NODE_ENV = 'tests';

export { chai, expect };
