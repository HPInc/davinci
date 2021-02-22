import should from 'should';
import { mgoose } from '../../../src';

describe('mgoose decorators', () => {
	describe('@mgoose.prop()', () => {
		it('should define metadata correctly', () => {
			class Customer {
				@mgoose.prop({ required: false })
				firstname: string;
			}

			const propsMetadata = Reflect.getMetadata('davinci:mongoose:props', Customer);
			should(propsMetadata[0])
				.have.property('key')
				.equal('firstname');
			should(propsMetadata[0])
				.have.property('optsFactory')
				.type('function');

			should(propsMetadata[0].optsFactory()).match({ required: false });
		});
	});

	describe('@mgoose.schema()', () => {
		it('should define metadata correctly', () => {
			@mgoose.schema({ timestamps: true })
			class Customer {
				@mgoose.prop({ required: false })
				firstname: string;
			}

			const propsMetadata = Reflect.getMetadata('davinci:mongoose:schemaOptions', Customer);
			should(propsMetadata).be.deepEqual({ timestamps: true });
		});
	});
});
