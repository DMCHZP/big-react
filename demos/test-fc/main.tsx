import React from 'react';
import ReactDOM from 'react-dom/client';

// ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
// 	<React.StrictMode>
// 		<App />
// 	</React.StrictMode>
// );

const App = () => {
	return (
		<div>
			<span>react1</span>
		</div>
	);
};

console.log(React);

console.log(App);
console.log(ReactDOM);
const root = document.querySelector('#root');
ReactDOM.createRoot(root).render(<App />);
