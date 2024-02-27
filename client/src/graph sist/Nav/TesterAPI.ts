import { E_MATCH, ICancelToken } from "./Common"

import {
	CAccount,
	CMarketData,
	CQuotesHistoryMutable2,
	ISymbolInfo,
	CSymbols,
	CTimeSeries,
	CTraderEnvironment,
	ITrader,
	Period, ISymbolInfoExt,
} from "./TraderOld"

import {CBars, CBar, TF} from "./Bars";
import { CSymbol } from "./Symbol"
import { CQuotesHistory } from "./MarketData"
import {IStrategyObject, getSignaller, IStrategyCommonObject, getTraderOrSignaller} from "./Strategy";


import {
	ITesterConfig,
	TesterTick,
	RunStrategyTest,
	CTradeHistory, tTesterOnBar,
} from "./Tester"

import {
	OptimizateSimple,
	MyGeneticParams,
} from "./Optimizer"


//import * as MsTrade from "./Data_MSTrade"

import {IParamValues, IStrategy, IStrategySignaller} from "./Strategy";
import {IIndicator} from "./Indicator";
//import {Strategy_MA} from "./Strategy_MA";


export * from "./Tester"
export * from "./TraderOld"
export * from "./Strategy"

//export {CMyWorker} from "./MyWorker";

//export {CTesterWorker} from "./TesterWorker";
//export {OnMessage} from "./TesterWorker";
//export {WorkerResultMsg} from "./TesterWorker";
//export {TRANSFER_BINARY_TRADE_HISTORY} from "./TesterWorker";

//export {TesterTaskInfo} from "./TesterWorker";



//----------------------------------




export class CTesterInfo
{
	symInfo! :ISymbolInfo;      // Инфа по символу
	strategyInfo! :IStrategyCommonObject;
	config! :ITesterConfig;     // Конфигурация тестера

	constructor(info :ITesterInfo);
	constructor(symInfo :ISymbolInfo, stratInfo :IStrategyCommonObject, config :ITesterConfig);

	constructor(info :ISymbolInfo|ITesterInfo, stratInfo? :IStrategyCommonObject, config? :ITesterConfig) {
		return Object.assign<CTesterInfo, Partial<ITesterInfo>>(
			this,
			(info as ITesterInfo).config ? <ITesterInfo> info : <ITesterInfo>{ symInfo: info, strategyInfo: stratInfo, config }
		);
	}//
}

export type ITesterInfo = Readonly<CTesterInfo>;





//import { ChartBar, DrawChart } from "./Chart"

//function ff(f :()=>any) { }

//,  div? :string



export async function LoadSymbolQuotesForTesterInfo(info :ITesterInfo)  : Promise<CQuotesHistory|null>
{
	//console.log("Startegy: ",{...info.strategy});
	//console.log("Params: ",[...info.strategyParams]);
	let startTime = info.config.startTime;
	let endTime = info.config.endTime;
	let symName = info.symInfo.name;
	let strategyInfo= info.strategyInfo;
	let strategyTf  = strategyInfo.paramsData.tf;

	let trader = getTraderOrSignaller(strategyInfo);
	if (!trader) {
		console.log("Failed to get signaller: ");
		let params= strategyInfo.paramsData.params;
		console.log("Strategy: ", {...strategyInfo.strategy}, "\n", "Params: ", params instanceof Array ? [...params] : params);
	}
	if (!trader) {
		return null;
	}

	let tf= info.config.tf ?? strategyTf;
	if (! tf) throw "timeframe is not defined";

	let minbars = trader.minRequiredDepthBars;
	if (minbars==null) minbars = 1;
	if (tf!=strategyTf && strategyTf)
		minbars *= strategyTf.sec/tf.sec;
	let loadStartTime = new Date(startTime.valueOf() - minbars * tf.msec);

	//let bars= await MsTrade.LoadQuotes(sym, tf, loadStartTime, endTime);
	let bars= await info.symInfo.priceInfo.GetBars(tf, loadStartTime, endTime);  // MsTrade.GetQuotesCacheable(sym, tf, loadStartTime, endTime);
	if (!bars) return null;
	//let res = await __LoadQuotes(TF.H1, new Date("2020.09.01"), new Date("2020.09.10"), ()=>print("Loaded"), ()=>print("Error"));
	//return res;

	let quotesHistory= new CQuotesHistory(new CBars(tf, bars), symName);

	return quotesHistory;
}



export async function RunTest(
	info :ITesterInfo,
	//onTick :(testerTick :TesterTick, indicators? :readonly IIndicator[], percent? :number)=>Promise<boolean|void>
	onTick :(data :tTesterOnBar)=>boolean|void|Promise<boolean|void>
)
	: Promise<CTradeHistory|null>
{
	let quotesHistory= await LoadSymbolQuotesForTesterInfo(info);
	if (!quotesHistory) return null;

	let symbol= new CSymbol(info.symInfo, quotesHistory);
	// let signaller= getSignaller(info.strategyInfo);
	// if (! signaller) return null;
	//
	// let result = await RunSignallerTest(signaller, info.strategyInfo.paramsData.tf, symbol,  info.config,
	// 	onTick ? (testerTick, percent)=>onTick(testerTick, signaller!.indicators, percent) : undefined
	// );


	console.log(info.strategyInfo);
	console.log(symbol);

	let result = await RunStrategyTest(info.strategyInfo, symbol, info.config, onTick);

	console.log("Equity:",[result?.toStrings()]);
	/*
	let chartBars= new Array<ChartBar>(bars.length);
	for(let i=0; i<bars.length; i++) {
		let bar= bars[i];
		//chartBars[i] = {date: bar.time.toISOString(),  open: bar.open,  high: bar.high,  low: bar.low,  close: bar.close};
	}*/
	//console.log("Drawing chart...");
	//DrawChart(div, chartBars);
	//console.log("Drawing is over.");
	return result;
}


//--------------------------------------------

export async function RunOptimization(
	item : {symbolInfo : ISymbolInfo,  strategy : IStrategy},
	tf :TF,
	paramDatas : readonly IParamValues[],
	testerConfig : ITesterConfig,
	threadCount : number,
	genetic : boolean|MyGeneticParams|null|undefined,
	onResult :(params : readonly number[], result :CTradeHistory)=>boolean|void, //Promise<boolean|void>,
	cancelToken? : ICancelToken
)
{
	/*
	let info : CTesterInfo = {
		symInfo: item.symbolInfo,
		strategy: item.strategy,
		strategyParams: [],
		tf: testerConfig.defaultTF;
		config: testerConfig
	};

	let quotesHistory= await LoadSymbolQuotesForTesterInfo(info);
	if (!quotesHistory) return null;
	*/
	if (!tf) { console.log("Timeframe is not defined");  throw "Timeframe is not defined"; }
	let startTime= new Date(testerConfig.startTime.valueOf() - 499*tf.msec);

	let bars= await item.symbolInfo.priceInfo.GetBars(tf, startTime, testerConfig.endTime); //  MsTrade.GetQuotesCacheable(item.symbolInfo.name, tf, startTime, testerConfig.endTime);
	if (!bars) return null;
	//let res = await __LoadQuotes(TF.H1, new Date("2020.09.01"), new Date("2020.09.10"), ()=>print("Loaded"), ()=>print("Error"));
	//return res;

	let quotesHistory= new CQuotesHistory(new CBars(tf, bars), item.symbolInfo.name);

	let symbol= new CSymbol(item.symbolInfo, quotesHistory);

	let result = await OptimizateSimple({symbol, strategy: item.strategy}, paramDatas, testerConfig, threadCount, genetic, onResult, cancelToken);

	return result;
}
