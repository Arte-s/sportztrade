import {CQuotesHistory, CBar, const_Date, TF, CreateRandomBars, IBars} from "./MarketData"
//import {ParsedUrlQueryInput} from "querystring";
import { ParsedUrlQueryInputMy } from "./Common";


export type Comission = {
	readonly value: number;  // Значение комиссии
	readonly unit: string;   // Единица измерения (напр. $ или %)
}

export type ISymbolQuotesInfo = {
	readonly tickSize : number;  // размер тика
	readonly quoteCurrency : string;  // валюта котирования
}

export interface ISymbolQuotes extends ISymbolQuotesInfo {
	readonly name: string;       // имя
	readonly GetBars : (tf :TF,  startTime :const_Date,  endTime :const_Date) => Promise<readonly CBar[]|null>;  // Получение баров в диапазоне времени
	readonly GetBars2 : (tf :TF,  endTime :const_Date,  barDepth :number) => Promise<readonly CBar[]|null>;  // Получение баров по конечному времени и количеству баров
}

export type ISymbolInfo = Readonly<{
	name: string;  // короткое имя
	fullName?: string; // полное имя
	lotSize : number;   // размер лота
	comissionPerSide : Comission|null; // комиссия за сторону
	//priceInfo : ISymbolQuotesInfo;
	priceInfo : ISymbolQuotes;
}>


// export class CSymbolInfo implements ISymbolInfo {
// 	name: string;  // короткое имя
// 	fullName?: string; // полное имя
// 	lotSize : number;   // размер лота
// 	comissionPerSide : Comission|null; // комиссия за сторону
// 	priceInfo : ISymbolQuotesInfo;
// 	constructor() { }
// }


export interface ISymbolInfoExt extends ISymbolInfo {
	priceInfo : ISymbolQuotes;
}

// export class CSymbolInfo
// {
// 	name : string;      // имя символа
// 	lotSize : number;   // размер лота
// 	tickSize : number;  // размер тика
// 	comissionPerSide : Comission; // комиссия за сторону
// 	quoteCurrency : string;  // валюта котирования
// }


// export class CSymbolInfo2
// {
// 	data : ISymbolData;
// 	lotSize : number;   // размер лота
// 	comissionPerSide : Comission; // комиссия за сторону
// }


type CSymbolInfo_c = Readonly<ISymbolInfo>;



export class CSymbol
{
	readonly info : CSymbolInfo_c;

	readonly quotesHistory : CQuotesHistory;

	get name() { return this.info.name; }

	get lastPrice() : number|null { return this.quotesHistory.minTfBars?.last?.close ?? null; }

	constructor(info :CSymbolInfo_c, quotesHistory :CQuotesHistory) { this.info= info;  this.quotesHistory= quotesHistory; }

	static fromParsedJSON(data : ParsedUrlQueryInputMy<CSymbol>) : CSymbol { return new CSymbol(data.info as CSymbolInfo_c,  CQuotesHistory.fromParsedJSON(data.quotesHistory)); }
}

//type CSymbolData = Readonly<CSymbolData_m>;


function GetByName<T extends {name:string;}> (array :readonly T[], name :string) { return array.find((symbol)=> symbol.name==name); }


export class CSymbols extends Array<CSymbol>
{
	getByName(name : string) { return GetByName(this, name); }//this.find((symbol)=> symbol.name==name); }
	constructor(array : readonly CSymbol[])  { super(...array); }
}


let _symCounter= 0;


export function createVirtualSymbol(name? :string, bars? :IBars, comission=10, comissionType :"$"|"%"= "$") {

	name ??= "defaultSymbol"+(++_symCounter);

	let quotesHistory = new CQuotesHistory(bars ?? [], name);

	async function _GetBars(tf :TF,  startTimeOrEndTime :const_Date,  endTimeOrBarDepth :const_Date|number) {
		let bars= quotesHistory.Bars(tf);
		if (!bars) return null;
		if (typeof endTimeOrBarDepth=="object") {
			let startTime= startTimeOrEndTime;
			let endTime= endTimeOrBarDepth;
			return bars.getArray(startTime, endTime);
		}
		let endTime= startTimeOrEndTime;
		let i= bars.indexOfLessOrEqual(endTime);
		if (i==-1) return [];
		let depth= endTimeOrBarDepth;
		return bars.slice(Math.max(i-depth+1,0), i+1).data;
	}

	let quotesInfo : ISymbolQuotes = {
		tickSize: quotesHistory.tickSize,
		quoteCurrency: "$",
		name,

		GetBars(tf :TF,  startTime :const_Date,  endTime :const_Date) {  // Получение баров в диапазоне времени
			return _GetBars(tf, startTime, endTime);
		},
		GetBars2(tf :TF,  endTime :const_Date,  barDepth :number) {
			return _GetBars(tf, endTime, barDepth);
		},

	}

	let symbolInfo : ISymbolInfo = {
		name,  // короткое имя
		//fullName?: string; // полное имя
		lotSize : 1,   // размер лота
		comissionPerSide : { value: comission, unit: comissionType }, // комиссия за сторону
		//priceInfo : ISymbolQuotesInfo;
		priceInfo : quotesInfo
	}
	return new CSymbol(symbolInfo, quotesHistory);
}


