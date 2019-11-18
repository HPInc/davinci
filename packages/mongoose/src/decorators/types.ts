import { SchemaTypeOpts } from 'mongoose';
import { TypeValueFactory, TypeValue, Maybe } from '@davinci/reflector';

export interface IPropDecoratorOptions {
	typeFactory?: TypeValueFactory;
	type?: TypeValue;
	required?: boolean;
	index?: SchemaTypeOpts.IndexOpts | boolean | string;
	validate?:
		| RegExp
		| [RegExp, string]
		| SchemaTypeOpts.ValidateFn<any>
		| [SchemaTypeOpts.ValidateFn<any>, string]
		| SchemaTypeOpts.ValidateOpts
		| SchemaTypeOpts.AsyncValidateOpts
		| SchemaTypeOpts.AsyncPromiseValidationFn<any>
		| SchemaTypeOpts.AsyncPromiseValidationOpts
		| (
				| SchemaTypeOpts.ValidateOpts
				| SchemaTypeOpts.AsyncValidateOpts
				| SchemaTypeOpts.AsyncPromiseValidationFn<any>
				| SchemaTypeOpts.AsyncPromiseValidationOpts
		  )[];
	rawMongooseOptions?: SchemaTypeOpts<any>;
}

export type IPropDecoratorOptionsFactory = () => Maybe<IPropDecoratorOptions>;

export interface IPropDecoratorMetadata {
	key: string;
	optsFactory?: IPropDecoratorOptionsFactory;
}
