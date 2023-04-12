import internals from 'shared/internals';
import { FiberNode } from './fiber';
import { Dispatcher, Dispatch } from 'react/src/currentDispathcer';
import {
	UpdateQueue,
	createUpdate,
	createUpdateQueue,
	enqueueUpdate,
	processUpdateQueue
} from './updateQueue';
import { Action } from 'shared/ReactTypes';
import { scheduleUpdateOnFiber } from './workLoop';

let currentlyRenderingFiber: FiberNode | null = null;
let workInProgressHook: Hook | null = null;
let currentHook: Hook | null = null;

const { currentDispathcer } = internals;

//hook 的 memoizeState 保存hook自身的状态数据
interface Hook {
	memoizeState: any;
	updateQueue: unknown;
	next: Hook | null;
}

export function renderWithHooks(wip: FiberNode) {
	//赋值操作
	currentlyRenderingFiber = wip;
	//重制hooks链表
	wip.memoizedState = null;

	const current = wip.alternate;

	if (current != null) {
		//update
		currentDispathcer.current = HooksDispathcerOnUpdate;
	} else {
		//mount
		currentDispathcer.current = HooksDispathcerOnMount;
	}

	//对于函数组件 函数就保存在 type
	const Component = wip.type;
	const props = wip.pendingProps;
	//这里执行函数组件就会执行组件内的hooks函数，同时函数返回的就是 react element
	const children = Component(props);

	//重制
	currentlyRenderingFiber = null;
	workInProgressHook = null;
	currentHook = null;

	return children;
}

const HooksDispathcerOnMount: Dispatcher = {
	useState: mountState
};

const HooksDispathcerOnUpdate: Dispatcher = {
	useState: updateState
};

function updateState<State>(): [State, Dispatch<State>] {
	//找到当前useState对应的hooks数据
	const hook = updateWorkInProgresHook();

	//计算新state的逻辑
	const queue = hook.updateQueue as UpdateQueue<State>;
	const pending = queue.shared.pending;

	if (pending != null) {
		const { memoizedState } = processUpdateQueue(hook.memoizeState, pending);
		hook.memoizeState = memoizedState;
	}

	//queue.dispatch 还是之前mountState 创建的 dispatch
	return [hook.memoizeState, queue.dispatch as Dispatch<State>];
}

function updateWorkInProgresHook(): Hook {
	// TODO:  render阶段出发的更新

	let nextCurrentHook: Hook | null;
	if (currentHook === null) {
		//这是 这个FC update时的第一个hook
		const current = currentlyRenderingFiber?.alternate;
		if (current != null) {
			nextCurrentHook = current.memoizedState;
		} else {
			nextCurrentHook = null;
		}
	} else {
		//这个FC update时 后续的hook
		nextCurrentHook = currentHook.next;
	}

	//这里就是为什么 hook 不能写在 if 的原因 , 上次记录最后一个hook的next为 null 如果，下一次update 发现
	if (nextCurrentHook === null) {
		//mount/update u1 u2 u3
		//update       u1 u2 u3 u4
		throw new Error(
			`组件 ${currentlyRenderingFiber?.type}本次执行时的hooks，比上次执行的多`
		);
	}

	currentHook = nextCurrentHook as Hook;

	const newHook: Hook = {
		memoizeState: currentHook.memoizeState,
		updateQueue: currentHook.updateQueue,
		next: null
	};
	if (workInProgressHook === null) {
		//mount时第一个hook
		if (currentlyRenderingFiber === null) {
			throw new Error('请在函数组件内调用hook');
		} else {
			workInProgressHook = newHook;
			currentlyRenderingFiber.memoizedState = workInProgressHook;
		}
	} else {
		//mount时 后续的hoo k
		workInProgressHook.next = newHook;
		workInProgressHook = newHook;
	}
	return workInProgressHook;
}

function mountState<State>(
	initialState: (() => State) | State
): [State, Dispatch<State>] {
	//找到当前useState对应的hooks数据
	const hook = mountWorkInProgresHook();
	let memoizedState;
	if (initialState instanceof Function) {
		memoizedState = initialState();
	} else {
		memoizedState = initialState;
	}

	const queue = createUpdateQueue<State>();
	hook.updateQueue = queue;
	hook.memoizeState = memoizedState;

	//@ts-ignore
	const dispatch = dispatchSetState.bind(null, currentlyRenderingFiber, queue);
	queue.dispatch = dispatch;
	return [memoizedState, dispatch];
}

function dispatchSetState<State>(
	fiber: FiberNode,
	updateQueue: UpdateQueue<State>,
	action: Action<State>
) {
	const update = createUpdate(action);
	enqueueUpdate(updateQueue, update);
	//对于hooks更新来说，是从当前hooks对应的fiber开始的
	scheduleUpdateOnFiber(fiber);
}

function mountWorkInProgresHook(): Hook {
	const hook: Hook = {
		memoizeState: null,
		next: null,
		updateQueue: null
	};
	if (workInProgressHook === null) {
		//mount时第一个hook
		if (currentlyRenderingFiber === null) {
			throw new Error('请在函数组件内调用hook');
		} else {
			workInProgressHook = hook;
			currentlyRenderingFiber.memoizedState = workInProgressHook;
		}
	} else {
		//mount时 后续的hook
		workInProgressHook.next = hook;
		workInProgressHook = hook;
	}
	return workInProgressHook;
}
