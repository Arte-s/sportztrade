import {
	CAccount,
	CMarketData, const_Date, CQuotesHistory,
	CQuotesHistoryMutable2,
	CSymbol,
	ISymbolInfo,
	CSymbols,
	CTimeSeries,
	CTraderEnvironment,
	E_MATCH,
	ITrader,
	Period,
	TF,
	CBars
} from "./TraderOld"

import {IParamValues, IStrategy, IStrategySignaller} from "./Strategy"

import {CTesterConfig, RunSignallerTest} from "./Tester"


import * as MsTrade from "./Data_MSTrade"
import {LoadQuotes} from "./Data_MSTrade";
import {Strategy_MA} from "./strategies/strategy_MA";


async function Check()
{
	let time= new Date();
	let sym= "btcusd";
	let tf= TF.H1;

	let bars= await MsTrade.LoadQuotes(sym, tf, new Date("2021-01-01"), new Date("2021-09-01"));
	//let res = await __LoadQuotes(TF.H1, new Date("2020.09.01"), new Date("2020.09.10"), ()=>print("Loaded"), ()=>print("Error"));
	//return res;
	console.log("ok.  Received:",bars.length,"bars.  Elapsed:", (new Date().valueOf()-time.valueOf())," ms");
	if (bars.length==0) return;

	let quotesHistory= new CQuotesHistory(new CBars(tf, bars), sym);

	//console.log(quotesHistory.minTf);

	//console.log(bars);

	//return;

	let symInfo :ISymbolInfo = {
		name: sym,
		lotSize: 10,
		comissionPerSide: { value: 10, unit: "USD" },
		tickSize: 1,
		quoteCurrency: "USD"
	}

	let signaller : IStrategySignaller = Strategy_MA.getSignaller([3,5])!;
	let symbol= new CSymbol(symInfo, quotesHistory);

	let testerConfig :CTesterConfig = {
		startTime : bars[0].time,
		endTime : bars[bars.length-1].time,
		tradeConfig : null, //CTradeConfig;
		startBalance : 10000,
		//defaultSymbol : null,
		//defaultTF : tf
	}

	let result = RunSignallerTest(signaller, tf, symbol, testerConfig);
}

await Check();