import _ from 'lodash';

const READ_HOOKS = [
	'count',
	'deleteMany',
	'deleteOne',
	'find',
	'findOne',
	'findOneAndDelete',
	'findOneAndRemove',
	'findOneAndUpdate',
	'remove',
	'update',
	'updateOne',
	'updateMany'
];

const WRITE_HOOKS = ['findOneAndUpdate', 'save', 'update', 'updateMany'];

const DELETE_HOOKS = ['deleteMany', 'deleteOne', 'remove'];

const createRegisterHooks = (hooksList, stage) => (mongooseSchema, handler) => {
	const isReadHook = hooksList === READ_HOOKS;
	const isWriteHook = hooksList === WRITE_HOOKS;
	const isDeleteHook = hooksList === DELETE_HOOKS;

	return hooksList.forEach(hook =>
		mongooseSchema[stage](hook, async function() {
			const args = [hook];
			if (isReadHook || isDeleteHook) {
				args.unshift(this.options.context);
			}
			if (isWriteHook) {
				args.unshift(_.get(this.$__.saveOptions, 'context'));
			}
			return handler(this, ...args);
		})
	);
};

export const beforeRead = createRegisterHooks(READ_HOOKS, 'pre');

export const beforeWrite = createRegisterHooks(WRITE_HOOKS, 'pre');

export const beforeDelete = createRegisterHooks(DELETE_HOOKS, 'pre');

export const afterRead = createRegisterHooks(READ_HOOKS, 'post');

export const afterWrite = createRegisterHooks(WRITE_HOOKS, 'post');

export const afterDelete = createRegisterHooks(DELETE_HOOKS, 'post');
