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

// const App = () => {
// 	const [num, setNum] = useState(100);

// 	return (
// 		<div
// 			onClickCapture={() => {
// 				setNum(num + 1);
// 			}}
// 		>
// 			{num}
// 		</div>
// 	);
// };

const App = () => {
	const [num, setNum] = useState(100);

	const arr =
		num % 2 === 0
			? [<p key={1}>1</p>, <div key={2}>2</div>, <h1 key={3}>3</h1>]
			: [<h1 key={3}>3</h1>, <p key={1}>1</p>, <div key={2}>2</div>];

	// const arr =
	// 	num % 2 === 0
	// 		? [<li key={1}>1</li>, <li key={2}>2</li>, <li key={3}>3</li>]
	// 		: [<li key={1}>1</li>, <li key={2}>2</li>];
	return (
		<ul
			onClickCapture={() => {
				setNum(num + 1);
			}}
		>
			{arr}
		</ul>
	);
};

const root = document.querySelector('#root');
ReactDOM.createRoot(root).render(<App />);
