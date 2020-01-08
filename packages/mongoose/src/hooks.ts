import { ElementType } from '@davinci/reflector';
import { Document, Mongoose, Schema } from 'mongoose';

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

type Hook = ElementType<typeof READ_HOOKS> | ElementType<typeof WRITE_HOOKS> | ElementType<typeof DELETE_HOOKS>;

interface PreArgs {
	query: Mongoose['Query'];
	hookName: Hook;
	context: unknown;
}
interface AfterArgs {
	query: Mongoose['Query'];
	hookName: Hook;
	context: unknown;
	result;
}

interface AfterRawResultArgs {
	query: Mongoose['Query'];
	hookName: Hook;
	context: unknown;
	rawResult: unknown;
}

interface DocumentPreArgs {
	hookName: Hook;
	context: unknown;
	doc: Document;
}
interface DocumentPostArgs {
	result: Document;
	hookName: Hook;
	context: unknown;
	doc: Document;
}

const createHandlerArgs = (
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
		thisObj: Document | Mongoose['Query'];
		result?: unknown;
		rest?: unknown[];
		context?: unknown;
	}
): PreArgs | AfterArgs | AfterRawResultArgs | DocumentPreArgs | DocumentPostArgs | undefined => {
	const operation = (isReadHook && 'read') || (isWriteHook && 'write') || (isDeleteHook && 'delete');
	const returnPreArgs = (): PreArgs => ({ query: thisObj as Mongoose['Query'], hookName, context });
	const returnAfterArgs = (): AfterArgs => ({ query: thisObj as Mongoose['Query'], hookName, context, result });

	const returnAfterRawResultArgs = (): AfterRawResultArgs => ({
		query: thisObj as Mongoose['Query'],
		hookName,
		context,
		rawResult: result
	});

	const returnDocumentPreArgs = (): DocumentPreArgs => ({ hookName, context, doc: thisObj as Document });
	const returnDocumentPostArgs = (): DocumentPostArgs => ({
		result: thisObj as Document,
		hookName,
		context,
		doc: rest[1] as Document
	});

	const argsSwitch = {
		countDocuments: {
			pre: {
				read: returnPreArgs
			},
			post: {
				read: () => ({ query: thisObj, hookName, context, count: result })
			}
		},
		find: {
			pre: {
				read: returnPreArgs
			},
			post: {
				read: returnAfterArgs
			}
		},
		findOne: {
			pre: {
				read: returnPreArgs
			},
			post: {
				read: returnAfterArgs
			}
		},
		findOneAndUpdate: {
			pre: {
				read: returnPreArgs,
				write: returnPreArgs
			},
			post: {
				read: returnAfterArgs,
				write: returnAfterArgs
			}
		},
		update: {
			pre: {
				read: returnPreArgs,
				write: returnPreArgs
			},
			post: {
				write: returnAfterRawResultArgs
			}
		},
		updateMany: {
			pre: {
				read: returnPreArgs,
				write: returnPreArgs
			},
			post: {
				write: returnAfterRawResultArgs
			}
		},
		updateOne: {
			pre: {
				read: returnPreArgs,
				write: returnPreArgs
			},
			post: {
				write: returnAfterRawResultArgs
			}
		},
		findOneAndDelete: {
			pre: {
				delete: returnPreArgs
			},
			post: {
				delete: returnAfterArgs
			}
		},
		findOneAndRemove: {
			pre: {
				delete: returnPreArgs
			},
			post: {
				delete: returnAfterArgs
			}
		},
		deleteOne: {
			pre: {
				delete: returnPreArgs
			},
			post: {
				delete: returnAfterRawResultArgs
			}
		},
		deleteMany: {
			pre: {
				delete: returnPreArgs
			},
			post: {
				delete: returnAfterRawResultArgs
			}
		},
		remove: {
			pre: {
				delete: returnDocumentPreArgs
			},
			post: {
				delete: returnDocumentPostArgs
			}
		},
		save: {
			pre: {
				write: returnDocumentPreArgs
			},
			post: {
				write: returnDocumentPostArgs
			}
		}
	};

	return argsSwitch?.[hookName]?.[stage]?.[operation]?.();
};

const createRegisterHooks = (hooksList, stage: Stage) => (mongooseSchema, handler): void => {
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
				context = this.options?.context;
				if (this.options?.skipHooks) {
					return;
				}
			}
			if (hasContextInSaveOptions(hook)) {
				// eslint-disable-next-line no-underscore-dangle
				context = this.$__.saveOptions?.context;
				// eslint-disable-next-line no-underscore-dangle
				if (this.$__.saveOptions?.skipHooks) {
					return;
				}
			}

			const args = createHandlerArgs(stage, hook, {
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

export type Handler = {
	beforeRead: (args: PreArgs) => unknown | Promise<unknown>;
	afterRead: (args: AfterArgs) => unknown | Promise<unknown>;

	beforeWrite: (args: PreArgs & DocumentPreArgs) => unknown | Promise<unknown>;
	afterWrite: (args: AfterArgs & DocumentPostArgs & AfterRawResultArgs) => unknown | Promise<unknown>;

	beforeDelete: (args: PreArgs & DocumentPreArgs) => unknown | Promise<unknown>;
	afterDelete: (args: AfterArgs & DocumentPostArgs & AfterRawResultArgs) => unknown | Promise<unknown>;
};

export function beforeRead(schema: Schema, handler: Handler['beforeRead']): void {
	return createRegisterHooks(READ_HOOKS, 'pre')(schema, handler);
}

export function afterRead(schema: Schema, handler: Handler['afterRead']): void {
	return createRegisterHooks(READ_HOOKS, 'post')(schema, handler);
}

export function beforeWrite(schema: Schema, handler: Handler['beforeWrite']): void {
	return createRegisterHooks(WRITE_HOOKS, 'pre')(schema, handler);
}

export function afterWrite(schema: Schema, handler: Handler['afterWrite']): void {
	return createRegisterHooks(WRITE_HOOKS, 'post')(schema, handler);
}

export function beforeDelete(schema: Schema, handler: Handler['beforeDelete']): void {
	return createRegisterHooks(DELETE_HOOKS, 'pre')(schema, handler);
}

export function afterDelete(schema: Schema, handler: Handler['afterDelete']): void {
	return createRegisterHooks(DELETE_HOOKS, 'post')(schema, handler);
}
