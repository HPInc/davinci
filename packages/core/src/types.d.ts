import { Express } from 'express';
import { Server } from 'http';

export interface IOfBaseExpress extends Express {
	server: Server;
	start: Function;
	close: Function;
}
