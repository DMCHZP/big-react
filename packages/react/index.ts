import currentDispathcer, {
	Dispatcher,
	resolveDispatcher
} from './src/currentDispathcer';
import {
	createElement as createElementFn,
	isValidElement as isValidElementFn
} from './src/jsx';

export { REACT_FRAGMENT_TYPE as Fragment } from 'shared/ReactSymbols';

export const useState: Dispatcher['useState'] = (initialState: any) => {
	const dispatcher = resolveDispatcher();
	return dispatcher.useState(initialState);
};

export const useEffect: Dispatcher['useEffect'] = (create, deps) => {
	const dispatcher = resolveDispatcher();
	return dispatcher.useEffect(create, deps);
};

//内部数据共享层
export const __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = {
	currentDispathcer
};

export const version = '0.0.0';
// //TODO 根据环境区分
// export const createElement = jsx;
// export { isValidElement } from './src/jsx';

// TODO 根据环境区分使用jsx/jsxDEV
export const createElement = createElementFn;
export const isValidElement = isValidElementFn;

// export default {
// 	version: '0.0.0',
// 	createElement: jsxDEV
// };
