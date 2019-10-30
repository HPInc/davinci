import { TypeValue, TypeValueFactory, Maybe } from '@davinci/reflector';

export interface IPropDecoratorOptions {
	type?: TypeValue;
	typeFactory?: TypeValueFactory;
	required?: boolean;
}

export type IPropDecoratorOptionsFactory = () => Maybe<IPropDecoratorOptions>;

export interface IPropDecoratorMetadata {
	key: string;
	optsFactory?: IPropDecoratorOptionsFactory;
}
