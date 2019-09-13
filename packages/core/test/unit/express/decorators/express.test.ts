import should from 'should';
import { express } from '../../../../src/express';

describe('express decorators', () => {
	describe('@req()', () => {
		it('should decorate correctly', () => {
			class MyClass {
				myMethod(@express.req() req) {
					return req.accountId;
				}
			}

			const methodParameters = Reflect.getMetadata('tsopenapi:method-parameters', MyClass.prototype.constructor);

			should(methodParameters).have.length(1);
			should(methodParameters[0]).be.deepEqual({
				handler: MyClass.prototype.myMethod,
				methodName: 'myMethod',
				index: 0,
				type: 'req'
			});
		});
	});

	describe('@res()', () => {
		it('should decorate correctly', () => {
			class MyClass {
				myMethod(@express.res() res) {
					return res.something;
				}
			}

			const methodParameters = Reflect.getMetadata('tsopenapi:method-parameters', MyClass.prototype.constructor);

			should(methodParameters).have.length(1);
			should(methodParameters[0]).be.deepEqual({
				handler: MyClass.prototype.myMethod,
				methodName: 'myMethod',
				index: 0,
				type: 'res'
			});
		});
	});

	describe('@middleware()', () => {
		it('should decorate correctly', () => {
			class MyClass {
				@express.middleware(middlewareFn)
				myMethod(res) {
					return res.something;
				}
			}

			function middlewareFn() {}
			const methodMiddlewareMeta = Reflect.getMetadata(
				'tsexpress:method-middleware',
				MyClass.prototype.constructor
			);

			should(methodMiddlewareMeta).have.length(1);
			should(methodMiddlewareMeta[0]).be.deepEqual({
				stage: 'before',
				handler: MyClass.prototype.myMethod,
				middlewareFunction: middlewareFn
			});
		});

		it('should decorate correctly a controller', () => {
			@express.middleware(middlewareFn)
			class MyClass {
				myMethod() {}
			}

			function middlewareFn() {}
			const methodMiddlewareMeta = Reflect.getMetadata(
				'tsexpress:method-middleware',
				MyClass.prototype.constructor
			);

			should(methodMiddlewareMeta).have.length(1);
			should(methodMiddlewareMeta[0]).be.deepEqual({
				stage: 'before',
				isControllerMw: true,
				middlewareFunction: middlewareFn
			});
		});
	});

	describe('@middleware.before()', () => {
		it('should decorate correctly', () => {
			class MyClass {
				@express.middleware.before(middlewareFn)
				myMethod(res) {
					return res.something;
				}
			}

			function middlewareFn() {}
			const methodMiddlewareMeta = Reflect.getMetadata(
				'tsexpress:method-middleware',
				MyClass.prototype.constructor
			);

			should(methodMiddlewareMeta).have.length(1);
			should(methodMiddlewareMeta[0]).be.deepEqual({
				stage: 'before',
				handler: MyClass.prototype.myMethod,
				middlewareFunction: middlewareFn
			});
		});
	});

	describe('@middleware.after()', () => {
		it('should decorate correctly', () => {
			class MyClass {
				@express.middleware.after(middlewareFn)
				myMethod(res) {
					return res.something;
				}
			}

			function middlewareFn() {}
			const methodMiddlewareMeta = Reflect.getMetadata(
				'tsexpress:method-middleware',
				MyClass.prototype.constructor
			);

			should(methodMiddlewareMeta).have.length(1);
			should(methodMiddlewareMeta[0]).be.deepEqual({
				stage: 'after',
				handler: MyClass.prototype.myMethod,
				middlewareFunction: middlewareFn
			});
		});
	});

	describe('@header()', () => {
		it('should decorate correctly', () => {
			const name = 'Content-Type';
			const value = 'text/plan';
			class MyClass {
				@express.header(name, value)
				myMethod() {}
			}

			const methodParameters = Reflect.getMetadata(
				'tsexpress:method-response-header',
				MyClass.prototype.constructor
			);

			should(methodParameters).have.length(1);
			should(methodParameters[0]).be.deepEqual({
				handler: MyClass.prototype.myMethod,
				name,
				value
			});
		});
	});
});
