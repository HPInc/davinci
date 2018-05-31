const debug = require('debug')('of-base-api');
const requireDir = require('require-dir');
const _ = require('lodash');
const path = require('path');
const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));

const checkAndAssignBootDir = options => {

	// create an array of boot paths
	const paths = [];

	// start with the bootDirPath passed in
	if (options && options.bootDirPath) {
		paths.push(path.join(process.cwd(), options.bootDirPath));
	}
	// add some standard paths
	paths.push(path.join(process.cwd(), 'boot'));
	paths.push(path.join(process.cwd(), 'src/boot'));

	// find only the valid folders that exist
	const validBootPath = paths.find(testPath => {
		if (!fs.existsSync(testPath)) return false;
		const stats = fs.statSync(testPath);
		if (stats.isDirectory()) return true;
		return false;
	});

	return validBootPath;
};

const execBootScripts = (app, options) => {

	debug('Executing Boot Scripts');

	const bootDirPath = checkAndAssignBootDir(options);

	// no valid boot path so do nothing
	if (!bootDirPath) return false;

	debug('Boot Folder ', bootDirPath);

	// found some valid scripts (ignore not functions)
	const scripts = requireDir(bootDirPath);

	const bootScripts = _.values(scripts).filter((s, i) => {
		debug('Checking Scripts', i);
		return (typeof s === 'function' || typeof s.default === 'function');
	});

	// execute them
	return Promise.map(bootScripts, (script, i) => {
		debug(`Executing script ${i}`);
		if (script.default) {
			return script.default(app);
		}
		return script(app);
	});
};

module.exports = {
	checkAndAssignBootDir,
	execBootScripts
};
