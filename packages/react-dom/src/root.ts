import { createContainer } from 'react-reconciler/src/fiberReconciler';
import { Container } from './hostConfig';
import { ReactElementType } from 'shared/ReactTypes';
import { updateContainer } from 'react-reconciler/src/fiberReconciler';

export function createRoot(container: Container) {
	const root = createContainer(container);
	return {
		render(element: ReactElementType) {
			updateContainer(element, root);
		}
	};
}