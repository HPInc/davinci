const fs = require('fs');

const errors = fs.readdirSync(__dirname);

errors.forEach(el => {
	if (el !== 'index.js') {
		const n = el.substring(0, el.indexOf('.'));
		module.exports[n] = require(`./${el}`);
	}
});
