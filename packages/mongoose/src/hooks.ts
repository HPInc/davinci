import _ from 'lodash';

export const READ_HOOKS = [
	// 'count',
	'countDocuments',
	'find',
	'findOne',
	'findOneAndDelete',
	'findOneAndRemove',
	'findOneAndUpdate',
	'deleteMany',
	// 'deleteOne',
	// 'remove',
	'update',
	'updateOne',
	'updateMany'
];

const WRITE_HOOKS = ['findOneAndUpdate', 'save', 'validate', 'update', 'updateMany'];

const DELETE_HOOKS = ['deleteMany', 'findOneAndDelete', 'findOneAndRemove'];

const createRegisterHooks = (hooksList, stage) => (mongooseSchema, handler) => {
	const isReadHook = hooksList === READ_HOOKS;
	const isWriteHook = hooksList === WRITE_HOOKS;
	const isDeleteHook = hooksList === DELETE_HOOKS;
	// const isPre = stage === 'pre';
	// const isPost = stage === 'post';

	const hasContextInOptions = hook =>
		isReadHook || isDeleteHook || ['findOneAndUpdate', 'update', 'updateMany'].includes(hook);
	const hasContextinSaveOptions = hook => isWriteHook && !['findOneAndUpdate', 'update', 'updateMany'].includes(hook);

	return hooksList.forEach(hook =>
		mongooseSchema[stage](hook, async function() {
			if (this.setOptions) {
				this.setOptions({ runValidators: true });
			}
			const args = [hook];
			if (hasContextInOptions(hook)) {
				args.unshift(this.options.context);
			}
			if (hasContextinSaveOptions(hook)) {
				// eslint-disable-next-line no-underscore-dangle
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
