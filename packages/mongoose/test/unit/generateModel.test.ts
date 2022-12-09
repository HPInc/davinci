/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import Sinon from 'sinon';
import { Model, Schema, SchemaTypes } from 'mongoose';
import { expect } from '../support/chai';
import { mgoose } from '../../src';

const sinon = Sinon.createSandbox();

describe('generateModel', () => {
	afterEach(() => {
		sinon.restore();
	});

	describe('schema generation', () => {
		it('supports primitive types', () => {
			class Customer {
				@mgoose.prop()
				firstname: string;
				@mgoose.prop()
				age: number;
				@mgoose.prop()
				isActive: boolean;
			}

			const schema = mgoose.generateSchema(Customer, {});

			expect(schema.obj).to.be.deep.equal({
				firstname: {
					type: String
				},
				age: {
					type: Number
				},
				isActive: {
					type: Boolean
				}
			});
		});

		it('supports nested classes', () => {
			class CustomerBirth {
				@mgoose.prop()
				place: string;
			}

			class Customer {
				@mgoose.prop()
				birth: CustomerBirth;
			}

			const schema = mgoose.generateSchema(Customer, {});

			expect(schema.obj).to.be.deep.equal({
				birth: {
					type: {
						place: {
							type: String
						}
					}
				}
			});
		});

		it('supports arrays', () => {
			class CustomerBirth {
				@mgoose.prop()
				place: string;
			}

			class Customer {
				@mgoose.prop({ type: [CustomerBirth] })
				birth: CustomerBirth[];

				@mgoose.prop({ type: [String] })
				tags: string[];
			}

			const schema = mgoose.generateSchema(Customer, {});

			expect(schema.obj).to.be.deep.equal({
				birth: [
					{
						type: {
							place: {
								type: String
							}
						}
					}
				],
				tags: [{ type: String }]
			});
		});

		it('supports class inheritance', () => {
			class BaseSchema {
				@mgoose.prop()
				createdAt: string;
				@mgoose.prop()
				updatedAt: number;
			}

			class MyClass1 extends BaseSchema {
				@mgoose.prop()
				otherProp1: string;
			}

			class MyClass2 extends BaseSchema {
				@mgoose.prop()
				otherProp2: string;
			}

			const schema1 = mgoose.generateSchema(MyClass1, {});
			const schema2 = mgoose.generateSchema(MyClass2, {});
			const baseSchema = mgoose.generateSchema(BaseSchema, {});

			expect(Object.keys(schema1.obj)).be.deep.equal(['otherProp1', 'createdAt', 'updatedAt']);
			expect(Object.keys(schema2.obj)).be.deep.equal(['otherProp2', 'createdAt', 'updatedAt']);
			expect(Object.keys(baseSchema.obj)).be.deep.equal(['createdAt', 'updatedAt']);
		});

		/*
		it('supports nested properties, with name "type"', () => {
			class Phone {
				@mgoose.prop()
				type: string;

				@mgoose.prop()
				number: string;
			}

			class Customer {
				@mgoose.prop({ type: [Phone], required: true })
				phones: Phone[];
			}

			const schema = mgoose.generateSchema(Customer, {});

			expect(schema.obj).to.be.deep.equal({
				profiles: [
					{
						required: true,
						type: {
							name: { type: String },
							phones: [
								{
									required: true,
									type: {
										type: { type: String },
										number: { type: String }
									}
								}
							]
						}
					}
				]
			});
		});
*/
	});

	describe('#mgoose.generateSchema', () => {
		it('attach statics and model methods', () => {
			@mgoose.schema()
			class Customer {
				/*@mgoose.method()
				static myStaticMethod() {}*/

				@mgoose.method()
				myMethod() {}
			}

			const schema = mgoose.generateSchema(Customer);
			// expect(schema.statics.myStaticMethod).be.equal(Customer.myStaticMethod);
			expect(schema.methods.myMethod).be.equal(Customer.prototype.myMethod);
		});

		it('should add the indexes', () => {
			@mgoose.index({ firstname: 1, lastname: 1 })
			@mgoose.index({ lastname: 1, unique: true })
			@mgoose.schema()
			class Customer {
				@mgoose.prop({ index: true })
				firstname: string;

				@mgoose.prop()
				lastname: string;
			}

			const schema = mgoose.generateSchema(Customer);
			expect(schema.indexes()).be.deep.equal([
				[
					{
						firstname: 1
					},
					{
						background: true
					}
				],
				[
					{
						lastname: 1,
						unique: true
					},
					{
						background: true
					}
				],
				[
					{
						firstname: 1,
						lastname: 1
					},
					{
						background: true
					}
				]
			]);
		});

		it('should add validators', () => {
			const validateFn = sinon.stub().returns(true);

			@mgoose.schema()
			class Customer {
				@mgoose.prop({ validate: validateFn })
				firstname: string;
			}

			const schema = mgoose.generateSchema(Customer);
			// @mgoose.ts-ignore
			expect(schema.path('firstname').validators).to.containSubset([{ validator: validateFn }]);
		});

		it('should support passing raw mongoose types', () => {
			@mgoose.schema()
			class Customer {
				@mgoose.prop({ required: true, index: true, rawType: SchemaTypes.Decimal128 })
				firstname: string;
			}

			const schema = mgoose.generateSchema(Customer);
			// @mgoose.ts-ignore
			expect(schema.path('firstname')).be.instanceOf(SchemaTypes.Decimal128);
			expect(schema.path('firstname')).to.containSubset({
				options: { required: true, index: true }
			});
		});

		it('should add virtual getters, by decorating a class method with @mgoose.virtual()', () => {
			@mgoose.schema()
			class Order {
				@mgoose.prop()
				date: Date;

				@mgoose.virtual()
				totalPrice() {}
			}

			const schema = mgoose.generateSchema(Order);
			expect(schema.virtuals).to.containSubset({
				totalPrice: {
					path: 'totalPrice',
					getters: [Order.prototype.totalPrice],
					setters: [],
					options: {}
				}
			});
		});

		it('should add virtual properties that populate, by decorating a class property with @mgoose.virtual({...})', () => {
			@mgoose.schema()
			class Order {
				@mgoose.prop()
				date: Date;

				@mgoose.virtual({ ref: 'LineItem', foreignField: '_id', options: { lean: true } })
				lineItems: object[];
			}

			const schema = mgoose.generateSchema(Order);
			expect(schema.virtuals).to.containSubset({
				lineItems: {
					path: 'lineItems',
					getters: [],
					options: {
						localField: 'lineItems',
						ref: 'LineItem',
						foreignField: '_id',
						options: {
							lean: true
						}
					}
				}
			});

			// @ts-ignore
			expect(schema.virtuals.lineItems.setters[0]).to.be.a('function');
		});

		it('should add virtual properties that populate, by decorating a class property with @mgoose.populate({...})', () => {
			@mgoose.schema()
			class Order {
				@mgoose.prop()
				date: Date;

				@mgoose.populate({
					name: 'lineItems',
					opts: { ref: 'LineItem', foreignField: '_id', options: { lean: true } }
				})
				@mgoose.prop()
				lineItemIds: object[];
			}

			const schema = mgoose.generateSchema(Order);
			expect(schema.virtuals).to.containSubset({
				lineItems: {
					path: 'lineItems',
					getters: [],
					options: {
						localField: 'lineItems',
						ref: 'LineItem',
						foreignField: '_id',
						options: {
							lean: true
						}
					}
				}
			});

			// @ts-ignore
			expect(schema.virtuals.lineItems.setters[0]).to.be.a('function');
		});

		it('should support attaching mongoose functionalities to sub-schemas', () => {
			@mgoose.schema()
			class Item {
				@mgoose.virtual()
				categories() {}
			}

			@mgoose.schema()
			class Order {
				@mgoose.prop({ index: true })
				firstname: string;

				@mgoose.prop({ type: [Item] })
				items: Item[];

				@mgoose.virtual({ ref: 'Something', localField: '_id', foreignField: '_id' })
				myField: string;
			}

			const schema = mgoose.generateSchema(Order);
			expect(schema.path('items').schema.virtualpath('categories')).be.ok;
		});

		it('should support attaching mongoose functionalities to the root schemas', () => {
			class Item {
				@mgoose.populate({ name: 'categories', opts: { ref: 'Ref', foreignField: '_id' } })
				categoryIds: string[];

				@mgoose.virtual()
				popularCategories() {}

				@mgoose.method()
				getTopCategories(limit: number) {
					return [].slice(0, limit);
				}
			}

			@mgoose.schema()
			class Order {
				@mgoose.prop({ index: true })
				firstname: string;

				@mgoose.prop({ type: [Item] })
				items: Item[];
			}

			const schema = mgoose.generateSchema(Order);
			expect(schema.virtualpath('categories')).be.ok;
			expect(schema.virtualpath('popularCategories')).be.ok;
			expect(schema.methods.getTopCategories).be.a('function').and.have.length(1);
		});

		it('should attach methods, virtuals and populates defined in subclasses, to the main schema', () => {
			class Item {
				@mgoose.populate({ name: 'categories', opts: { ref: 'Ref', foreignField: '_id' } })
				categoryIds: string[];

				@mgoose.virtual()
				popularCategories() {}
			}

			@mgoose.schema()
			class Order {
				@mgoose.prop({ index: true })
				firstname: string;

				@mgoose.prop({ type: [Item] })
				items: Item[];
			}

			const schema = mgoose.generateSchema(Order);
			expect(schema.path('items').schema).to.be.undefined;
		});

		it('avoid passing the schema options down to subschemas', () => {
			@mgoose.schema()
			class Item {
				@mgoose.virtual()
				categories() {}
			}

			@mgoose.schema({ timestamps: true })
			class Order {
				@mgoose.prop({ index: true })
				firstname: string;

				@mgoose.prop({ type: [Item] })
				items: Item[];
			}

			const schema = mgoose.generateSchema(Order);
			// @ts-ignore
			expect(schema.options.timestamps).be.true;
			// @ts-ignore
			expect(schema.path('items').schema.options.timestamps).not.be.true;
		});

		it('should allow passing the schema options using the decorator', () => {
			@mgoose.schema({ timestamps: false, id: false, _id: false })
			class Item {
				@mgoose.virtual()
				categories() {}
			}

			@mgoose.schema({ timestamps: true, id: true, _id: true })
			class Order {
				@mgoose.prop({ index: true })
				firstname: string;

				@mgoose.prop({ type: [Item] })
				items: Item[];
			}

			const schema = mgoose.generateSchema(Order);
			// @ts-ignore
			expect(schema.options).to.containSubset({ timestamps: true, id: true, _id: true });
			// @ts-ignore
			expect(schema.path('items').schema.options).to.containSubset({ timestamps: false, id: false, _id: false });
		});

		it('should allow omitting the schema decorator for classes passed explicitly to generateSchema', () => {
			class Customer {
				@mgoose.prop()
				firstname: string;
				@mgoose.prop()
				age: number;
				@mgoose.prop()
				isActive: boolean;
			}

			const schema = mgoose.generateSchema(Customer, {});

			expect(schema).to.be.instanceOf(Schema);
		});
	});

	describe('#generateModel', () => {
		it('should generate a mongoose model', () => {
			class Customer {
				firstname: string;
			}
			const CustomerModel = mgoose.generateModel(Customer);
			expect(CustomerModel.prototype).be.instanceOf(Model);
		});
	});
});
