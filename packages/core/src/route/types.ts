import { TypeValue, TypeValueFactory, Maybe } from '@davinci/reflector';

/**
 * Something
 * @param type - Explicitly passed type
 * @param rawType - The raw json schema type
 * @param typeFactory - Function that returns a type (useful for lazily evaluated types)
 * @param required - Whether the property is required or not
 */
export interface IPropDecoratorOptions {
	type?: TypeValue;
	rawType?: unknown;
	typeFactory?: TypeValueFactory;
	required?: boolean;
}

export type IPropDecoratorOptionsFactory = () => Maybe<IPropDecoratorOptions>;

export interface IPropDecoratorMetadata {
	key: string;
	optsFactory?: IPropDecoratorOptionsFactory;
}
