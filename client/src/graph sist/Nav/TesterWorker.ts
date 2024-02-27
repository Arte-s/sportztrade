//// <reference lib="Webworker"/>


import {CMyWorker2} from "./myWorker";
import {CSymbol} from "./Symbol";
import {JSON_clone, ParsedUrlQueryInputMy} from "./Common";
import {AllStrategies, createStrategyObject, getSignaller} from "./Strategies";
import {TF} from "./Time";
import {ByteStreamW} from "./ByteStream";
import {CTesterConfig, CTradeHistory, ITesterConfig, RunSignallerTest} from "./Tester";

export class TesterTaskInfo {
    symbol?: CSymbol | null;
    strategyName?: string | null;
    strategyParams: readonly number[];
    tfName: string;
    testerConfig?: ITesterConfig | null;

    constructor(info: Readonly<TesterTaskInfo>) {
        this.symbol = info.symbol;
        this.strategyName = info.strategyName;
        this.strategyParams = info.strategyParams;
        this.tfName = info.tfName;
        this.testerConfig = info.testerConfig;
    }

    static fromParsedJSON(data: ParsedUrlQueryInputMy<TesterTaskInfo>): TesterTaskInfo {
        return {
            symbol: data.symbol ? CSymbol.fromParsedJSON(data.symbol) : null,
            strategyName: data.strategyName,
            strategyParams: data.strategyParams,
            tfName: data.tfName, //tf: TF.fromName(data.tf.name) ?? (()=>{throw("Can't get TF for "+data.tf.name)})(),
            testerConfig: data.testerConfig ? CTesterConfig.fromParsedJSON(data.testerConfig) : null
        };
    }

    //constructor(symbol : CSymbol,  strategyName : string,  strategyParams : readonly number[], testerConfig : CTesterConfig)
}

export const TRANSFER_BINARY_TRADE_HISTORY = true;
export type WorkerResultMsg = { isBinary: boolean, data: ParsedUrlQueryInputMy<(CTradeHistory | null) | (CTradeHistory | null)[]> | ArrayBuffer, duration: number };


let __StrategyName: string;
let __Symbol: CSymbol;
let __testerConfig: CTesterConfig;

async function OnMessage(ev: MessageEvent<ParsedUrlQueryInputMy<TesterTaskInfo | TesterTaskInfo[]>>) {
    //let res = Calculate(1);
    //postMessage(JSON_clone(new CTradeHistory));  return;
    //let unlock= await threadMutex.lock();
    console.log = () => {
    };

    //return;
    /*
    console.log("==== In worker #"+ev.data?.strategyName+".  Time=",Date.now());
    console.log("!!!  Возвращаем пустой результат");
    postMessage(null);  return;
    postMessage(JSON_clone(new CTradeHistory), undefined);  return;
    */
    //let data= ev.data;

    let datas = ev.data instanceof Array ? ev.data : [ev.data];
    //print("tasks:",datas.length);
    let results: (CTradeHistory | null)[] = [];
    let localTime0 = Date.now();

    for (let data of datas) {
        let strategyName = data.strategyName ?? __StrategyName;
        let symbol = data.symbol ? CSymbol.fromParsedJSON(data.symbol) : __Symbol;
        let testerConfig = data.testerConfig ? CTesterConfig.fromParsedJSON(data.testerConfig) : __testerConfig;
        //print(strategyName, symbol.name, testerConfig);
        //if (__Symbol && data.symbol)
        //console.assert(! (__Symbol && (data.symbol || data.testerConfig)),  data);

        __StrategyName = strategyName;
        __Symbol = symbol;
        __testerConfig = testerConfig;
        //console.log("Отключаем проверку стратегии");

        let strategy = AllStrategies[strategyName]; // strategies.find((item)=>item.name==strategyName);

        if (!strategy) {
            throw("Wrong strategy: " + strategyName);
        }
        let localTime = Date.now();
        let tf = TF.fromName(data.tfName) ?? (()=>{throw "Wrong tf: "+data.tfName;})()

        let trader = getSignaller(createStrategyObject(strategy, data.strategyParams, tf));
        if (!trader) throw("Failed to get signaller for params: " + data.strategyParams.join());

        let result = await RunSignallerTest(trader, tf, symbol, testerConfig);
        //let result = RunSignallerTest2(trader, symbol, testerConfig);

        console.log("Elapsed for RunSignallerTest:", Date.now() - localTime);
        results.push(result);
        //print("tested combo Ok");
        //postMessage(Date.now()-localTime); return;
        //CSymbol.fromParsedJSON(data.symbol);
        //let z= CTradeHistory.fromParsedJSON(JSON_clone(new CTradeHistory));
    }

    //let stream= new ByteStreamW;
    //for(let result of results) stream.pushNullable(result);

    //print("tested group Ok");
    let result = ev.data instanceof Array ? results : results[0];
    //print("Agent result:",result);
    if (0) {
        console.log("!!!  Возвращаем пустой результат");
        result = new CTradeHistory();
    }
    //print(JSON_stringify_DateAsNumber(result));
    //postMessage(JSON_clone(result));
    let elapsed_ms = Date.now() - localTime0;

    if (TRANSFER_BINARY_TRADE_HISTORY) {
        let stream = new ByteStreamW();
        if (result instanceof Array) stream.pushArrayOfNullable(result);
        else stream.pushNullable(result);
        let buffer = stream.data.buffer;
        //postMessage({ jsonData : JSON_clone(new CTradeHistory), binaryData: buffer }, [buffer]);
        return {data: buffer, duration: elapsed_ms};
    }
    return {data: JSON_clone(result), duration: elapsed_ms};
    //unlock();
    //let d= new Date();
}

let __lastMessageTask: Promise<unknown>;

export const onmessage = async function(ev : MessageEvent<ParsedUrlQueryInputMy<TesterTaskInfo|TesterTaskInfo[]>>)
{
    await __lastMessageTask;
    let answer : { data :WorkerResultMsg["data"], duration :number};
    answer = await (__lastMessageTask = OnMessage(ev));
    function postMyMessage(message :WorkerResultMsg, transfer? :Transferable[]) { return transfer ? postMessage(message, "*", transfer) : postMessage(message); }
    let isBinary = answer.data instanceof ArrayBuffer; // ? true : typeof answer.data=="string" ? false : (()=>{throw("Wrong data type")})();
    //console.warn("result: ",answer);
    postMyMessage({...answer, isBinary }, answer.data instanceof ArrayBuffer ? [answer.data] : undefined);
}



export class CTesterWorker extends CMyWorker2<TesterTaskInfo, WorkerResultMsg> {
    constructor() {
        // super(import.meta.url);
        super("./TesterWorkerFile.js");
        console.assert(onmessage != undefined);
    }
}

