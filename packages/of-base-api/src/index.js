const express = require('express');
const compression = require('compression');
const bodyParser = require('body-parser');
const requireDir = require('require-dir');
const _ = require('lodash');
const path = require('path');
const Promise = require('bluebird');
const docs = require('./openapi.docs');
const errorHandler = require('./middleware/error-handler');

const boot = (...args) => {
	let app = args[0];
	let options = args[1];
	let callback = args[2];

	const PORT = process.env.PORT || 3000;

	if (args.length === 1) {
		callback = app;
		app = express();
	} else if (args.length === 2) {
		callback = typeof options === 'function' ? options : (callback || (() => app));
		options = {};
	}

	const execBootScripts = () => {
		const bootDirPath = path.join(
			path.dirname(process.argv[1]),
			'boot'
		);

		const bootScripts = _.values(requireDir(bootDirPath));
		return Promise.map(bootScripts, script => {
			if (typeof script === 'function') return script(app);
			return false;
		});
	};

	const configure = async () => {
		app.use(compression());
		app.use(bodyParser.json());
		app.use(bodyParser.urlencoded({ extended: true }));
		process.nextTick(() => {
			app.use(errorHandler());
			docs.explorer(app, {
				discoveryUrl: '/api-doc.json',
				version: '1.0',  // read from package.json
				basePath: '/api'
			});
		});

		await execBootScripts();
		app.listen(PORT, () => console.log(`Example app listening on port ${PORT}!`));
		return app;
	};

	if (typeof callback === 'function') {
		configure();
		return callback.call(app, app);
	}

	return configure();
};

module.exports = boot;
