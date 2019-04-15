import should from 'should';
import { express } from '../../../src/express';

describe('express decorators', () => {
	describe('@req()', () => {
		it('should decorate correctly', () => {
			const MyClass = class {
				myMethod(req) {
					return req.accountId;
				}
			};

			express.req()(MyClass.prototype, 'myMethod', 0);
			const methodParameters = Reflect.getMetadata('tsswagger:method-parameters', MyClass.prototype);

			should(methodParameters).have.length(1);
			should(methodParameters[0]).be.deepEqual({
				handler: MyClass.prototype.myMethod,
				target: MyClass.prototype,
				methodName: 'myMethod',
				index: 0,
				type: 'req'
			});
		});
	});

	describe('@res()', () => {
		it('should decorate correctly', () => {
			const MyClass = class {
				myMethod(res) {
					return res.something;
				}
			};

			express.res()(MyClass.prototype, 'myMethod', 0);
			const methodParameters = Reflect.getMetadata('tsswagger:method-parameters', MyClass.prototype);

			should(methodParameters).have.length(1);
			should(methodParameters[0]).be.deepEqual({
				handler: MyClass.prototype.myMethod,
				target: MyClass.prototype,
				methodName: 'myMethod',
				index: 0,
				type: 'res'
			});
		});
	});

	describe('@middleware()', () => {
		it('should decorate correctly', () => {
			const MyClass = class {
				myMethod(res) {
					return res.something;
				}
			};

			const middlewareFn = () => {};
			express.middleware(middlewareFn)(MyClass.prototype, 'myMethod');
			const methodMiddlewareMeta = Reflect.getMetadata('tsexpress:method-middleware', MyClass.prototype);

			should(methodMiddlewareMeta).have.length(1);
			should(methodMiddlewareMeta[0]).be.deepEqual({
				stage: 'before',
				handler: MyClass.prototype.myMethod,
				middlewareFunction: middlewareFn
			});
		});
	});

	describe('@middleware.before()', () => {
		it('should decorate correctly', () => {
			const MyClass = class {
				myMethod(res) {
					return res.something;
				}
			};

			const middlewareFn = () => {};
			express.middleware.before(middlewareFn)(MyClass.prototype, 'myMethod');
			const methodMiddlewareMeta = Reflect.getMetadata('tsexpress:method-middleware', MyClass.prototype);

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
			const MyClass = class {
				myMethod(res) {
					return res.something;
				}
			};

			const middlewareFn = () => {};
			express.middleware.after(middlewareFn)(MyClass.prototype, 'myMethod');
			const methodMiddlewareMeta = Reflect.getMetadata('tsexpress:method-middleware', MyClass.prototype);

			should(methodMiddlewareMeta).have.length(1);
			should(methodMiddlewareMeta[0]).be.deepEqual({
				stage: 'after',
				handler: MyClass.prototype.myMethod,
				middlewareFunction: middlewareFn
			});
		});
	});
});
