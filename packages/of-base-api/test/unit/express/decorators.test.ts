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
});
