const _ = require('lodash');
const swaggerDocs = require('./openapi.docs');
const createRoute = require('./router.factory');

class API {
	constructor(name, def) {
		this.name = name;
		this.def = def;

		// create the router
		this.router = createRoute(this.def, this);

		// add the defs to the centralised swagger / openapi documentation
		swaggerDocs.addResource(this.name, this.def);
	}
	addContext(context, query) {
		// use the context filter, if one was defined
		const contextQuery = this.contextFilter ? this.contextFilter(context) : {};
		// include any custom criteria defined on this request
		return _.assign(contextQuery, query);
	}
	get(context) {
		if (!this.model) return Promise.resolve({ message: 'No model implemented' });
		const id = context.params.id;
		return this.model.get(id, context);
	}
	list(context) {
		if (!this.model) return Promise.resolve({ message: 'No model implemented' });
		const query = {};
		// return this.model.find(query);
		return this.model.find({
			query: this.addContext(context, query)
		});
	}
	create(context) {
		if (!this.model) return Promise.resolve({ message: 'No model implemented' });
		const doc = this.addContext(context, context.body);
		return this.model.create(doc);
	}
	update(context) {
		if (!this.model) return Promise.resolve({ message: 'No model implemented' });
		const doc = this.addContext(context, context.body);
		const id = context.params.id;
		return this.model.update(id, doc);
	}
	remove(context) {
		if (!this.model) return Promise.resolve({ message: 'No model implemented' });
		const id = context.params.id;
		return this.model.remove(id);
	}
}

module.exports = API;
