import { beginWork } from './beginWork';
import { FiberNode, FiberRootNode, createWorkInProgress } from './fiber';
import { HostRoot } from './workTags';

let workInProgress: FiberNode | null = null;

function prepareFreshStack(root: FiberRootNode) {
	workInProgress = createWorkInProgress(root.current, {});
}

export function scheduleUpdateOnFiber(fiber: FiberNode) {
	//调度功能

	//保证了是从根节点开始调度更新， 常见的触发更新的方式：如果是 ReactDOM.createRoot().render（或老版的ReactDOM.render）、 this.setState、 useState的dispatch方法
	const root = markUpdateFromFiberToRoot(fiber);
}

//调用 setState 时候会从当前fiber 向上遍历到根节点 ， 该方法是获取根节点fiberNode
export function markUpdateFromFiberToRoot(fiber: FiberNode) {
	let node = fiber;
	let parent = node.return;
	while (parent != null) {
		node = parent;
		parent = parent.return;
	}
	if (node.tag === HostRoot) {
		return node.stateNode;
	}
	return null;
}

function renderRoot(root: FiberRootNode) {
	prepareFreshStack(root);

	do {
		try {
			workLoop();
		} catch (err) {
			if (__DEV__) {
				console.warn('error !');
			}
			workInProgress = null;
		}
	} while (true);
}

function workLoop() {
	while (workInProgress != null) {
		performanceUnitOfWork(workInProgress);
	}
}

function performanceUnitOfWork(fiber: FiberNode) {
	//next 是当前fiber的子节点
	const next = beginWork(fiber);
	//这里fiber 完成后，所有pendingProps已经准备好，就可以赋值给memoizedProps
	fiber.memoizedProps = fiber.pendingProps;

	if (next === null) {
		completeUnitOfWork(fiber);
	} else {
		workInProgress = next;
	}
}

function completeUnitOfWork(fiber: FiberNode) {
	let node: FiberNode | null = fiber;
	do {
		completeWork(fiber);
		const sibling = node.sibling;
		if (sibling !== null) {
			workInProgress = sibling;
			return;
		}
		node = node?.return;
		workInProgress = node;
	} while (node != null);
}
