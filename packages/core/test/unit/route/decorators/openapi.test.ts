import should from 'should';
import Sinon from 'sinon';
import { openapi } from '../../../../src/route';

const sinon = Sinon.createSandbox();

describe('openapi decorators', () => {
	afterEach(() => {
		sinon.restore();
	});

	describe('@openapi.prop()', () => {
		it('should define metadata correctly', () => {
			const Customer = class {
				firstname: string;
			};
			sinon.stub(Reflect, 'getMetadata').returns([]);
			sinon.stub(Reflect, 'defineMetadata');
			openapi.prop({ required: false })(Customer.prototype, 'myMethod');

			// @ts-ignore
			should(Reflect.defineMetadata.getCall(0).args[0]).be.equal('tsopenapi:props');
			// @ts-ignore
			should(Reflect.defineMetadata.getCall(0).args[1][0]).be.deepEqual({
				key: 'myMethod',
				opts: { required: false }
			});
		});
	});

	describe('@openapi.definition()', () => {
		it('should define metadata correctly', () => {
			const Customer = class {};
			sinon.stub(Reflect, 'defineMetadata');
			openapi.definition({ title: 'MyCustomer' })(Customer);

			// @ts-ignore
			should(Reflect.defineMetadata.getCall(0).args[0]).be.equal('tsopenapi:definition');
			// @ts-ignore
			should(Reflect.defineMetadata.getCall(0).args[1]).be.deepEqual({ title: 'MyCustomer' });
		});
	});
});
