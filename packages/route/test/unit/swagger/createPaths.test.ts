import should from 'should';
import createPathsDefinition from '../../../src/swagger/createPaths';
import { context } from '../../../../core/src/context';
import { route } from '../../../src';

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
		context()(MyClass.prototype, 'find', 1);

		const paths = createPathsDefinition(MyClass);
		should(paths).be.deepEqual({
			'/': {
				get: {
					summary: 'List',
					description: 'My find method',
					operationId: 'find',
					parameters: [
						{ name: 'query', in: 'query', schema: { type: 'string' } },
						{ schema: { type: 'context' } }
					],
					responses: { '200': {} }
				}
			}
		});
	});
});
