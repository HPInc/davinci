import should from 'should';
import Sinon from 'sinon';
import { swagger } from '../../../../../src';

const sinon = Sinon.createSandbox();

describe('swagger decorators', () => {
	afterEach(() => {
		sinon.restore();
	});

	describe('#swagger.prop()', () => {
		it('should define metadata correctly', () => {
			const Customer = class {
				firstname: string;
			};
			sinon.stub(Reflect, 'getMetadata').returns([]);
			sinon.stub(Reflect, 'defineMetadata');
			swagger.prop({ required: false })(Customer.prototype, 'myMethod');

			// @ts-ignore
			should(Reflect.defineMetadata.getCall(0).args[0]).be.equal('tsswagger:props');
			// @ts-ignore
			should(Reflect.defineMetadata.getCall(0).args[1][0]).be.deepEqual({
				key: 'myMethod',
				opts: { required: false }
			});
		});
	});

	describe('#swagger.definition()', () => {
		it('should define metadata correctly', () => {
			const Customer = class {};
			sinon.stub(Reflect, 'defineMetadata');
			swagger.definition({ title: 'MyCustomer' })(Customer);

			// @ts-ignore
			should(Reflect.defineMetadata.getCall(0).args[0]).be.equal('tsswagger:definition');
			// @ts-ignore
			should(Reflect.defineMetadata.getCall(0).args[1]).be.deepEqual({ title: 'MyCustomer' });
		});
	});
});
