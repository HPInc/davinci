export type Maybe<T> = null | undefined | T;

export interface ClassType<T = any> {
	new (...args: any[]): T;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface RecursiveArray<TValue> extends Array<RecursiveArray<TValue> | TValue> {}

export type TypeValue = ClassType | Function | object | symbol;
export type ReturnTypeFuncValue = TypeValue | RecursiveArray<TypeValue>;
export type ReturnTypeFunc = (returns?: void) => ReturnTypeFuncValue;

export type TypeValueFactory = (type?: void) => TypeValue;
export type ClassTypeResolver = (of?: void) => ClassType;
