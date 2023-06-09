import { scheduleMicroTask } from 'hostConfig';
import { beginWork } from './beginWork';
import {
	commitHookEffectListCreate,
	commitHookEffectListDestory,
	commitHookEffectListUmount,
	commitMutationEffects
} from './commitWork';
import { completeWork } from './completeWork';
import {
	FiberNode,
	FiberRootNode,
	PendingPassiveEffect,
	createWorkInProgress
} from './fiber';
import { MutationMask, NoFlags, PassiveMask } from './fiberFlags';
import {
	Lane,
	NoLane,
	SyncLane,
	getHighestPriorityLane,
	markRootFinished,
	mergeLanes
} from './fiberLanes';
import { flushSyncCallbacks, scheduleSyncCallBack } from './syncTaskQueue';
import { HostRoot } from './workTags';
import {
	unstable_scheduleCallback as scheduleCallback,
	unstable_NormalPriority as NormalPriority
} from 'scheduler';
import { HookHasEffect, Passive } from './hookEffectTags';

let workInProgress: FiberNode | null = null;
let wipRootRenderLane: Lane = NoLane;
let rootDoesHasPassiveEffects = false;

function prepareFreshStack(root: FiberRootNode, lane: Lane) {
	workInProgress = createWorkInProgress(root.current, {});
	wipRootRenderLane = lane;
}

export function scheduleUpdateOnFiber(fiber: FiberNode, lane: Lane) {
	// TODO 调度功能

	//保证了是从根节点开始调度更新， 常见的触发更新的方式：如果是 ReactDOM.createRoot().render（或老版的ReactDOM.render）、 this.setState、 useState的dispatch方法
	const root = markUpdateFromFiberToRoot(fiber);
	markRootUpdated(root, lane);
	ensureRootIsScheduled(root);
}

// 调度阶段入口
function ensureRootIsScheduled(root: FiberRootNode) {
	const updateLane = getHighestPriorityLane(root.pendingLanes);
	if (updateLane === NoLane) {
		return;
	}
	if (updateLane === SyncLane) {
		//同步优先级 用微任务调度

		if (__DEV__) {
			console.log('在微任务调度');
		}
		scheduleSyncCallBack(performSyncWorkOnRoot.bind(null, root, updateLane));
		scheduleMicroTask(flushSyncCallbacks);
	} else {
		//其他优先级 用宏任务调度
	}
}

function markRootUpdated(root: FiberRootNode, lane: Lane) {
	root.pendingLanes = mergeLanes(root.pendingLanes, lane);
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

function performSyncWorkOnRoot(root: FiberRootNode, lane: Lane) {
	const nextLane = getHighestPriorityLane(root.pendingLanes);
	if (nextLane !== SyncLane) {
		//其他比SyncLane低的优先级；
		//NoLane
		ensureRootIsScheduled(root);
		return;
	}

	if (__DEV__) {
		console.warn('render阶段开始执行');
	}

	//初始化
	prepareFreshStack(root, lane);

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
	root.finishedLane = lane;
	wipRootRenderLane = NoLane;
	commitRoot(root);
}

function commitRoot(root: FiberRootNode) {
	const finishedWork = root.finishWorked;

	if (finishedWork === null) {
		return;
	}

	if (__DEV__) {
		console.warn('commit 阶段开始', finishedWork);
	}
	const lane = root.finishedLane;
	if (lane === NoLane && __DEV__) {
		console.error('commit 阶段finishedLane 不应该是NoLane');
	}

	root.finishWorked = null;
	root.finishedLane = NoLane;

	markRootFinished(root, lane);

	if (
		(finishedWork.flags & PassiveMask) !== NoFlags ||
		(finishedWork.subtreeFlags & PassiveMask) !== NoFlags
	) {
		if (!rootDoesHasPassiveEffects) {
			rootDoesHasPassiveEffects = true;
			//调度副作用
			scheduleCallback(NormalPriority, () => {
				// 执行副作用
				flushPassiveEffects(root.pendingPassiveEffects);

				return;
			});
		}
	}

	// 判断是否存在3个子阶段需要执行的操作
	// root flags root subtreeFlags
	const subTreeHasEffect =
		(finishedWork.subtreeFlags & MutationMask) != NoFlags;
	const rootHasEffect = (finishedWork.flags & MutationMask) != NoFlags;

	if (subTreeHasEffect || rootHasEffect) {
		//beForeMutation
		//mutation

		commitMutationEffects(finishedWork, root);
		root.current = finishedWork;

		//layout
	} else {
		root.current = finishedWork;
	}

	rootDoesHasPassiveEffects = false;
	ensureRootIsScheduled(root);
}

function flushPassiveEffects(pendingPassiveEffects: PendingPassiveEffect) {
	pendingPassiveEffects.unmount.forEach((effect) => {
		commitHookEffectListUmount(Passive, effect);
	});

	pendingPassiveEffects.unmount = [];

	pendingPassiveEffects.update.forEach((effect) => {
		commitHookEffectListDestory(Passive | HookHasEffect, effect);
	});

	pendingPassiveEffects.update.forEach((effect) => {
		commitHookEffectListCreate(Passive | HookHasEffect, effect);
	});

	pendingPassiveEffects.update = [];
	flushSyncCallbacks();
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
	const next = beginWork(fiber, wipRootRenderLane);
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
