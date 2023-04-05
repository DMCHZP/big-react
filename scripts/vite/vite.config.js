import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import replace from '@rollup/plugin-replace';
import { resolvePkgPath } from '../rollup/utils';
import path from 'path';
//vite 打包用的也是rollup ，插件都兼容
// https://vitejs.dev/config/
export default defineConfig({
	plugins: [react(), replace({ __DEV__: true, preventAssignment: true })],
	//配置别名，让import react 和react-dom指向我们的打包产物路径
	resolve: {
		alias: [
			{
				find: 'react',
				replacement: resolvePkgPath('react')
			},
			{
				find: 'react-dom',
				replacement: resolvePkgPath('react-dom')
			},
			{
				find: 'hostConfig',
				replacement: path.resolve(
					resolvePkgPath('react-dom'),
					'./src/hostConfig.ts'
				)
			}
		]
	}
});
