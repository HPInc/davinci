/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import { Document, Query, Schema } from 'mongoose';

type Stage = 'pre' | 'post';

export const READ_HOOKS = [
	'countDocuments',
	'find',
	'findOne',
	'findOneAndUpdate',
	'update',
	'updateMany',
	'updateOne'
] as const;

const WRITE_HOOKS = ['findOneAndUpdate', 'save', 'update', 'updateMany', 'updateOne'] as const;

const DELETE_HOOKS = ['deleteMany', 'deleteOne', 'remove', 'findOneAndDelete', 'findOneAndRemove'] as const;

type Hook =
	| 'countDocuments'
	| 'find'
	| 'findOne'
	| 'findOneAndUpdate'
	| 'update'
	| 'updateMany'
	| 'updateOne'
	| 'save'
	| 'deleteMany'
	| 'deleteOne'
	| 'remove'
	| 'findOneAndDelete'
	| 'findOneAndRemove';

export interface PreArgs<Context = unknown, ModelSchema = unknown> {
	query: Query<ModelSchema, ModelSchema & Document>;
	hookName: Hook;
	context: Context;
	/**
	 * @deprecated Use the new {context} property instead.
	 */
	davinciContext: Context;
}

export interface AfterArgs<Context = unknown, ModelSchema = unknown> {
	query: Query<ModelSchema, ModelSchema & Document>;
	hookName: Hook;
	/**
	 * @deprecated Use the new {context} property instead.
	 */
	davinciContext: Context;
	context: Context;
	result: (ModelSchema & Document) | (ModelSchema & Document)[];
}

export interface AfterRawResultArgs<Context = unknown, ModelSchema = unknown> {
	query: Query<ModelSchema, ModelSchema & Document>;
	hookName: Hook;
	/**
	 * @deprecated Use the new {context} property instead.
	 */
	davinciContext: Context;
	context: Context;
	rawResult: unknown;
}

export interface DocumentPreArgs<Context = unknown, ModelSchema = unknown> {
	hookName: Hook;
	/**
	 * @deprecated Use the new {context} property instead.
	 */
	davinciContext: Context;
	context: Context;
	doc: Document & ModelSchema;
}
export interface DocumentPostArgs<Context = unknown, ModelSchema = unknown> {
	result: Document;
	hookName: Hook;
	/**
	 * @deprecated Use the new {context} property instead.
	 */
	davinciContext: Context;
	context: Context;
	doc: Document & ModelSchema;
}

/**
 * It maps and generates the hook handler arguments
 * based on the type of the hook
 * @param stage
 * @param hookName
 * @param isReadHook
 * @param isWriteHook
 * @param isDeleteHook
 * @param thisObj
 * @param result
 * @param rest
 * @param context
 */
const createHandlerArgs = <Context = unknown, ResultType = unknown>(
	stage: Stage,
	hookName: Hook,
	{
		isReadHook,
		isWriteHook,
		isDeleteHook,
		thisObj,
		result,
		rest,
		context
	}: {
		isReadHook: boolean;
		isWriteHook: boolean;
		isDeleteHook: boolean;
		thisObj: Document | Query<ResultType, ResultType & Document>;
		result?: any;
		rest?: unknown[];
		context?: Context;
	}
):
	| PreArgs<ResultType>
	| AfterArgs<ResultType>
	| AfterRawResultArgs<ResultType>
	| DocumentPreArgs
	| DocumentPostArgs
	| undefined => {
	const operation = (isReadHook && 'read') || (isWriteHook && 'write') || (isDeleteHook && 'delete');
	// createPreArgs creates the arguments for `before(Read|Write|Delete)` hooks
	const createPreArgs = (): PreArgs<Context, ResultType> => ({
		query: thisObj as Query<ResultType, ResultType & Document>,
		hookName,
		context,
		davinciContext: context
	});

	// createAfterArgs creates the arguments for `after(Read|Write|Delete)` hooks
	const createAfterArgs = (): AfterArgs<Context, ResultType> => ({
		query: thisObj as Query<ResultType, ResultType & Document>,
		hookName,
		context,
		davinciContext: context,
		result
	});

	// createAfterRawResultArgs creates the arguments for `after(Read|Write|Delete)` hooks triggered by atomic operations
	const createAfterRawResultArgs = (): AfterRawResultArgs<Context, ResultType> => ({
		query: thisObj as Query<ResultType, ResultType & Document>,
		hookName,
		context,
		davinciContext: context,
		rawResult: result
	});

	// createDocumentPreArgs creates the arguments for `before(Read|Write|Delete)` hooks triggered by
	// document middlewares: https://mongoosejs.com/docs/middleware.html
	const createDocumentPreArgs = (): DocumentPreArgs => ({
		hookName,
		context,
		davinciContext: context,
		doc: thisObj as Document
	});

	// createDocumentPostArgs creates the arguments for `after(Read|Write|Delete)` hooks triggered by
	// document middlewares: https://mongoosejs.com/docs/middleware.html
	const createDocumentPostArgs = (): DocumentPostArgs => ({
		result: thisObj as Document,
		hookName,
		context,
		davinciContext: context,
		doc: rest[1] as Document
	});

	const argsSwitch = {
		countDocuments: {
			pre: {
				read: createPreArgs
			},
			post: {
				read: () => ({ query: thisObj, hookName, context, davinciContext: context, count: result })
			}
		},
		find: {
			pre: {
				read: createPreArgs
			},
			post: {
				read: createAfterArgs
			}
		},
		findOne: {
			pre: {
				read: createPreArgs
			},
			post: {
				read: createAfterArgs
			}
		},
		findOneAndUpdate: {
			pre: {
				read: createPreArgs,
				write: createPreArgs
			},
			post: {
				read: createAfterArgs,
				write: createAfterArgs
			}
		},
		update: {
			pre: {
				read: createPreArgs,
				write: createPreArgs
			},
			post: {
				write: createAfterRawResultArgs
			}
		},
		updateMany: {
			pre: {
				read: createPreArgs,
				write: createPreArgs
			},
			post: {
				write: createAfterRawResultArgs
			}
		},
		updateOne: {
			pre: {
				read: createPreArgs,
				write: createPreArgs
			},
			post: {
				write: createAfterRawResultArgs
			}
		},
		findOneAndDelete: {
			pre: {
				delete: createPreArgs
			},
			post: {
				delete: createAfterArgs
			}
		},
		findOneAndRemove: {
			pre: {
				delete: createPreArgs
			},
			post: {
				delete: createAfterArgs
			}
		},
		deleteOne: {
			pre: {
				delete: createPreArgs
			},
			post: {
				delete: createAfterRawResultArgs
			}
		},
		deleteMany: {
			pre: {
				delete: createPreArgs
			},
			post: {
				delete: createAfterRawResultArgs
			}
		},
		remove: {
			pre: {
				delete: createDocumentPreArgs
			},
			post: {
				delete: createDocumentPostArgs
			}
		},
		save: {
			pre: {
				write: createDocumentPreArgs
			},
			post: {
				write: createDocumentPostArgs
			}
		}
	};

	return argsSwitch?.[hookName]?.[stage]?.[operation]?.();
};

/**
 * Factory function that generates (before|after)(Read|Write|Delete) utilities
 * @param hooksList
 * @param stage
 */
const createRegisterHooks =
	(hooksList, stage: Stage) =>
	<T>(mongooseSchema: T, handler): void => {
		const isReadHook = hooksList === READ_HOOKS;
		const isWriteHook = hooksList === WRITE_HOOKS;
		const isDeleteHook = hooksList === DELETE_HOOKS;

		const hasContextInOptions = (hook: Hook): boolean =>
			isReadHook || isDeleteHook || ['findOneAndUpdate', 'update', 'updateMany', 'updateOne'].includes(hook);
		const hasContextInSaveOptions = (hook: Hook): boolean =>
			isWriteHook && !['findOneAndUpdate', 'update', 'updateMany', 'updateOne'].includes(hook);

		hooksList.forEach(hook =>
			mongooseSchema[stage](hook, async function hookHandlerWrapper(result, ...rest) {
				let context;
				if (hasContextInOptions(hook)) {
					context = this.options?.davinciContext;
					if (this.options?.skipHooks) {
						return;
					}
				}
				if (hasContextInSaveOptions(hook)) {
					// eslint-disable-next-line no-underscore-dangle
					context = this.$__.saveOptions?.davinciContext;
					// eslint-disable-next-line no-underscore-dangle
					if (this.$__.saveOptions?.skipHooks) {
						return;
					}
				}

				const args = createHandlerArgs<T, T & Document>(stage, hook, {
					isReadHook,
					isWriteHook,
					isDeleteHook,
					thisObj: this,
					result,
					context,
					rest
				});

				if (args) {
					await handler(args);
				}
			})
		);
	};

export type Handler<Context = unknown, ModelSchema = unknown> = {
	beforeRead: (args: PreArgs<Context, ModelSchema>) => unknown | Promise<unknown>;
	afterRead: (args: AfterArgs<Context, ModelSchema>) => unknown | Promise<unknown>;

	beforeWrite: (
		args: PreArgs<Context, ModelSchema> & DocumentPreArgs<Context, ModelSchema>
	) => unknown | Promise<unknown>;
	afterWrite: (
		args: AfterArgs<Context, ModelSchema> & DocumentPostArgs & AfterRawResultArgs<Context>
	) => unknown | Promise<unknown>;

	beforeDelete: (
		args: PreArgs<Context, ModelSchema> & DocumentPreArgs<Context, ModelSchema>
	) => unknown | Promise<unknown>;
	afterDelete: (
		args: AfterArgs<Context, ModelSchema> &
			DocumentPostArgs<Context, ModelSchema> &
			AfterRawResultArgs<Context, ModelSchema>
	) => unknown | Promise<unknown>;
};

export function beforeRead<Context = unknown, ModelSchema = unknown>(
	schema: Schema,
	handler: Handler<Context, ModelSchema>['beforeRead']
): void {
	return createRegisterHooks(READ_HOOKS, 'pre')(schema, handler);
}

export function afterRead<Context = unknown, ModelSchema = unknown>(
	schema: Schema,
	handler: Handler<Context, ModelSchema>['afterRead']
): void {
	return createRegisterHooks(READ_HOOKS, 'post')(schema, handler);
}

export function beforeWrite<Context = unknown, ModelSchema = unknown>(
	schema: Schema,
	handler: Handler<Context, ModelSchema>['beforeWrite']
): void {
	return createRegisterHooks(WRITE_HOOKS, 'pre')(schema, handler);
}

export function afterWrite<Context = unknown, ModelSchema = unknown>(
	schema: Schema,
	handler: Handler<Context, ModelSchema>['afterWrite']
): void {
	return createRegisterHooks(WRITE_HOOKS, 'post')(schema, handler);
}

export function beforeDelete<Context = unknown, ModelSchema = unknown>(
	schema: Schema,
	handler: Handler<Context, ModelSchema>['beforeDelete']
): void {
	return createRegisterHooks(DELETE_HOOKS, 'pre')(schema, handler);
}

export function afterDelete<Context = unknown, ModelSchema = unknown>(
	schema: Schema,
	handler: Handler<Context, ModelSchema>['afterDelete']
): void {
	return createRegisterHooks(DELETE_HOOKS, 'post')(schema, handler);
}
