import { DecoratorId, reflect } from '@davinci/reflector';
import { context } from '../../../src';
import { expect } from '../../support/chai';

describe('context decorator', () => {
	it('should decorate correctly', () => {
		class MyController {
			myMethod(@context() ctx) {
				return ctx;
			}
		}

		const controllerReflection = reflect(MyController);

		expect(controllerReflection.methods[0].parameters[0].decorators[0]).to.be.deep.equal({
			[DecoratorId]: 'core.parameter.context'
		});
	});
});
