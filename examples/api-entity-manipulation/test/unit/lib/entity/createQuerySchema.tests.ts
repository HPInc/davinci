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

	it('should create an entityJsonSchema that represent the response type of the list endpoint', () => {
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
				AND: {
					type: 'array',
					items: {
						_$ref: CustomerWhereBaseEntityDefinition
					}
				},
				OR: {
					type: 'array',
					items: {
						_$ref: CustomerWhereBaseEntityDefinition
					}
				},
				NOR: {
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
								EQ: {
									type: 'string'
								},
								NE: {
									type: 'string'
								},
								GT: {
									type: 'string'
								},
								GTE: {
									type: 'string'
								},
								LT: {
									type: 'string'
								},
								LTE: {
									type: 'string'
								},
								IN: {
									type: 'array',
									items: {
										type: 'string'
									}
								},
								NIN: {
									type: 'array',
									items: {
										type: 'string'
									}
								},
								EXISTS: {
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
								EQ: {
									type: 'string'
								},
								NE: {
									type: 'string'
								},
								GT: {
									type: 'string'
								},
								GTE: {
									type: 'string'
								},
								LT: {
									type: 'string'
								},
								LTE: {
									type: 'string'
								},
								IN: {
									type: 'array',
									items: {
										type: 'string'
									}
								},
								NIN: {
									type: 'array',
									items: {
										type: 'string'
									}
								},
								EXISTS: {
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
						EXISTS: {
							type: 'boolean'
						},
						number: {
							anyOf: [
								{
									title: 'PrimitiveBaseFilterOperators',
									type: 'object',
									properties: {
										EQ: {
											type: 'string'
										},
										NE: {
											type: 'string'
										},
										GT: {
											type: 'string'
										},
										GTE: {
											type: 'string'
										},
										LT: {
											type: 'string'
										},
										LTE: {
											type: 'string'
										},
										IN: {
											type: 'array',
											items: {
												type: 'string'
											}
										},
										NIN: {
											type: 'array',
											items: {
												type: 'string'
											}
										},
										EXISTS: {
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
								EQ: {
									type: 'string'
								},
								NE: {
									type: 'string'
								},
								GT: {
									type: 'string'
								},
								GTE: {
									type: 'string'
								},
								LT: {
									type: 'string'
								},
								LTE: {
									type: 'string'
								},
								IN: {
									type: 'array',
									items: {
										type: 'string'
									}
								},
								NIN: {
									type: 'array',
									items: {
										type: 'string'
									}
								},
								EXISTS: {
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
								EQ: {
									type: 'string'
								},
								NE: {
									type: 'string'
								},
								GT: {
									type: 'string'
								},
								GTE: {
									type: 'string'
								},
								LT: {
									type: 'string'
								},
								LTE: {
									type: 'string'
								},
								IN: {
									type: 'array',
									items: {
										type: 'string'
									}
								},
								NIN: {
									type: 'array',
									items: {
										type: 'string'
									}
								},
								EXISTS: {
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
						EXISTS: {
							type: 'boolean'
						},
						number: {
							anyOf: [
								{
									title: 'PrimitiveBaseFilterOperators',
									type: 'object',
									properties: {
										EQ: {
											type: 'string'
										},
										NE: {
											type: 'string'
										},
										GT: {
											type: 'string'
										},
										GTE: {
											type: 'string'
										},
										LT: {
											type: 'string'
										},
										LTE: {
											type: 'string'
										},
										IN: {
											type: 'array',
											items: {
												type: 'string'
											}
										},
										NIN: {
											type: 'array',
											items: {
												type: 'string'
											}
										},
										EXISTS: {
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
