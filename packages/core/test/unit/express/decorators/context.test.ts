import should from 'should';
import { Reflector } from '@davinci/reflector';
import { context } from '../../../../src/express';

describe('@context()', () => {
	it('should decorate correctly', () => {
		class MyClass {
			myMethod(@context() context) {
				return context;
			}

			myOtherMethod(@context() context) {
				return context;
			}
		}

		const contextMetadata = Reflector.getMetadata('tscontroller:context', MyClass.prototype.constructor);

		should(contextMetadata).have.length(2);
		// the array is reversed because the items are added with Array.prototype.unshift
		should(contextMetadata[0]).be.deepEqual({
			handler: MyClass.prototype.myOtherMethod,
			methodName: 'myOtherMethod',
			index: 0,
			type: 'context'
		});

		should(contextMetadata[1]).be.deepEqual({
			handler: MyClass.prototype.myMethod,
			methodName: 'myMethod',
			index: 0,
			type: 'context'
		});
	});
});
