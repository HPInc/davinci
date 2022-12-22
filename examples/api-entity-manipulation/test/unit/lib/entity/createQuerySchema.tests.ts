/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import { entity, EntityRegistry } from '@davinci/core';
import { createQuerySchema } from '../../../../src/lib/entity/createQuerySchema';
import { expect } from '../../../support/chai';

describe('createQuerySchema', () => {
	let entityRegistry: EntityRegistry;

	beforeEach(() => {
		entityRegistry = new EntityRegistry();
	});

	it('should create an entityJsonSchema that represents a query schema', () => {
		@entity()
		class Phone {
			@entity.prop({ required: true })
			number: string;
		}

		@entity()
		class Customer {
			@entity.prop({ required: true })
			firstname: string;

			@entity.prop({ required: true })
			lastname: string;

			@entity.prop({ required: true })
			phone: Phone;
		}

		class CustomerQuerySchema extends createQuerySchema(Customer, {
			queryablePaths: ['firstname', 'lastname', 'phone']
		}) {}

		const customerQuerySchema = entityRegistry.getEntityDefinitionJsonSchema(CustomerQuerySchema);
		//const customerEntityDefinition = entityRegistry.getEntityDefinitionMap().get(Customer);
		const CustomerWhereBaseEntityDefinition = Array.from(entityRegistry.getEntityDefinitionMap().values()).find(
			ed => ed.getName() === 'CustomerWhereBase'
		);
		const customerWhereBaseSchema = entityRegistry.getEntityDefinitionJsonSchema(
			CustomerWhereBaseEntityDefinition.getType()
		);

		const CustomerWhereEntityDefinition = Array.from(entityRegistry.getEntityDefinitionMap().values()).find(
			ed => ed.getName() === 'CustomerWhere'
		);
		const customerWhereSchema = entityRegistry.getEntityDefinitionJsonSchema(
			CustomerWhereEntityDefinition.getType()
		);

		expect(customerQuerySchema).to.be.deep.equal({
			title: 'CustomerQuerySchema',
			type: 'object',
			properties: {
				$where: {
					_$ref: CustomerWhereEntityDefinition
				},
				$select: {
					anyOf: [
						{
							type: 'object',
							patternProperties: {
								'.*': {
									enum: [1, -1],
									type: 'number'
								}
							}
						},
						{
							items: {
								type: 'string'
							},
							type: 'array'
						}
					]
				},
				$limit: {
					type: 'number'
				},
				$skip: {
					type: 'number'
				}
			},
			required: []
		});

		expect(customerWhereSchema).to.be.deep.equal({
			title: 'CustomerWhere',
			type: 'object',
			properties: {
				$and: {
					type: 'array',
					items: {
						_$ref: CustomerWhereBaseEntityDefinition
					}
				},
				$or: {
					type: 'array',
					items: {
						_$ref: CustomerWhereBaseEntityDefinition
					}
				},
				firstname: {
					anyOf: [
						{
							title: 'PrimitiveBaseFilterOperators',
							type: 'object',
							properties: {
								$eq: {
									type: 'string'
								},
								$ne: {
									type: 'string'
								},
								$gt: {
									type: 'string'
								},
								$gte: {
									type: 'string'
								},
								$lt: {
									type: 'string'
								},
								$lte: {
									type: 'string'
								},
								$in: {
									type: 'array',
									items: {
										type: 'string'
									}
								},
								$nin: {
									type: 'array',
									items: {
										type: 'string'
									}
								},
								$exists: {
									type: 'boolean'
								}
							},
							required: []
						},
						{
							type: 'string'
						}
					]
				},
				lastname: {
					anyOf: [
						{
							title: 'PrimitiveBaseFilterOperators',
							type: 'object',
							properties: {
								$eq: {
									type: 'string'
								},
								$ne: {
									type: 'string'
								},
								$gt: {
									type: 'string'
								},
								$gte: {
									type: 'string'
								},
								$lt: {
									type: 'string'
								},
								$lte: {
									type: 'string'
								},
								$in: {
									type: 'array',
									items: {
										type: 'string'
									}
								},
								$nin: {
									type: 'array',
									items: {
										type: 'string'
									}
								},
								$exists: {
									type: 'boolean'
								}
							},
							required: []
						},
						{
							type: 'string'
						}
					]
				},
				phone: {
					title: 'phone',
					type: 'object',
					properties: {
						$exists: {
							type: 'boolean'
						},
						number: {
							anyOf: [
								{
									title: 'PrimitiveBaseFilterOperators',
									type: 'object',
									properties: {
										$eq: {
											type: 'string'
										},
										$ne: {
											type: 'string'
										},
										$gt: {
											type: 'string'
										},
										$gte: {
											type: 'string'
										},
										$lt: {
											type: 'string'
										},
										$lte: {
											type: 'string'
										},
										$in: {
											type: 'array',
											items: {
												type: 'string'
											}
										},
										$nin: {
											type: 'array',
											items: {
												type: 'string'
											}
										},
										$exists: {
											type: 'boolean'
										}
									},
									required: []
								},
								{
									type: 'string'
								}
							]
						}
					},
					required: []
				}
			},
			required: [],
			$id: 'CustomerWhere'
		});
		expect(customerWhereBaseSchema).to.be.deep.equal({
			title: 'CustomerWhereBase',
			type: 'object',
			properties: {
				firstname: {
					anyOf: [
						{
							title: 'PrimitiveBaseFilterOperators',
							type: 'object',
							properties: {
								$eq: {
									type: 'string'
								},
								$ne: {
									type: 'string'
								},
								$gt: {
									type: 'string'
								},
								$gte: {
									type: 'string'
								},
								$lt: {
									type: 'string'
								},
								$lte: {
									type: 'string'
								},
								$in: {
									type: 'array',
									items: {
										type: 'string'
									}
								},
								$nin: {
									type: 'array',
									items: {
										type: 'string'
									}
								},
								$exists: {
									type: 'boolean'
								}
							},
							required: []
						},
						{
							type: 'string'
						}
					]
				},
				lastname: {
					anyOf: [
						{
							title: 'PrimitiveBaseFilterOperators',
							type: 'object',
							properties: {
								$eq: {
									type: 'string'
								},
								$ne: {
									type: 'string'
								},
								$gt: {
									type: 'string'
								},
								$gte: {
									type: 'string'
								},
								$lt: {
									type: 'string'
								},
								$lte: {
									type: 'string'
								},
								$in: {
									type: 'array',
									items: {
										type: 'string'
									}
								},
								$nin: {
									type: 'array',
									items: {
										type: 'string'
									}
								},
								$exists: {
									type: 'boolean'
								}
							},
							required: []
						},
						{
							type: 'string'
						}
					]
				},
				phone: {
					title: 'phone',
					type: 'object',
					properties: {
						$exists: {
							type: 'boolean'
						},
						number: {
							anyOf: [
								{
									title: 'PrimitiveBaseFilterOperators',
									type: 'object',
									properties: {
										$eq: {
											type: 'string'
										},
										$ne: {
											type: 'string'
										},
										$gt: {
											type: 'string'
										},
										$gte: {
											type: 'string'
										},
										$lt: {
											type: 'string'
										},
										$lte: {
											type: 'string'
										},
										$in: {
											type: 'array',
											items: {
												type: 'string'
											}
										},
										$nin: {
											type: 'array',
											items: {
												type: 'string'
											}
										},
										$exists: {
											type: 'boolean'
										}
									},
									required: []
								},
								{
									type: 'string'
								}
							]
						}
					},
					required: []
				}
			},
			required: [],
			$id: 'CustomerWhereBase'
		});
	});
});
