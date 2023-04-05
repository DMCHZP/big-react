import { FiberNode } from './fiber';

export function renderWithHooks(wip: FiberNode) {
	//对于函数组件 函数就保存在 type
	const Component = wip.type;
	const props = wip.pendingProps;
	const children = Component(props);
	return children;
}
