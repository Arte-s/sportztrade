import { CancelablePromise } from "./Common"


const p = new CancelablePromise((resolve, reject) => {
	setTimeout(() => {
		console.log('resolved!');
		resolve(0);
	}, 2000);
})


p.catch(console.log);

setTimeout(() => {
	p.cancel('Messed up!');
}, 1000);

export {};

await p;