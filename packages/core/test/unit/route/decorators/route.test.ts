import should from 'should';
import Sinon from 'sinon';
import { createRouteMethodDecorator } from '../../../../src/route/decorators/route';
import { route } from '../../../../src/route';

const sinon = Sinon.createSandbox();

describe('route decorators', () => {
	afterEach(() => {
		sinon.restore();
	});

	describe('createRouteMethodDecorator', () => {
		it('should create a method decorator', () => {
			const decorator = createRouteMethodDecorator('get');
			should(decorator).be.a.Function();
		});
	});

	describe('verb methods', () => {
		const createArtifactsAndDecorate = verb => {
			const decorator = verb === 'delete' ? route.del : route[verb];
			const MyClass = class {
				myMethod() {}
			};
			sinon.stub(Reflect, 'defineMetadata');
			sinon.stub(Reflect, 'getMetadata').returns([]);
			const decoratorArgs = {
				path: '/thepath',
				description: 'My description',
				summary: 'This is a method',
				responses: { '200': {} }
			};

			decorator(decoratorArgs)(MyClass.prototype, 'myMethod');

			return { decorator, decoratorArgs, MyClass };
		};

		describe('@route.get()', () => {
			it('should define metadata correctly', () => {
				const { decoratorArgs, MyClass } = createArtifactsAndDecorate('get');

				// @ts-ignore
				should(Reflect.defineMetadata.getCall(0).args[0]).be.equal('tsopenapi:methods');
				// @ts-ignore
				should(Reflect.defineMetadata.getCall(0).args[1][0]).be.deepEqual({
					path: decoratorArgs.path,
					verb: 'get',
					methodName: 'myMethod',
					summary: decoratorArgs.summary,
					description: decoratorArgs.description,
					responses: decoratorArgs.responses,
					handler: MyClass.prototype.myMethod
				});
			});
		});

		describe('@route.post()', () => {
			it('should define metadata correctly', () => {
				const { decoratorArgs, MyClass } = createArtifactsAndDecorate('post');

				// @ts-ignore
				should(Reflect.defineMetadata.getCall(0).args[0]).be.equal('tsopenapi:methods');
				// @ts-ignore
				should(Reflect.defineMetadata.getCall(0).args[1][0]).be.deepEqual({
					path: decoratorArgs.path,
					verb: 'post',
					methodName: 'myMethod',
					summary: decoratorArgs.summary,
					description: decoratorArgs.description,
					responses: decoratorArgs.responses,
					handler: MyClass.prototype.myMethod
				});
			});
		});

		describe('@route.put()', () => {
			it('should define metadata correctly', () => {
				const { decoratorArgs, MyClass } = createArtifactsAndDecorate('put');

				// @ts-ignore
				should(Reflect.defineMetadata.getCall(0).args[0]).be.equal('tsopenapi:methods');
				// @ts-ignore
				should(Reflect.defineMetadata.getCall(0).args[1][0]).be.deepEqual({
					path: decoratorArgs.path,
					verb: 'put',
					methodName: 'myMethod',
					summary: decoratorArgs.summary,
					description: decoratorArgs.description,
					responses: decoratorArgs.responses,
					handler: MyClass.prototype.myMethod
				});
			});
		});

		describe('@route.patch()', () => {
			it('should define metadata correctly', () => {
				const { decoratorArgs, MyClass } = createArtifactsAndDecorate('patch');

				// @ts-ignore
				should(Reflect.defineMetadata.getCall(0).args[0]).be.equal('tsopenapi:methods');
				// @ts-ignore
				should(Reflect.defineMetadata.getCall(0).args[1][0]).be.deepEqual({
					path: decoratorArgs.path,
					verb: 'patch',
					methodName: 'myMethod',
					summary: decoratorArgs.summary,
					description: decoratorArgs.description,
					responses: decoratorArgs.responses,
					handler: MyClass.prototype.myMethod
				});
			});
		});

		describe('@route.delete()', () => {
			it('should define metadata correctly', () => {
				const { decoratorArgs, MyClass } = createArtifactsAndDecorate('delete');

				// @ts-ignore
				should(Reflect.defineMetadata.getCall(0).args[0]).be.equal('tsopenapi:methods');
				// @ts-ignore
				should(Reflect.defineMetadata.getCall(0).args[1][0]).be.deepEqual({
					path: decoratorArgs.path,
					verb: 'delete',
					methodName: 'myMethod',
					summary: decoratorArgs.summary,
					description: decoratorArgs.description,
					responses: decoratorArgs.responses,
					handler: MyClass.prototype.myMethod
				});
			});
		});

		describe('@route.head()', () => {
			it('should define metadata correctly', () => {
				const { decoratorArgs, MyClass } = createArtifactsAndDecorate('head');

				// @ts-ignore
				should(Reflect.defineMetadata.getCall(0).args[0]).be.equal('tsopenapi:methods');
				// @ts-ignore
				should(Reflect.defineMetadata.getCall(0).args[1][0]).be.deepEqual({
					path: decoratorArgs.path,
					verb: 'head',
					methodName: 'myMethod',
					summary: decoratorArgs.summary,
					description: decoratorArgs.description,
					responses: decoratorArgs.responses,
					handler: MyClass.prototype.myMethod
				});
			});
		});
	});

	describe('@route.param()', () => {
		it('should define metadata correctly', () => {
			const MyClass = class {
				myMethod(query) {
					return query;
				}
			};

			sinon
				.stub(Reflect, 'getMetadata')
				.onFirstCall()
				.returns([])
				.onSecondCall()
				.returns(['string']);
			sinon.stub(Reflect, 'defineMetadata');

			route.param({ name: 'query', in: 'query' })(MyClass.prototype, 'myMethod', 0);

			// @ts-ignore
			should(Reflect.defineMetadata.getCall(0).args[0]).be.equal('tsopenapi:method-parameters');
			// @ts-ignore
			should(Reflect.defineMetadata.getCall(0).args[1][0]).be.deepEqual({
				target: MyClass.prototype,
				handler: MyClass.prototype.myMethod,
				methodName: 'myMethod',
				index: 0,
				options: {
					name: 'query',
					in: 'query'
				},
				type: 'string'
			});
		});

		/*
		That is particularly important for prototypal inheritance:
		Assuming we have:

		class MongooseController {
			@route.param({ name: 'correctName', in: 'path' })
			find() {}
		}

		class CustomerController extends MongooseController {
			@route.param({ name: 'correctName', in: 'path' })
			find() {}
		}

		The decorator is called *against the same target Customer.prototype.find* twice, and that could led to strange
		behaviours.

		We want only the decorator specified in the CustomerController class, to have effect
		*/
		it(`should ignore setting metadata on the method, if metadata already exists 
				(example: it was defined by the extending class)`, () => {
			const BaseClass = class {
				myMethod(query) {
					return query;
				}
			};
			route.param({ name: 'wrongName', in: 'query' })(BaseClass.prototype, 'myMethod', 0);

			const MyClass = class extends BaseClass {
				myMethod(query) {
					return query;
				}
			};

			sinon
				.stub(Reflect, 'getMetadata')
				.onFirstCall()
				.returns([])
				.onSecondCall()
				.returns(['string']);
			sinon.stub(Reflect, 'defineMetadata');

			route.param({ name: 'correctName', in: 'query' })(MyClass.prototype, 'myMethod', 0);

			// @ts-ignore
			should(Reflect.defineMetadata.getCall(0).args[0]).be.equal('tsopenapi:method-parameters');
			// @ts-ignore
			should(Reflect.defineMetadata.getCall(0).args[1][0]).be.deepEqual({
				target: MyClass.prototype,
				handler: MyClass.prototype.myMethod,
				methodName: 'myMethod',
				index: 0,
				options: {
					name: 'correctName',
					in: 'query'
				},
				type: 'string'
			});
		});
	});

	describe('@route.controller()', () => {
		it('should define metadata correctly', () => {
			const MyClass = class {
				myMethod(query) {
					return query;
				}
			};
			sinon.stub(Reflect, 'defineMetadata');

			const decoratorArg = {
				basepath: '/thebasepath',
				additionalSchemas: [MyClass],
				excludedMethods: ['testMethod']
			};
			route.controller(decoratorArg)(MyClass);

			// @ts-ignore
			should(Reflect.defineMetadata.getCall(0).args[0]).be.equal('tsopenapi:controller');
			// @ts-ignore
			should(Reflect.defineMetadata.getCall(0).args[1]).be.deepEqual(decoratorArg);
		});
	});
});
