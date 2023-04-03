import { Container } from 'hostConfig';
import { FiberNode, FiberRootNode } from './fiber';
import { HostRoot } from './workTags';
import {
	createUpdate,
	createUpdateQueue,
	enqueueUpdate,
	UpdateQueue
} from './updateQueue';
import { ReactElementType } from 'shared/ReactTypes';
import { scheduleUpdateOnFiber } from './workLoop';

export function createContainer(container: Container) {
	/*
	 * 创建根节点的fiberNode 叫做 hostRootFiber，hostRootFiber的stateNode也就是他的原生dom 指向 fiberRootNode
	 *
	 */

	const hostRootFiber = new FiberNode(HostRoot, {}, null);
	const fiberRootNode = new FiberRootNode(container, hostRootFiber);

	// 创建更新队列
	hostRootFiber.updateQueue = createUpdateQueue();
}

export function updateContainer(
	element: ReactElementType,
	root: FiberRootNode
) {
	const hostRootFiber = root.current;
	const update = createUpdate<ReactElementType | null>(element);

	enqueueUpdate(
		hostRootFiber.updateQueue as UpdateQueue<ReactElementType | null>,
		update
	);
	scheduleUpdateOnFiber(hostRootFiber);
	return element;
}
