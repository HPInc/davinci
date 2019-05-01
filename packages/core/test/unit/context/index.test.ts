import should from 'should';
import { context } from '../../../src/context';

describe('@context()', () => {
	it('should decorate correctly', () => {
		const MyClass = class {
			myMethod(context) {
				return context;
			}

			myOtherMethod(context) {
				return context;
			}
		};

		context()(MyClass.prototype, 'myMethod', 0);
		context()(MyClass.prototype, 'myOtherMethod', 1);
		const contextMetadata = Reflect.getMetadata('tscontroller:context', MyClass.prototype);

		should(contextMetadata).have.length(2);
		// the array is reversed because the items are added with Array.prototype.unshift
		should(contextMetadata[0]).be.deepEqual({
			handler: MyClass.prototype.myOtherMethod,
			target: MyClass.prototype,
			methodName: 'myOtherMethod',
			index: 1,
			type: 'context'
		});

		should(contextMetadata[1]).be.deepEqual({
			handler: MyClass.prototype.myMethod,
			target: MyClass.prototype,
			methodName: 'myMethod',
			index: 0,
			type: 'context'
		});
	});
});
