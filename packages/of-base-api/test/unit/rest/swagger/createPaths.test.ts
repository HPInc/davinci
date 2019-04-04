import should from 'should';
import createPathsDefinition from '../../../../src/rest/swagger/createPaths';
import { context, rest } from '../../../../src';

describe('createPathsDefinition', () => {
	it('should create a path definition object from a decorated controller', () => {
		const MyClass = class {
			constructor() {}
			// @rest.get({ path: '/', summary: 'List' })
			find(query, context) {
				return { query, context };
			}
		};

		// decoration (decorator doesn't work inside a block)
		rest.controller({})(MyClass.prototype);
		rest.get({ path: '/', summary: 'List', description: 'My find method', responses: { '200': {} } })(
			MyClass.prototype,
			'find'
		);
		rest.param({ name: 'query', in: 'query' })(MyClass.prototype, 'find', 0);
		context()(MyClass.prototype, 'find', 1);

		const paths = createPathsDefinition(MyClass);
		should(paths).be.deepEqual({
			'/': {
				get: {
					summary: 'List',
					description: 'My find method',
					operationId: 'find',
					parameters: [{ type: null, name: 'query', in: 'query' }, { type: 'context' }],
					responses: { '200': {} }
				}
			}
		});
	});
});
