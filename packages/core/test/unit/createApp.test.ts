import should from 'should';
// import path from 'path';
import sinon from 'sinon';
import express from 'express';
import { processArgs, createApp, configureExpress } from '../../src/createApp';

describe('createApp', () => {
	const makeApp = () => {
		return {
			listener: sinon.stub(),
			listen: sinon.stub(),
			use: sinon.stub(),
			get: sinon.stub()
		};
	};

	describe('processArgs', () => {
		// processArgs(runMiddlewares) -> Promise
		// processArgs(app, runMiddlewares) -> Promise
		// processArgs(app, options, runMiddlewares) -> Promise

		it('Should successfully create an app with no args', () => {
			const [app, options, runMiddlewares] = processArgs();
			should(app).have.property('use');
			options.should.be.empty;
			runMiddlewares.should.be.Function;
		});

		it('Should successfully create an app with a single middleware function', () => {
			const fn = () => {};
			const [app, options, runMiddlewares] = processArgs(fn);
			should(app).have.property('use');
			options.should.be.empty;
			runMiddlewares.should.be.Function;
		});

		it('Should successfully create an app with an app, options and middleware function', () => {
			const fn = () => {};
			const myApp = makeApp();
			const [app, options, runMiddlewares] = processArgs(myApp, fn);
			should(app).have.property('use');
			options.should.be.empty;
			runMiddlewares.should.be.Function;
		});

		it('Should successfully create an app with an app, options and middleware function', () => {
			const fn = () => {};
			const myOptions = { boot: 'dir' };
			const myApp = makeApp();
			const [app, options, runMiddlewares] = processArgs(myApp, myOptions, fn);
			should(app).have.property('use');
			options.should.deepEqual({ boot: 'dir' });
			runMiddlewares.should.be.Function;
		});
	});

	describe('configureExpress', () => {
		it('Should successfully configure an express app with no options and no middleware', () => {
			const app = makeApp();
			configureExpress(app);
			should(app).have.property('use');
		});
		it('Should successfully configure an express app with no middleware', () => {
			const app = makeApp();
			const options = { version: '1.1.1' };
			configureExpress(app, options);
			should(app).have.property('use');
		});

		it('Should successfully configure an express app with added middleware', () => {
			const app = makeApp();
			const options = { version: '1.1.1' };
			const middlewares = app => {
				should(app).have.property('use');
			};
			configureExpress(app, options, middlewares);
			should(app).have.property('use');
		});
	});

	describe('createApp', () => {
		let app;
		afterEach(() => {
			app.close();
		});

		it('Should successfully configure a http express app with no middleware', async () => {
			app = await createApp();
			await app.start();
			should(app.server).have.property('listen');
		});

		it('Should successfully configure a http express app with middleware', async () => {
			const myApp = express();
			const middlewares = app => {
				should(app).have.property('use');
			};
			app = await createApp(myApp, middlewares);
			await app.start();
			should(app.server).have.property('listen');
		});

		it('Should successfully configure a http express app with middleware', async () => {
			const myApp = express();
			const middlewares = app => {
				should(app).have.property('use');
			};
			const myOptions = {};
			app = await createApp(myApp, myOptions, middlewares);
			await app.start();
			should(app.server).have.property('listen');
		});

		it('Should successfully configure a http express app with middleware', async () => {
			const myApp = express();
			const middlewares = app => {
				should(app).have.property('use');
			};
			const myOptions = { tls: {} };
			app = await createApp(myApp, myOptions, middlewares);
			await app.start();
			should(app.server).have.property('listen');
		});

		it('Should successfully configure a http express app with middleware', async () => {
			const myApp = express();
			const middlewares = app => {
				should(app).have.property('use');
			};
			const myOptions = { tls: { key: 'key' } };
			app = await createApp(myApp, myOptions, middlewares);
			await app.start();
			should(app.server).have.property('listen');
		});

		it('Should successfully configure a https express app with middleware', async () => {
			const cert = `-----BEGIN CERTIFICATE-----
			MIIC3jCCAcagAwIBAgIJAJ2dp74JjAGKMA0GCSqGSIb3DQEBBQUAMB0xGzAZBgNV
			BAMTEnd3dy5mYWtlZG9tYWluLmNvbTAeFw0yMTExMTExMDMwMTdaFw0zMTExMDkx
			MDMwMTdaMB0xGzAZBgNVBAMTEnd3dy5mYWtlZG9tYWluLmNvbTCCASIwDQYJKoZI
			hvcNAQEBBQADggEPADCCAQoCggEBAMMfKbp9Q5db7zA5O5jvtNmRukSAZqGP+2Az
			RhXI0nRMSJUrUkKABugrv9tkeU+qvVB0/3lkdGhIsS0AwUoXgqyVLJapCKnwjK3v
			dmkzzLU7mWV20AFNdGCMvsyrpfRdmbnGSJB46p0tFJDSUzV8DjRHWuhndwcsNFIx
			GC9aXRNH+SNPr6RqcrSeQpvWb69DlXq1OKNqzsRn5Z3cILqBaZs94IbIwDv7iFw+
			cyBUtIlV0CBuFv5PeQbY8DyF6liuBCr8au3dPVTPM6EoGJ+H9XakDzhl8My8yGxS
			CtdKqd8VG6Wi+bI73zyRYz3o/ztnRlui6ETlpofFmi6WWjLEFHUCAwEAAaMhMB8w
			HQYDVR0RBBYwFIISd3d3LmZha2Vkb21haW4uY29tMA0GCSqGSIb3DQEBBQUAA4IB
			AQBttTkWTNKKO+veVtdWekNJtqus8946Wf4FMkZiVnqJEfu/J01adN2E2FHEJyRJ
			7KkR/SYscFwS8l+wWBMXlv0Y9hGlMeE3/tzPbumHUVu4RMfE2feLZnLboU4O14u4
			SVyG//a4fdOlc7WPFU57pn32di6sQmB7huGMrlpP4Pdri+dSD2i94VdkWa4Z646V
			sC2pKWg24oBjFVJOKRjCmD0CenjishBP7nkjSzDEzkhv19WRjgayFjlqe3vhGIPT
			FuaHOpY85TWShsxbkQZk8mJb1O5ldrecpj3TYQAbAymXyrF5s/1jCF3OmIp5C0ze
			Vxso2OZv7sb4rdB3TlM2ymlD
			-----END CERTIFICATE-----`;

			const key = `-----BEGIN RSA PRIVATE KEY-----
			MIIEpQIBAAKCAQEAwx8pun1Dl1vvMDk7mO+02ZG6RIBmoY/7YDNGFcjSdExIlStS
			QoAG6Cu/22R5T6q9UHT/eWR0aEixLQDBSheCrJUslqkIqfCMre92aTPMtTuZZXbQ
			AU10YIy+zKul9F2ZucZIkHjqnS0UkNJTNXwONEda6Gd3Byw0UjEYL1pdE0f5I0+v
			pGpytJ5Cm9Zvr0OVerU4o2rOxGflndwguoFpmz3ghsjAO/uIXD5zIFS0iVXQIG4W
			/k95BtjwPIXqWK4EKvxq7d09VM8zoSgYn4f1dqQPOGXwzLzIbFIK10qp3xUbpaL5
			sjvfPJFjPej/O2dGW6LoROWmh8WaLpZaMsQUdQIDAQABAoIBADT2d4AsUjV6eeFQ
			F7I6lo9b9AB2DeWazHPfVw3AtgdlUWpUGP79+2H3xhsKGbebM8nsCBBuSP6phJYf
			l1fCK/EmiLTYawadycHItw51RgKHi+qzpmBEIuu2KHArw18iLQD1Jms4tw4011k8
			DeP9qWldWPquYuuqfwU0WEk6MPtzWzraMtAuVprlIfUUxBPPlHSCM/ij4kaylD5q
			RXtDoCvCPNzluFH0RujCCuDIsvEYDe4xMVwfkSEA4U46SXmE2LN5uM8pRlhWKkPi
			pFwiqP2zOPNWUXxI3+ityVgdQFc4RSrBn3475EmGrIkIwEIihe/iD8N1iR9g0Swe
			bmM4Oh0CgYEA7z74AdvLCqW168O1DKelmZAXedXveh2czazm8j7DncRHpwvXGMfm
			N6KB+PPXkEX8BnSOmrzlGGOnGNdW3bo6FGpGFWts08Gin0nW27E4jRukO1Cjlg2y
			Yfv9J6PovYhJc1/BLV1v8svwVkfh+D5PBF/TqidXA35xt6PGxIUbkWcCgYEA0Mkq
			kXFIM1r3o48kx+MrfHDCQzc6cXfaLREzS1RWZ9iYtBMTiqXEOXgkpNhopybFOuGT
			/0BhZNiG/OzaUeKeNsC/0/MlxhmFOAXLTFjGHdHZz94oFh8nAapnP/6o9vA5AiEl
			ITJPdqTwzeAez6+eAYGo0vBWLET6mIQrALzGNcMCgYEAsd2bni4cxp6qIEyQhocA
			u6j/ewnND3mCgPqBfCmjXuB08MEBuh+rjUMY48/NPCp7kwUGnA3BOJ+ls/csUo3H
			7jOQRQ5niwrTbx8DSLN5upaJQ7vQ0pb+PpCMBfN67aWsDcVrpeFogBaUaGDqo5cX
			QcZIY6D5tNRFkOSGusXG2BMCgYEAsXXLEMRQshXn1sWcZanZFHRjKe6PZlKQxy2P
			g7+zkaCwap6sRXSQTKipvNOUYD679Ug3GwYFwkmosuI+zsrn33IFmolY2gBnEy8Z
			lVL/UelEUUJqoCLqbKgCCorR4tJcIks52/V/RUD8zIBqr+x9SJqEfIZ7ODWJKols
			Y7wQXTECgYEAnmVqADicvCDt+odEzDZTklPxWNg7QIzqpNO/I1BCRHdeIU+1r3cZ
			kYexKuCpFlnLId5DsMbDiR1GTpWLLq8A9qWbNioJI7uShkf1pp6RWPCVq6Oa/uvS
			7+6/GPfLO9hPa+g3NBQhb/g7nhmlLGaVRxYAF8Q3g7TX5aBvtqG1T2s=
			-----END RSA PRIVATE KEY-----`;

			const myApp = express();
			const middlewares = app => {
				should(app).have.property('use');
			};
			const myOptions = { tls: { key, cert } };
			app = await createApp(myApp, myOptions, middlewares);
			await app.start();
			should(app.server).have.property('listen');
		});
	});
});
