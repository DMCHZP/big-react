import { Props, Key, ReactElementType } from 'shared/ReactTypes';
import {
	FunctionComponent,
	HostComponent,
	WorkTag,
	Fragment
} from './workTags';
import { Flags, NoFlags } from './fiberFlags';
import { Container } from 'hostConfig';
import { Lane, Lanes, NoLane, NoLanes } from './fiberLanes';

export class FiberNode {
	type: any;
	tag: WorkTag;
	key: Key;
	stateNode: any;
	pendingProps: Props;
	return: FiberNode | null;
	sibling: FiberNode | null;
	child: FiberNode | null;
	index: number;
	ref: any;
	alternate: FiberNode | null;
	flags: Flags;
	subtreeFlags: Flags;
	memoizedProps: Props;
	memoizedState: any;
	updateQueue: any;
	deletions: FiberNode[] | null;
	constructor(tag: WorkTag, pendingProps: Props, key: Key) {
		this.tag = tag;
		this.key = key || null;
		//真实dom结构
		this.stateNode = null;

		//节点类型比如 FunctionComponment
		this.type = null;

		//构成树状结构
		//指向父fiber
		this.return = null;
		this.sibling = null;
		this.child = null;
		//多节点中的索引位置
		this.index = 0;

		this.ref = null;

		//作为工作单元
		this.pendingProps = pendingProps;
		this.memoizedProps = null;
		this.memoizedState = null;
		this.updateQueue = null;

		this.alternate = null;
		//副作用
		this.flags = NoFlags;
		this.subtreeFlags = NoFlags;
		this.deletions = null;
	}
}

// 根结点的 FiberNode 原生dom 对象
export class FiberRootNode {
	container: Container;
	current: FiberNode;
	finishWorked: FiberNode | null;
	pendingLanes: Lanes;
	finishedLane: Lane;
	constructor(container: Container, hostRootFiber: FiberNode) {
		this.container = container;
		//FiberRootNode 的 current 指向 hostRootFiber (跟节点的 fiberNode 对象)
		this.current = hostRootFiber;
		//根结点的 FiberNode 的 stateNode 指向当前 FiberRootNode
		hostRootFiber.stateNode = this;
		this.finishWorked = null;
		this.pendingLanes = NoLanes;
		this.finishedLane = NoLane;
	}
}

export const createWorkInProgress = (
	current: FiberNode,
	pendingProps: Props
) => {
	// 获取fiber的缓存fiber
	let wip = current.alternate;
	if (wip === null) {
		//如果为空 就是 mount 阶段
		wip = new FiberNode(current.tag, pendingProps, current.key);
		wip.stateNode = current.stateNode;

		wip.alternate = current;
		current.alternate = wip;
	} else {
		//不为空就是 update 阶段
		wip.pendingProps = pendingProps;
		wip.flags = NoFlags;
		wip.subtreeFlags = NoFlags;
		wip.deletions = null;
	}

	wip.type = current.type;
	wip.updateQueue = current.updateQueue;
	wip.child = current.child;
	wip.memoizedProps = current.memoizedProps;
	wip.memoizedState = current.memoizedState;

	return wip;
};

export function createFiberFromElement(element: ReactElementType): FiberNode {
	const { type, key, props } = element;
	let fiberTag: WorkTag = FunctionComponent;
	if (typeof type === 'string') {
		//<div/> type:'div'
		fiberTag = HostComponent;
	} else if (typeof type !== 'function' && __DEV__) {
		console.warn('未定义的type类型');
	}
	const fiber = new FiberNode(fiberTag, props, key);
	fiber.type = type;
	return fiber;
}

export function createFiberFromFragment(elements: any[], key: Key): FiberNode {
	const fiber = new FiberNode(Fragment, elements, key);
	return fiber;
}
