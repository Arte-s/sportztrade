import {
	const_Date,
	CBar,
	IBars,
	TF
} from "./Bars";

//import {FBinanceSymbols, FBinanceLoad} from "../and/loadHistoryBinance"
//import {loadTradableBinanceSymbolNames, historyLoadFull2} from "./binanceHistory";
import * as Binance from "./binanceHistory";
import * as MsTrade from "./Data_MSTrade";


export interface IHistorySource {
	readonly name? : string;
	getSymbols() : Promise<readonly string[]>;
	getBars(symbol :string, tf :TF, start :const_Date, end :const_Date) : Promise<readonly CBar[]|null>;
	getBars2(symbol :string, tf :TF, end :const_Date, barsCount :number) : Promise<readonly CBar[]|null>;
}


class CHistorySource_MsTrade implements IHistorySource {
	readonly name = "MsTrade";
	getSymbols() { return Promise.resolve(["BTCUSD", "ETHUSD", "LTCUSD", "XRPUSD"]); }
	getBars(symbol :string, tf :TF, start :const_Date, end :const_Date) { return MsTrade.LoadQuotesWithConversionTimeframe(symbol, tf, start, end); }
	getBars2(symbol :string, tf :TF, end :const_Date, barsCount :number) { return this.getBars(symbol, tf, new Date(end.valueOf() - barsCount*tf.msec), end)}
}
export const HistorySource_MsTrade = new CHistorySource_MsTrade();


// class CHistorySource_Binance { //implements IHistorySource {
// 	readonly name = "Binance";
// 	getSymbols() { return FBinanceSymbols(); }
// 	getBars(symbol :string, tf :TF, start :const_Date, end :const_Date) { return FBinanceLoad(symbol, tf, start, end); }
// 	getBars2(symbol :string, tf :TF, end :const_Date, barsCount :number) { return this.getBars(symbol, tf, new Date(end.valueOf() - barsCount*tf.msec), end)}
// }
class CHistorySource_Binance implements IHistorySource {
	readonly name = "Binance Spot";
	getSymbols() { return Binance.loadTradableBinanceSymbolNames().then((bars)=>bars??[]); }
	getBars(symbol :string, tf :TF, start :const_Date, end :const_Date) { return Binance.historyLoadFull2(symbol, tf, start, end); }
	getBars2(symbol :string, tf :TF, end :const_Date, barsCount :number) { return this.getBars(symbol, tf, new Date(end.valueOf() - barsCount*tf.msec), end)}
}


export const HistorySource_Binance = new CHistorySource_Binance();



type HistoryCache = Map<string, {tf :TF, startTime :const_Date, endTime :const_Date, bars :readonly CBar[]}>;


//const __symHistoryCache = new Map<string, {tf :TF, startTime :const_Date, endTime :const_Date, bars :readonly CBar[]}> ();


// Получить кэшируемые котировки

export async function GetQuotesCacheable(source :IHistorySource, symbol :string,  tf :TF,  startTime :const_Date,  endTime :const_Date, cache : HistoryCache)
	: Promise<readonly CBar[]|null>
{
	let key= symbol+" "+tf.name;

	let cachedData = cache.get(key);
	//console.log(cachedData, tf, startTime, endTime);
	//if (cachedData) console.log("ExistCacheData:", cachedData.tf, cachedData.startTime, cachedData.endTime);
	//console.log("!!!!", cachedData ? cachedData.tf+"  "+cachedData.startTime+"  "+cachedData.endTime : "");
	if (cachedData && cachedData.tf==tf && cachedData.startTime<=startTime && cachedData.endTime>=endTime) {
		console.log("Got quotes history from cache:",cachedData.bars.length,"bars");
		return cachedData.bars;
	}
	let localTime = Date.now();
	console.log("Start downloading quotes for ",key,"from",source.name);
	//let bars= await MsTrade.LoadQuotes(sym, tf, loadStartTime, endTime);
	let bars= await source.getBars(symbol, tf, startTime, endTime);
	if (! bars) return null;
	console.log("ok.  Received:",bars.length,"bars.  Elapsed:", Date.now()-localTime,"ms");
	if (bars.length==0) return null; //
	if (endTime < new Date(Date.now()-Math.max(tf.sec, 3600*8)*1000))  // Если не позднее прошлых суток или 8 часов
		cache.set(key,  {tf, startTime, endTime, bars});
	return bars;
}


// Источник с кэшируемыми котировками

export class CHistorySourceCacheable implements IHistorySource {
	private _source;
	private _cache : HistoryCache;
	constructor(source : IHistorySource) { this._source= source;  this._cache= new Map(); }
	clearCache() { this._cache.clear(); }
	getSymbols() { return this._source.getSymbols(); }
	getBars(symbol :string, tf :TF, start :const_Date, end :const_Date) { return GetQuotesCacheable(this._source, symbol, tf, start, end, this._cache); }
	getBars2(symbol :string, tf :TF, end :const_Date, barsCount :number) { return this.getBars(symbol, tf, new Date(end.valueOf() - barsCount*tf.msec), end)}
}


export class CHistoryCacheable_MsTrade extends CHistorySourceCacheable {
	constructor() { super(HistorySource_MsTrade); }
}

export class CHistoryCacheable_Binance extends CHistorySourceCacheable {
	constructor() {
		super(HistorySource_Binance);
	}
}
