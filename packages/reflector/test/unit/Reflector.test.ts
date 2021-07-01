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

	it('should return the parameter names for regular functions', () => {
		function myFunction(first, second, third) {
			return [first, second, third];
		}

		const parameterNames = Reflector.getParameterNames(myFunction);

		should(parameterNames).be.deepEqual(['first', 'second', 'third']);
	});

	it('should return the parameter names for arrow functions with parens', () => {
		const myFunction = (first, second, third) => {
			return [first, second, third];
		};

		const parameterNames = Reflector.getParameterNames(myFunction);

		should(parameterNames).be.deepEqual(['first', 'second', 'third']);
	});

	// todo: currently fails, need to evaluate if it is required for reflection
	it.skip('should return the parameter names for arrow functions without parens', function() {
		const myFunction = first => [first];

		const parameterNames = Reflector.getParameterNames(myFunction);

		should(parameterNames).be.deepEqual(['first']);
	});

	it('should return the parameter names, ignoring param defaults', function() {
		const myFunction = (first, second = 2, third = 3) => {
			return [first, second, third];
		};

		const parameterNames = Reflector.getParameterNames(myFunction);

		should(parameterNames).be.deepEqual(['first', 'second', 'third']);
	});

	it('should return the parameter names for multi-line functions', function () {
		function myFunction(
			first,
			second,
			third
		) {
			return [first, second, third];
		}

		const parameterNames = Reflector.getParameterNames(myFunction);

		should(parameterNames).be.deepEqual(['first', 'second', 'third']);
	});

	it('should return the parameter names for functions with inline comments', function () {
		function myFunction(
			first, // the first thing
			second, /* the second thing */
			third
		) {
			return [first, second, third];
		}

		const parameterNames = Reflector.getParameterNames(myFunction);

		should(parameterNames).be.deepEqual(['first', 'second', 'third']);
	});
});
