import { SchemaTypeOpts } from 'mongoose';
import { TypeValueFactory, Maybe } from '@davinci/reflector';

export interface IPropDecoratorOptions extends SchemaTypeOpts<any> {
	typeFactory?: TypeValueFactory;
}

export type IPropDecoratorOptionsFactory = () => Maybe<IPropDecoratorOptions>;

export interface IPropDecoratorMetadata {
	key: string;
	optsFactory?: IPropDecoratorOptionsFactory;
}
