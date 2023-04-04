import { ReactElementType } from 'shared/ReactTypes';
import { FiberNode } from './fiber';
import { UpdateQueue, processUpdateQueue } from './updateQueue';
import {
	FunctionComponent,
	HostRoot,
	HostText,
	HostComponent
} from './workTags';
import { mountChildFiber, reconcilerChildFiber } from './childFibers';

//递归中的递阶段
export const beginWork = (wip: FiberNode) => {
	//比较 react element 和 fiberNode，返回子fiberNode
	switch (wip.tag) {
		case HostRoot:
			//1. 对于 根结点的fiberNode 要做两件事 1. 计算状态的最新值 2.创造子fiberNode
			return updateHostRoot(wip);
		case HostComponent:
			//1.创造子fiberNode
			return updateHostComponent(wip);
		case HostText:
			return null;
		default:
			if (__DEV__) {
				console.warn('beginWork 未实现类型');
			}
	}
	return null;
};

function updateHostRoot(wip: FiberNode) {
	const baseState = wip.memoizedState;
	const updateQueue = wip.updateQueue as UpdateQueue<Element>;
	const pending = updateQueue.shared.pending;
	updateQueue.shared.pending = null;
	//对于根节点fiberNode 的 updateQueue.shared.pending; 是一个 reactElement

	//就我们的应用是<div id="app"><App/></div>，hostRootFiber对应的是div，他的子元素对应的是App，但是App这个ReactElement被传给hostRootFiber作为memoizedState，hostRootFiber根据这个memoizedState来生成子FiberNode
	const { memoizedState } = processUpdateQueue(baseState, pending);
	wip.memoizedState = memoizedState;
	//这里 memoizedState 是一个 reactElement
	const nextChildren = wip.memoizedState;
	reconcileChildren(wip, nextChildren);
	return wip.child;
}

function updateHostComponent(wip: FiberNode) {
	const nextProps = wip.pendingProps;
	const nextChildren = nextProps.children;
	reconcileChildren(wip, nextChildren);
	return wip.child;
}

function reconcileChildren(wip: FiberNode, children?: ReactElementType) {
	const current = wip.alternate;
	if (current != null) {
		//update
		wip.child = reconcilerChildFiber(wip, current?.child, children);
	} else {
		//mount
		wip.child = mountChildFiber(wip, null, children);
	}
}
