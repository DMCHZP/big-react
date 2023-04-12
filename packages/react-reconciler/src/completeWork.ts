import {
	Instance,
	appendInitialChild,
	createInstance,
	createTextInstance
} from 'hostConfig';
import { FiberNode } from './fiber';
import {
	FunctionComponent,
	HostComponent,
	HostRoot,
	HostText
} from './workTags';
import { NoFlags, Update } from './fiberFlags';
import { updateFiberProps } from 'react-dom/src/SyntheticEvent';

export const completeWork = (wip: FiberNode) => {
	//ccc
	const nextProps = wip.pendingProps;
	const current = wip.alternate;

	switch (wip.tag) {
		case HostComponent:
			if (current != null && wip.stateNode) {
				//update
				//如果 存在缓存 fiberNode 并且存在 stateNode 也就是真实dom节点，就是更新阶段
				//1. props 是否变化
				//2. Update flag
				updateFiberProps(wip.stateNode, nextProps);
			} else {
				//1. 构建DOM （创建当前fiberNode 对应的真实dom）
				//const instance = createInstance(wip.type, nextProps);
				const instance = createInstance(wip.type, nextProps);
				//2. 将Dom插入到Dom树 （递归遍历找到当前fiberNode下所有 对应有 HostComponent 的节点（包括子节点和兄弟节点），并且append到上面 instance dom中 ）
				appendAllChildren(instance, wip);
				wip.stateNode = instance;
			}
			bubbleProperties(wip);
			return null;
		case HostText:
			if (current != null && wip.stateNode) {
				//如果 存在缓存 fiberNode 并且存在 stateNode 也就是真实dom节点，就是更新阶段
				const oldText = current.memoizedProps.content;
				const nextText = nextProps.content;
				if (oldText != nextText) {
					markUpdate(wip);
				}
			} else {
				//1. 构建DOM
				const instance = createTextInstance(nextProps.content);
				wip.stateNode = instance;
			}
			bubbleProperties(wip);
			return null;
		case HostRoot:
			bubbleProperties(wip);
			return null;
		case FunctionComponent:
			bubbleProperties(wip);
			return null;
		default:
			if (__DEV__) {
				console.warn('未处理的completeWork情况', wip);
			}
	}
};

function markUpdate(fiber: FiberNode) {
	fiber.flags |= Update;
}

// function A(){
// 	return <div></div>
// }
// <h3><A/></h3>
//对于以上例子 A的 fiberNode 要插入h3 实际上应该是 A 的子fiberNode div dom 插入到 h3中
//作用：递归遍历当 前fiberNode下所有的子节点，把各个子节点的dom插入到当前fiber对应的dom中
function appendAllChildren(parent: Instance, wip: FiberNode) {
	// 为什么要拿 wip.child？假设当前wip 是<div><p>111</p><p>222</p></div> div就是当前的为 hostComponent 的fiberNode ，
	// 这个方法的目的就是递归遍历（子节点）找到当前fiberNode 下所有 HostComponent或HostText 并且把他们 插入到 parent dom（当前fiberNode 对应的真实dom）中
	let node = wip.child;
	while (node != null) {
		if (node?.tag === HostComponent || node?.tag === HostText) {
			appendInitialChild(parent, node.stateNode);
		} else if (node.child != null) {
			//这个种情况相当于  <div><A/><p>222</p></div> 中的 A组件 ，然后找到 A组件child为 HostComponment
			node.child.return = node;
			node = node.child;
			continue;
		}
		if (node === wip) {
			return;
		}

		//
		while (node.sibling === null) {
			if (node.return === null || node.return === wip) {
				return;
			}
			//归阶段
			node = node.return;
		}
		//appendInitialChild 后还要处理兄弟节点
		node.sibling.return = node.return;
		node = node.sibling;
	}
}

//flags 冒泡，当前fiberNode 的 subtreeFlags 会包含它所有子节点的flags
function bubbleProperties(wip: FiberNode) {
	let subtreeFlags = NoFlags;
	let child = wip.child;
	while (child !== null) {
		subtreeFlags |= child.subtreeFlags;
		subtreeFlags |= child.flags;

		child.return = wip;
		child = child.sibling;
	}
	wip.subtreeFlags |= subtreeFlags;
}
