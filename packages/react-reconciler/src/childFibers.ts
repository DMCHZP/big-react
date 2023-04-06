import { Props, ReactElementType } from 'shared/ReactTypes';
import {
	FiberNode,
	createFiberFromElement,
	createWorkInProgress
} from './fiber';
import { REACT_ELEMENT_TYPE } from 'shared/ReactSymbols';
import { HostText } from './workTags';
import { ChildDeletion, Placement } from './fiberFlags';

function ChildReconciler(shouldTrackEffects: boolean) {
	function deleteChild(returnFiber: FiberNode, childToDelete: FiberNode) {
		if (!shouldTrackEffects) {
			return;
		}
		const deletions = returnFiber.deletions;
		if (deletions === null) {
			returnFiber.deletions = [childToDelete];
			returnFiber.flags |= ChildDeletion;
		} else {
			returnFiber.deletions?.push(childToDelete);
		}
	}
	function reconileSingleElement(
		returnFiber: FiberNode, // wip fiberNode
		currentFiber: FiberNode | null, //wip.child fiberNode
		element: ReactElementType //wip对应的child reactElement
	) {
		const key = element.key;

		work: if (currentFiber != null) {
			//update
			if (currentFiber.key === key) {
				//key相同
				if (element.$$typeof === REACT_ELEMENT_TYPE) {
					if (currentFiber.type === element.type) {
						//type相同
						//这里进行fiber的复用
						const existing = useFiber(currentFiber, element.props);
						existing.return = returnFiber;
						return existing;
					}
					//标记删除旧fiberNode，在commit阶段执行真正的删除
					deleteChild(returnFiber, currentFiber);
					break work;
				} else {
					if (__DEV__) {
						console.warn('还未实现的react类型');
						break work;
					}
				}
			} else {
				//标记删除旧fiberNode，在commit阶段执行真正的删除
				deleteChild(returnFiber, currentFiber);
			}
		}
		//根据 element 创建 fiber 并返回
		const fiber = createFiberFromElement(element);
		fiber.return = returnFiber;
		return fiber;
	}

	function reconilerSingleTextNode(
		returnFiber: FiberNode, // wip fiberNode
		currentFiber: FiberNode | null, //wip.child fiberNode
		content?: string | number
	) {
		if (currentFiber !== null) {
			//update
			if (currentFiber.tag === HostText) {
				//类型没变，可以复用
				const existing = useFiber(currentFiber, { content });
				existing.return = returnFiber;
				return existing;
			}
			deleteChild(returnFiber, currentFiber);
		}
		const fiber = new FiberNode(HostText, { content }, null);
		fiber.return = returnFiber;
		return fiber;
	}

	function placeSingleChild(fiber: FiberNode) {
		if (shouldTrackEffects && fiber.alternate === null) {
			fiber.flags |= Placement;
		}
		return fiber;
	}

	return function reconcileChildFibers(
		returnFiber: FiberNode, // wip fiberNode
		currentFiber: FiberNode | null, //wip.child fiberNode
		newChild?: ReactElementType //wip对应的child的reactElement
	) {
		if (typeof newChild === 'object' && newChild != null) {
			switch (newChild.$$typeof) {
				case REACT_ELEMENT_TYPE:
					return placeSingleChild(
						reconileSingleElement(returnFiber, currentFiber, newChild)
					);
				default:
					if (__DEV__) {
						console.warn('未实现的 reconciler类型 ', newChild);
					}
			}
		}
		// HostText
		if (typeof newChild === 'string' || typeof newChild === 'number') {
			return placeSingleChild(
				reconilerSingleTextNode(returnFiber, currentFiber, newChild)
			);
		}

		// TODO 多节点的情况 ul> li*3

		//兜底删除
		if (currentFiber != null) {
			deleteChild(returnFiber, currentFiber);
		}

		if (__DEV__) {
			console.warn('未实现的 reconciler类型 ', newChild);
		}
		return null;
	};
}

function useFiber(fiber: FiberNode, pendingProps: Props): FiberNode {
	const clone = createWorkInProgress(fiber, pendingProps);
	clone.index = 0;
	clone.sibling = null;
	return clone;
}

export const reconcilerChildFiber = ChildReconciler(true);
export const mountChildFiber = ChildReconciler(false);
