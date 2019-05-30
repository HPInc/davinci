import 'reflect-metadata';
import * as route from './decorators/route';
import * as openapi from './decorators/openapi';
import * as openapiDocs from './openapi/openapiDocs';
import { default as createRouter } from './createRouter';

export { route, openapi, openapiDocs, createRouter };
