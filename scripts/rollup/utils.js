import path from 'path';
import fs from 'fs';
import ts from 'rollup-plugin-typescript2';
import cjs from '@rollup/plugin-commonjs';

const pkgPath = path.resolve(__dirname, '../../packages');
const distPaht = path.resolve(__dirname, '../../dist/node_modules');

export function resolvePkgPath(pgkName, isDist) {
	if (isDist) {
		return `${distPaht}/${pgkName}`;
	}
	return `${pkgPath}/${pgkName}`;
}

export function getPackageJSON(pgkName) {
	const path = `${resolvePkgPath(pgkName)}/package.json`;
	const str = fs.readFileSync(path, { encoding: 'utf-8' });
	return JSON.parse(str);
}

export function getBaseRollupPlugins({ typescript = {} } = {}) {
	return [cjs(), ts(typescript)];
}
