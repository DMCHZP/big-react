import { beginWork } from './beginWork';
import { commitMutationEffects } from './commitWork';
import { completeWork } from './completeWork';
import { FiberNode, FiberRootNode, createWorkInProgress } from './fiber';
import { MutationMask, NoFlags } from './fiberFlags';
import { HostRoot } from './workTags';

let workInProgress: FiberNode | null = null;

function prepareFreshStack(root: FiberRootNode) {
	workInProgress = createWorkInProgress(root.current, {});
}

export function scheduleUpdateOnFiber(fiber: FiberNode) {
	// TODO 调度功能

	//保证了是从根节点开始调度更新， 常见的触发更新的方式：如果是 ReactDOM.createRoot().render（或老版的ReactDOM.render）、 this.setState、 useState的dispatch方法
	const root = markUpdateFromFiberToRoot(fiber);
	renderRoot(root);
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
			break;
		} catch (err) {
			if (__DEV__) {
				console.warn('workLoop发生错误', err);
			}
			workInProgress = null;
		}
	} while (true);

	const finishedWork = root.current.alternate;
	root.finishWorked = finishedWork;
	commitRoot(root);
}

function commitRoot(root: FiberRootNode) {
	const finishedWork = root.finishWorked;

	if (finishedWork === null) {
		return;
	}

	if (__DEV__) {
		console.log('commit 阶段开始', finishedWork);
	}

	root.finishWorked = null;

	// 判断是否存在3个子阶段需要执行的操作
	// root flags root subtreeFlags
	const subTreeHasEffect =
		(finishedWork.subtreeFlags & MutationMask) != NoFlags;
	const rootHasEffect = (finishedWork.flags & MutationMask) != NoFlags;

	if (subTreeHasEffect || rootHasEffect) {
		//beForeMutation
		//mutation

		commitMutationEffects(finishedWork);
		root.current = finishedWork;

		//layout
	} else {
		root.current = finishedWork;
	}
}

function workLoop() {
	while (workInProgress != null) {
		performanceUnitOfWork(workInProgress);
	}
}

// function App(){
// 	return (
// 		<div>
// 			Hello
// 			<span></span>
// 		</div>
// 	)
// }
//1.HostRootFiber beginWork (生成App FiberNode)
//2.App FiberNode beginWork (生成 div FiberNode)
//3.Div FiberNode beginWork (生成 Hello 、Span fiberNode)
//4.“Hello” fiberNode beginWork （叶子节点）(HostText)
//5.“Hello” fiberNode completeWork (HostText)
//6.span fiberNode beginWork (HostComponent)
//7.span fiberNode completeWork
//8.Div fiberNode completeWork
//9.App fiberNode completeWork
//10.HostRootFiber fiberNode completeWork

function performanceUnitOfWork(fiber: FiberNode) {
	//beginWork 会根据当前 fiberNode 创建出他第一个child的fiberNode ，next 是当前fiberNode的子fiberNode

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
		completeWork(node);
		const sibling = node.sibling;
		if (sibling !== null) {
			workInProgress = sibling;
			return;
		}
		node = node?.return;
		workInProgress = node;
	} while (node != null);
}
