import 'reflect-metadata';
import * as route from './decorators/route';
import * as swagger from './decorators/swagger';
import * as openapiDocs from './swagger/openapiDocs';

export { default as createRouter } from './createRouter';
export { route, swagger, openapiDocs };
