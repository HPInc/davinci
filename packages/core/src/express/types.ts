import { Request } from 'express';

export interface IHeaderDecoratorMetadata {
	name: string;
	value: string;
	handler: Function;
}

export interface DaVinciRequest extends Request {
	requestHandled?: boolean;
}
