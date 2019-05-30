import should from 'should';
import createPathsDefinition from '../../../../src/route/openapi/createPaths';
import { route } from '../../../../src/route';

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

		const paths = createPathsDefinition(MyClass);
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
});
