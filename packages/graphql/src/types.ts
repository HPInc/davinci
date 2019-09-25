import { GraphQLScalarType } from 'graphql';

export interface ClassType<T = any> {
	new (...args: any[]): T;
}

export interface RecursiveArray<TValue> extends Array<RecursiveArray<TValue> | TValue> {}

export type TypeValue = ClassType | GraphQLScalarType | Function | object | symbol;
export type ReturnTypeFuncValue = TypeValue | RecursiveArray<TypeValue>;
export type ReturnTypeFunc = (returns?: void) => ReturnTypeFuncValue;

export type TypeValueFactory = (type?: void) => TypeValue;
export type ClassTypeResolver = (of?: void) => ClassType;

/**
 * @param type - The type of the field. Only Required for complex objects: Classes, Arrays, Objects
 */
export interface ITypeDecoratorOptions {
	name?: string;
	description?: string;
}

/**
 * @param type - The type of the field. Only Required for complex objects: Classes, Arrays, Objects
 */
export interface IFieldDecoratorOptions {
	type?: TypeValue;
	typeFactory?: TypeValueFactory;
	required?: boolean;
	description?: string;
	asInput?: boolean;
}

export interface IFieldDecoratorMetadata {
	key: any;
	opts?: IFieldDecoratorOptions;
}
