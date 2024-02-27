/// <reference no-default-lib="true"/>
/// <reference lib="esnext"/>

import {CSymbol, CSymbols} from "./Symbol"

import {
    CBar,
    CBarBase,
    CTimeSeries,
    CTimeSeriesBase,
    OHLC,
    Period,
    TF
} from "./Bars"

import {CQuotesHistoryMutable2} from "./MarketData"

import {
    getTraderExt,
    getTraderOrSignaller,
    IStrategyCommonObject,
    IStrategyObjectNew,
    IStrategySignaller,
    StrategySignal
} from "./Strategy"

// import {Strategy_MA} from "./Strategy_MA";
// import {Strategy_Pan} from "./Strategy_Pan"
// import {Strategy_Lana} from "./Strategy_Lana";

import {ByteStreamR, ByteStreamW} from "./ByteStream"
import {IIndicator} from "./Indicator";
import {CAccount, CMarketData, CTraderEnvironment, ITrader} from "./TraderOld";
import {sleepAsync, ICancelToken, ParsedUrlQueryInputMy} from "./Common";

import * as TraderNew from "./Trader"
import {Trader, traderCallbacksDefault} from "./Trader"
import {OrderID} from "./Orders"
import {IndicatorData} from "../and/interface/IIndicator";
//import {__lastMessageTask, OnMessage, TesterTaskInfo, WorkerResultMsg} from "./TesterWorker";
//import {TraderExt} from "../ind/Trader";


export * from "./TraderOld";

//import {length} from "@amcharts/amcharts4/.internal/core/utils/Iterator";

export * from "./Strategy";




function CBar_read(stream :ByteStreamR) : CBar { return new CBar(stream.readDate(), stream.readDouble(), stream.readDouble(), stream.readDouble(), stream.readDouble(), stream.readDouble(), stream.readInt32()); }

function CBar_write(stream :ByteStreamW, bar :CBar) : boolean { return stream.pushDate(bar.time)?.pushNumbers([bar.open, bar.high, bar.low, bar.close],"double")?.pushDouble(bar.volume)?.pushInt32(bar.tickVolume) !=null; }




export class CTradeBar extends CBarBase
{
    readonly comission :number;  // Комиссия на заданном баре
    readonly buyVolume :number;
    readonly buyTickVolume :number;

    constructor(data :ITradeBar) {
        super(data);
        this.comission= data.comission;
        this.buyVolume= data.buyVolume;
        this.buyTickVolume= data.buyTickVolume;
    }
    static fromParsedJSON(data :ParsedUrlQueryInputMy<CTradeBar>) { let bar= CBar.fromParsedJSON(data);  return bar ? new CTradeBar({...bar, comission: data.comission, buyVolume: data.buyVolume, buyTickVolume: data.buyTickVolume}) : null; }

    static read(stream :ByteStreamR) : CTradeBar { let bar= CBar_read(stream);  return new CTradeBar({...bar, comission: stream.readDouble(), buyVolume: stream.readDouble(), buyTickVolume: stream.readInt32()}); }

    static write(bar :ITradeBar, stream :ByteStreamW) { return CBar_write(stream, bar) && stream.pushDouble(bar.comission)!=null && stream.pushDouble(bar.buyVolume)!=null && stream.pushInt32(bar.buyTickVolume)!=null; }

    write(stream :ByteStreamW) : boolean { return CTradeBar.write(this, stream); } //CBar_write(stream, this) && stream.pushDouble(this.comission)!=null && stream.(this.comission)!=null; }
}

export type ITradeBar = Omit<CTradeBar,"write">;

// abstract class A {
//     abstract readonly points : number[];  // здесь почему-то автоматически вызывается  set points(undefined)
//     constructor() { }
// }
//
// class B extends A {
//     private _points : number[] = [];
//     get points() { return this._points; }
//     set points(points :number[]) { this._points= [...points]; } // здесь вылетает ошибка!
// }
//
// let object = new B();


export class CTradeHistory extends CTimeSeriesBase< Readonly<{equity :number, volume :number}> >
{
    private data : CTimeSeries<{equity :number, volume :number}> = new CTimeSeries(); //почему - то не создаться этот класс, после инициализации класса возвращает data = ubdefined
    get points() { return this.data.points; }
    constructor() {
        super(); // выполняет команду возврата прокси после конструктор вырубается   	return new Proxy();
        //console.warn("этот код никогда не выполниться сам console.log не будет вызван!");
        //this.data = new CTimeSeries();
        //console.warn("этот код никогда не выполниться сам console.log не будет вызван!!!!");
         /// этот код никогда не выполниться сам console.log не будет вызван
        // console.log({data:this.data},"этот код никогда не выполниться!!!!!!"); /// этот код никогда не выполниться сам console.log не будет вызван
    }
    set points(points) {
        console.assert(this.data!=null); //this.data??= new CTimeSeries(); // временно
        this.data.points= [...points]; };
    get name()  {
        return this.data.name; }
    set name(name) {
        console.assert(this.data!=null); //this.data??= new CTimeSeries(); // временно
        this.data.name = name;
    }

    EquityHistory?: CTimeSeries;
    VolumeHistory?: CTimeSeries;
    EquityBars: CTradeBar[] = [];
    tradesCount : number = 0;

    //toString() { return this.points.reduce((prevStr, point)=>point.time.toString()+", ")}
    get pointsExt() {
        return this.points.map((point) => ({
            time: point.time,
            equity: point.value.equity,
            volume: point.value.volume
        }));
    }

    toStrings() {
        return this.points.map((pnt) => "time: " + pnt.time.toISOString() + ", equity: " + pnt.value.equity + ", volume: " + pnt.value.volume);
    } //JSON.stringify(tradeEquity.points,undefined).replace(/"([^"]+)":/g, '$1:'));

     override toString() : string { return this.toStrings().join(",\n"); }
    //JSON.stringify(tradeEquity.points,undefined).replace(/"([^"]+)":/g, '$1:'));


    pushPoint(time: const_Date, value: number, volume: number) {
        return this.points.push({time, value: {equity: value, volume}});
    }

    // pushBar1(time: const_Date, ohlc: OHLC, deltaVolume: number, comission: number, totalVolume: number)
    // {
    //     this.pushBar2(new CTradeBar(time, ohlc, deltaVolume, comission), totalVolume);
    // }

    pushBar(bar: CTradeBar, totalVolume: number) : void {
        this.pushPoint(bar.time, bar.close, totalVolume);
        this.EquityBars ??= [];
        this.EquityBars.push(bar);  //return this.pushBar(bar.time, new OHLC(bar.open, bar.high, bar.low, bar.close), bar.volume, totalVolume);
    }

    static fromParsedJSON(parsedHistory: ParsedUrlQueryInputMy<CTradeHistory>) {
        let data = (parsedHistory as unknown as CTradeHistory).data;
        if (!data) throw "CTradeHistory: data is not found in parsed object";
        let parsedData = data as unknown as ParsedUrlQueryInputMy<typeof data>;
        //let aaa : ParsedUrlQueryInputMy<CTimeSeries<number>> = { };
        let obj : CTradeHistory = Object.assign(new CTradeHistory(), { ...parsedHistory, data: CTimeSeries.fromParsedJSON(parsedData) });
        obj.EquityHistory = CTimeSeries.fromParsedJSON(parsedHistory.EquityHistory as any) as CTimeSeries|undefined;
        obj.VolumeHistory = CTimeSeries.fromParsedJSON(parsedHistory.VolumeHistory as any);
        obj.EquityBars = parsedHistory.EquityBars?.map((barData) => CTradeBar.fromParsedJSON(barData) ?? (()=>{throw "null bar!"})()) ?? [];
        return obj;
    }

    write(stream :ByteStreamW) : boolean {
        let ok = this.data.write(stream, (stream, dataPoint)=> stream.pushDouble(dataPoint.equity).pushDouble(dataPoint.volume)!=null);
        //print("w:  (ok="+ok+"\n",stream);
        ok &&= stream.pushBool(this.EquityHistory!=null) && this.EquityHistory?.write(stream, "double")!=false;

        ok &&= stream.pushBool(this.VolumeHistory!=null) && this.VolumeHistory?.write(stream, "double")!=false;

        return ok && stream.pushArray(this.EquityBars)!=null;
    }

    static read(stream :ByteStreamR) : CTradeHistory {
        let timeseries : CTimeSeries<{equity :number, volume :number}>
            = CTimeSeries.read(stream, (stream)=> ({ equity: stream.readDouble(), volume: stream.readDouble() }));
        let obj= new CTradeHistory();
        Object.assign(obj, timeseries);
        //print("r:\n",stream);
        if (stream.readBool()) obj.EquityHistory= CTimeSeries.read(stream, "double");

        if (stream.readBool()) obj.VolumeHistory= CTimeSeries.read(stream, "double");

        obj.EquityBars = stream.readArray(CTradeBar);
        return obj;
    }
}


    //static seriesToBinary(series : CTimeSeries) { }

/*
static toBinary<T extends {[key in keyof T]: number} | { toBinary();}> (obj : CTimeSeries<T>) {
	//if (obj.points[0]. );
	const buffer = new ArrayBuffer(obj.points.length);  const view = new DataView(buffer);
	DataView.
}
*/


export class CTestResult extends CAccount
{
    EquityHistory : CTimeSeries= new CTimeSeries<number>();
}

// Конфигурация торговли
class CTradeConfig {  }
type ITradeConfig = { }


// Конфигурация тестирования

export class CTesterConfig
{
    startTime : const_Date;  // Начальная дата
    endTime : const_Date;    // Конечная дата
    tradeConfig? : ITradeConfig|null;  // Конфигурация торговли
    startBalance : number = 0;  // Начальный баланс
    tf? : TF;  // Таймфрейм тестирования
    //defaultSymbol? : string;  // Символ по умолчанию
    //defaultTf? : TF;          // Таймфрейм по умолчанию

    constructor(startTime :const_Date, endTime :const_Date, startBalance =0) { this.startTime= startTime;  this.endTime= endTime;  this.startBalance= startBalance; }

    static fromParsedJSON(data: ParsedUrlQueryInputMy<CTesterConfig>) : CTesterConfig {
        //let tf = data.defaultTf ? TF.fromSec(data.defaultTf.sec) : undefined;
        return {
            startTime: new Date(data.startTime),
            endTime: new Date(data.endTime),
            tradeConfig: data.tradeConfig ? Object.assign(new CTradeConfig(), data.tradeConfig) : undefined,
            startBalance: data.startBalance,
            tf: data.tf ? TF.all[data.tf.index] : undefined
        };//,  defaultSymbol: data.defaultSymbol,  defaultTf: tf };
    }
}

export type ITesterConfig = Readonly<CTesterConfig>

//export type CTesterConfig = Readonly<CTesterConfig_mut>;


export class CLogger
{
    print(...args : any[]) { console.log(...args); }
    alert(...args : any[]) { console.log(...args); }//prompt(...args); }
}


//-------------------


//function RunTest(symbol : CSymbol,  strategy : IStrategy,  startTime : Date,  endTime : Date, config : CTradeConfig) : CTestResult

export function RunTest(trader :ITrader,  testerConfig :ITesterConfig,  marketData :Readonly<CMarketData>) : CTestResult|null
{
    let newsymbols: CSymbol[] = [];
    let minTf : TF|null = null;
    for (let symbol of marketData.symbols) {
        let quotes = new CQuotesHistoryMutable2(symbol.name);
        newsymbols.push(new CSymbol(symbol.info, quotes));
        if (!minTf || minTf < (symbol.quotesHistory.minTf ?? minTf))  minTf= symbol.quotesHistory.minTf;
    }
    let tf= minTf;
    if (! tf) return null;
    let startTime= Period.EndTime(tf, testerConfig.startTime);

    let traderMarket :CMarketData = { symbols: new CSymbols(newsymbols), time: startTime };

    let env :CTraderEnvironment = {market: traderMarket,  account: new CAccount(),  logger: new CLogger()};

    env.account.balance= testerConfig.startBalance;
    env.account.equity= env.account.balance;

    trader.OnInit(env);
    let equity= new CTimeSeries();

    for (let time= startTime;  time<=testerConfig.endTime;  time= new Date(time.valueOf() + tf.msec))
    {
        env.market.time= time;
        env.market.symbols.map((symbol, i)=>
            (symbol.quotesHistory as CQuotesHistoryMutable2).Update(marketData.symbols[i].quotesHistory, time)
        );
        env.account.UpdateFromMarket(env.market);

        let orders = trader.OnTick(env);

        env.account.UpdateFromOrders(orders, env.market);

        equity.points.push( {time,  value: env.account.equity} );
    }

    trader.OnDeinit(env);

    let result = new CTestResult();
    result.EquityHistory= equity;

    return result;
}


export type TesterTrade = Readonly<{ id: number;  price: number;  volume: number;  time: const_Date;  profit?: number}>;

//------------------------

export type TesterTick = Readonly<{
    time :const_Date;        // Время текущего тика
    price :number;           // Текущая цена по символу
    bars :readonly CBar[];   // Ссылка на массив прошедших баров по символу
    equity :number;    // Текущее значение эквити
    volume :number;   // Текущий объём позиции
    equityBar? :CTradeBar  // Последний бар эквити
    trades : readonly TesterTrade[];
}>;



function _Calculate(cyclesCount=1)
{
    let start= Date.now();
    let stop= start+200000*cyclesCount;
    let sum= 0;
    for(let i=start; i<stop; i++)
        sum += Math.sqrt(i);
    //console.log("result: ",sum," Elapsed:",Date.now()-start,"ms");
    return sum;
}


export type tTesterOnBar = { tick :TesterTick, indicators? :readonly IndicatorData[], indicatorsValues? :readonly IIndicator[], percentOfComplete :number };

//type tTesterOnBarShort = Omit<tTesterOnBar, "percentOfComplete">



export function* __RunSignallerTest(
    strategy :IStrategySignaller,
    strategyTF :TF|undefined|null,
    symbol :CSymbol,
    testerConfig :ITesterConfig
)
    : Generator<tTesterOnBar>
{
    if (0)
    {
        let res= new CTradeHistory();
        let d= Date.now();
        let val = _Calculate(5);
        //print("Pass elapsed:",Date.now()-d,"ms")
        res.points.push({time: new Date(), value: { equity: val, volume: val }});
        //print("!!!");
        return res; //new CTradeHistory;
    }
    //if(counter<=2) return RunSignallerTest(strategy, symbol, testerConfig, onbar, counter+1);
    //if (!onbar) return Calculate();
    //if (!onbar) { let tradeEquity= new CTradeHistory;  tradeEquity.pushBar2(new CBar(null, 0, 0, 0, Calculate(), 0), 0);  return tradeEquity; }

    let tf= testerConfig.tf ?? symbol.quotesHistory.minTf;
    if (! tf) { console.log("tf is not defined");  return null; }
    if (!strategyTF) strategyTF= tf;
    if (tf > strategyTF) throw "Tester timeframe "+tf.name+" > strategy timeframe "+strategyTF?.name+" !!!";
    let startTime= Period.StartTime(tf, testerConfig.startTime);
    let startCloseTime= Period.EndTime(tf, testerConfig.startTime);
    //let quotes = new CQuotesHistoryMutable2(symbol.name);
    //let equity= new CTimeSeries();
    //tradeEquity.EquityBars.length= 10000;  tradeEquity.EquityBars.length= 0;
    //tradeEquity.pointsExt.length= 10000;   tradeEquity.pointsExt.length=0;
    let volume= 0;
    let value= testerConfig.startBalance;
    let bars= symbol.quotesHistory.Bars(tf);  if (!bars) return null;
    let iPrev= -1; //bars.IndexOf(startTime, E_MATCH.GREAT_OR_EQUAL);

    //startTime = new Date(startTime.valueOf() + Math.random()*5 * tf.msec);
    console.log("Start testing "+symbol.name+" ",testerConfig.startTime,"-",testerConfig.endTime," ",tf.name);
    let pastBars : CBar[] =[];
    let ibar= bars.indexOfLessOrEqual(startTime)-1;
    let nextBarTime : const_Date = new Date(0); //ibar>=0 ?
    let strategyBars= symbol.quotesHistory.Bars(strategyTF);
    if (!strategyBars) return null;
    let strategyBarIndex= strategyBars.indexOf(startTime, "greatOrEqual");
    if (strategyBarIndex==-1) return;
    let strategyBarEndTime = strategyBars.closeTime(strategyBarIndex); //strategyBars[istrategyBar].time.valueOf() + strategyTF.msec-1);
    strategy.onNewBars(strategyBars.data.slice(0, strategyBarIndex));
    //let s=0;
    //print("old:",startTime);
    //startTime = new Date(startTime.valueOf() + (Date.now() - Date.parse("2020-10-26")) / (1440*60*1000));
    //print("new:",startTime);
    let isPercentFee = symbol.info.comissionPerSide?.unit=="%";
    const MAX_TIME = new Date(8640000000000000);
    let _signal : StrategySignal|undefined;
    //let stopLoss :number|undefined, takeProfit :number|undefined;
    let timeStamp= Date.now();
    let id = 0;


    for (let time :Date = startTime;  time<=testerConfig.endTime;  time= new Date(time.valueOf() + tf.msec))
    {
        let closeTime= new Date(time.valueOf() + tf.msec-1);
        if (time>=nextBarTime) { ibar++;  nextBarTime= ibar<bars.count-1 ? bars.time(ibar+1) : MAX_TIME;  if (time>=nextBarTime) throw "wrong bar time: "+nextBarTime }

        let i= ibar; //bars.IndexOfLessOrEqual(time);
        //s+=i;
        if (i==-1) break;
        let valueHigh=value, valueLow=value, valueOpen=value;
        //let oldVolume= volume;
        let comission=0;
        let trades : TesterTrade[] = [];
        let tradedVolume = 0;
        let isBuyTrade = false;
        //continue;
        if (i>iPrev) {
            let bar= bars.data[i];
            if (volume) {
                let prevPrice= bars.close(iPrev);//.close;
                let fullVolume= volume * symbol.info.lotSize;
                valueOpen= value + fullVolume * (bar.open - prevPrice);
                valueHigh= value + fullVolume * (bar.high - prevPrice);
                valueLow= value + fullVolume * (bar.low - prevPrice);
                value += fullVolume * (bar.close - prevPrice);
                // if (_signal) {
                //     if (_signal.takeprofit!=null)
                //         if (volume>0 ? bar.high>=_signal.takeprofit : bar.low<=_signal.takeprofit)
                // }
            }

            pastBars.push(bar);
            // if (onbar!=undefined) {
            //     let newBars= bars.data.slice(iPrev+1, i+1);
            //     pastBars.push(...newBars);
            // }
            iPrev= i;

            if (closeTime >= strategyBarEndTime)
            {
                //console.log(closeTime);
                let strategyBar= strategyBars.data[strategyBarIndex];
                strategy.onNewBars([strategyBar]);
                strategyBarIndex++;
                strategyBarEndTime = strategyBarIndex < strategyBars.length ? strategyBars.closeTime(strategyBarIndex) : MAX_TIME;
                console.assert(strategyBarEndTime > closeTime);

                let signal= strategy.getSignal();
                //console.log(signal);

                let signalLots= typeof signal =="number" ? signal : signal?.volume;
                //console.log(time, signal);
                if (signalLots==null) continue;
                let deltaVolume= signalLots - volume;
                if (deltaVolume!=0) {
                    comission = (symbol.info?.comissionPerSide?.value ?? 0) * Math.abs(deltaVolume) * (isPercentFee ? bar.close / 100 : 1);
                    value -= comission;
                    if (value < valueLow) valueLow= value;
                    volume = signalLots;
                    trades.push({id :id++, price: bar.close, volume: deltaVolume, time: closeTime});
                    tradedVolume = Math.abs(signalLots);
                    isBuyTrade= signalLots>0;
                }
            }
        }
        //if (comission) console.log(valueHigh,"  ",comission);
        //continue;
        //equity.points.push({time: time, value: value});
        //tradeEquity.pushPoint(time, value, volume);
        //let equityOHLC= new OHLC( valueOpen, valueHigh, valueLow, value);
        let equityBar = new CTradeBar({
            time, open: valueOpen, high: valueHigh, low: valueLow, close: value, volume: tradedVolume, tickVolume: trades.length,
            comission, buyVolume: isBuyTrade ? tradedVolume : 0, buyTickVolume: isBuyTrade ? trades.length : 0
        });
        //tradeEquity.pushBar(time, equityOHLC, volume-oldVolume, volume);

        let percentOfComplete= (time.valueOf() - startTime.valueOf()) * 100 / (testerConfig.endTime.valueOf() - startTime.valueOf());
        yield {
            tick :{time: closeTime,  price: bars[i].close,  bars: pastBars,  equity: value,  volume,  equityBar, trades},
            indicatorsValues : strategy.indicatorValues,
            percentOfComplete
        };
    }
    //print("Finish testing "+symbol.name+". Elapsed:", Date.now()-localTime, "ms");
}


function EquityCalculator({comissionPerSide=0, comissionMode="money", lotSize=1, startValue=0} : {comissionPerSide :number, comissionMode? :"money"|"percent", lotSize? :number, startValue? :number}) {
    const isPercentFee= comissionMode=="percent";
    let _value = startValue;
    let _volume = 0;
    let _fullVolume = 0;
    let _price : number|undefined;
    return {
        onTrade({lots, price} : {lots :number, price :number}) {
            let comission = comissionPerSide * Math.abs(lots) * (isPercentFee ? price / 100 : 1);
            _value -= comission;
            // //if (valueOpen==null) { valueOpen= valueHigh = valueLow = value; }
            // if (value < valueLow) valueLow= value;
            // sumComission += comission;
            _volume += lots;
            _fullVolume= _volume * lotSize;
            //trades.push({id: orderID, price, volume: lots, time});
            // lastPrice= price;
            // tradedVolume += Math.abs(lots);
            return _value;
        },
        onPrice(price :number) {
            if (_price!=undefined)
                _value += _fullVolume * (price - _price);
            _price= price;
            return _value;
        }
    } as const;
}



export function* __RunTraderTest(
    trader :TraderNew.TraderWrapper,
    strategyTF :TF|undefined|null,
    symbol :CSymbol,
    testerConfig :ITesterConfig
) : Generator<tTesterOnBar|void>
{
    let tf= testerConfig.tf ?? symbol.quotesHistory.minTf;
    if (! tf) { console.log("tf is not defined");  return null; }
    if (!strategyTF) strategyTF= tf;
    if (tf > strategyTF) throw "Tester timeframe "+tf.name+" > strategy timeframe "+strategyTF?.name+" !!!";
    let startTime= Period.StartTime(tf, testerConfig.startTime);
    let startCloseTime= Period.EndTime(tf, testerConfig.startTime);
    //let quotes = new CQuotesHistoryMutable2(symbol.name);
    //let equity= new CTimeSeries();
    //tradeEquity.EquityBars.length= 10000;  tradeEquity.EquityBars.length= 0;
    //tradeEquity.pointsExt.length= 10000;   tradeEquity.pointsExt.length=0;
    let volume= 0;
    let value= testerConfig.startBalance;
    let bars= symbol.quotesHistory.Bars(tf);  if (!bars) return null;
    let iPrev= -1; //bars.IndexOf(startTime, E_MATCH.GREAT_OR_EQUAL);

    //startTime = new Date(startTime.valueOf() + Math.random()*5 * tf.msec);
    console.log("Start testing "+symbol.name+" ",testerConfig.startTime,"-",testerConfig.endTime," ",tf.name);
    let pastBars : CBar[] =[];
    let ibar= bars.indexOfLessOrEqual(startTime)-1;
    let nextBarTime : const_Date = new Date(0); //ibar>=0 ?
    let strategyBars= symbol.quotesHistory.Bars(strategyTF);
    console.log("Доступная история: ",strategyBars?.firstTime,"-",strategyBars?.lastTime);
    if (!strategyBars) return null;
    let strategyBarIndex= strategyBars.indexOf(startTime, "greatOrEqual");
    if (strategyBarIndex==-1) return;
    let strategyBarEndTime = strategyBars.closeTime(strategyBarIndex); //strategyBars[istrategyBar].time.valueOf() + strategyTF.msec-1);

    for (let a of trader.onBarsGenerator(strategyBars.data.slice(0, strategyBarIndex)))
        yield;

    //let s=0;
    //print("old:",startTime);
    //startTime = new Date(startTime.valueOf() + (Date.now() - Date.parse("2020-10-26")) / (1440*60*1000));
    //print("new:",startTime);
    let isPercentFee = symbol.info.comissionPerSide?.unit=="%";
    const MAX_TIME = new Date(8640000000000000);
    let _signal : StrategySignal|undefined;
    //let stopLoss :number|undefined, takeProfit :number|undefined;

    let lastPrice : number;

    let equityCalc = EquityCalculator({
        comissionPerSide: symbol.info?.comissionPerSide?.value ?? 0,
        comissionMode: isPercentFee ? "percent" : "money",
        lotSize: symbol.info.lotSize,
        startValue: testerConfig.startBalance
    });
    //let id = 0;
    if (tf > TF.D1) throw "Неподдерживаемый таймфрейм для тестирования: "+tf;

    for (let time :Date = startTime;  time<=testerConfig.endTime;  time= new Date(time.valueOf() + tf.msec))
    {
        let closeTime= new Date(time.valueOf() + tf.msec-1);
        if (time>=nextBarTime) { ibar++;  nextBarTime= ibar<bars.count-1 ? bars.time(ibar+1) : MAX_TIME;  if (time>=nextBarTime) throw "wrong bar time: "+nextBarTime }

        let i= ibar; //bars.IndexOfLessOrEqual(time);
        //s+=i;
        if (i==-1) break;
        let valueHigh=value, valueLow=value, valueOpen=value;
        //let oldVolume= volume;
        let sumComission=0;
        let trades : TesterTrade[] = [];
        let tradedVolume = 0;
        let tradedVolumeBuy = 0;
        let tradesBuy = 0;
        //continue;
        if (i>iPrev) {
            let bar= bars.data[i];
            // if (onbar!=undefined) {
            //     let newBars= bars.data.slice(iPrev+1, i+1);
            //     pastBars.push(...newBars);
            // }
            pastBars.push(bar);

            iPrev= i;

            if (closeTime >= strategyBarEndTime)
            {
                function _onPrice(price :number) {
                    lastPrice ??= price;
                    let fullVolume= volume * symbol.info.lotSize;
                    let newValue= value + fullVolume * (price - lastPrice);
                    //if (trades.length>0)
                    //if (bar.time.valueOf()==Date.parse("2022-02-11 05:00")) console.log({price, lastPrice, value, volume, newValue});
                    //if (valueOpen==null) { valueOpen= valueHigh = valueLow = newValue; }
                    valueHigh= Math.max(valueHigh, newValue);
                    valueLow= Math.min(valueLow, newValue);
                    value = newValue;
                    lastPrice= price;
                }

                function onAddVolume(orderID :OrderID, lots :number, price :number= bar.close, time :const_Date= closeTime, srcPrice? :number) {
                    _onPrice(price);  //if (isNaN(price)) console.error("!!! #"+orderID,time);
                    let comission = (symbol.info?.comissionPerSide?.value ?? 0) * Math.abs(lots) * (isPercentFee ? price / 100 : 1);
                    value -= comission;
                    //if (valueOpen==null) { valueOpen= valueHigh = valueLow = value; }
                    if (value < valueLow) valueLow= value;
                    sumComission += comission;
                    volume += lots;
                    let profit= srcPrice!=null ? -lots * (price-srcPrice) * symbol.info.lotSize - comission : null;
                    trades.push({id: orderID, price, volume: lots, time, ...(profit!=null ? {profit} : {})});
                    //lastPrice= price;
                    tradedVolume += Math.abs(lots);
                    if (lots>0) { tradedVolumeBuy += lots;  tradesBuy++; }
                    //if (bar.time.valueOf()==Date.parse("2022-02-11 05:00")) console.log("onAddVol",{lots,price,value,volume});
                }

                //console.log(closeTime);
                let strategyBar= strategyBars.data[strategyBarIndex];

                let loggerCallbacks= traderCallbacksDefault(bar);

                trader.onBar(strategyBar, true, null, null,
                    {
                        onAdd(order) { loggerCallbacks?.onAdd(order); if (order.type==null) onAddVolume(order.id, order.volume, order.price, order.time); },
                        onRemove2(order, time, price) { loggerCallbacks?.onRemove2?.(order, time, price);  if (order.type==null) onAddVolume(order.id, -order.volume, price, time, order.price); },
                        onActivate2(order, time) { loggerCallbacks?.onActivate2?.(order, time);  onAddVolume(order.id, order.volume, order.price, time); },
                        onModify2(order, newData) {
                            if (1 || order.type==null) loggerCallbacks.onModify2?.(order, newData, closeTime);
                            if (order.type==null && newData.volume!=null) onAddVolume(order.id, newData.volume - order.volume, bar.close, closeTime, order.price);
                        },
                        onPrice(price :number) { _onPrice(price); }
                    }
                )
                //trader.onNewBars([strategyBar]);
                strategyBarIndex++;
                strategyBarEndTime = strategyBarIndex < strategyBars.length ? strategyBars.closeTime(strategyBarIndex) : MAX_TIME;
                console.assert(strategyBarEndTime > closeTime);
            }
        }

        let equityBar = new CTradeBar({time, open: valueOpen, high: valueHigh, low: valueLow, close: value, volume: tradedVolume,
            tickVolume: trades.length, buyTickVolume: tradesBuy, buyVolume: tradedVolumeBuy, comission: sumComission
        });
        let percentOfComplete= (time.valueOf() - startTime.valueOf()) * 100 / (testerConfig.endTime.valueOf() - startTime.valueOf());
        yield {
            tick: {time: closeTime,  price: bars[i].close,  bars: pastBars,  equity: value,  volume,  equityBar, trades},
            indicators: trader.indicators,
            indicatorsValues: trader.indicatorValues,
            percentOfComplete
        };

    }
    //print("Finish testing "+symbol.name+". Elapsed:", Date.now()-localTime, "ms");
}



async function __RunIteratorTest(iterator :Iterable<tTesterOnBar|void>, onbarOrCancelToken? :((data :tTesterOnBar)=>boolean|void|Promise<boolean|void>) | ICancelToken
) : Promise<CTradeHistory|null>
{
    let [onbar, isCancelled]=
        typeof onbarOrCancelToken=="object"
            ? [undefined, ()=>onbarOrCancelToken.isCancelled?.()]
            : [onbarOrCancelToken, ()=>false];

    let tradeEquity= new CTradeHistory();
    let timeStamp= Date.now();

    for(let tickData of iterator) {
        if (tickData) {
            let tick= tickData.tick;
            if (onbar) {
                if (tick.trades.length>0 || tick.equityBar?.volume)
                    console.log(tickData);
                let res= onbar(tickData);
                //console.log({time: closeTime,  price: bars[i].close,  bars: pastBars,  equity: value,  volume,  equityBar, trades});
                let boolRes= res instanceof Promise ? await res : res;
                if (boolRes===false) {
                    console.log("Stopped!");
                    break;
                }
            }
            tradeEquity.pushBar(tick.equityBar!, tick.volume);
            tradeEquity.tradesCount += tick.trades.length;
        }
        if (Date.now() - timeStamp >=50) {
            await sleepAsync(0);
            timeStamp= Date.now();
        }
        if (isCancelled()) { console.log("Stopped!");  break; }
    }
    return tradeEquity;
}



export async function RunStrategyTest(
    strategyObject :IStrategyCommonObject,
    //trader :TraderNew.TraderExt,
    //strategyTF :TF|undefined|null,
    symbol :CSymbol,
    testerConfig :ITesterConfig,
    onbarOrCancelToken? :((data :tTesterOnBar)=>boolean|void|Promise<boolean|void>) | ICancelToken
)
    : Promise<CTradeHistory|null>
{
    let trader = getTraderOrSignaller(strategyObject);
    if (!trader) return null;
    let strategyTf= strategyObject.paramsData.tf;

    let iterator : Generator<tTesterOnBar|void>;
    if ((trader as IStrategySignaller).getSignal)
        iterator = __RunSignallerTest((trader as IStrategySignaller), strategyTf, symbol, testerConfig);
    else
    if ((trader as Trader).onBar)
        iterator = __RunTraderTest(getTraderExt(strategyObject as IStrategyObjectNew), strategyTf, symbol, testerConfig);
    else throw "Trader handler is not found!";

    return __RunIteratorTest(iterator, onbarOrCancelToken);
}


export function RunSignallerTest(
    signaller :IStrategySignaller,
    strategyTF :TF|undefined|null,
    symbol :CSymbol,
    testerConfig :ITesterConfig,
    onbarOrCancelToken? :((data :tTesterOnBar)=>boolean|void|Promise<boolean|void>) | ICancelToken
) {
    return __RunIteratorTest(__RunSignallerTest(signaller, strategyTF, symbol, testerConfig), onbarOrCancelToken);
}

//---------------------------------


//let threadMutex= new lib.Mutex;



//function JSON_stringify_DateAsNumber(obj) : string { return JSON.stringify(obj, (key,value)=> key=="time" || value instanceof Date ? value.valueOf() : value); }

//function JSON_clone_DateAsNumber(obj) : ParsedUrlQueryInputMy { return JSON.parse(JSON_stringify_DateAsNumber(obj)); }


//declare const jQuery;
//function cloneFull<T>(obj :T) : T {  let newobj = {};  Object.setPrototypeOf(newobj, Object.getPrototypeOf(obj));   newobj= jQuery.extend(true, newobj, obj);  return newobj as T; }//newobj.prototype= obj.prototype;  return newobj; } // let newobj= JSON.parse(JSON.stringify(obj));  return newobj; }



export function GetSumEquity<T extends ITradeBar>(barsArrays: readonly(readonly T[])[]): CTradeBar[] {
    //let sumEquity : CBar[] = [];
    let myBars: (ITradeBar & {delta: number}) [] = []; //{time: const_Date, delta: number, volume: number}[] = []
    for (let bars of barsArrays)
        for (let [i, bar] of bars.entries()) myBars.push({...bar, delta: bar.close - (bars[i - 1]?.close ?? 0)});

    myBars.sort((a, b) => a.time.valueOf() - b.time.valueOf());
    //function newBar(time: const_Date, price :number)
    let myBar = new CTradeBar({...new CBar(new Date(-1),0,0,0, 0), buyVolume: 0, buyTickVolume: 0, comission: 0 }) as Mutable<CTradeBar>;
    let resultEquity: CTradeBar[] = [];
    for (let i = 0; i < myBars.length; i++) {
        let bar = myBars[i];
        if (bar.time > myBar.time) {
            if (i > 0)
                resultEquity.push({...myBar});
            //myBar = new CTradeBar({...new CBar(bar.time,0,0,0, 0), buyVolume: 0, buyTickVolume: 0, comission: 0 });
            //myBar = {...new CBar(bar.time,0,0,0, 0), buyVolume: 0, buyTickVolume: 0, comission: 0 };
            Object.assign(myBar, {time: bar.time, volume: 0, tickVolume: 0, buyVolume: 0, buyTickVolume: 0, comission: 0 })
        }
        let price = myBar.close + bar.delta;  // используем одну цену, т.к. бары разных символов не синхронны
        myBar.open= myBar.high= myBar.low= myBar.close = price;
        myBar.volume += bar.volume;
        myBar.tickVolume += bar.tickVolume;
        myBar.buyVolume += bar.buyVolume;
        myBar.buyTickVolume += bar.buyTickVolume;
        myBar.comission += bar.comission;
        // myBar = new CTradeBar({...new CBar(bar.time, price, price, price, price, myBar.volume + bar.volume, myBar.tickVolume+bar.tickVolume), comission: myBar.comission + bar.comission});
    }
    if (myBars.length)
        resultEquity.push(myBar);
    return resultEquity;
}


// let myBar = new CBar(new Date(0), 0, 0, 0, 0) as Mutable<CBar>;
// let resultEquity = [];
// for(let i=0; i<sumEquity.length; i++) {
// 	let bar= sumEquity[i];
// 	if (bar.time>myBar.time) {
// 		resultEquity.push({...myBar});
// 		myBar= {...bar};
// 		continue;
// 	}
// 	myBar.high= Math.max(myBar.high, bar.high);
// 	myBar.low= Math.min(myBar.low, bar.low);
// 	myBar.close= Math.min(myBar.low, bar.low);
// }