/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import path from 'path';
import TerserPlugin from 'terser-webpack-plugin';
import { Configuration } from 'webpack';

const isProduction = true || process.env.NODE_ENV == 'production';

const config: Configuration = {
	entry: './src/index.ts',
	output: {
		path: path.resolve(__dirname, 'dist'),
		filename: 'index.js'
	},
	target: 'node',
	devtool: isProduction ? 'source-map' : null,
	node: {
		global: false,
		__filename: false,
		__dirname: false
	},
	module: {
		rules: [
			{
				test: /\.(ts|tsx)$/i,
				loader: 'ts-loader',
				exclude: ['/node_modules/']
			}
		]
	},
	resolve: {
		extensions: ['.tsx', '.ts', '.jsx', '.js'],
		alias: {
			tsyringe: require.resolve('tsyringe/dist/esm2015/index.js')
		}
	},
	optimization: {
		minimize: true,
		minimizer: [
			new TerserPlugin({
				parallel: true,
				terserOptions: {
					mangle: false,
					keep_classnames: true,
					keep_fnames: true
					// https://github.com/webpack-contrib/terser-webpack-plugin#terseroptions
				}
			})
		]
	}
};

module.exports = () => {
	if (isProduction) {
		config.mode = 'production';
	} else {
		config.mode = 'development';
	}
	return config;
};
