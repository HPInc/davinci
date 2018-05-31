const should = require('should');
const sinon = require('sinon');
const { applyHook } = require('../../src/hookUtils');

describe('hookUtils', () => {

	const makeService = () => {
		return {
			find: () => Promise.resolve([1, 2, 3])
		};
	}

	it('should successfully process hooks onto a service standard function', async () => {
		const service = makeService();
		const newService = applyHook(service);
		should(newService).have.property('find');
		const results = await newService.find();
		results.should.be.Array;
	});

	it('should successfully process hooks onto a service with findOne addded', async () => {
		const service = makeService();
		const newService = applyHook(service);
		should(newService).have.property('findOne');
		const results = await newService.findOne();
		results.should.be.Array;
	});

	it('should successfully process the after hook on a find call', async () => {
		const service = makeService();
		const newService = applyHook(service);
		newService.addHook('after', 'find', hook => {
			hook.result.should.be.Array;
			hook.result.should.be.of.length(3);
			hook.result.push(4);
			hook.result.should.be.of.length(4);
		});
		const results = await newService.find();
		results.should.be.Array;
		results.should.be.of.length(4);
	});

	it('should successfully process the after hook on a findOne call', async () => {
		const service = makeService();
		const newService = applyHook(service);
		newService.addHook('after', 'findOne', hook => {
			hook.result.should.be.equal(1);
			hook.result = 2;
		});
		const results = await newService.findOne();
		results.should.equal(2);
	});

	it('should successfully process the before hook on a find call', (done) => {
		const service = makeService();
		const newService = applyHook(service);
		newService.addHook('before', 'find', hook => {
			hook.should.have.property('result');
			done();
		});
		newService.find();
	});

	it('should successfully add a before hook using the .before method', (done) => {
		const service = makeService();
		const newService = applyHook(service);
		newService.before('find', hook => {
			hook.should.have.property('result');
			done();
		});
		newService.find();
	});

	it('should successfully add a after hook using the .after method', (done) => {
		const service = makeService();
		const newService = applyHook(service);
		newService.after('find', hook => {
			hook.result.should.be.Array;
			hook.result.should.be.of.length(3);
			hook.result.push(4);
			hook.result.should.be.of.length(4);
			done();
		});
		newService.find();
	});
});

