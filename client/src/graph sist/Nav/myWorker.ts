/// <reference no-default-lib="true"/>
/// <reference lib="esnext"/>
//// <reference lib="Webworker"/>

import {JSON_clone} from "./Common";
//import {TesterTaskInfo} from "./Tester";


//type SimpleT = { [key :any] : number|string|boolean|SimpleT; }




export class CMyWorker<TArg=any, TResult = any> {
	private static _lastId = 0;
	private worker: Worker; //Readonly<Worker>;
	readonly id = ++CMyWorker._lastId;

	constructor(file: string) {
		//if (!file) file= import.meta.url;  // текущий файл
		this.worker = new Worker(file, {type: "module"}); //if (__first) print(msg);  __first=0;
		this.worker.onmessage = (msg: MessageEvent<TResult>) => {
			this.handlers.splice(0, 1)[0]?.onResolve(msg.data);
		}
		this.worker.onerror = (msg) => {
			this.handlers.splice(0, 1)[0]?.onReject(msg);
		}
		this.worker.onmessageerror = (msg) => {
			this.handlers.splice(0, 1)[0]?.onReject(msg);
		}
	}

	protected handlers: { onResolve: (result: TResult)=>void, onReject: (msg: Event)=>void }[] = [];

	//async send(arg) : Promise<ParsedUrlQueryInputMy> { return new Promise((onResolve, onReject)=> { this.worker.onmessage= (msg)=>{ return onResolve(msg.data); }; this.worker.onerror= onReject;  this.worker.postMessage(JSON_clone(arg)); }); }
	async send(arg: TArg): Promise<TResult> {
		return new Promise((onResolve, onReject) => {
			this.handlers.push({onResolve, onReject});
			this.worker.postMessage(JSON_clone(arg));
		});
	}

	terminate() {
		this.worker.terminate();
	}
}

export class CMyWorker2<TArg=any, TResult = any> extends CMyWorker<TArg|readonly TArg[], TResult|readonly TResult[]> {
	//async send(arg: TArg): Promise<TResult>;
	override async send<T extends TArg|readonly TArg[]>(arg: T) { return await super.send(arg) as (T extends TArg ? TResult : readonly TResult[]); }//return super().send(arg); }
}



//var onmessage = async function(ev : MessageEvent<ParsedUrlQueryInputMy<unknown>>) { }
// }