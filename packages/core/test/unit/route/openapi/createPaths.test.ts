import should from 'should';
import createPathsDefinition from '../../../../src/route/openapi/createPaths';
import { openapi, route } from '../../../../src/route';

describe('createPathsDefinition', () => {
	it('should create a path definition object from a decorated controller', () => {
		const MyClass = class {
			constructor() {}
			// @route.get({ path: '/', summary: 'List' })
			find(query, context) {
				return { query, context };
			}
		};

		// decoration (decorator doesn't work inside a block)
		route.controller({})(MyClass.prototype);
		route.get({ path: '/', summary: 'List', description: 'My find method', responses: { '200': {} } })(
			MyClass.prototype,
			'find'
		);
		route.param({ name: 'query', in: 'query', schema: { type: 'string' } })(MyClass.prototype, 'find', 0);

		const paths = createPathsDefinition(MyClass).paths;
		should(paths).be.deepEqual({
			'/': {
				get: {
					summary: 'List',
					description: 'My find method',
					operationId: 'find',
					parameters: [{ name: 'query', in: 'query', schema: { type: 'string' } }],
					responses: { '200': {} }
				}
			}
		});
	});

	it('should support passing explicit types to the methods parameters #1', () => {
		@openapi.definition({ title: 'Item' })
		class Item {
			@openapi.prop()
			barcode: string;
		}

		@route.controller({})
		class MyClass {
			@route.post({ path: '/', summary: 'Create', description: 'Create an item' })
			post(@route.body({ type: [Item] }) items: Item[]) {
				return items;
			}
		}

		const { paths, definitions } = createPathsDefinition(MyClass);
		should(paths).be.deepEqual({
			'/': {
				post: {
					summary: 'Create',
					description: 'Create an item',
					operationId: 'post',
					parameters: [
						{
							in: 'body',
							name: 'items',
							schema: {
								type: 'array',
								items: {
									$ref: '#/definitions/Item'
								}
							}
						}
					],
					responses: {
						'200': {
							description: 'Success'
						}
					}
				}
			}
		});
		should(definitions).be.deepEqual({
			Item: {
				title: 'Item',
				type: 'object',
				properties: {
					barcode: {
						type: 'string'
					}
				}
			}
		});
	});

	it('should support passing explicit types to the methods parameters #2', () => {
		class Item {
			@openapi.prop()
			barcode: string;
		}

		@route.controller({})
		class MyClass {
			@route.post({ path: '/', summary: 'Create', description: 'Create an item' })
			post(@route.body({ type: [Item] }) items: Item[]) {
				return items;
			}
		}

		const { paths } = createPathsDefinition(MyClass);
		should(paths).be.deepEqual({
			'/': {
				post: {
					summary: 'Create',
					description: 'Create an item',
					operationId: 'post',
					parameters: [
						{
							in: 'body',
							name: 'items',
							schema: {
								type: 'array',
								items: {
									type: 'object',
									title: 'Item',
									properties: {
										barcode: {
											type: 'string'
										}
									}
								}
							}
						}
					],
					responses: {
						'200': {
							description: 'Success'
						}
					}
				}
			}
		});
	});

	it('should support passing a enum type to the methods parameters', () => {
		class Item {
			@openapi.prop()
			barcode: string;
		}

		// the body can either be an item, or an array of items
		@route.controller({})
		class MyClass {
			@route.post({ path: '/', summary: 'Create', description: 'Create one or multiple items' })
			post(@route.body({ enum: [Item, [Item]] }) items: Item | Item[]) {
				return items;
			}
		}

		const { paths } = createPathsDefinition(MyClass);
		should(paths).be.deepEqual({
			'/': {
				post: {
					summary: 'Create',
					description: 'Create one or multiple items',
					operationId: 'post',
					parameters: [
						{
							in: 'body',
							name: 'items',
							schema: {
								oneOf: [
									{
										type: 'object',
										title: 'Item',
										properties: {
											barcode: {
												type: 'string'
											}
										}
									},
									{
										type: 'array',
										items: {
											type: 'object',
											title: 'Item',
											properties: {
												barcode: {
													type: 'string'
												}
											}
										}
									}
								]
							}
						}
					],
					responses: {
						'200': {
							description: 'Success'
						}
					}
				}
			}
		});
	});
});
