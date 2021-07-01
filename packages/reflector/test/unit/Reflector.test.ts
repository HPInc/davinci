import should from 'should';
import Reflector from '../../src/Reflector';

describe('Reflector', () => {

	describe('#getMetadata', () => {
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

	describe('#getParameterNames', () => {
		it('should return empty array for a function with no parameters', () => {
			function fn() { return 42; }
			Reflector.getParameterNames(fn).should.eql([]);
		});

		it('should return the parameter names for regular functions', () => {
			function fn(first, second, third) { return [first, second, third]; }
			Reflector.getParameterNames(fn).should.eql(['first', 'second', 'third']);
		});

		it('should return the parameter names for functions with commented parameters', () => {
			function fn(a/* a*/, /* b */b, /*c*/c,d/*d*/) { return [a, b, c, d]; }
			Reflector.getParameterNames(fn).should.eql(['a', 'b', 'c', 'd']);
		});

		it('should return the parameter names for functions with defaults', () => {
			const fn = function(a = 1, b = true, c = () => {}) { return [a, b, c]; };
			Reflector.getParameterNames(fn).should.eql(['a', 'b', 'c']);
		});

		it('should return the parameter names for functions with complex defaults', () => {
			const fn = function (a=4*(5/3), b) { return [a, b]; };
			Reflector.getParameterNames(fn).should.eql(['a', 'b']);
		});

		it('should return the parameter names for functions with rest arguments', () => {
			const fn = function(a, b, ...more) { return [a, b, more]; }
			Reflector.getParameterNames(fn).should.eql(['a', 'b', 'more']);
		});

		it('should return the parameter names for regular functions with inline functions', () => {
			function fn(first, second, third) {
				return function (a, b, c) {
					return [first, second, third, a, b, c];
				}
			}

			Reflector.getParameterNames(fn).should.eql(['first', 'second', 'third']);
		});

		it('should return the parameter names for functions with unusual characters', () => {
			function π9(ƒ, µ) { return [ƒ, µ]; }
			Reflector.getParameterNames(π9).should.eql(['ƒ', 'µ']);
		});

		it('should return the parameter names for arrow functions with parens', () => {
			const fn = (first, second, third) => { return [first, second, third]; };
			Reflector.getParameterNames(fn).should.eql(['first', 'second', 'third']);
		});

		it('should return the parameter names for multi-line functions', () => {
			function fn(
				first,
				second,
				third
			) {
				return [first, second, third];
			}
			Reflector.getParameterNames(fn).should.eql(['first', 'second', 'third']);
		});

		it('should return the parameter names for functions with inline comments', () => {
			function /* (some information) */ fn(
				first, // the first thing
				second, /* the second thing */
				third
			) {
				return [first, second, third];
			}
			Reflector.getParameterNames(fn).should.eql(['first', 'second', 'third']);
		});

		it('should return the parameter names for tricky embedded comments', () => {
			const fn = function(a /* fooled you{*/,b) { return [a, b]; };
			Reflector.getParameterNames(fn).should.eql(['a', 'b']);
		});

		it('should return the parameter names for tricky embedded comments (part 2)', () => {
			const fn = function /* are you kidding me? (){} */(a /* function() yes */,
				/* no, */b)/* omg! */{/*}}*/ return[a, b]; };
			Reflector.getParameterNames(fn).should.eql(['a', 'b']);
		});

		it('should return the parameter names for arrow functions without parens', () => {
			const fn = first => { return [first]; };
			Reflector.getParameterNames(fn).should.eql(['first']);
		});

		it('should return the parameter names for arrow functions without parens or braces', () => {
			const fn = first => [first];
			Reflector.getParameterNames(fn).should.eql(['first']);
		});
	});

});
