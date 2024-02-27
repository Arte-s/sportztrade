//import { prototype } from "assert";
import { TF } from "./MarketData"
import {CSymbol, CSymbols} from "./Symbol"


export * from "./MarketData"

export * from "./Symbol"



/*
declare global {
	interface Array<T> {
		protected getByName(name: string);// : CSymbol { return this.find((symbol)=> symbol.name==name); }}
	}

Array.prototype.getByName = function(name: string) { return this.find((symbol)=> symbol.name==name); }
*/



export class CMarketData
{
	symbols : Readonly<CSymbols>= new CSymbols([]); //  readonly CSymbol[]
	time? : const_Date;
}


type ITrade = {}


export class CTradeData
{
	orders: Order[] = [];
	trades: ITrade[] = [];
	requests: Order[] = [];
}

class CSymTradeData {
	position: number = 0;  // число лотов
	symbol: string;
	constructor(symbol : string)  { this.symbol= symbol; }
}

class CSymTradeDataExt extends CSymTradeData
{
	currentPrice? : number;
}


export class CAccount extends CTradeData
{
	//symDatas : { [key : string] : CTradeData; };
	symDatas : CSymTradeDataExt[] = [];
	symData(symbol : string) : CSymTradeDataExt|undefined { return this.symDatas.find((data)=>data.symbol==symbol); }
	balance: number = 0;
	equity: number = 0
	margin: number = 0;
	// market скорее всего не нужен здесь
	UpdateFromOrders(requests :Readonly<COrders>,  market :Readonly<CMarketData>) {
		for(let request of requests) {
			let symbol= request.symbol;
			let data= this.symData(symbol);
			if (!data) {
				let symdata= market.symbols.getByName(symbol);
				if (! symdata) { throw("Wrong symbol "+symbol); }
				data= new CSymTradeDataExt(symbol);
				data.currentPrice= symdata.lastPrice ?? undefined;
			}
			//data.
		}

	}

	UpdateFromMarket(market :Readonly<CMarketData>) : void {
		for (let data of this.symDatas) {
			let price = market.symbols.getByName(data.symbol)?.lastPrice;
			if (! price) continue;
			if (data.currentPrice!=null) this.equity += (price - data.currentPrice) * data.position;
			data.currentPrice= price;
		}
	}
}




interface ILogger
{
	print(...args : any[]) :any;
	alert(...args : any[]) :any;
}



export type CTraderEnvironment = { market : CMarketData, account : CAccount,  logger : ILogger }




type Order = {
	symbol : string;
	price? : number;
	volume : number;
}

class COrderResult { }


type COrders = Order[];


export interface ITrader
{
	OnInit(data : CTraderEnvironment) : boolean|COrders;  //OnStart(data : CTraderEnvironment) : COrders;
	OnDeinit(data : CTraderEnvironment) :void;
	OnTick(data : CTraderEnvironment, symbols? : readonly CSymbol[]) : COrders;
	//OnBar();
	OnTimer(data : CTraderEnvironment) : COrders;

	OnTradeTransaction(request : Order, result : COrderResult) :void;
}

