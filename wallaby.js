module.exports = function () {
	return {
		files: [
			'index.js',
			'test/support/**/*.js',
			'test/unit/boot/*.js',
			'src/**/*.js'
		],

		tests: [
			'test/**/*.test.js'
		],

		env: {
			type: 'node'
		},

		workers: {
			initial: 1,
			regular: 1,
			recycle: true
		},

		setup: function () {
			require('./test/support/env.js');
		}
	};
};
