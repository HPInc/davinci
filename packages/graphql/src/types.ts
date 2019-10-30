import { GraphQLScalarType } from 'graphql';
import { ClassType, TypeValueFactory, Maybe } from '@davinci/reflector';

export type TypeValue = ClassType | GraphQLScalarType | Function | object | symbol;

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
