import { useState } from 'react';
import ReactDOM from 'react-dom/client';

// ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
// 	<React.StrictMode>
// 		<App />
// 	</React.StrictMode>
// );

// const App = () => {
// 	const [num, setNum] = useState(100);
// 	window.setNum = setNum;
// 	return num === 3 ? <Child /> : <div>{num}</div>;
// };
// function Child() {
// 	return <div>big-react111</div>;
// }

const App = () => {
	const [num, setNum] = useState(100);
	return (
		<div
			onClickCapture={() => {
				setNum(num + 1);
			}}
		>
			{num}
		</div>
	);
};
function Child() {
	return <div>big-react111</div>;
}

const root = document.querySelector('#root');
ReactDOM.createRoot(root).render(<App />);
