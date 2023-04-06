import currentDispathcer, {
	Dispatcher,
	resolveDispatcher
} from './src/currentDispathcer';
import { jsx, jsxDEV } from './src/jsx';

export const useState: Dispatcher['useState'] = (initialState: any) => {
	const dispatcher = resolveDispatcher();
	return dispatcher.useState(initialState);
};

//内部数据共享层
export const __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = {
	currentDispathcer
};

export const version = '0.0.0';
//TODO 根据环境区分
export const createElement = jsx;
export { isValidElement } from './src/jsx';

// export default {
// 	version: '0.0.0',
// 	createElement: jsxDEV
// };
