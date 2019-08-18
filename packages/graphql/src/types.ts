import { GraphQLScalarType } from 'graphql';

export interface ClassType<T = any> {
	new (...args: any[]): T;
}

export interface RecursiveArray<TValue> extends Array<RecursiveArray<TValue> | TValue> {}

export type TypeValue = ClassType | GraphQLScalarType | Function | object | symbol;
export type ReturnTypeFuncValue = TypeValue | RecursiveArray<TypeValue>;
export type ReturnTypeFunc = (returns?: void) => ReturnTypeFuncValue;
