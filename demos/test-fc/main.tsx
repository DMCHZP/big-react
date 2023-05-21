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

	// const arr =
	// 	num % 2 === 0
	// 		? [<p key={1}>1</p>, <div key={2}>2</div>, <h1 key={3}>3</h1>]
	// 		: [<h1 key={3}>3</h1>, <p key={1}>1</p>, <div key={2}>2</div>];

	// const arr =
	// 	num % 2 === 0
	// 		? [<li key={1}>1</li>, <li key={2}>2</li>, <li key={3}>3</li>]
	// 		: [<li key={3}>3</li>, <li key={2}>2</li>];

	const arr =
		num % 2 === 0
			? [
					<li key={1}>1</li>,
					<li key={2}>2</li>,
					<>
						<div>666</div>
						<div>777</div>
					</>
			  ]
			: [<li key={1}>1</li>, <li key={2}>2</li>];

	// return (
	// 	<div>
	// 		<div>11</div>
	// 		<div>22</div>
	// 		<>
	// 			<div>33</div>
	// 			<div>44</div>
	// 		</>
	// 	</div>
	// );
	// return (
	// 	<div>
	// 		<>
	// 			<div>33</div>
	// 			<div>44</div>
	// 		</>
	// 	</div>
	// );
	// return (
	// 	<>
	// 		<div>11</div>
	// 		<div>22</div>
	// 	</>
	// );

	return (
		<ul
			onClickCapture={() => {
				setNum((num) => num + 1);
				setNum((num) => num + 1);
				setNum((num) => num + 1);
			}}
		>
			{/* <li>3</li>
			<li>4</li>
			{arr} */}
			{num}
		</ul>
	);
};

const root = document.querySelector('#root');
ReactDOM.createRoot(root).render(<App />);
