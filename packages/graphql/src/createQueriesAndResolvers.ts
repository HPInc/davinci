import _fp from 'lodash/fp';
import _ from 'lodash';
import { getSchema } from './generateSchema';

export const createQueriesAndResolvers = Controller => {
	const queriesMetadata = Reflect.getMetadata('tsgraphql:queries', Controller.prototype) || [];
	const controllerArgs = _fp.flow(
		_fp.sortBy('index'),
		_fp.compact
	)(Reflect.getMetadata('tsgraphql:args', Controller.prototype) || []);

	const allSchemas = {};
	const controller = new Controller();

	const queries = queriesMetadata.reduce((acc, query) => {
		const { methodName, name, returnType } = query;
		const queryArgsMetadata = _.filter(controllerArgs, { methodName });
		const { schema: graphqlReturnType, schemas } = getSchema(returnType, allSchemas);
		Object.assign(allSchemas, schemas);

		const { queryArgs, handlerArgsDefinition } = queryArgsMetadata.reduce(
			(acc, arg: any) => {
				const { type, name } = arg;
				let graphqlArgType = type;
				if (type === 'context') {
					acc.handlerArgsDefinition.push({ name, isContext: true });
					return acc;
				}

				const { schema: gArgType } = getSchema(type);
				graphqlArgType = gArgType;

				acc.queryArgs[name] = { type: graphqlArgType };
				return acc;
			},
			{ queryArgs: {}, handlerArgsDefinition: [] }
		);

		acc[name || methodName] = {
			type: graphqlReturnType,
			args: queryArgs,
			resolve(_, args, context) {
				const handlerArgs = handlerArgsDefinition.map(({ name, isContext }) => {
					if (isContext) return context;

					return (args || {})[name];
				});
				return controller[methodName](...handlerArgs);
			}
		};

		return acc;
	}, {});

	return { queries, schemas: allSchemas };
};

export default createQueriesAndResolvers;
