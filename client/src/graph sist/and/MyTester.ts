import {
	CBar,
	CBars,
	const_Date,
	ISymbolInfo,
	CTesterConfig,
	CTimeSeries,
	CTradeBar,
	CTradeHistory,
	IParamValues,
	IStrategy,
	ITesterInfo,
	RunOptimization,
	RunTest,
	TesterTick, tTesterOnBar,
} from "../Nav/TesterAPI";
import {TF, CDelayer} from "../Nav/Time";

import {ISymbolQuotes} from "../Nav/Symbol"


import {ICancelToken} from "../Nav/Common"

import * as lib from "../Nav/Common"
import {MyGeneticParams} from "../Nav/Optimizer";

import {IHistorySource} from "../Nav/HistoryLoader"
import {TradeStatistics} from "../Nav/TradeStatistics";
import {IIndicator} from "../Nav/Indicator";

export {CParamStepper} from "../Nav/Strategy"


export function SymbolQuotesGetter(name :string, tickSize: number, quoteCurrency :string, source :IHistorySource) : ISymbolQuotes
{
	async function GetBars(tf :TF, start :const_Date, end :const_Date) { return source.getBars(name, tf, start, end); }
	async function GetBars2(tf :TF, end :const_Date, barsCount :number) { return source.getBars2(name, tf, end, barsCount); }

	return { name, tickSize, quoteCurrency, GetBars, GetBars2 };
}


export type TradeData = { time :const_Date|string;  volume :number;  price: number;  volumeTotal :number }

export type SymTradeData = TradeData & { symbol :string };



export class CTesterSpeed { value :number = Number.MAX_VALUE; }


function TimeFloor(time :const_Date, tf :TF)  { return new Date(Math.floor(time.valueOf()/tf.msec)*tf.msec); }




export async function Test0 (
	testerInfo :ITesterInfo,   // Инфа о тестировании
	onTick? :(trades :readonly TradeData[],  onclick? : (time :string)=>any) =>any,  // обработчик сделок
	speedRef? : Readonly<CTesterSpeed>,  // ссылка на значение скорости тестирования
	onProgress? : (percent :number)=>void   // обработчик прогресса выполнения
)
{

}


//
//
// export function SetChartAutoResize(chart :IChartApi, htmlElement : HTMLElement)
// {
// 	let lastParentSize : readonly[number?, number?] = [undefined, undefined];
// 	// @ts-ignore
// 	let $htmlElement = $(htmlElement);
//
// 	$htmlElement.on('mousemove', (()=>{
// 		let parentSize= [$htmlElement.width(), $htmlElement.height()] as const;
// 		if (parentSize[0]) {
// 			if (lastParentSize[0] && parentSize[0]!=lastParentSize[0]) {
// 				//console.log("resize:",parentSize[0]);
// 				//priceChart?.resize(parentSize[0], quotesChartDiv.height, true);
// 				//equityChart?.resize(parentSize[0], equityChartDiv.height, true);
// 				chart?.applyOptions({width:parentSize[0]}); //.priceScale().applyOptions()
// 				//equityChart?.timeScale()..applyOptions()
// 				//priceChart?.timeScale().fitContent();
// 				//console.log([parentSize[0], priceChart?.options().height], [parentSize[0], equityChart?.options().height]);
// 			}
// 			lastParentSize= [$htmlElement.width(), $htmlElement.height()] as const;
// 		}
// 	}));
// }



type tTestAnd = {
	testerInfo :ITesterInfo,   // Инфа о тестировании
	onTrades? :(trades :readonly TradeData[] ) =>any,  // обработчик сделок
	//speedRef? : Readonly<CTesterSpeed>,  // ссылка на значение скорости тестирования
	getSpeed? : ()=>number, // // получение значения скорости тестирования
	onProgress? : (percent :number)=>void  // обработчик прогресса выполнения
	onTick? :(data :tTesterOnBar)=>boolean|void|Promise<boolean|void>
	 }

type tTestHtml = {
	onTrades? :(trades :readonly TradeData[], onclick : (time :const_Date)=>any) =>any,  // обработчик сделок
	quotesChartDiv? :HTMLElement,  // элемент графика котировок
	equityChartDiv? :HTMLElement,  // элемент графика эквити
}

type tTestEl = {
	onTrades? :(trades :readonly TradeData[] ) =>any,  // обработчик сделок
	priceChart :any,  // элемент графика котировок
	equityChart :any,  // элемент графика эквити
}

export async function TestAnd ( data:tTestAnd & tTestHtml
) : Promise<[TradeStatistics, CTradeBar[]]> {
	const {onTrades} = data;
	// let priceChart = CreateMyChartArea(quotesChartDiv);
	// let equityChart = CreateMyChartArea(equityChartDiv);
	// @ts-ignore
//	let $chartsParent = $(equityChartDiv).parent();
	//
	// SetChartAutoResize(priceChart, $chartsParent[0]);
	// SetChartAutoResize(equityChart, $chartsParent[0]);

	// Скроллинг графиков
	function scrollCharts(time: const_Date) {
		// let timeRange= priceChart.timeScale().getVisibleRange()
		// if (timeRange) equityChart.timeScale().setVisibleRange(timeRange);
		// scrollChartToTime(priceChart, time);
		// //equityChart.timeScale().options().
		// //equityChart.timeScale().setVisibleRange(priceChart.timeScale().getVisibleRange());
		// scrollChartToTime(equityChart, time);
	}

	let onTrades_simple = onTrades ? (trades :readonly TradeData[])=>onTrades(trades, scrollCharts) : undefined;

	let [priceChart, equityChart] = [{},{}]

	return Test2And({...data,priceChart, equityChart, onTrades:onTrades_simple});
}



export const PriceChartColor = "#00FF00";



export async function Test2And (
	data:tTestAnd & tTestEl,
) : Promise<[TradeStatistics, CTradeBar[]]>
{
	const {onTrades,priceChart,equityChart,testerInfo,getSpeed} = data
	let {onProgress} = data;
//alert(testerInfo);
//return;
//let result= await RunTest (testerInfo,  undefined /*(tick, indicators)=>console.log("tick: ",tick)*/);//,  "chartDiv");
	let allbars : CBar[] = [];
	let trades : TradeData[] = [];
	// let markers : IChartMarker[] = [];
	let equityBars : CTradeBar[] = [];

	//let [priceChart, equityChart] : IChartApi[] = [];
	// let [priceSeries, equitySeries] : ISeriesApi<"Candlestick">[] = [];
	// let balanceSeries : ISeriesApi<"Line">;

	function MyEquityChart(api :any) {
		// let _equitySeries : ISeriesApi<"Candlestick">;
		// let _balanceSeries : ISeriesApi<"Line">;
		return {
			addEquityBars(bars :readonly CBar[]) {
				// if (!_equitySeries) {
				// 	[api, _equitySeries] = DrawCandleChart(bars, api, undefined, null, timeShift_s);
				// }
				// else for(let bar of bars) _equitySeries.update(bar);
			},
			addBalancePoints(points :{time :const_Date, value :number}[]) {
				// if (!_balanceSeries) {
				// 	_balanceSeries= api.addLineSeries({ color: "#3030FF", lineWidth: 1 });
				// 	_balanceSeries.setData(points);
				// }
				// else for(let bar of points) _balanceSeries.update(bar);
			}
			//equityChart.timeScale().setVisibleLogicalRange({ from: -3,  to: 2 });
			//priceChart.timeScale().subscribeVisibleTimeRangeChange((range)=>equityChart.timeScale().setVisibleRange(range));
			//equityChart.timeScale().subscribeVisibleTimeRangeChange((range)=>priceChart.timeScale().setVisibleRange(range));
		}
	}

	let myEquityChart= MyEquityChart(equityChart);

	//equityChartDiv.onwheel = (e)=> console.log("!!!",equityChart); //e.deltaY);

	let indDatas :CTimeSeries[] = []; //let indName : string[] = [];
	//let indChartSeries : ISeriesApi<"Line">[] = [];
	//let indChartSeriesWrappers : ReturnType<typeof createNewSeriesWrapper>[] = [];
	let indChartSeriesWrappers: ReturnType<typeof createNewSeriesWrapper>[] = [];//ReturnType<typeof createNewSeriesWrapper>[] = [];
	let indColors : string[]= ['#FFFF00', '#FF06FF']; // yellow,  green



	function createNewSeriesWrapper (newSeries :any) {
		let _empty= true;
		return {
			addData(data :any[]) {
				// if (! (data instanceof Array)) data= [data];
				// if (_empty) { newSeries.setData(data); _empty= false; }
				// else for(let item of data) newSeries.update(item);
			}
		}
	}

//	const createNewLineSeriesWrapper = createNewSeriesWrapper<"Line">();

	function indicatorSeries(i :number) {
		return indChartSeriesWrappers[i] ??= createNewSeriesWrapper( priceChart.addLineSeries({ // = chart.addLineSeries({
			color: indColors[i]!=undefined ? indColors[i] : '#FFFFFF',  //white
			lineWidth: 1,
		}) );
	}

	let markers:any = undefined
	const timeShift_s = 0; //3600*6;
	let delayer= new CDelayer;

	const getSpeed_= ()=> (getSpeed?.() ?? undefined); // { return speedRef?.value; }

	let useVisual= (getSpeed_() ?? 0) < Number.MAX_VALUE;
	let balancePoints : {time :const_Date, value :number} [] = [];  // точки баланса
	let showProgressTime = 0;
	let priceChartColor = PriceChartColor; //'rgb(0,255,0)'
	//alert("use visual="+useVisual+"  "+speedRef.value);
	//let printTimer=0;
	let n = 0;

	let _percent= 0;
    onProgress??= ()=>{}
	// Запускаем таймер для обновления прогресса тестирования
	let progressTimer = new lib.MyTimerInterval(50, ()=>(onProgress!(_percent)), ()=>onProgress!(_percent));

	let tf= testerInfo.config.tf ?? testerInfo.strategyInfo.paramsData.tf !;
	if (! tf) throw "tf is not defined";

	console.log(testerInfo);
	let result = await RunTest(testerInfo,
		async ({tick, indicators, percentOfComplete}) =>
		{
			data.onTick?.({tick, indicators, percentOfComplete})
			//
			// console.log(percent);
			// console.log(tick);
			//
			//
			//
			// let newbars= tick.bars.slice(n);  n = allbars.push(...newbars);  // Возвращает итоговое число элементов
			// _percent= percent ?? 0;
			// //if (tick.volume!=0)
			// 	//console.log(tick);
			// let tickPeriodTime= TimeFloor(tick.time, tf);
			// if (indicators && indicators.length > indDatas.length) indDatas.length= indicators.length;
			// let indValues= [];
			// if (indicators)
			// 	for(let i=0; i<indicators?.length ??0; i++) {
			// 		indDatas[i] ??= new CTimeSeries();
			// 		let val= indicators[i].value();
			// 		// Отбрасываем значение времени к началу бара, т.к. иначе будут проблемы с пропуском баров на графике
			// 		if (val !=null)  indDatas[i].points.push({time: tickPeriodTime,  value: val});
			// 		indValues[i]= val;
			// 		indDatas[i].name ??= indicators[i].name;
			// 	}
			// let lastPrice= newbars.length>0 ? newbars[newbars.length-1].close : 0;
			// let equityBar= tick.equityBar!;
			// let isNewTrade = AddTradeToArrays(tick.time, equityBar.volume, lastPrice, tick.volume, markers, trades);
			// //console.log(tick);
			// equityBars.push(equityBar);
			// let balance= isNewTrade ? equityBar.close : (balancePoints.length>0 ? balancePoints[balancePoints.length-1].value : 0);
			// balancePoints.push( {time: equityBar.time,  value: balance} );
			//
			// //console.log("tickTime ",tick.time,"  newbars: ",newbars.length);
			//
			// if (useVisual) {
			// 	OnNewTick(tick.time, newbars, equityBar, tick.volume, indValues, tickPeriodTime, isNewTrade, balance);
			// 	// Преобразовать скорость в задержку
			// 	function speedToDelay_ms(speed :number|undefined) { return speed && speed>0 ?  5000 / Math.pow(1.08,  Math.max(speed-1, 0)) :  speed==0 ? 9999999999 : null; }
			// 	// Выжидаем паузу:
			// 	await delayer.sleepAsync(()=> speedToDelay_ms(getSpeed_()) );
			// }
			//
			// if (getSpeed_()==-1) { console.log("Stopped");  return false; }
			return true;
		}// : { i = allbars.push(...tick.bars.slice(i));
	);
	console.log("Result bars: ", allbars.length);


	progressTimer.stop();

	/*
	function ScrollChartToTime(chart : IChartApi,  barsSeries : readonly CBar[], time :Time) { //position : number) {
		let range= chart.timeScale()?.getVisibleLogicalRange();
		let rangeSize= range ? range.to.valueOf() - range.from.valueOf() : 0; //if (range)alert(range.from+"  "+range.to);
		chart.timeScale().scrollToPosition(-(allbars.length-1-i - rangeSize/2), true);
	}
	*/


	// Событие нового тика
	function OnNewTick(time :const_Date,  bars :readonly CBar[],  equityBar :CBar,  tradeVolumeTotal :number,  indValues :readonly (number|null)[],  periodTime :const_Date,  isNewTrade: boolean,  balance :number)
	{
		//let lastPrice= bars.length>0 ? bars[bars.length-1].close : 0;
		//let isNewTrade = AddTrade(time, equityBar.volume, lastPrice, tradeVolumeTotal, markers, trades)
		// if (!priceSeries) { [priceChart, priceSeries] = DrawCandleChart(bars, priceChart, priceChartColor, null, timeShift_s); }// console.log("Group: ",bars); }
		// 		// else {
		// 		// 	//for (let bar of bars) { console.log("Updating ",bar);  series.update(bar);  console.log("Updated"); }
		// 		// 	for (let bar of bars) priceSeries.update(bar);
		// 		// }

		if (isNewTrade) {
		//	priceSeries.setMarkers(markers);
			//chart.options().rightPriceScale.autoScale= false;
			//options.rightPriceScale.scaleMargins= { bottom: 0.05, top: 0.1 };
			if (onTrades) onTrades([trades[trades.length - 1]]);
		}
		// Отрисовываем значения индикаторов
		for (let ind=0; ind<indValues.length; ind++) {
		//	if (indValues[ind]!=null)
				// Берём время на начало бара, а не конца, иначе будут пропускаться бары на графике
			//	indicatorSeries(ind).addData({time: periodTime, value: indValues[ind]!});
		}
		if (!equityBar) return;
		myEquityChart.addEquityBars([equityBar]);
		myEquityChart.addBalancePoints([{time: equityBar.time, value: balance}]);
		//return 0;
	}


	// Добавить сделку
	function AddTradeToArrays(time :const_Date, volume :number, tradePrice :number, volumeTotal :number, markers :any[], trades :TradeData[]) {
		if (!volume) return false;
		let volumeStr= lib.DblToStrAuto(Math.abs(volume), -3);
		let markerTime = TimeFloor(time, tf);
		if (volume < 0) {
			markers.push({
				time: markerTime,
				position: 'aboveBar',
				color: '#e91e63',
				shape: 'arrowDown',
				//text: 'Sell ' + volumeStr
				text: volumeStr
			});
		} else {
			markers.push({
				time: markerTime,
				position: 'belowBar',
				color: '#2196F3',
				shape: 'arrowUp',
				//text: 'Buy ' + volumeStr
				text: volumeStr
			});
		}
		trades.push({time, volume, price: tradePrice, volumeTotal});
		return true;
	}

	//if (useVisual)  return;

	if (! useVisual && result)   // Не визуальное тестирование
	{
		result.EquityBars ??= [];

		//for (let i = 0; i < result.EquityBars.length; i++) { let bar = result.EquityBars[i]; AddTrade(bar.time, bar.volume, 0, result.points[i].value.volume, markers, trades); }

		if (onTrades) onTrades(trades);

		//FillTradeTable([{time: 100, volume: 1, volumeTotal: 10}]);
		//markers=[];
		// Рисуем график котировок
		//[priceChart] = DrawCandleChart(allbars, priceChart, priceChartColor, markers, timeShift_s);

		// Перебираем индикаторы и отрисоваем их
		//if (0)
		// for (let [ind,indData] of indDatas.entries()) {
		// 	indicatorSeries(ind).addData(indData.points);
		// }
		//console.log(result.EquityBars);

		if (result.EquityBars) {
			myEquityChart.addEquityBars(result.EquityBars); // Отрисовка баров эквити
			myEquityChart.addBalancePoints(balancePoints); // Отрисовка линии баланса
		}

		// Делаем видимым весь график теста
		let bars= new CBars(tf, allbars);
		let startTime= testerInfo.config.startTime;
		let i= bars.indexOfLessOrEqual(startTime);
		i= Math.max(i-5, 0);
		if (bars.length>0) { //startTime= new Date(Math.min(bars.time(i).valueOf(), startTime.valueOf()));
			let range = {from: bars.time(i), to: testerInfo.config.endTime};
			//console.log(new Date(testerInfo.config.endTime.valueOf() + testerInfo.tf.msec*50));
			priceChart.timeScale().setVisibleRange(range);
			equityChart.timeScale().setVisibleRange(range);
		}
	}

	let statistics= new TradeStatistics(equityBars); //, testerInfo.symInfo.comissionPerSide);
	return [statistics, equityBars];
}



//import {verify} from "crypto";
//-----------------------------------------------

export async function Optimizate(
	item : {symbolInfo : ISymbolInfo,  strategy : IStrategy},
	tf :TF, // таймфрейм
	paramDatas : readonly IParamValues[],  // массивы значений по параметрам
	testerConfig : Readonly<CTesterConfig>,   // конфигурация тестера
	threadCount : number,  // число потоков
	genetic : boolean|MyGeneticParams|null|undefined,  // Параметры генетики
	onResult :(params : readonly number[], result :TradeStatistics, equityValues :readonly number[])=>Promise<void>,  // обработчик результата
	cancelToken? : ICancelToken  // токен отмены    //speedRef : Readonly<CTesterSpeed>
)
{
	//let defaultTreadCount= 4;
	//let nThreads= isNaN(threadCount) ? defaultTreadCount : threadCount;
	//alert(maxThreads);  return;
	///if (1) { await TestWorker.Test(nThreads);  return; }

	await RunOptimization(item, tf, paramDatas, testerConfig, threadCount, genetic,
		(params : readonly number[], result :CTradeHistory)=>
			{
				let statistics= new TradeStatistics(result?.EquityBars ?? []); //, item.symbolInfo.comissionPerSide);
				let equityValues= result?.points.map((point)=>point.value.equity);
				onResult(params, statistics, equityValues);
				//if (speedRef && speedRef.value<0) return false;
				return true;
			}, cancelToken);
}


export const MsTradeSymbolQuotes = (name: string, smth:string|undefined, currency: string) => {
	console.log(name, smth, currency)
}