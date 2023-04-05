import { Container, appendChildToContainer } from 'hostConfig';
import { FiberNode, FiberRootNode } from './fiber';
import { MutationMask, NoFlags, Placement } from './fiberFlags';
import { HostComponent, HostRoot, HostText } from './workTags';

let nextEffect: FiberNode | null = null;

// 相当于beginWork CompleteWork 那样从finishedWork（也就是 hostRootFiber ）递归遍历
export const commitMutationEffects = (finishedWork: FiberNode) => {
	nextEffect = finishedWork;
	while (nextEffect != null) {
		const child: FiberNode | null = nextEffect.child;
		if ((nextEffect.subtreeFlags & MutationMask) != NoFlags && child != null) {
			nextEffect = child;
		} else {
			while (nextEffect != null) {
				//向下遍历到第一个没有subtreeFlags的fiber节点 ，然后执行effect
				commitMutationEffectsOnFiber(nextEffect);
				//指向兄弟节点，然后重复以上过程
				const sibling: FiberNode | null = nextEffect.sibling;
				if (sibling != null) {
					nextEffect = sibling;
					break;
				}
				//处理完之后向上遍历处理
				nextEffect = nextEffect.return;
			}
		}
	}
};

const commitMutationEffectsOnFiber = (finishedWork: FiberNode) => {
	const flags = finishedWork.flags;

	if ((flags & Placement) !== NoFlags) {
		commitPlacement(finishedWork);
		//位运算，移除该flags
		finishedWork.flags &= ~Placement;
	}
};

//提交插入操作的effecct
const commitPlacement = (finishedWork: FiberNode) => {
	//parent Dom

	if (__DEV__) {
		console.warn('执行Placement操作', finishedWork);
	}
	//获取当前fiber HostParent ：比如当前fiber是 <A/> :<p>1</p> ｜ <div><A/><div> ｜ 这种情况 HostParent 就是 div

	const hostParent = getHostParent(finishedWork);
	if (hostParent != null) {
		// 把当前fiber的dom 插入到 hostParent （注意当前 fiber 可能不是一个 HostComponent）（）
		appendPlacementNodeIntoContainer(finishedWork, hostParent);
	}
};

//获取当前fiber ,最近的HostComponent
function getHostParent(fiber: FiberNode): Container | null {
	let parent = fiber.return;
	while (parent) {
		const parentTag = parent.tag;
		if (parentTag === HostComponent) {
			return parent.stateNode as Container;
		}
		if (parentTag === HostRoot) {
			return (parent.stateNode as FiberRootNode).container;
		}
		parent = parent.return;
	}
	if (__DEV__) {
		console.warn('未找到HostParent');
	}
	return null;
}

function appendPlacementNodeIntoContainer(
	finishedWork: FiberNode,
	hostParent: Container
) {
	//当前fiberNode 为HostComponent或者 HostText 才能进行dom的插入
	if (finishedWork.tag === HostComponent || finishedWork.tag === HostText) {
		appendChildToContainer(hostParent, finishedWork.stateNode);
		return;
	}
	const child = finishedWork.child;
	if (child != null) {
		//递归继续寻找
		appendPlacementNodeIntoContainer(child, hostParent);
		//继续寻找兄弟节点
		let sibling = child.sibling;
		while (sibling != null) {
			appendPlacementNodeIntoContainer(sibling, hostParent);
			sibling = sibling.sibling;
		}
	}
}