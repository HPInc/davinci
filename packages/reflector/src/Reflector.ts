import 'reflect-metadata';

export default class Reflector {
	static getMetadata(metadataKey: any, target: any, propertyKey?: string | symbol) {
		return Reflect.getMetadata(metadataKey, target, propertyKey);
	}

	static defineMetadata(metadataKey: any, metadataValue: any, target: any, propertyKey?: string | symbol) {
		return Reflect.defineMetadata(metadataKey, metadataValue, target, propertyKey);
	}

	static pushMetadata(metadataKey: any, metadataValue: any, target: any, propertyKey?: string | symbol) {
		const metadata = Reflector.getMetadata(metadataKey, target, propertyKey) || [];
		const newMetadataValue = [...metadata, metadataValue];

		return Reflector.defineMetadata(metadataKey, newMetadataValue, target, propertyKey);
	}

	static unshiftMetadata(metadataKey: any, metadataValue: any, target: any, propertyKey?: string | symbol) {
		const metadata = Reflector.getMetadata(metadataKey, target, propertyKey) || [];
		const newMetadataValue = [metadataValue, ...metadata];

		return Reflector.defineMetadata(metadataKey, newMetadataValue, target, propertyKey);
	}
}
