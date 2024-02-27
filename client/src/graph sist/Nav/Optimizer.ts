import {CMarketData, CSymbol} from "./TraderOld"
import * as lib from "./Common"
import {CancelablePromise, ICancelToken, ParsedUrlQueryInputMy} from "./Common"
import {createStrategyObject, IParamValues, IStrategy} from "./Strategy"

//import { Genetic } from 'async-genetic';

import {ByteStreamR} from "./ByteStream";

import {CTesterConfig, CTestResult, CTradeBar, CTradeHistory, RunStrategyTest, RunTest} from "./Tester";

import {TF} from "./Time"

import {TradeStatistics} from "./TradeStatistics";
import {CTesterWorker, TesterTaskInfo, WorkerResultMsg} from "./TesterWorker";
import {cachedFitnessFunction, myGeneticAlgorithm, myGeneticSolve} from "./myGenetic";

export * from "./Tester";

//import {Strategy_MA} from "./Strategy_MA";

//console.log(S1,"  ",v);
//export {CMyWorker} from "./MyWorker";

//export {JSON_clone} from "./Common";
// export {CTesterWorker} from "./TesterWorker";
// export {OnMessage} from "./TesterWorker";
// export {WorkerResultMsg} from "./TesterWorker";
// export {TRANSFER_BINARY_TRADE_HISTORY} from "./TesterWorker";

//function promiseReverse<T>(promise : Promise<T>) : Promise<T> { return new Promise((resolve, reject) => Promise.resolve(promise).then(reject, resolve)); }

function promiseReverse<T>(promise : Promise<T>) : Promise<T> { return new Promise((resolve, reject) => promise.then(reject, resolve)); }

function PromiseAny<T=any>(promises : Iterable<Promise<T>>) : Promise<T> { return promiseReverse(Promise.all([...promises].map(promiseReverse))) as unknown as Promise<T>; }


function PromiseAnyWithIndex<T=any>(promises : Iterable<Promise<T>>) : Promise<[T, number]> {
	return PromiseAny([...promises].map((promise,i)=>new Promise((resolve, reject)=>promise.then((value)=>resolve([value, i]), reject))));
}




interface ITaskResult  {
	task         : TesterTaskInfo;
	tradeHistory : CTradeHistory|null;
	testingDuration : number;
}

interface IAgentTaskResult extends ITaskResult {
	agent: CTesterAgent;
	fullDuration : number;
}




let __FreeWorkers : Set<CTesterWorker> = new Set();


class CTesterAgent
{
	private worker : CTesterWorker = __FreeWorkers.values()?.next()?.value || new CTesterWorker();
	private tasks : CancelablePromise<WorkerResultMsg>[] = [];
	readonly id : number;
	//private _taskCount = 0;
	get taskCount() { return this.tasks.length; }// this._taskCount; }

	constructor(id :number=0) { this.id= id; }// this.worker= __FreeWorkers.values()?.next()?.value || new CMyWorker('tester.js'); }

	async RunTest(strategy :IStrategy|null,  params :readonly number[],  tf: TF,  symbol :CSymbol|null,  testerConfig :CTesterConfig|null)
		: Promise<IAgentTaskResult>
	{
		//let localTime= Date.now();
		//let worker= new CMyWorker('tester.js');
		let worker= this.worker;
		if (!worker) throw("Worker is not defined"); //{ console.log("Worker is not defined");  return null; }
		//console.log("Worker creation duration: ",Date.now()-localTime);
		//let tf= TF.H1;
		//let sym= cloneFull(symbol); //.name);  (symbol).quotesHistory.minTf.name;
		//console.log(sym);
		//alert(sym.name);
		//let symJSON= JSON.stringify(symbol);

		let taskInfo : TesterTaskInfo = { symbol: symbol,  strategyName: strategy?.name,  strategyParams: params,  tfName: tf.name, testerConfig : testerConfig };

		//console.log(sym.name);
		//return await worker.send({strategy, symbol, testerConfig}) as Promise<CTradeHistory>;
		//print("First");
		//console.log("@@@@ Agent",this.id,"waiting");
		let time= Date.now();

		console.log("==== Sending to worker #"+this.id+"... Time=",time);

		//task.strategyName= this.id+"";

		//taskInfo["sentTime"]= Date.now();
		//task= { symbol: null,  strategyName: null,  strategyParams: params,  testerConfig : null };
		//await worker.send(task);
		//return true;

		let task= CancelablePromise.resolve( worker.send(taskInfo) );

		this.tasks.push(task);  //this._taskCount++;

		let resultData= await task.finally(()=>{ this.tasks.splice(this.tasks.indexOf(task),1); });  // Удаляем первую задачу из списка по завершении  //this._taskCount--;


		let result :CTradeHistory|null;

		if (resultData.isBinary) {
			let buffer = resultData.data as ArrayBuffer;
			let rstream= new ByteStreamR(buffer);
			result = rstream.readNullable(CTradeHistory);
		}
		else {
			let json = resultData.data as ParsedUrlQueryInputMy;
			result= CTradeHistory.fromParsedJSON(json);
		}

		let elapsed= Date.now() - time;

		//as Promise<CTradeHistory>;
		//let json= await worker.send(taskInfo) as ParsedUrlQueryInputMy;
		//json= JSON_clone(new CTradeHistory);
		//print("==== Receive from worker #"+this.id+". Time=",Date.now(),"  Full duration:",Date.now()-time);
		//console.log("@@@@ Agent",this.id,"continue");
		//console.log("Second");
		//return json;
		//print({...json});

		//print(result);
		///console.log("@@@@ ok",this.id);
		return { task: taskInfo,  tradeHistory: result,  agent: this,  testingDuration: resultData.duration, fullDuration: elapsed };
	}

	deinit() {
		//__FreeWorkers.add(this.worker);  this.worker=null;
		this.worker.terminate();
		for(let task of this.tasks) task.cancel("Cancel");
		//this.tasks.length = 0;
	}
}



//declare type Promise<T>; // = Promise<T>; // { }


class CTesterAgents
{
	protected agents : CTesterAgent[] =[];
	protected tasks : Promise<IAgentTaskResult>[] = [];
	readonly maxAgentsCount :number;
	//private _freeAgent : CTesterAgent; // _freeIndex : number;
	protected freeAgentsSet : Set<CTesterAgent> = new Set();

	constructor(maxAgents : number = 2) { this.maxAgentsCount= maxAgents;  console.assert(maxAgents>=0); }// this._freeIndex=-1; }

	protected getAgentWithMinimumTasks() {
		let taskCount = Number.MAX_VALUE;
		let agent :CTesterAgent|undefined;
		for (let ag of this.agents)
			if (ag.taskCount <= taskCount) {
				agent = ag;
				taskCount = ag.taskCount;
			}
		return agent;
	}

	agentMinTaskCount() { if (this.agents.length < this.maxAgentsCount) return 0;  return this.getAgentWithMinimumTasks()!.taskCount; }


	tasksCount() { return this.tasks.length; }

	private _ipass=0;

	pushTask(strategy :IStrategy, params :readonly number[], tf :TF, symbol :CSymbol, testerConfig :CTesterConfig, onResult? :(result:IAgentTaskResult)=>any)
	{ //: Promise<any> {
		//let index= this._freeIndex;
		//let agent : CTesterAgent;
		//if (index==-1) index= this.agents.push(agent= new CTesterAgent) - 1;
		//else agent= this.agents[index];
		//if ()
		//let agent= this._freeAgent;
		//if (! agent) { agent= new CTesterAgent; }
		//this._freeAgent= null;

		let agent : CTesterAgent;
		let isNew= false;

		if (1) { // Выбираем агента с минимальным числом заданий, либо нового агента в пределах maxAgentsCount
			let bestAgent= this.getAgentWithMinimumTasks();
			if (!bestAgent || (this.agents.length < this.maxAgentsCount && bestAgent.taskCount>0)) {
				this.agents.push( bestAgent = new CTesterAgent(this.agents.length) );
				isNew= true;
			}
			agent = bestAgent;
		}
		else
		if (0) {  // Выбираем свободного агента, иначе нового агента
			if (this.freeAgentsSet.size==0) { agent= new CTesterAgent(this.agents.length);  this.agents.push(agent);  isNew=true;  }
			else { agent= this.freeAgentsSet.values().next().value;  this.freeAgentsSet.delete(agent); }
		}
		else { // Выбираем следующего агента по кругу
			let i= this._ipass%this.maxAgentsCount;  console.log("Выбираем агента #"+i);
			agent= this.agents[i];  if (!agent) { agent= this.agents[i] = new CTesterAgent(i);  isNew=true; }
		}

		let [agentSymbol, agentStrategy, agentTesterConfig] = isNew ? [symbol, strategy, testerConfig] : [null, null, null];
		//if (!isNew) { strategy=null; symbol=null; testerConfig=null; }

		let task= agent.RunTest(agentStrategy, params, tf, agentSymbol, agentTesterConfig);
		let passId= this._ipass;
		//console.log("Ok");
		//alert("!");
		if (onResult) task= task.then(
			(result)=>{
				//if (! result) return null;
				printDebug("Finished task #"+passId," Duration full:",result.fullDuration," Duration of test:",result.testingDuration);
				//print("tasks remain:  total=",this.tasks.length,"  byAgents: ",this.agents.map((agent)=>agent.taskCount).join(", "));
				onResult(result);
				return result;
			}
		);//, ()=>console.log("Task failed"));
		this._ipass++;
		//this.tasks[index]= task;
		this.tasks.push(task!);
		//return task;
	}

	async popResult() : Promise<ITaskResult> {
		//let tasks= this.agents.map((agent)=>agent.)
		//if (this.tasks.length < this.maxAgentsCount)
		//return this.tasks.length;
		//let result= await PromiseAny(this.tasks);
		try {
			console.log("Waiting for any task to complete");
			let [result, index] = await PromiseAnyWithIndex(this.tasks);
			//console.log(!!this.tasks[0]);
			//this.tasks
			//let [result, index] = [await PromiseAny(this.tasks), 0];
			//console.log("Agent", result ? result.agent.id :"?", "result: ",result,"\ntask index: ",index);
			console.log("Remove task #"+index," (agent #"+ (result ? result.agent.id :"?")+")");
			if (1)
				if (index != null) {
					this.tasks[index] = this.tasks[this.tasks.length - 1];
					let popped= this.tasks.pop();
					//this.tasks.splice(index, 1);
				}
			this.freeAgentsSet.add(result.agent);

			return result;
		}
		catch(e) { console.log("catch: ",e);  console.log("Task count:", this.tasks.length);  throw(e); }
		//for(let i=0; i<this.tasks.length; i++) if (this.tasks[i].)
		//let z : JQueryPromise<CTradeHistory>;
		//z= this.tasks[1];
		//for (let i=0; i<this.maxAgentsCount; i++) if (this.tasks[i].state()=='resolved') return i;
		//return -1;
	}
	////console.log("startWait ",this.tasks.length,"tasks"); console.log("endWait");
	async waitAll() { await Promise.all(this.tasks);  this.tasks=[];  for(let agent of this.agents) this.freeAgentsSet.add(agent); }

	clear() { for(let agent of this.agents) agent.deinit();  this.agents=[];  this.tasks=[];  this.freeAgentsSet.clear(); }
}

/*
class CTesterAgents2
{
    protected _agents = new CTesterAgents();

    pushTask(strategy :IStrategy, params :readonly number[], symbol :CSymbol, testerConfig :CTesterConfig, onResult :(CTaskResult)=>any) {
        this._agents.pushTask(strategy, params, symbol, testerConfig).then();
    }

    waitForTasksCount(count: number) { }

    waitForAll()
}
*/



/*
export async function Test()
{
    let workers= [];
    let tasks = [];
    let time= Date.now();
    let threadCount= 4;
    let isParallel= 0;
    console.log(isParallel ? "Параллельное вычисление: "+threadCount+" потоков" : "Одиночное вычисление");
    let sum=0;

    for (let n=0; n<240/threadCount; n++)
        if (! isParallel)
            sum += Calculate(threadCount);
        else {
            for (let i = 0; i < threadCount; i++) {
                let worker = n == 0 ? new CMyWorker("testWorker") : workers[i];
                if (n == 0) workers.push(worker);
                let task = worker.send(null);
                tasks.push(task);
                //if (i==0) console.log(n);
            }
            sum = (await Promise.all(tasks)).reduce((prev, curr)=>prev+curr);
        }
    console.log("Elapsed total:",Date.now()-time,"ms,  Sum=",sum);
}

onmessage = async function(ev : MessageEvent<any>) {
    let result = Calculate(1);
    postMessage(result);
}
*/



// Generate all combinations of array elements:  (cartesian)
function* __getCombinations<T>(head? :Iterable<T>, ...tail: Iterable<T>[]) : Generator<T[]> {
	if (!head) return null;
	let remainder : Iterable<T[]> = tail.length ? __getCombinations(...tail) : [[]];
	for (let r of remainder) for (let h of head) yield [h, ...r];
}

function* getCombinations<T>(head : Iterable<T>, ...tail: (Iterable<T>)[]) { yield* __getCombinations(head, ...tail); }

// test:
if (0)
	for (let c of getCombinations([0,1], [0,1,2,3], [0,1,2])) {
		console.log(...c);
	}



//function Optimizate1(paramDatas : IParamValues[]) : CTestResult[]

function Optimizate(
	item : {symbol : CSymbol,  strategy : IStrategy},
	paramDatas : readonly IParamValues[],
	testerConfig : CTesterConfig,
	marketData : CMarketData)
	: CTestResult[] | null
{
	if (paramDatas.length != item.strategy.paramInfo.length) {
		console.error("Wrong parameters amount: ", paramDatas.length, "  Required: ", item.strategy.paramInfo.length);
		return null;
	}
	let combosTotal = 1;
	for(let paramData of paramDatas) combosTotal *= paramData.length;
	console.log("Total combinations: ",combosTotal);
	//console.log(paramDatas);
	//if (paramDatas.length>0)
	let combos : Iterable<number[]> = __getCombinations(...paramDatas);
	if (!paramDatas.length) combos= [[]];
	let results= new Array<CTestResult>();
	if (! item.strategy.getTraderOld) throw("Trader for "+item.strategy.name+" is not defined");
	let tf= testerConfig.tf ?? (()=>{throw "tf is undefined"})();

	for(let params of combos) {
		console.log(...params);
		let trader = item.strategy.getTraderOld({params, tf});
		if (! trader) continue;
		let result = RunTest(trader, testerConfig, marketData);
		if (!result) continue;
		results.push(result);
	}
	return results;
}

//Optimizate1( [[1,2,3],[4,5,6]]);
//Optimizate1( undefined, [[1,2,3],[4,5,6]], undefined);

/*
function Optimizate(items : [{symbol : CSymbol,  strategy : IStrategy}],  testerConfig : CTesterConfig) : CTestResult[]
{
    let allResults = new Array<CTestResult>();
    for(let item of items) {
        let results = Optimizate1(item, testerConfig);
        allResults = allResults.concat(results);
    }
    return allResults;
}
*/


//const print= console.log;

const oldLog= console.log;


let print = function(...args : any[]) { oldLog(...args); }

print = oldLog;

let printDebug = function(...args : any[]) { console.log(...args); }

printDebug= console.log;



export type MyGeneticParams = {
	populationSize :number;
	crossoverProbability : number;
	mutationProbability : number;
	badEpochs : number;
	minTradesCount :number;
	criterio : "profit"|"sharpCoef"|"recoveryFactor";
}


export class CMyGeneticParams implements MyGeneticParams
{
	populationSize :number = 0;
	crossoverProbability : number = 0;
	mutationProbability : number = 0;
	badEpochs : number = 0;
	minTradesCount :number = 0;
	criterio : "profit"|"sharpCoef"|"recoveryFactor" = "profit";
}




export function getCriterioFunction(criterio :MyGeneticParams["criterio"]) {
	if (criterio=="profit") return ((data :readonly CTradeBar[])=> data.length > 0 ? data[data.length - 1].close : 0);
	if (criterio=="sharpCoef") return ((data :readonly CTradeBar[]) => TradeStatistics.getSharpCoef(data));
	if (criterio=="recoveryFactor") return ((data :readonly CTradeBar[]) => TradeStatistics.getRecoveryFactor(data));
	throw("Unknown criterio: "+JSON.stringify(criterio));
}

/*
let t= Date.now();
let workers= [new CMyWorker('tester.js'), new CMyWorker('tester.js')];
let tasks =[];
for (let i=0; i<100; i++) {
	if (1) if (i>1) { let [result,index]= await PromiseAnyWithIndex(tasks);  tasks.splice(index,1); }
	tasks[i] = workers[i % 2].send("aaa").then(() => console.log("Task", i, " finished"));
}
await Promise.all(tasks);//.catch(()=>alert('catch'));
console.log(Date.now()-t);
alert("Finish");
return;
*/


export async function OptimizateSimple
(
	item : Readonly<{symbol :CSymbol, strategy :IStrategy}>,
	paramDatas : readonly IParamValues[],
	testerConfig : Readonly<CTesterConfig>,
	threadCount : number,
	useGenetic : boolean|MyGeneticParams|null|undefined,
	onResult :(params : readonly number[], result :CTradeHistory)=>boolean|void,
	cancelToken? : ICancelToken
)
	: Promise<boolean> //: Promise<CTestResult[]|null>
{
	//await Test();  return true;

	if (paramDatas.length != item.strategy.paramInfo.length) {
		console.error("Wrong parameters amount: ", paramDatas.length, "  Required: ", item.strategy.paramInfo.length);
		return false;
	}
	let combosTotal = 1;
	for(let paramData of paramDatas) combosTotal *= paramData.length;
	print("Total combinations: ",combosTotal);
	//console.log(paramDatas);
	//if (paramDatas.length>0)
	let combos :Iterable<number[]> = __getCombinations(...paramDatas);
	if (!paramDatas.length) combos= [[]];


	const tf= item.symbol.quotesHistory.minTf;
	if (! tf) { console.log("Отсутствует история по ",item.symbol.name);  return false; }
	const strategyTf= tf;

	//let results= new Array<CTestResult>();
	//let worker= new CMyWorker('tester.js');
	//worker.onMessage()
	let defaultTreadCount= navigator?.hardwareConcurrency ?? 4;
	let maxThreads= isNaN(threadCount) ? defaultTreadCount : threadCount;
	if (useGenetic) maxThreads=1;

	let useRemoteAndLocalAgentsTogether = 0;
	let remoteThreads= maxThreads;
	if (useRemoteAndLocalAgentsTogether && maxThreads>1) remoteThreads--;
	//alert(maxThreads);  return;
	let agents= new CTesterAgents(remoteThreads);
	let stop= false;

	if (! window.Worker && maxThreads>1) { console.error("Web worker is not supported!");  maxThreads=1; }

	print("Max threads:",maxThreads);
	if (0) {
		combosTotal= 1;
		combos = [...combos].slice(0, combosTotal);
		print("Тестируем только начальные " + combosTotal + " комбинации!!!"); // Оставляем только начальные элементы
	}//console.log("Задаём пустой onresult !!!");  onresult= (a :any, b:any)=>Promise.resolve(true);

	let agentUnloadMessagePrinted= false;
	let n=0;

	let sum=0;
	let workers : CTesterWorker[] = [];
	let Agents= [];
	let tasks : Promise<void>[] = [];
	//let tt= setInterval(()=> { if (cancelToken?.isCancelled()==true) { print("STOPPED!!!");  stop=true; clearInterval(tt); } }, 50)


	const statusChecker = lib.createCancellableTimer(50,
		()=>
			! (stop? stop: stop = (cancelToken?.isCancelled()==true)));

	const cancellationChecker = promiseReverse(statusChecker);

	//setTimeout.__promisify__(0);

	const localTime0= Date.now();

	let pauseTime=0;
	//print("Отключаем onresult");  onresult= null;
	let allCombos : number[][];
	//let print= console.log;

	printDebug= ()=>{}

	console.log= printDebug;
	//await getCheckerOnTimer(()=>true, 100);

	//let cancellationChecker= setInterval(()=> stop||= cancelToken.isCancelled(), 50);
	let i=-1;
	let tasksDurationOfTesting = 0;
	let tasksDurationFull = 0;

	//let printCountTimeMs= Date.now();

	function onPassResult(params :readonly number[],  result :CTradeHistory|undefined|null,  duration :number) {
		n++;
		printDebug("Result:\n", result);
		if (duration!=null) printDebug("Duration:", duration, "ms");
		tasksDurationOfTesting += duration;
		//if ((Date.now()-printCountTimeMs) > 2000) { print("Выполнено",Math.round(n/combosTotal*100)+"%");  printCountTimeMs= Date.now(); }
		if (onResult && result) return onResult(params, result) != false;
		return true;
	}

	// Запускаем таймер, печатающий прогресс выполнения
	const printingProgressTimer = function() {
		let _printed_n = -1;
		function printProgress() { if (n!=_printed_n) print("Выполнено",Math.round(n/combosTotal*100)+"%");  _printed_n= n; }

		return new lib.MyTimerInterval(2000, printProgress, printProgress);
	} ();


	if (useGenetic)
	{
		let geneticParamsDefault : MyGeneticParams = { populationSize: 250, crossoverProbability: 0.8, mutationProbability: 0.2, badEpochs: 5, minTradesCount: 1, criterio : "profit" };

		let geneticParams= typeof(useGenetic)=="boolean" ? geneticParamsDefault : {...geneticParamsDefault, ...useGenetic};

		print("Параметры генетики:", geneticParams);

		const criterioFunc = getCriterioFunction(geneticParams.criterio);

		async function computeFitnessFunction(params: readonly number[]) {
			//if (map[params.join(",")]!=null) { console.error("!!!! "+params.join(","));  stop=false; throw("dublicate"); }
			//let trader = getSignaller(item.strategy, params, strategyTf);
			let stratObject= createStrategyObject(item.strategy, params, strategyTf);
			if (!stratObject) return Number.MIN_VALUE;
			let localTime = Date.now();

			let result = await RunStrategyTest(stratObject, item.symbol, testerConfig); //, cancelToken);

			let length = result?.points.length;
			if (!result || length==null) return Number.MIN_VALUE;
			if (result.tradesCount < (geneticParams.minTradesCount ?? 1)) return Number.MIN_VALUE;

			let res = criterioFunc(result.EquityBars); //length > 0 ? result.points[length - 1].value.equity : 0;
			console.assert(res != undefined);
			//map[params.join(",")]= res;
			let ok = onPassResult(params, result, Date.now() - localTime);
			if (!ok) stop = true;

			if (Date.now() - pauseTime > 50) {
				await lib.sleepAsync(0);
				pauseTime = Date.now();
			}

			return res;
		}

		const fitnessFunction = cachedFitnessFunction(computeFitnessFunction);

		let paramValues: number[][] = paramDatas.map((data) => [...data]);

		let popSize= Math.min(geneticParams.populationSize, Math.round(combosTotal/3+30));
		if (popSize!=geneticParams.populationSize) print("Меняем размер популяции на",popSize);
		geneticParams= {...geneticParams,  populationSize: popSize };

		let genetic = myGeneticAlgorithm(paramValues, fitnessFunction, geneticParams, 1);//, defaultTreadCount*10);

		await myGeneticSolve(genetic, geneticParams.badEpochs, ()=>stop);

	}
	//===== Полный перебор =====================================================
	else // if (!isGenetic)

		for(let params of combos) {
			i++;
			if (stop) break;
			printDebug("Комбинация параметров: ",...params);

			//worker.postMessage({trader, item.symbol, testerConfig});
			//let result= await worker.send({trader, symbol: item.symbol, testerConfig});

			if (i % maxThreads==maxThreads-1  &&  (maxThreads==1 || useRemoteAndLocalAgentsTogether))  // && maxThreads==1) {
			{   // Синхронный тест
				let localTime = Date.now();
				//let trader = getSignaller(item.strategy, params, tf); //item.strategy.getSignaller({params, tf: strategyTf});
				//if (!trader) continue;
				//let result = await RunSignallerTest(trader, strategyTf, item.symbol, testerConfig); //, cancelToken);
				let stratObj= createStrategyObject(item.strategy, params, tf);
				if (!stratObj) continue;

				let result = await RunStrategyTest(stratObj, item.symbol, testerConfig); //, cancelToken);

				//if (! await onresult(params, result)) return false;
				sum += result?.points[Math.round(Math.random()*(result.points.length-1))]?.value.equity ?? 0;

				let ok = onPassResult(params, result, Date.now()-localTime);
				if (! ok) stop= true;

				if (Date.now()-pauseTime>50) { await lib.sleepAsync(0);  pauseTime= Date.now(); }

				continue;
				//let result = await RunSignallerTestAsync(item.strategy, params, item.symbol, testerConfig);
			}
			if (0) {
				let worker= workers[i % maxThreads];
				let isNew= false;
				if (!worker) { worker= workers[i % maxThreads]= new CTesterWorker();  isNew=true; }
				//tasks.push(worker.send(null));
				//let agent : CTesterAgent = Agents[n % maxThreads];
				//if (!agent) agent= Agents[n % maxThreads]= new CTesterAgent(n % maxThreads);
				//tasks.push(agent.RunTest(null, params, null, null));
				let groupSize= 1;
				allCombos ??= [...__getCombinations(...paramDatas)];
				//print(i, i%1);
				if (1)
					if (i % groupSize==0 || i==combosTotal-i) {
						//print(i);
						let datas : TesterTaskInfo[] = [];
						for(let combo of allCombos.slice(i, Math.min(i+groupSize,combosTotal))) {
							datas.push({ symbol: isNew ? item.symbol : null, tfName: tf.name, strategyName: item.strategy.name,  strategyParams: combo,  testerConfig : isNew ? testerConfig : null });
							//datas.push({ symbol: null,  strategyName: null,  strategyParams: null,  testerConfig : null });
							if (isNew) isNew=false;
						} //let taskInfos = { symbol: isNew ? item.symbol : null,  strategyName: item.strategy?.name,  strategyParams: params.slice(i, i+10),  testerConfig : testerConfig };
						let task= worker.send(datas).then((results :readonly unknown[])=>{n+= datas?.length;});
						tasks.push(task);
					}
			}
			else
				//agents.pushTask(null, params, null, null);
				agents.pushTask(item.strategy, params, tf, item.symbol, testerConfig,
					(taskResult: IAgentTaskResult) => {
						if (stop) return;
						//alert(111);
						//print("!");
						//tasksDurationOfTesting += taskResult.testingDuration;
						tasksDurationFull += taskResult.fullDuration;

						let result = taskResult.tradeHistory;
						//console.log("Agent #" + taskResult.agent.id, "result:\n", result);
						let ok= onPassResult(taskResult.task.strategyParams, result, taskResult.testingDuration); //let ok = onresult(taskResult.task.strategyParams, result);
						if (! ok) stop=true;
					}
				);
			//if (agents.tasksCount()==maxThreads) await agents.waitAll();
			//return;
			let taskCount= agents.tasksCount();
			if (1)
				if (taskCount >= maxThreads * 50) //maxThreads)
				{
					if (1) {
						print("Разгружаем очередь задач");

						while(agents.agentMinTaskCount()>10)
							await agents.popResult();
						print("Разгружено задач:", taskCount - agents.tasksCount());
						//alert("!");

					}
					else if (!agentUnloadMessagePrinted) { print("Отключаем ожидание разгрузки агента!"); agentUnloadMessagePrinted= true; }
				}
			//console.log("^^^^^^^ ",n);
			//if (n==2) break;
			//results.push(result);
			//n++;
		}

	if (maxThreads>1) print("Sending duration total:", Date.now() - localTime0," ms.  Remain tasks:",agents.tasksCount());
	//alert(1);
	//print("Tasks: ",agents.tasksCount());
	//let cancellationCheckerTask= new Promise((resolve, reject)=> stop ? reject)
	//await Promise.all([...tasks]);  console.log("Elapsed total:", Date.now() - localTime0," ms");

	let allTasks= Promise.all([...tasks, agents.waitAll()]); //.catch(()=>alert("catch"));

	await Promise.race([allTasks, cancellationChecker]).catch((reason)=>{ console.error("Exception ",reason); throw(reason);}); //    console.log(reason));

	printingProgressTimer.stop();

	console.log= print;

	//alert(2);
	if (stop) print("STOPPED !");
	print("Computed",n,"combinations");
	//if (stop) alert("!!! 1");
	//clearInterval(cancellationChecker);
	//alert(2);
	agents.clear();

	if (threadCount==1)
		print("sum=",sum);

	if (n>0) {
		if (threadCount > 1) {
			//print("Duration of tasks: ",tasksDurationFull, "ms", " ("+(tasksDurationFull/n).toFixed(1)+" per pass)");
			print("Average duration of task: ", (tasksDurationFull / n).toFixed(1), "ms");
		}
		print("Average duration of test: ", (tasksDurationOfTesting / n).toFixed(1), "ms");
		print("Total duration of tests: ", tasksDurationOfTesting, "ms");//, " ("+(tasksDurationOfTesting/n).toFixed(1)+" per pass)");
	}

	print("Elapsed total:", Date.now() - localTime0, "ms");
	//alert("Elapsed total:"+ (Date.now() - localTime0)+" ms");
	//alert("!");
	//worker.terminate();
	return !stop;
	//return results;
}


