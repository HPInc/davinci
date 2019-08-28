import should from 'should';
import Reflector from '../../src/Reflector';

describe('Reflector', () => {
	it('should define and get metadata', () => {
		const myDecorator = (target: Function | Object) => {
			Reflector.defineMetadata('mKey', 'mValue', target);
		};

		@myDecorator
		class MyClass {}

		const metadataValue = Reflector.getMetadata('mKey', MyClass);

		should(metadataValue).be.deepEqual('mValue');
	});

	it('should push into a metadata array', () => {
		const firstDecorator = (target: Function | Object) => {
			Reflector.pushMetadata('mKey', 'firstValue', target);
		};
		const secondDecorator = (target: Function | Object) => {
			Reflector.pushMetadata('mKey', 'secondValue', target);
		};

		@firstDecorator
		@secondDecorator
		class MyClass {}

		const metadataValue = Reflector.getMetadata('mKey', MyClass);

		should(metadataValue).be.deepEqual(['secondValue', 'firstValue']);
	});
});
