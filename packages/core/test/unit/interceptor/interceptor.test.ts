/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */
import { DecoratorId, reflect } from '@davinci/reflector';
import { expect } from '../../support/chai';
import { executeInterceptorsStack, Interceptor, interceptor } from '../../../src';

type InterceptorState = { calls: string[] };
type InterceptorStateErrors = { errorMessages: string[] };

describe('interceptors', () => {
	it('should execute the interceptor using the onion principle', async () => {
		const calls = [];
		const interceptor1: Interceptor<{ State: InterceptorState }> = async (next, { state }) => {
			state.calls.push('interceptor1 before');
			await next();
			state.calls.push('interceptor1 after');
		};
		const interceptor2: Interceptor<{ State: InterceptorState }> = async (next, { state }) => {
			state.calls.push('interceptor2 before');
			await next();
			state.calls.push('interceptor2 after');
		};
		const interceptor3: Interceptor<{ State: InterceptorState }> = async (next, { state }) => {
			state.calls.push('interceptor3 before');
			await next();
			state.calls.push('interceptor3 after');
		};

		await executeInterceptorsStack([interceptor1, interceptor2, interceptor3], {
			module: '',
			handlerArgs: [],
			state: { calls }
		});

		expect(calls).to.be.deep.equal([
			'interceptor1 before',
			'interceptor2 before',
			'interceptor3 before',
			'interceptor3 after',
			'interceptor2 after',
			'interceptor1 after'
		]);
	});

	it('should be able to propagate the result of the execution stack', async () => {
		const interceptor1: Interceptor<{ State: InterceptorState }> = async next => {
			const result = await next();

			return { ...result, interceptor1Success: true };
		};
		const interceptor2: Interceptor<{ State: InterceptorState }> = async next => {
			const result = await next();

			return { ...result, interceptor2Success: true };
		};
		const interceptor3: Interceptor<{ State: InterceptorState }> = async next => {
			const result = await next();

			return { ...result, interceptor3Success: true };
		};

		const result = await executeInterceptorsStack([interceptor1, interceptor2, interceptor3]);

		expect(result).to.be.deep.equal({
			interceptor1Success: true,
			interceptor2Success: true,
			interceptor3Success: true
		});
	});

	it('should be able to stop the execution stack by not calling the next interceptor', async () => {
		const calls = [];
		const interceptor1: Interceptor<{ State: InterceptorState }> = async (next, { state }) => {
			state.calls.push('interceptor1 before');
			const result = await next();
			state.calls.push('interceptor1 after');

			return result;
		};
		const interceptor2: Interceptor<{ State: InterceptorState }> = async (_next, { state }) => {
			state.calls.push('interceptor2 before');

			// not calling next() here
			return { success: true };
		};
		const interceptor3: Interceptor<{ State: InterceptorState }> = async (next, { state }) => {
			state.calls.push('interceptor3 before');
			await next();
			state.calls.push('interceptor3 after');
		};

		const result = await executeInterceptorsStack([interceptor1, interceptor2, interceptor3], {
			module: '',
			handlerArgs: [],
			state: { calls }
		});

		expect(result).to.be.deep.equal({ success: true });
		expect(calls).to.be.deep.equal(['interceptor1 before', 'interceptor2 before', 'interceptor1 after']);
	});

	it('should bubble up the exceptions', async () => {
		const interceptor1: Interceptor<{ State: InterceptorStateErrors }> = async next => {
			try {
				await next();
			} catch (err) {
				throw new Error(`Interceptor 1 error + ${err.message}`);
			}
		};
		const interceptor2: Interceptor<{ State: InterceptorStateErrors }> = async next => {
			try {
				await next();
			} catch (err) {
				throw new Error(`Interceptor 2 error + ${err.message}`);
			}
		};
		const interceptor3: Interceptor<{ State: InterceptorStateErrors }> = async () => {
			throw new Error('Interceptor 3 error');
		};

		await expect(executeInterceptorsStack([interceptor1, interceptor2, interceptor3])).to.be.rejectedWith(
			'Interceptor 1 error + Interceptor 2 error + Interceptor 3 error'
		);
	});

	it('should decorate correctly', () => {
		const handler = () => {};
		@interceptor(handler)
		class MyController {
			@interceptor(handler)
			myMethod() {}
		}

		const controllerReflection = reflect(MyController);

		expect(controllerReflection.decorators[0]).to.be.deep.equal({ [DecoratorId]: 'interceptor', handler });
		expect(controllerReflection.methods[0].decorators[0]).to.be.deep.equal({
			[DecoratorId]: 'interceptor',
			handler
		});
	});
});
