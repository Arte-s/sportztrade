import {TF} from "./Time";
import {CBar, CBars, CBarsMutable} from "./Bars";
import {BSearch, sleepAsync} from "./Common"
import {CQuotesHistoryMutable} from "./MarketData";

import fetch from "node-fetch";



// type BinanceSymbolInfo2 = {
//     name : string,
//     tickSize : number,
//     minPrice : number,
//     minStepLot : number, //minQty stepSize
//     minQty : number,
//     stepSize : number,
// }



type BinanceSymbolInfo = {
    symbol : string,
    status : string,
    baseAsset : string,
    baseAssetPrecision : number,
    quoteAsset : string,
    quoteAssetPrecision : number,
    quotePrecision : number,
    filters : [{
            filterType :"PRICE_FILTER",
            minSize : string,
            maxSize : string,
            tickSize : string
        }, {
            filterType: "PERCENT_PRICE",
            multiplierUp: string,
            multiplierDown: string,
            avgPriceMins: number
        }, {
            filterType : "LOT_SIZE",
            minQty : string,
            maxQty : string,
            stepSize: string
        }
    ]
}

function filterTradableBinanceSymbols(symbolsInfo :readonly BinanceSymbolInfo[]) {
    return symbolsInfo.filter(s => s.status=="TRADING");
}

//список инструментов

export async function loadAllBinanceSymbolsInfo(mode : "spot"|"futures") {
    const requestFutures= 'https://fapi.binance.com/fapi/v1/exchangeInfo';
    const requestSpot='https://api1.binance.com/api/v3/exchangeInfo';
    const request= mode=="futures" ? requestFutures : requestSpot;
    try {
        const parsedData= (await (await fetch(request))?.json()) as any|undefined;
        const data : BinanceSymbolInfo[]|undefined = parsedData?.symbols;
        if (! (data instanceof Array)) { throw "Wrong response"; }//: "+JSON.stringify(data); }
        return data;
    }
    catch (e) { console.error(request,e); }
}

//список торгуемых инструментов

export async function loadTradableBinanceSymbolsInfo(mode : "spot"|"futures") {
    let symInfo= await loadAllBinanceSymbolsInfo(mode);  if (!symInfo) return undefined;
    return filterTradableBinanceSymbols(symInfo);
}

// список названий торгуемых инструментов

export async function loadTradableBinanceSymbolNames(mode : "spot"|"futures"= "spot") {
    return (await loadTradableBinanceSymbolsInfo(mode))?.map( ss => ss.symbol);
}






type tInfoForLoad= Readonly<{ symbol: string, tf :TF, isFutures :boolean, timeFrom: const_Date, timeTo: const_Date }>;

const tfData : readonly(readonly[TF,string])[] = [
    [TF.M1,"1m"],
    [TF.M3,"3m"],
    [TF.M5,"5m"],
    [TF.M15,"15m"],
    [TF.M30,"30m"],
    [TF.H1,"1h"],
    [TF.H2,"2h"],
    [TF.H4,"4h"],
    [TF.H6,"6h"],
    [TF.H8,"8h"],
    [TF.H12,"12h"],
    [TF.D1,"1d"],
    [TF.W1,"1w"]
];
const tfMap : ReadonlyMap<TF,string> = new Map(tfData);


const MAX_REQUEST_BARS = 1000;
const MAX_REQUESTS_PER_MINUTE = 1200;


function getBinanceTimeframeName(tf :TF) { return tfMap.get(tf); }

function getBinanceBuildTimeframe(tf :TF) {
    for(let data of [...tfData].reverse()) {
        if (data[0]<=tf && tf.sec % data[0].sec ==0) return data[0];
    }
    return undefined;
}


export async function loadHistoryLimited(info: tInfoForLoad, limitBars=MAX_REQUEST_BARS): Promise<CBar[]|undefined> {

    let tfName= getBinanceTimeframeName(info.tf);
    if (! tfName) throw "Недоступный таймфрейм: "+info.tf.name;

    if (info.timeFrom > info.timeTo) throw "Некорректное время: "+info.timeFrom+" - "+info.timeTo;

    if (limitBars > MAX_REQUEST_BARS) throw "Некорректный limitBars";

    const prefix= info.isFutures ? "https://fapi.binance.com/fapi/v1" : "https://api1.binance.com/api/v3";

    //формируем строку (фьючерс)
    const request = prefix+'/klines?symbol=' + info.symbol + '&interval=' + tfName + '&startTime=' + info.timeFrom.valueOf() + '&endTime=' + info.timeTo.valueOf() + '&limit='+limitBars
    console.log(new Date());
    console.log("RequestInfo: ",{...info, tf: info.tf.name});
    console.log("Request:  ",request);
    try {
        const parseData= (await (await fetch(request)).json()) as [];
        return parseData?.map((item: (number|string)[]) => {
                return new CBar({
                    time: new Date(+item[0]),
                    open: +item[1],
                    high: +item[2],
                    low: +item[3],
                    close: +item[4],
                    volume: +item[5],
                    tickVolume: +item[8]
                })
            })
    } catch (e) {
        console.error(e);
    }
}

// let _oldTicks = 0;
// let _ticksShift = 0;
// function getTickCount() { let ticks= Date.now();  if () }


const _taskTimes : number[] = [];
let   _taskWaiting = false;


async function safeLoad(info: tInfoForLoad, limitBars :number) {
    let i=0;
    while(true) {
        const time= Date.now();
        const period = 61*1000; // минуту назад
        const oldTime= time - period;
        let iOld= BSearch(_taskTimes, oldTime, "greatOrEqual");
        let taskCount= iOld>=0 ? _taskTimes.length - iOld : 0;
        _taskTimes.splice(0, _taskTimes.length - taskCount);
        //console.log("tasks:",taskCount);
        if (taskCount < MAX_REQUESTS_PER_MINUTE) break;

        if (i++==0 && !_taskWaiting) console.log("Достигнут лимит частоты закачки. Ждём завершения минуты: ~"+Math.round((period-(time-_taskTimes[0]))/1000),"с");
        _taskWaiting= true;
        await sleepAsync(5);
    }
    const time= Date.now();
    _taskTimes.push(time);
    _taskWaiting= false;
    //console.log("push");
    try {
        return loadHistoryLimited(info, limitBars);
    }
    finally {
        // let i= BSearch(_taskTimes, time, "equal");
        // if (i==-1) throw "Не найден элемент в массиве";
        // _taskTimes.splice(i, 1);
    }
}


async function* historyLoaderBase(info: tInfoForLoad) {
    const timeValFrom= info.timeFrom.valueOf();
    const timeValTo= info.timeTo.valueOf();
    const leftToRight= info.timeFrom <= info.timeTo;
    const k= leftToRight ? 1 : -1;
    const tDelta= info.tf.msec * MAX_REQUEST_BARS - 1;
    let taskInfos : tInfoForLoad[] = [];
    let tasks : Promise<CBar[]|undefined>[] = [];
    for(let timeVal= timeValFrom;  (timeVal - timeValTo)*k <0;  timeVal += tDelta) {
        const taskTimeValTo= Math.min(timeVal + tDelta, timeValTo);
        let taskInfo : tInfoForLoad = {...info, timeFrom: new Date(timeVal), timeTo: new Date(taskTimeValTo)};
        if (!leftToRight) taskInfo= {...taskInfo, timeFrom: taskInfo.timeTo, timeTo: taskInfo.timeFrom };
        const task= safeLoad(taskInfo, MAX_REQUEST_BARS);
        //await task;
        //yield bars;
        tasks.push(task);
        taskInfos.push(taskInfo);
    }
    for(let [i,task] of tasks.entries()) {
        let result= await task;
        if (! result) { console.error("Failed to load history (task #"+i+"): ",taskInfos[i]); break; }
        yield {bars: result, hasNext: i<tasks.length-1};
    }
}

//function myIteratorWrapper(iterator :IterableIterator<any>) { for(let val of iterator) }

export async function* historyLoader(info: tInfoForLoad) {
    const leftToRight= info.timeFrom <= info.timeTo;
    const tf= info.tf;
    //let mainBars = new CBarsMutable(tf);
    const binanceTf= getBinanceBuildTimeframe(tf);
    if (! binanceTf) throw "Wrong timeframe: "+tf.name;
    //console.log(binanceTf.name);
    let fullHistory= new CQuotesHistoryMutable();

    for await(let {bars, hasNext} of historyLoaderBase({...info, tf: binanceTf})) {
        if (leftToRight)
              fullHistory.AddEndBars(bars, binanceTf);
        else  fullHistory.AddStartBars(bars, binanceTf);
        let mainBars= fullHistory.Bars(tf)!.data;
        if (tf!=binanceTf && hasNext)
            mainBars= leftToRight ? mainBars.slice(0, mainBars.length-1) : mainBars.slice(1);
        //else mainBars= [...mainBars];
        yield mainBars;
        //allBars.push(...bars);
    }
}

export async function* historyLoader2(info: tInfoForLoad) {
    const leftToRight= info.timeFrom <= info.timeTo;
    let lastLen=0;
    for await(let allBars of historyLoader(info)) {
        const slicedBars = leftToRight ? allBars.slice(lastLen) : allBars.slice(0, allBars.length-lastLen);
        lastLen= allBars.length;
        yield {bars: slicedBars, allBars}
    }
}

export async function historyLoadFull(info: tInfoForLoad, stopped? :()=>boolean) {
    let allBars : readonly CBar[] = [];
    for await(let bars of historyLoader(info)) {
        allBars= bars;
        if (stopped?.()) break;
    }
    return allBars;
}

export function historyLoadFull2(symbol :string, tf :TF, timeFrom :const_Date, timeTo :const_Date, stopped? :()=>boolean) {
    return historyLoadFull({symbol, tf, timeFrom, timeTo, isFutures: false}, stopped);
}


async function testBars() {
    console.time("Elapsed");
    let loader= historyLoader2({
        timeFrom: new Date("2022-01-01"), timeTo: new Date("2022-06-01"), symbol: "BTCUSDT", isFutures: false, tf: TF.H3
    });
    let i=0;
    let allBars : CBar[] = [];
    for await(let data of loader) {
        let bars= data.bars;
        console.log("#"+ ++i,". ",{count: bars.length, first: bars[0]?.time, last: bars.at(-1)?.time});
        allBars.push(...bars);
    }
    console.log("total",{count: allBars.length, first: allBars[0]?.time, last: allBars.at(-1)?.time});
    console.timeEnd("Elapsed");
}

async function testSymbols() {
    console.time("Elapsed");
    const isFutures= true;
    let symbols = await loadTradableBinanceSymbolNames(isFutures ? "futures" : "spot");
    if (!symbols) throw "Error!";
    for(let sym of symbols)
        console.log(sym);
    console.log("Total symbols: ",symbols.length);
    console.timeEnd("Elapsed");
}

//testSymbols();

//testBars();