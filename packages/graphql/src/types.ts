import { GraphQLScalarType } from 'graphql';

export type Maybe<T> = null | undefined | T;

export interface ClassType<T = any> {
	new (...args: any[]): T;
}

export interface RecursiveArray<TValue> extends Array<RecursiveArray<TValue> | TValue> {}

export type TypeValue = ClassType | GraphQLScalarType | Function | object | symbol;
export type ReturnTypeFuncValue = TypeValue | RecursiveArray<TypeValue>;
export type ReturnTypeFunc = (returns?: void) => ReturnTypeFuncValue;

export type TypeValueFactory = (type?: void) => TypeValue;
export type ClassTypeResolver = (of?: void) => ClassType;

export type OperationType = 'query' | 'mutation';

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

export interface IFieldDecoratorOptionsFactoryArgs {
	isInput: boolean;
	operationType: OperationType;
	resolverMetadata?: IResolverDecoratorMetadata;
}

export type FieldDecoratorOptionsFactory = (
	args: IFieldDecoratorOptionsFactoryArgs
) => Maybe<IFieldDecoratorOptions>;

export interface IFieldDecoratorMetadata {
	key: any;
	opts?: IFieldDecoratorOptions;
	optsFactory?: FieldDecoratorOptionsFactory;
}

export interface IResolverDecoratorMetadata {
	name: string;
	methodName: string;
	returnType: any;
	handler: Function;
}
