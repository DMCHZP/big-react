export type WorkTags =
	| typeof FunctionComponent
	| typeof HostRoot
	| typeof HostComponent
	| typeof HostText;

export const FunctionComponent = 0;
//跟节点对应的fiber
export const HostRoot = 3;
//<div>
export const HostComponent = 5;
// <div>123</div>
export const HostText = 6;
