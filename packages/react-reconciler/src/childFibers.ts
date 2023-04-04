import { ReactElementType } from 'shared/ReactTypes';
import { FiberNode, createFiberFromElement } from './fiber';
import { REACT_ELEMENT_TYPE } from 'shared/ReactSymbols';
import { HostText } from './workTags';
import { Placement } from './fiberFlags';

function ChildReconciler(shouldTrackEffects: boolean) {
	function reconileSingleElement(
		returnFiber: FiberNode, // wip fiberNode
		currentFiber: FiberNode | null, //wip.child fiberNode
		element: ReactElementType //wip对应的child reactElement
	) {
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

		if (__DEV__) {
			console.warn('未实现的 reconciler类型 ', newChild);
		}
		return null;
	};
}

export const reconcilerChildFiber = ChildReconciler(true);
export const mountChildFiber = ChildReconciler(false);
