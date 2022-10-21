/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import { expect } from '../../support/chai';
import { mgoose } from '../../../src';
import { reflect } from '@davinci/reflector';

describe('mgoose decorators', () => {
	describe('@mgoose.prop()', () => {
		it('should define metadata correctly', () => {
			class Customer {
				@mgoose.prop({ required: false })
				firstname: string;
			}

			const { properties } = reflect(Customer);
			expect(properties[0]).have.property('name').equal('firstname');
			expect(properties[0].decorators[0]).to.have.property('options').that.containSubset({ required: false });
		});
	});

	describe('@mgoose.schema()', () => {
		it('should define metadata correctly', () => {
			@mgoose.schema({ timestamps: true })
			class Customer {
				@mgoose.prop({ required: false })
				firstname: string;
			}

			const { decorators } = reflect(Customer);
			expect(decorators[0]).to.have.property('options').that.is.deep.equal({ timestamps: true });
		});
	});

	describe('@mgoose.virtual()', () => {
		it('should decorate property correctly', () => {
			@mgoose.schema({ timestamps: true })
			class Customer {
				@mgoose.virtual()
				@mgoose.prop({ required: false })
				firstname: string;
			}

			const { properties } = reflect(Customer);
			expect(properties[0].name).be.equal('firstname');
			expect(properties[0].decorators[0].handler).be.undefined;
		});

		/*it('should decorate method correctly', () => {
			@mgoose.schema({ timestamps: true })
			class Customer {
				@mgoose.virtual()
				@mgoose.prop({ required: false })
				firstname(): string {
					return 'firstName';
				}
			}

			const { properties } = reflect(Customer);
			expect(properties[0].name).be.equal('firstname');
			expect(properties[0].decorators[0].handler).not.be.undefined;
		});*/
	});
});
