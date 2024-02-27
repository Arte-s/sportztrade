//
// import {
//     const_Date,
//     ISymbolInfo,
//     CTesterConfig,
//     ITesterInfo,
//     RunTest,
//     CBar,
//     IBars,
//     CTradeBar,
//     CTimeSeries,
//     IStrategy, IParamValues, CTradeHistory,
//     Comission,
//     sleepAsync, ICancelToken,
//     BSearch, CBars, CQuotesHistory, CSymbol, TesterTick
// } from "../Nav/TesterAPI";
//
// import {interfaceGraphAPI} from "../API";
// import {CGraphCanvas} from "./vgraf3";
// import {IIndicator} from "../Nav/Indicator";
// import {TradeStatistics} from "../Nav/TradeStatistics"
//
// import { TF, CDelayer } from "../Nav/Time";
//
//
// import {MyGeneticParams, OptimizateSimple} from "../Nav/Optimizer";
// import { DrawCandleChart, IChartApi, IChartMarker, ISeriesApi, Time, scrollChartToTime } from "../Nav/Chart/Chart"
// import {Eqvity} from "../ind/Eqviti"
//
//
//
// import * as TestWorker from "../Nav/testWorker"
// import * as lib from "../Nav/Common"
// import * as MyTester from "../Nav/MyTester"
//
// export {CParamStepper} from "../Nav/Strategy"
//
// export class TradeData { time! :const_Date;  volume! :number;  price!: number;  volumeTotal! :number }
//
//
//
// export class CTesterSpeed { value :number = Number.MAX_VALUE; }
//
//
// function TimeFloor(time :const_Date, tf :TF)  { return new Date(Math.floor(time.valueOf()/tf.msec)*tf.msec); }
//
//
//
//
// class Test{
//     LoadSymbolQuotes=(name :string)=>{
//         return MyTester.MsTradeSymbolQuotes(name, undefined, "USD");
//     }
//     async Test2 (
//         testerInfo :ITesterInfo,   // Инфа о тестировании
//         onBars? :(history :IBars, equityBars :CBar[], balance :{time :const_Date, value :number} [], complete?:boolean)=>any, // событие нового бара 100% вызывается в конце теста
//         onTrades? :(trades :readonly TradeData[]) =>any,  // обработчик сделок  100% вызывается в конце теста
//         speedRef? : Readonly<CTesterSpeed>,  // ссылка на значение скорости тестирования
//         onProgress? : (percent :number)=>void   // обработчик прогресса выполнения
//     ) : Promise<TradeStatistics>
//     {
//         let allbars : CBar[] = [];
//         let trades : TradeData[] = [];
//         let markers : IChartMarker[] = [];
//         let equityBars : CBar[] = [];
//         let _equityBars : CTradeBar[] = [];
//
//         let delayer= new CDelayer;
//         const getSpeed_= ()=> (speedRef?.value);
//         let useVisual= getSpeed_() && getSpeed_()! < Number.MAX_VALUE;
//         let balancePoints : {time :const_Date, value :number} [] = [];
//         let showProgressTime = 0;
//         let n = 0;
//
//         let _percent= 0;
//         // Запускаем таймер для обновления прогресса тестирования
//         let progressTimer = new lib.MyTimerInterval(50, ()=>onProgress?.(_percent), ()=>onProgress?.(_percent));
//
//         let init=false;
//         const ontick=async(tick :TesterTick, indicators :readonly IIndicator[], percent :number) =>
//         {
//             let newbars= tick.bars.slice(n);  n = allbars.push(...newbars);  // Возвращает итоговое число элементов
//             _percent= percent;
//
//             let tickPeriodTime= TimeFloor(tick.time, testerInfo.strategyTf);
//             let lastPrice= newbars.length>0 ? newbars[newbars.length-1].close : 0;
//             let isNewTrade = AddTrade(tick.time, tick.equityBar.volume, lastPrice, tick.volume, markers, trades);
//             equityBars.push({...tick.equityBar});
//             _equityBars.push(tick.equityBar);
//             let balance= isNewTrade ? tick.equityBar.close : (balancePoints.length>0 ? balancePoints[balancePoints.length-1].value : 0);
//             balancePoints.push( {time: tick.equityBar.time,  value: balance} );
//
//             if (useVisual) {
//                 if (onBars) onBars(new CBars(testerInfo.strategyTf ,allbars) ,equityBars ,balancePoints);
//                 if (isNewTrade && onTrades)  onTrades(trades);
//
//                 // Преобразовать скорость в задержку
//                 function speedToDelay_ms(speed :number|undefined) { return speed && speed>0 ?  5000 / Math.pow(1.08,  Math.max(speed-1, 0)) :  speed==0 ? 9999999999 : null; }
//                 // Выжидаем паузу:
//                 await delayer.sleepAsync(()=> speedToDelay_ms(getSpeed_()) );
//             }
//             if (getSpeed_()==-1) { console.log("Stopped");  return false; }
//             return true;
//         }
//         if (!testerInfo.symInfo.priceInfo)
//             testerInfo.symInfo.priceInfo= this.LoadSymbolQuotes(testerInfo.symInfo.name); //если не задано то берет занчение по умолчанию
//         console.log(testerInfo.symInfo.priceInfo);
//         let result = await RunTest(testerInfo,ontick// : { i = allbars.push(...tick.bars.slice(i));
//         );
//
//         if (onBars) onBars(new CBars(testerInfo.strategyTf ,allbars) ,equityBars ,balancePoints, true);
//         if (onTrades)  onTrades(trades);
//         progressTimer.stop();
//         // Добавить сделку
//         function AddTrade(time, volume, tradePrice, volumeTotal, markers :IChartMarker[], trades :TradeData[]):boolean {
//             if (!volume) return false;
//             trades.push({time, volume, price: tradePrice, volumeTotal});
//             return true;
//         }
//
//         let statistics= new TradeStatistics(_equityBars); //, testerInfo.symInfo.comissionPerSide);
//         return statistics;
//     }
//
//
//     async Test (
//         testerInfo :ITesterInfo,   // Инфа о тестировании
//         quotesChartDiv :interfaceGraphAPI,  // элемент графика котировок
//         equityChartDiv :Eqvity,  // элемент графика эквити
//         onTrades? :(trades :readonly TradeData[],  onclick? : (time :string)=>any) =>any,  // обработчик сделок
//         speedRef? : Readonly<CTesterSpeed>,  // ссылка на значение скорости тестирования
//         onProgress? : (percent :number)=>void   // обработчик прогресса выполнения
//     ) : Promise<TradeStatistics>
//     {
//         let allbars : CBar[] = [];
//         let trades : TradeData[] = [];
//         let markers : IChartMarker[] = [];
//         let equityBars : CTradeBar[] = [];
//         quotesChartDiv.ModeTest(true);
//
//         let delayer= new CDelayer;
//         const getSpeed_= ()=> (speedRef?.value);
//         let useVisual= getSpeed_() && getSpeed_() < Number.MAX_VALUE;
//
//         let balancePoints : {time :const_Date, value :number} [] = [];
//         let showProgressTime = 0;
//         let n = 0;
//
//         let _percent= 0;
//         // Запускаем таймер для обновления прогресса тестирования
//         let progressTimer = new lib.MyTimerInterval(50, ()=>onProgress(_percent), ()=>onProgress(_percent));
//
//         let init=false;
//         const ontick=async (tick, indicators, percent) =>
//         {
//             let newbars= tick.bars.slice(n);  n = allbars.push(...newbars);  // Возвращает итоговое число элементов
//             _percent= percent;
//
//             let tickPeriodTime= TimeFloor(tick.time, testerInfo.strategyTf);
//
//             let lastPrice= newbars.length>0 ? newbars[newbars.length-1].close : 0;
//             let isNewTrade = AddTrade(tick.time, tick.equityBar.volume, lastPrice, tick.volume, markers, trades);
//             //console.log(tick);
//             equityBars.push(tick.equityBar);
//             let balance= isNewTrade ? tick.equityBar.close : (balancePoints.length>0 ? balancePoints[balancePoints.length-1].value : 0);
//             balancePoints.push( {time: tick.equityBar.time,  value: balance} );
//
//             if (!init) {
//                 init=true;
//                 for (let i=0; i<tick.bars.length; i++) {
//                     equityChartDiv.PushBar(tick.equityBar);
//                 }
//             }
//
//             equityChartDiv.PushBar(tick.equityBar);
//             equityChartDiv.SetHistory(trades);
//             if (useVisual) {
//                 OnNewTick(tick.time,tick.bars, tick.equityBar, tick.volume, tickPeriodTime, isNewTrade, balance);
//
//                 // Преобразовать скорость в задержку
//                 function speedToDelay_ms(speed :number|undefined) { return speed && speed>0 ?  5000 / Math.pow(1.08,  Math.max(speed-1, 0)) :  speed==0 ? 9999999999 : null; }
//                 // Выжидаем паузу:
//                 await delayer.sleepAsync(()=> speedToDelay_ms(getSpeed_()) );
//             }
//             if (getSpeed_()==-1) { console.log("Stopped");  return false; }
//             return true;
//         }//
//         if (!testerInfo.symInfo.priceInfo)
//             testerInfo.symInfo.priceInfo= this.LoadSymbolQuotes(testerInfo.symInfo.name); //если не задано то берет занчение по умолчанию
//         console.log(testerInfo.symInfo.priceInfo);
//         let result = await RunTest(testerInfo,ontick// : { i = allbars.push(...tick.bars.slice(i));
//         );
//         progressTimer.stop();
//         // Событие нового тика
//         function OnNewTick(time :const_Date,  bars :readonly CBar[],  equityBar :CBar,  tradeVolumeTotal :number,  periodTime :const_Date,  isNewTrade: boolean,  balance :number)
//         {
//             let history=new CBars(testerInfo.strategyTf,bars);
//             quotesChartDiv.Set(testerInfo.symInfo.name,testerInfo.strategyTf,history);
//             if (isNewTrade) {
//                 onTrades(trades);
//             }
//         }
//         // Добавить сделку
//         function AddTrade(time, volume, tradePrice, volumeTotal, markers :IChartMarker[], trades :TradeData[]):boolean {
//             if (!volume) return false;
//             trades.push({time, volume, price: tradePrice, volumeTotal});
//             return true;
//         }
//
//         if (onTrades) onTrades(trades);
//         if (! useVisual)
//         {
//             if (!result.EquityBars) result.EquityBars = [];
//             let bars= new CBars(testerInfo.strategyTf, allbars);
//             quotesChartDiv.Set(testerInfo.symInfo.name,testerInfo.strategyTf,bars);
//         }
//
//         let statistics= new TradeStatistics(equityBars); //, testerInfo.symInfo.comissionPerSide);
//         return statistics;
//     }
//
//
//      async RunOptimization(
//         item : {symbolInfo : ISymbolInfo,  strategy : IStrategy},
//         tf :TF,
//         paramDatas : readonly IParamValues[],
//         testerConfig : Readonly<CTesterConfig>,
//         threadCount : number,
//         isGenetic : boolean|MyGeneticParams,
//         onresult :(params : readonly number[], result :CTradeHistory)=>Promise<boolean|void>,
//         cancelToken? : ICancelToken
//     )
//     {
//         if (!tf) { console.log("Timeframe is not defined");  throw "Timeframe is not defined"; }
//         let startTime= new Date(testerConfig.startTime.valueOf() - 499*tf.msec);
//
//         if (!item.symbolInfo.priceInfo) item.symbolInfo.priceInfo=this.LoadSymbolQuotes(item.symbolInfo.name);
//
//         let bars= await item.symbolInfo.priceInfo.GetBars(tf, startTime, testerConfig.endTime); //  MsTrade.GetQuotesCacheable(item.symbolInfo.name, tf, startTime, testerConfig.endTime);
//         if (!bars) return null;
//         let quotesHistory= new CQuotesHistory(new CBars(tf, bars), item.symbolInfo.name);
//         let symbol= new CSymbol(item.symbolInfo, quotesHistory);
//         const result = OptimizateSimple({symbol, strategy: item.strategy}, paramDatas, testerConfig, threadCount, isGenetic, onresult, cancelToken);
//
//         return result;
//     }
// }
//
// export const Tester=new Test();
//
// //import {verify} from "crypto";
// //-----------------------------------------------
//
//
