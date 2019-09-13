import should from 'should';
import Sinon from 'sinon';
import { Reflector } from '@davinci/reflector';
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
			sinon.stub(Reflector, 'defineMetadata');
			sinon.stub(Reflector, 'getMetadata').returns([]);
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
				should(Reflector.defineMetadata.getCall(0).args[0]).be.equal('tsopenapi:methods');
				// @ts-ignore
				should(Reflector.defineMetadata.getCall(0).args[1][0]).be.deepEqual({
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
				should(Reflector.defineMetadata.getCall(0).args[0]).be.equal('tsopenapi:methods');
				// @ts-ignore
				should(Reflector.defineMetadata.getCall(0).args[1][0]).be.deepEqual({
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
				should(Reflector.defineMetadata.getCall(0).args[0]).be.equal('tsopenapi:methods');
				// @ts-ignore
				should(Reflector.defineMetadata.getCall(0).args[1][0]).be.deepEqual({
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
				should(Reflector.defineMetadata.getCall(0).args[0]).be.equal('tsopenapi:methods');
				// @ts-ignore
				should(Reflector.defineMetadata.getCall(0).args[1][0]).be.deepEqual({
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
				should(Reflector.defineMetadata.getCall(0).args[0]).be.equal('tsopenapi:methods');
				// @ts-ignore
				should(Reflector.defineMetadata.getCall(0).args[1][0]).be.deepEqual({
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
				should(Reflector.defineMetadata.getCall(0).args[0]).be.equal('tsopenapi:methods');
				// @ts-ignore
				should(Reflector.defineMetadata.getCall(0).args[1][0]).be.deepEqual({
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
				.stub(Reflector, 'getMetadata')
				.onFirstCall()
				.returns([])
				.onSecondCall()
				.returns(['string']);
			sinon.stub(Reflector, 'defineMetadata');

			route.param({ name: 'query', in: 'query' })(MyClass.prototype, 'myMethod', 0);

			// @ts-ignore
			should(Reflector.defineMetadata.getCall(0).args[0]).be.equal('tsopenapi:method-parameters');
			// @ts-ignore
			should(Reflector.defineMetadata.getCall(0).args[1][0]).be.deepEqual({
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
			class BaseClass {
				myMethod(@route.param({ name: 'wrongName', in: 'query' }) query: string) {
					return query;
				}
			}

			class MyClass extends BaseClass {
				myMethod(@route.param({ name: 'correctName', in: 'query' }) query: string) {
					return query;
				}
			}

			const metadata = Reflector.getMetadata('tsopenapi:method-parameters', MyClass.prototype.constructor);
			// @ts-ignore
			should(metadata[0]).be.deepEqual({
				handler: MyClass.prototype.myMethod,
				methodName: 'myMethod',
				index: 0,
				options: {
					name: 'correctName',
					in: 'query'
				},
				type: String
			});
		});
	});

	describe('@route.controller()', () => {
		it('should define metadata correctly', () => {
			const decoratorArg = {
				basepath: '/thebasepath',
				excludedMethods: ['testMethod']
			};

			sinon.stub(Reflector, 'defineMetadata');
			@route.controller(decoratorArg)
			// @ts-ignore
			class MyClass {
				myMethod(query) {
					return query;
				}
			}

			// @ts-ignore
			should(Reflector.defineMetadata.getCall(0).args[0]).be.equal('tsopenapi:controller');
			// @ts-ignore
			should(Reflector.defineMetadata.getCall(0).args[1]).be.deepEqual(decoratorArg);
		});
	});
});
