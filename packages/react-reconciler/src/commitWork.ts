import {
	Container,
	Instance,
	appendChildToContainer,
	commitUpdate,
	insertChildToContainer,
	removeChild
} from 'hostConfig';
import { FiberNode, FiberRootNode } from './fiber';
import {
	ChildDeletion,
	MutationMask,
	NoFlags,
	Placement,
	Update
} from './fiberFlags';
import {
	FunctionComponent,
	HostComponent,
	HostRoot,
	HostText
} from './workTags';

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
	if ((flags & Update) !== NoFlags) {
		commitUpdate(finishedWork);
		//位运算，移除该flags
		finishedWork.flags &= ~Update;
	}
	if ((flags & ChildDeletion) !== NoFlags) {
		const deletions = finishedWork.deletions;
		if (deletions != null) {
			deletions.forEach((childToDeletion) => {
				commitDeletion(childToDeletion);
			});
		}
		//位运算，移除该flags
		finishedWork.flags &= ~ChildDeletion;
	}
};

function recordHostChildrenToDelete(
	childrenToDelete: FiberNode[],
	unmountFiber: FiberNode
) {
	//1. 找到第一个root host 节点
	const lastOne = childrenToDelete[childrenToDelete.length - 1];
	if (!lastOne) {
		childrenToDelete.push(unmountFiber);
	} else {
		let node = lastOne.sibling;
		while (node != null) {
			if (unmountFiber === node) {
				childrenToDelete.push(unmountFiber);
			}
			node = node.sibling;
		}
	}
	//2.每找到第一个host节点，判断一下这个节点是不是 1 找到的那个节点的兄弟节点
}

function commitDeletion(childToDelete: FiberNode) {
	const rootChildrenToDelete: FiberNode[] = [];
	//递归子树
	commitNestedComponent(childToDelete, (unmountFiber) => {
		switch (unmountFiber.tag) {
			case HostComponent:
				recordHostChildrenToDelete(rootChildrenToDelete, unmountFiber);
				//TODO 解绑ref
				break;
			case HostText:
				recordHostChildrenToDelete(rootChildrenToDelete, unmountFiber);
				break;
			case FunctionComponent:
				//TODO useEffect unMount
				return;
			default:
				if (__DEV__) {
					console.warn('未处理的unmount类型', childToDelete);
				}
		}
	});
	//移除rootHostNode 的DOM
	if (rootChildrenToDelete.length) {
		const hostParent = getHostParent(childToDelete);
		if (hostParent != null) {
			rootChildrenToDelete.forEach((node) => {
				removeChild(node.stateNode, hostParent);
			});
		}
	}
	childToDelete.return = null;
	childToDelete.child = null;
}

//递归遍历 执行整棵树 的Unmount 操作
function commitNestedComponent(
	root: FiberNode,
	onCommitUnmount: (fiber: FiberNode) => void
) {
	let node = root;
	while (true) {
		onCommitUnmount(node);
		if (node.child != null) {
			node.child.return = node;
			node = node.child;
			continue;
		}

		if (node === root) {
			return;
		}

		while (node.sibling === null) {
			if (node.return === null || node.return === root) {
				return;
			}

			//向上归
			node = node.return;
		}
		node.sibling.return = node.return;
		node = node.sibling;
	}
}

//提交  插入/移动  操作的effecct
const commitPlacement = (finishedWork: FiberNode) => {
	if (__DEV__) {
		console.warn('执行Placement操作', finishedWork);
	}
	//获取当前fiber HostParent ：比如当前fiber是 <A/> :<p>1</p> ｜ <div><A/><div> ｜ 这种情况 HostParent 就是 div
	//parent Dom
	const hostParent = getHostParent(finishedWork);

	const sibling = getHostSibling(finishedWork);

	if (hostParent != null) {
		// 把当前fiber的dom 插入到 hostParent （注意当前 fiber 可能不是一个 HostComponent）（）
		insertOrAppendPlacementNodeIntoContainer(finishedWork, hostParent, sibling);
	}
};

function getHostSibling(fiber: FiberNode) {
	let node: FiberNode = fiber;

	findSibling: while (true) {
		while (node.sibling === null) {
			const parent = node.return;
			if (
				parent === null ||
				parent.tag === HostComponent ||
				parent.tag === HostRoot
			) {
				return null;
			}
			node = parent;
		}
		node.sibling.return = node.return;
		node = node.sibling;

		while (node.tag !== HostText && node.tag !== HostComponent) {
			// 向下便利
			if ((node.flags & Placement) != NoFlags) {
				continue findSibling;
			}
			if (node.child === null) {
				continue findSibling;
			} else {
				node.child.return = node;
				node = node.child;
			}
		}
		if ((node.flags & Placement) === NoFlags) {
			return node.stateNode;
		}
	}
}

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

function insertOrAppendPlacementNodeIntoContainer(
	finishedWork: FiberNode,
	hostParent: Container,
	before?: Instance
) {
	//当前fiberNode 为HostComponent或者 HostText 才能进行dom的插入
	if (finishedWork.tag === HostComponent || finishedWork.tag === HostText) {
		if (before) {
			insertChildToContainer(finishedWork.stateNode, hostParent, before);
		} else {
			appendChildToContainer(hostParent, finishedWork.stateNode);
		}
		return;
	}
	const child = finishedWork.child;
	if (child != null) {
		//递归继续寻找
		insertOrAppendPlacementNodeIntoContainer(child, hostParent);
		//继续寻找兄弟节点
		let sibling = child.sibling;
		while (sibling != null) {
			insertOrAppendPlacementNodeIntoContainer(sibling, hostParent);
			sibling = sibling.sibling;
		}
	}
}
