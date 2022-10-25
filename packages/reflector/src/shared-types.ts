/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

export type Maybe<T> = null | undefined | T;

export interface ClassType<T = any> {
	new (...args: any[]): T;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface RecursiveArray<TValue> extends Array<RecursiveArray<TValue> | TValue> {}

export type TypeValue = ClassType | Function | object | boolean;
export type ReturnTypeFuncValue = TypeValue | RecursiveArray<TypeValue>;
export type ReturnTypeFunc = (returns?: void) => ReturnTypeFuncValue;

export type TypeValueFactory = (type?: void) => TypeValue;
export type ClassTypeResolver = (of?: void) => ClassType;

export type Thunk<T> = (() => T) | T;

export type PartialDeep<T> = T extends Function ? T : T extends object ? { [P in keyof T]?: PartialDeep<T[P]> } : T;
