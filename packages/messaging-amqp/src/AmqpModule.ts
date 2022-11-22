/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import {
	App,
	di,
	executeInterceptorsStack,
	getInterceptorsHandlers,
	InterceptorBag,
	mapParallel,
	mapSeries,
	Module
} from '@davinci/core';
import { ClassReflection, ClassType, DecoratorId, MethodReflection, PartialDeep } from '@davinci/reflector';
import { Level, Logger, pino } from 'pino';
import createDeepmerge from '@fastify/deepmerge';
import amqplib, { Message } from 'amqplib';
import amqpConnectionManager, { AmqpConnectionManager, ChannelWrapper, ConnectionUrl } from 'amqp-connection-manager';
import { EventEmitter } from 'events';
import { AmqpConnectionManagerOptions } from 'amqp-connection-manager/dist/esm/AmqpConnectionManager';
import { AmqpSubscriptionSettings, ParameterConfiguration, SubscribeDecoratorMetadata, Subscription } from './types';
import { ChannelManager, ChannelManagerOptions } from './ChannelManager';

const deepmerge = createDeepmerge({ all: true });

export interface AmqpModuleOptions {
	connection: ConnectionUrl;
	connectionManagerOptions?: AmqpConnectionManagerOptions;
	connectionTimeout?: number;
	subscriptions?: Array<AmqpSubscriptionSettings>;
	defaultSubscriptionSettings?: PartialDeep<AmqpSubscriptionSettings>;
	defaultChannelSettings?: AmqpSubscriptionSettings;
	gracefulShutdownStrategy?: 'none' | 'processInFlight' | 'nackInFlight' | null;
	channelManagerFactory?: (connection: AmqpConnectionManager, options: ChannelManagerOptions) => ChannelManager;
	logger?: {
		name?: string;
		level?: Level | 'silent';
	};
}

interface InFlightMessage {
	message?: Message;
	processed?: boolean;
	subscription?: Subscription;
}

export class AmqpModule extends Module {
	app: App;
	private logger: Logger;
	private options: AmqpModuleOptions;
	private connection: AmqpConnectionManager;
	private subscriptions: Array<Subscription>;
	private subscriptionsMap: Map<string, Subscription> = new Map();
	private bus: EventEmitter;
	private inFlightMessages: Map<Message, InFlightMessage> = new Map();
	private channelManager: ChannelManager;

	constructor(options: AmqpModuleOptions) {
		super();
		this.options = deepmerge(
			<AmqpModuleOptions>{
				connectionTimeout: 5000,
				defaultChannelSettings: { exchangeType: 'topic' },
				logger: { name: 'AmqpModule', level: 'info' }
			},
			options
		);
		this.bus = new EventEmitter();
		this.logger = pino({ name: this.options.logger?.name });
		if (this.options.logger?.level) {
			this.logger.level = this.options.logger?.level;
		}
	}

	getModuleId() {
		return ['messaging', 'amqp'];
	}

	onRegister(app: App) {
		this.app = app;

		const level = this.options.logger?.level ?? app.getOptions().logger?.level;
		if (level) {
			this.logger.level = level;
		}

		const connectionOptions =
			typeof this.options.connection === 'object' ? this.options.connection : { url: this.options.connection };
		this.connection = amqpConnectionManager.connect(connectionOptions, this.options.connectionManagerOptions);
		this.channelManager =
			this.options.channelManagerFactory?.(this.connection, { logger: this.options.logger }) ??
			di.container.resolve(ChannelManager).setConnection(this.connection).setOptions({
				defaultChannelSettings: this.options.defaultChannelSettings,
				logger: this.options.logger
			});
	}

	async onInit() {
		this.logger.debug('Initializing module');
		await this.connection.connect({ timeout: this.options?.connectionTimeout });
		this.logger.info('Connection established');

		await this.createSubscriptions();
	}

	async onDestroy() {
		if (this.options.gracefulShutdownStrategy === 'processInFlight') {
			this.logger.debug('Waiting for the in-flight messages to be processed');
			// stop consuming new messages
			await mapParallel(this.subscriptions ?? [], subscription => {
				return this.channelManager.unsubscribe(subscription);
			});
			// wait until they are processed
			await new Promise(resolve => {
				this.bus.once('empty', () => resolve(null));
			});
			this.logger.debug('All the in-flight messages have been processed');
		} else if (this.options.gracefulShutdownStrategy === 'nackInFlight') {
			this.logger.debug('Nacking all the in-flight messages');
			await mapParallel(Array.from(this.inFlightMessages.values()), inFlightMsg => {
				this.channelManager.nackMessage(inFlightMsg.message, inFlightMsg.subscription, true);
				inFlightMsg.processed = true;
			});
		}

		await mapParallel(this.subscriptions ?? [], subscription =>
			this.channelManager.closeChannel(subscription).catch(err => {
				this.logger.info(
					{ subscriptionName: subscription.settings.name, error: err },
					'Channel closed with errors'
				);
			})
		);

		await this.connection.close();
		this.logger.info('Connection closed');
	}

	async createSubscriptions() {
		this.subscriptions = this.options?.subscriptions?.map(options => ({ settings: options })) ?? [];
		const controllerMethodReflectionsMap = new Map<
			Subscription,
			{
				controller: ClassType;
				controllerReflection: ClassReflection;
				methodReflection: MethodReflection;
			}
		>();

		this.app.getControllersWithReflection().forEach(({ controllerInstance, reflection }) => {
			const matches = this.findMatchingMethodAndDecoratorReflections(reflection);

			matches.forEach(({ methodReflection, decorator }) => {
				const controllerMethodAndReflections = {
					controller: controllerInstance,
					controllerReflection: reflection,
					methodReflection
				};

				const subscription: Subscription = {
					// the following ts-ignore is needed to circumvent
					// an issue affecting nyc and typescript module augmentation.
					// the tests executed via `nyc npm test` seems to ignore the augmentation defined
					// in the src/index.ts file
					// @ts-ignore
					settings: { name: decorator.options.name, ...decorator.options?.amqp }
				};
				this.subscriptions.push(subscription);

				controllerMethodReflectionsMap.set(subscription, controllerMethodAndReflections);
			});
		});

		this.subscriptions = this.subscriptions.map(s => {
			if (this.subscriptionsMap.has(s.settings.name)) {
				throw new Error(`A subscription with the name ${s.settings.name} is already in use`);
			}
			this.subscriptionsMap.set(s.settings.name, s);

			s.settings = deepmerge<(AmqpSubscriptionSettings | PartialDeep<AmqpSubscriptionSettings>)[]>(
				{ ...this.options.defaultSubscriptionSettings },
				{ exchangeType: 'topic', autoAck: true },
				s.settings
			) as AmqpSubscriptionSettings;
			return s;
		});

		await mapSeries(this.subscriptions ?? [], async subscription => {
			const { controller, controllerReflection, methodReflection } =
				controllerMethodReflectionsMap.get(subscription);

			const parametersConfig = this.createParametersConfigurations({
				controllerReflection,
				methodReflection
			});

			await this.channelManager.subscribe(
				subscription,
				await this.createMessageHandler({
					controller,
					methodName: methodReflection.name,
					parametersConfig,
					subscription,
					reflections: {
						methodReflection,
						controllerReflection
					}
				})
			);

			this.logger.debug(
				{ subscription: { name: subscription.settings.name } },
				'Subscription initialized an connected'
			);
		});
	}

	createParametersConfigurations({
		controllerReflection,
		methodReflection
	}: {
		methodReflection: MethodReflection;
		controllerReflection: ClassReflection;
	}): ParameterConfiguration[] {
		return methodReflection.parameters.reduce((acc, parameterReflection) => {
			const parameterDecoratorMetadata = parameterReflection.decorators.find(
				d => d[DecoratorId] === 'messaging.parameter'
			);

			if (parameterDecoratorMetadata?.[DecoratorId] === 'messaging.parameter') {
				const { options } = parameterDecoratorMetadata;
				const parameterType = parameterReflection.type;

				acc.push({
					source: options.in,
					name: parameterReflection.name,
					options,
					type: parameterType
				});
			} else if (parameterDecoratorMetadata?.[DecoratorId] === 'core.parameter.context') {
				acc.push({
					source: 'context',
					options: parameterDecoratorMetadata.options,
					reflection: { controllerReflection, methodReflection }
				});
			} else {
				acc.push(null);
			}

			return acc;
		}, []);
	}

	createMessageHandler({
		controller,
		methodName,
		subscription,
		parametersConfig,
		reflections: { controllerReflection, methodReflection }
	}: {
		controller: InstanceType<ClassType>;
		methodName: string;
		subscription: Subscription;
		parametersConfig: ParameterConfiguration[];
		reflections: { methodReflection: MethodReflection; controllerReflection: ClassReflection };
	}) {
		const interceptors = [
			...getInterceptorsHandlers(controllerReflection),
			...getInterceptorsHandlers(methodReflection)
		];
		// eslint-disable-next-line @typescript-eslint/no-this-alias
		const amqpModule = this;

		return async function davinciAmqpMessageHandler(msg: amqplib.ConsumeMessage) {
			amqpModule.logger.debug({ message: msg }, 'Message received');
			amqpModule.addInFlightMsg({ message: msg, subscription });

			const parametersValues = await mapParallel(parametersConfig, parameterCfg => {
				let value;
				if (parameterCfg.source === 'message') {
					value = msg;
				}
				if (parameterCfg.source === 'payload') {
					value = subscription.settings?.json ? JSON.parse(msg.content.toString()) : msg.content;
				}
				if (parameterCfg.source === 'channel') {
					value = subscription.channel;
				}

				return value;
			});

			const interceptorsBag = amqpModule.prepareInterceptorBag({
				subscription,
				parameters: parametersValues
			});

			try {
				const result = await executeInterceptorsStack(
					[...interceptors, (_next, context) => controller[methodName](...context.handlerArgs)],
					interceptorsBag
				);

				if (!amqpModule.isInFlightMsgProcessed(msg) && subscription.settings?.autoAck) {
					amqpModule.channelManager.ackMessage(msg, subscription);
					amqpModule.deleteInFlightMsg(msg);
				}

				return result;
			} catch (err) {
				const { autoNack } = subscription.settings;
				const { enabled: nackEnabled, requeue } =
					typeof autoNack === 'boolean' ? { enabled: autoNack, requeue: false } : autoNack ?? {};

				if (!amqpModule.isInFlightMsgProcessed(msg) && nackEnabled) {
					amqpModule.channelManager.nackMessage(msg, subscription, requeue);
					amqpModule.deleteInFlightMsg(msg);
					return null;
				}

				throw err;
			}
		};
	}

	getConnection() {
		return this.connection;
	}

	getOptions() {
		return this.options;
	}

	getSubscriptions() {
		return this.subscriptions;
	}

	getChannels() {
		return this.channelManager.getChannels();
	}

	private addInFlightMsg(inFlightMessage: InFlightMessage) {
		this.inFlightMessages.set(inFlightMessage.message, inFlightMessage);
		this.bus.emit('addedInFlightMessage', { totalInFlight: this.inFlightMessages.size });
	}

	private deleteInFlightMsg(msg: Message) {
		this.inFlightMessages.delete(msg);
		this.bus.emit('removedInFlightMessage', { totalInFlight: this.inFlightMessages.size });

		if (this.inFlightMessages.size === 0) {
			this.bus.emit('empty');
		}
	}

	private isInFlightMsgProcessed(msg: Message) {
		return !!this.inFlightMessages.get(msg)?.processed;
	}

	private prepareInterceptorBag({
		subscription,
		parameters
	}: {
		subscription: Subscription;
		parameters: any[];
	}): InterceptorBag<{}, { channel: ChannelWrapper; subscription: Subscription }> {
		return {
			module: 'messaging-amqp',
			handlerArgs: parameters,
			channel: subscription.channel,
			subscription,
			state: {}
		};
	}

	private findMatchingMethodAndDecoratorReflections(controllerReflection: ClassReflection) {
		return controllerReflection.methods.reduce<
			{ methodReflection: MethodReflection; decorator: SubscribeDecoratorMetadata }[]
		>((acc, method) => {
			const decorator = method.decorators.find(d => d[DecoratorId] === 'messaging.subscribe');
			if (decorator) {
				acc.push({ methodReflection: method, decorator });
			}

			return acc;
		}, []);
	}
}
