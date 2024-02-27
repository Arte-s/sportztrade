import {
    BSearch,
    CBar,
    CBars,
    IBars,
    IBarsExt,
    ILine,
    Indicator,
    IndicatorSignalExt,
    IndicatorSignalPartialOnBar,
    Point,
    shallowEqual,
    tInfoInit3,
    tLoadBar,
    tOnInitIndicator,
    tSetTicks,
    tTick
} from "../../API";

import {SimpleParams} from "../CParams";
import {CSymbolData, ISymbolDataReadonly, tOnBars, tSymbolCallback2} from "../Symbol";
import {sleepAsync} from "../../Nav/Common"
import {tAlertMini} from "../interface/mini";
import {interfaceIndicator,tIndSymbol} from "../interface/IIndicator";
import {CreateArrow, IGraphLabel, Line} from "../../ind/IndCommon";
import {ICJournal2} from "../СJournal";
import {CIndWork, createSignalAPI, HistoryAPI, IndWorkData, tOnBarsShort, tOnBars_} from "./indWorkBase";


export type tOnCalculate = { prev_calculated: number, bars: IBars, tick_volume: number, volume: number, spread: number }



class CStopper {
    private stopped = false;
    private _time0 = Date.now();

    readonly isStopped = () => {
        if (this.stopped || Date.now() - this._time0 < 50)
            return this.stopped;
        return (async()=>{
            await sleepAsync(0);
            this._time0 = Date.now();
            return this.stopped;
        })();
    }

    stop() {
        this.stopped = true;
    }
}




// export class CParamsExtra extends CParams {
//    lastBarShift= { name: "Last_Bar", value: 0, range: { defaultMin:-10000, max:0, step:1 }, hidden: true };
//    lastBarTime= { name: "Last_Time", value: normalizeDate(new Date(), 60000) as const_Date, enabled: false, range: { step: 60000 } };
//    useSound = { name: "Звуковой сигнал", value: false };
// }
//
//
// export type ParamsReadonlyExt = ReadonlyFull<CParamsExtra>; //ReadonlyFull<ReturnType<typeof _paramsInfoToExt>>;


function Point__(x: number|const_Date, y: number): Point {
    return {x: x.valueOf(), y};
}




// Поток индикатора

export class CIndicatorThread {

    private _work : CIndicatorWork;
    public get work() : Omit<CIndicatorWork, "onBars"|"onTicks"> { return this._work; }

    private symbolData: CSymbolData;
    get     symData() : ISymbolDataReadonly { return this.symbolData; }
    private otherSymDatas= new Map<tIndSymbol, CSymbolData>();

    private _updatesCounter = 0;
    get updatesCount() { return this._updatesCounter + this._work.updatesCount(); }

    // включает/выключает выполнение onBars onTick
    private _calc= true;
    set calc(flag :boolean) { if (flag && !this._calc) this._work= this.runNewWork();  this._calc= flag; }
    get calc()              { return this._calc; }

    private _calcTimeLimit? :const_Date;  // ограничение расчёта баров

    stop() { this._work.stop();  this.DeleteStream(); }

    private getOtherSymDatas() : tOnBars_["otherSymbols"] {
        return [...this.otherSymDatas.entries()]
        .filter(([symbol,data])=>((data.history?.length??0)>0))
        .map(([symbol,data])=>({symbol, allBars: data.history ??new CBars(data.tf,[]), bar: data.history?.last}));
    }

    private createWork : ()=>CIndicatorWork;
    private runNewWork() { //bars? :IBars
        this._work?.stop();
        for(let symData of this.otherSymDatas.values())
            symData.Delete();
        this.otherSymDatas.clear();

        let work= this.createWork();
        this._work= work;
        if (this.calc) {
            if (0)
            for(let symData of this.otherSymDatas.values())
                symData.addCallback({onTick: ()=>{
                    let bars= this.symbolData.history;
                    if (bars && this.calc) this._onBars({history: bars, newBars: bars.slice(bars.length-1)});
                }});
            let bars= this.symbolData.history;
            let ticks= this._calcTimeLimit ? this.sliceTicks(this.allTicks, undefined, this._calcTimeLimit) : this.allTicks;
            let task= work.onTicks({ticks});
            if (bars) this._onBars({history: bars, newBars: bars}).then();
        }
        this._updatesCounter++;
        return work;
    }

    private _tasks : Promise<void>[] = [];


    //constructor(indicator :Indicator, params :SimpleParams<ParamsReadonlyExt>, symbolInfo: tInfoInit3, calc=true)
    constructor(indicator :Indicator, params :SimpleParams, symbolInfo: tInfoInit3, config: {calc?: boolean, timeLimit? :const_Date|null, useSound?: boolean}, logger? :ICJournal2) { //symbolInfo: tInfoInit3) {

        const symbolData = new CSymbolData(symbolInfo, this.callback);//undefined  this.OnHistoryEasy
        this.symbolData= symbolData;
        const otherSymDatas= this.otherSymDatas;

        function _getOtherSymbol(symbol:tIndSymbol) {
            let address = symbolData.address;
            let exchangeAddress= address.slice(0, -1);
            let newAddress= [...exchangeAddress, symbol];
            if (symbol.includes(":")) newAddress= symbol.split(":").map(item=>item.trim());
            console.warn("Address:",newAddress);
            return symbolInfo.baseHistory!.addByAddress(newAddress);
        }
        let _this= this;
        console.warn("symbol:",symbolData.address,"firsTime:",symbolData.history?.firstTime);

        this.createWork= ()=> new CIndicatorWork(
            indicator,
            params,
            {
                tf: symbolData.tf,
                hasTf: true,
                startDate: symbolData.history?.firstTime ?? undefined,
                //allBars: symbolData.history ?? new CBars(symbolData.tf, []),
                loadHistory: (arg: number|const_Date) => symbolData.loadHistory(arg),
                //getBars: (tf)=>symbolData.link?.history.Bars(tf),
                alert: (data)=> logger?.add({...data, key: indicator.Name, symbol: symbolData.symbol}),
                symbol: symbolData.link!,
                symbols: symbolInfo.baseHistory ?? (()=>{throw "baseHistory in not defined!"})(),
                getOtherSymbol(symbol:string) { return _getOtherSymbol(symbol); },

                subscribeOtherSymbol(symbol:string, loadHistory?) {
                    const otherSymDataObj= _getOtherSymbol(symbol);
                    if (! otherSymDataObj) { console.error("Unknown symbol:",symbol);  return false; }
                    let otherSymInfo : tInfoInit3 = {
                        tf: symbolData.tf,
                        address: otherSymDataObj.getAddress(),
                        link: otherSymDataObj
                    };
                    console.log("Подписка к символу:",symbol, otherSymInfo);
                    let otherSymData= new CSymbolData(otherSymInfo);
                    otherSymDatas.set(symbol, otherSymData);
                    let nbarsOrTime= loadHistory?.from ?? loadHistory?.nbars;
                    nbarsOrTime ??= this.startDate;
                    if (nbarsOrTime!=null) { //this.getOtherSymbol(symbol)?.LoadHistoryForEventMini(symbolData.tf, nbarsOrTime);
                        console.log("Запрос на подкачку истории по",symbol, { loadHistory, nbarsOrTime });
                        let task = otherSymData.loadHistory(nbarsOrTime).then(()=>console.log("Подкачана история по",symbol,otherSymData.history));
                        _this._tasks.push(task);
                    }
                    return true;
                }
            },
            config.useSound ?? false
        );
        this._calc= config.calc ?? true;
        this._calcTimeLimit= config.timeLimit ?? undefined;
        this._work= this.runNewWork();
    }

    protected OnHistory = async (history: IBars, type: tLoadBar) => {
        if (type == "left" && history?.length) {
            this._work= this.runNewWork();
        }
        // if (type == "right") {
        //     await this.OnBarsEasy({history, newBars:history, timeLastBar:0});
        // }
    }

    protected onBars = async (data: Readonly<tOnBars>) => {
        if (!this.calc) return;
        const oldTime= this.work.firstBarTime;
        if (oldTime && oldTime.valueOf() != data.history.firstTime?.valueOf()) {
            console.log(`Индикатор #${this.work.id}: Время первого бара изменено: ${oldTime} -> ${data.history.firstTime}. Переинициализируем индикатор.`);
            this._work= this.runNewWork();
            return this._work.currentTask;
        }
        return this._onBars(data);
    }

    private async _onBars(data: Readonly<tOnBarsShort>, calcTimeLimit= this._calcTimeLimit) {
        await Promise.all(this._tasks);
        this._tasks = [];
        return this._work.onBars({
                ...data,
                otherSymbols: this.getOtherSymDatas(),
                getBars :(tf)=> { console.log("Запрашиваем основную историю",tf.name,"по",this.symData.symbol); return this.symbolData.link?.history.Bars(tf) ?? undefined },
                getOtherBars :(symbol, tf)=> {
                    console.log("Запрашиваем историю",tf.name,"по",symbol);
                    return this.otherSymDatas.get(symbol)?.link?.history.Bars(tf) ?? undefined;
                }
            },
            calcTimeLimit
        );
    }

    setTimeLimit(timeLimit :const_Date|undefined) {
        console.log("setTimeLimit:",timeLimit?.toString());
        let lastCalcTime= this._work.lastCalcTime ?? new Date(0);
        this._calcTimeLimit= timeLimit;
        timeLimit ??= new Date("2100-01-01");
        if (timeLimit >= lastCalcTime) {
            if (this._work.hasTickHandler) {
                let ticks= this.sliceTicks(this.allTicks, lastCalcTime, timeLimit);
                let task= this._work.onTicks({ticks});
           }
           let bars= this.symbolData.history;
           if (bars) {
               //let i= bars?.indexOf(lastCalcTime, "greatOrEqual");
               //let j= bars?.indexOf(timeLimit, "lessOrEqual");
               //let n= i+1;
               //if (i < j) {
                   //let newbars= bars.slice(i, j+1);
               let task= this._onBars({history: bars, newBars: bars.slice(0,0)}, timeLimit);
               //}
           }
        }
        else this._work= this.runNewWork();

    }

    private allTicks : tTick[] = [];

    private sliceTicks(ticks :readonly tTick[], from: const_Date|undefined, to: const_Date) : tTick[] {
        if (ticks.length==0) return [];
        let i= from ? BSearch(ticks, tick => tick.time.valueOf() - from.valueOf(), "greatOrEqual") : 0;
        let j= BSearch(ticks, tick => tick.time.valueOf() - to.valueOf(), "lessOrEqual");
        if (i <= j) return ticks.slice(i, j+1);
        return [];
    }

    protected onTicks(data: tSetTicks) {
        let ticks= data.ticks;
        if (this._work.hasTickHandler)
            this.allTicks.push(...ticks);
        if (!this.calc) return;
        let calcTimeLimit= this._calcTimeLimit;
        if (calcTimeLimit) {
            //data
            ticks= this.sliceTicks(ticks, undefined, calcTimeLimit);
        }
        return this._work.onTicks({ticks, bars: data.bars, history: data.history});
    }

    private callback: tSymbolCallback2 = {
        onTick: (data: tSetTicks) => this.onTicks(data),
        onBar: (data: tOnBars) => this.onBars(data),
        onHistory: (history: IBars, type: tLoadBar) => this.OnHistory(history, type),
        onSetSymbolData: () => {
            throw "Неожиданная смена символа!"
        }
    }

    //удаляет подписку на котировки
    DeleteStream() {
        this.symbolData.Delete();
    }
}







export class CIndicatorWork {

    private static _id = 0;

    readonly id = ++CIndicatorWork._id;
    //readonly symbolData: CSymbolData;
    private _tasksCount = 0;     // число выполняемых задач в очереди
    private _lastCalcTime? : const_Date;  // время последнего рассчитываемого бара/тика
    private _progressPercent? :number;
    private _calculationStartTimeStamp? :const_Date;

    private  stopper = new CStopper();

    get calculatedBars() { return this.data.lastCalculatedBars; }

    get firstBarTime() { return this.data.firstBarTime; }

    get lastCalcTime() { return this._lastCalcTime; }

    private readonly indicator : Indicator;
    //private readonly work: interfaceIndicator; // базовый рабочий класс инициализируется в конструкторе

    private _extraLines :readonly ILine[] = [];
    private _extraLabels :readonly IGraphLabel[] = [];

    // //поставить метку на перерисовку графика
    // updatesCounterNext() {this._updatesCounter++}

    // счётчик изменений основного объекта (только увеличивается)
    private _updatesCounter = 0;
    updatesCount() { return this._updatesCounter; }

    // проверяет, выполняется ли расчёт индикатора в текущий момент
    isCalculating() { return this._tasksCount>0; }//return this._Promise!=undefined; }

    get calculationProgress_percent() { return this._progressPercent; }

    get calculationStartTime() { return this._calculationStartTimeStamp; }

    get currentTask() { return this._Promise; }

    stop() { this.stopper.stop(); }

    readonly paramValues : SimpleParams;//<ParamsReadonlyExt>;

    //private _getBars : (tf :TF)=>IBars|undefined; //this.symbolData.link?.history.Bars(tf)
    //private _getOtherBars : (symbol :tIndSymbol, tf :TF)=>IBars|undefined;

    private _alert : (data :tAlertMini)=>void; //{ return Journal.add({...data, name: this.name, symbol: this.symbolData.address, tf: this.symbolData.tf}); }

    private _useSound = false;
    get useSound()                 { return this._useSound; }
    set useSound(enabled :boolean) { let lastVal= this._useSound;  this._useSound= enabled;  if (!lastVal && enabled) this._lastSignalAlert?.(); }

    private _data : CIndWork;
    private get work() : interfaceIndicator { return this._data.work; }//this.workData.work; }

    constructor(
        indicator :Indicator,
        params :SimpleParams, //<ParamsReadonlyExt>, //symbolInfo: tInfoInit3) {
        onInitData : tOnInitIndicator,
        useSound=false
        //info : { bars :IBars, loadHistory(load: number|Date) :Promise<void>, getBars(tf :TF) :IBars|null|undefined, alert(data :tAlertMini) :void, symbol: tOnInitSymbol},
    )//calc=true)
    {
        this.paramValues= params;
        this.indicator= indicator;
        this._alert= onInitData.alert; //{ return Journal.add({...data, name: this.name, symbol: this.symbolData.address, tf: this.symbolData.tf}); }
        this.useSound= useSound;
        console.log("Индикатор #"+this.id+": создание: ",params);

        this._data= new CIndWork(indicator, params, onInitData);
    }


    get iBuffers() {
        //if (!(this.work?.iBuffers)) console.log(this.work);
        return this.work.iBuffers ?? []
    };

    private getCalcLines(lines :readonly ILine[], calcTime? :const_Date) {
        if (calcTime) {
            //console.warn("!!!! ",calcTime);
            let calcTimeLine= Line(Point__(calcTime, 0), Point__(calcTime, 1e8), "rgba(255,255,255,0.8)", 1, "dot");
            lines= lines.concat(calcTimeLine);
        }
        return lines;
    }

    private _lineBuf? : { indLines? :readonly ILine[], extraLines :readonly ILine[], calcTime? :const_Date, };
    private _lines : readonly ILine[] = [];

    private _labelBuf? : { indLabels? :readonly IGraphLabel[], extraLabels :readonly IGraphLabel[] };
    private _labels : readonly IGraphLabel[] = [];

    get lines() {
        let oldStruct= this._lineBuf;
        let lines= this.isCalculating() ? this.work.fixedLines : this.work.lines;
        let newStruct : typeof oldStruct = { indLines: lines, extraLines: this._extraLines, calcTime: this._lastCalcTime }
        //console.log("checkLines");
        if (! oldStruct || !shallowEqual(oldStruct, newStruct)) {
            //console.log("different");
            this._lineBuf= newStruct;
            this._lines= this.getCalcLines(lines ??[], this._lastCalcTime).concat(this._extraLines);
        }
        return this._lines; //this.work?.lines??[]
    };

    get lines2() {
        return this.work?.lines2 ?? [];
    };

    get labels() {
        let oldStruct= this._labelBuf;
        //console.log("****",this.isCalculating())
        let labels= this.isCalculating() ? this.work.fixedLabels : this.work.labels;
        let newStruct : typeof oldStruct = { indLabels: labels, extraLabels: this._extraLabels }
        if (! oldStruct || !shallowEqual(oldStruct, newStruct)) {
            this._labelBuf= newStruct;
            this._labels= (labels ??[]).concat(this._extraLabels);
        }
        return this._labels; //return this.work?.labels??[]
    };

    get windows() { return this.work?.windows ?? [] };

    //массив окон на которых отображается наш индикатор, возможно несколько окон для одно индикатора
    // readonly windowsObj: ICDivFunc[] =[]

    get name() { return this.indicator.Name };


    private _Promise :Promise<undefined|void|number>= Promise.resolve();

    private _lastSignalAlert? : ()=>void;


    //private onSignal(signalData :IndicatorSignalPartialOnBar, currentTime? :const_Date) {
    private onSignal(signalData :IndicatorSignalExt, currentTime? :const_Date) {
        let {name, volume, price, time} = signalData;
        let up= volume>0;
        //let arrow= price!=null ? CreateArrow(bar.time, price, up) : CreateArrowOnClose(bar, up);
        let arrow = CreateArrow(time, price, up);
        this._extraLabels= this._extraLabels.concat(arrow); //if (fixed) newFixedLabels.push(arrow); else newLabels.push(arrow);
        if (! currentTime) return;
        //if (bar!=bars.last) return;
        //new Date(bar.time.valueOf() + bars.Tf.msec - 1000);
        let fullName= this.name + (name!=null ? " ("+name+")" : "");
        this._lastSignalAlert = ()=> {
            console.warn("Внимание!  Сигнал ",volume>0 ? "BUY" : "SELL"," от индикатора",fullName, "в",currentTime);
            // if (bar== currentBar) this.signal! += signal;
            //if (this.paramValues.useSound) {
            if (this.useSound) {
                //let moduleFile= import.meta.url;
                //let dir= moduleFile.substr(0, moduleFile.lastIndexOf("/")) + "/";
                let dir="";
                let audio = new Audio(dir+'AirHorn.wav');
                audio.play().catch(e=>console.warn(e));
            }
        }
        this._lastSignalAlert();
    }

    //private static _indIDCounter = 0;

    private data= new class {
        lastBar? :CBar;
        firstBarTime? :const_Date;
        lastBarTime? :const_Date;
        lastCalculatedBars? :number;
        lastBarClosed? :boolean;
    };


    readonly onBars = async (data: Readonly<tOnBars_>, timeLimit? :const_Date) => {
        //console.trace();
        //if (!data.history?.length) return;
        const oldTime= this.data.firstBarTime;
        if (oldTime && oldTime.valueOf() != data.history.firstTime?.valueOf()) {
            throw `Время первого бара изменено: ${oldTime} -> ${data.history.firstTime}`;
        }
        data= {...data, history: data.history.toImmutable(), newBars: data.newBars.toImmutable()}; // создаём копию истории при необходимости
        this._tasksCount++;
        // console.log({data})
        return this._Promise = Promise.resolve(this._Promise).then(async() => {
            //let arrows : CArrow[] = [];
            //this._labels= this.work.labels;
            this._updatesCounter++;
            this._progressPercent= undefined;
            this._calculationStartTimeStamp = new Date();
            let bars= data.history;
            const onBar = (i :number, percentOfComplete :number)=> {
                this._lastCalcTime= bars.time(i);
                if (this.work.OnBar) this._progressPercent= percentOfComplete;//(i - prevCalculated) / (bars.length - prevCalculated) * 100;
                this._updatesCounter++;
            }

            let resBars= (await this._OnBars(data, onBar, timeLimit)) ?? 0; //{history, newBars, timeLastBar, this.work, this.calculatedBars});
            //this._progressPercent= undefined;
            //console.warn(resBars,"/",bars.length);
            //this._lines= this.getCalcLines(resBars>0 ? data.history[resBars-1]?.time : undefined);
            //this._labels= arrows.length>0 ? this.work.labels.concat(arrows) : this.work.labels;

            return resBars;

        }).finally(()=>{this._tasksCount--;})
    }



    private _OnBars = async (data :Readonly<tOnBars_>, onBar :(index:number, percentOfComplete :number)=>void, timeLimit? :const_Date) => {

        //async OnCalculate(prev_calculated :number, bars :IBars, isStopped : ()=>Promise<boolean>|boolean): Promise<number> {

        //if (this.stopper.isStopped()) return 0
        let ticks0= Date.now();

        let bars= data.history;

        let forwBars= 0;//-this.paramValues.lastBarShift;

        forwBars= Math.max(forwBars, 0);

        let maxCountBars= bars.count;// - forwBars; //+ this._indInfo.paramsValues.lastBarShift;
        const endTimeVal= timeLimit; //this.paramValues.lastBarTime;
        if (endTimeVal) {
            let endTime= new Date(endTimeVal.valueOf()); //this._indInfo.paramsValues.lastBarTime ?? "2100.01.01");
            let i= bars.indexOf(endTime, "lessOrEqual");
            maxCountBars= i+1; //Math.min(i+1, maxCountBars);
        }
        maxCountBars -= forwBars;

        //let res= this._OnCalculate(prev_calculated, bars.slice(0, bars.length-1));
        // console.log("1. ",this.lines.length, this.fixedLines.length)

        if (!bars?.length) return 0

        let indData= this.data;
        indData.firstBarTime ??= bars[0].time;

        //проверка на обнуление
        if (bars[0].time.valueOf() != indData.firstBarTime.valueOf()) throw "Время первого бара изменено: "+bars[0].time;  //{this.firstTime=bars[0].time as Date; data.prevCalculatedBars=0; }

        let prevCalculatedBars= indData.lastCalculatedBars ?? 0;

        console.log("Индикатор #"+this.id+": начало расчёта","  prev_calculated="+prevCalculatedBars, "bars_total="+bars.length);
        //console.log(JSON_clone(bars.data));
        if (prevCalculatedBars > data.history.length) {
            console.trace("prevCalculatedBars > this.symbolData.history.count");
        }
        // console.assert(data.prevCalculatedBars == data.history.length - data.newBars.length, "!");
        //console.log("!!!");
        if (prevCalculatedBars>0 && indData.lastBarTime && bars[prevCalculatedBars-1]?.time.valueOf()==indData.lastBarTime.valueOf())
            prevCalculatedBars -=  (indData.lastBarClosed ? 0 : 1);
        // console.assert(newData.prevCalculatedBars == newData.history.length - newData.newBars.length,
        //     "!! "+JSON.stringify({
        //         prevCalcBars: newData.prevCalculatedBars, allBars: newData.history.length, newBars: newData.newBars.length, lastClosed: indData.lastBarClosed,
        //         lastTime: indData.lastBarTime, newBarTime: newData.newBars.length>0 ? newData.newBars[0].time : ""
        //     })
        // );

        let newData = {...data };

        let isLastClosed = false;
        if (maxCountBars < data.history.length) { //forwBars>0) {
            bars= bars.slice(0, maxCountBars);
            //bars= newData.history.slice(0, newData.history.length-forwBars);
            newData.history= bars;
            newData.newBars= bars.slice(prevCalculatedBars);
            isLastClosed= true;
        }
        let barsExt : IBarsExt = CBars.createCopyExt(bars, isLastClosed);

        let indicator= this.work;

        this._lastSignalAlert= undefined;


        const onSignal = (signalData :IndicatorSignalPartialOnBar)=> {
            let {bar} = signalData;
            let currentTime= bar!=bars.last ? undefined : new Date(bar.time.valueOf() + bars.Tf.msec - 1000);
            this.onSignal({price: bar.close, time: bar.time, ...signalData}, currentTime);
        }

        //console.log("!!!",":",{barsExt, newBars: newData.newBars, prevCalculatedBars});

        // let resBars= await this._OnBars2({...newData, history: barsExt, prevCalculatedBars, indicator}, onSignal,
        //         (i)=>onBar(i, (i + 1 - prevCalculatedBars) / (barsExt.length - prevCalculatedBars) * 100)
        //     ).catch((e)=>{throw e;}); ////console.error(e);  console.trace();  return bars.length; }

        const resBars= await this._data.OnBars(
            {...newData, history: barsExt, prevCalculatedBars},
            {
                drawSignal: onSignal,
                onBar: (i)=>onBar(i, (i + 1 - prevCalculatedBars) / (barsExt.length - prevCalculatedBars) * 100),
                signals: this.mySignals,
                alert: this._alert,
                isStopped :this.stopper.isStopped
            }
        ); //.catch((e)=>{throw e;}); ////console.error(e);  console.trace();  return bars.length; }


        indData.lastBar= data.history.last ?? undefined;
        indData.lastBarTime= bars.last?.time;
        indData.lastCalculatedBars= resBars;
        indData.lastBarClosed= isLastClosed;

        console.log("Индикатор #"+this.id+": расcчитано баров:",(resBars-prevCalculatedBars)+"/"+resBars+".  Число линий:",indicator.lines.length, "Время:",Date.now()-ticks0,"ms"); //, this.fixedLines.length)

        //console.log(prev_calculated, bars.length, (Date.now()-ticks0)+" ms");
        return resBars;
    }

    protected mySignals = createSignalAPI(); //new CMySignals();


    // имеется ли обработчик тиков
    get hasTickHandler() { return this.work.OnTick!=null || this.work.OnTicks!=null; }


    public onTicks(data: tSetTicks) {
        if (data.ticks.length==0) return;
        let work= this.work;
        return this._Promise = Promise.resolve(this._Promise).then(async () => {
            if (this.work==work) {
                await this._OnTicks(data);
                //let count= data.ticks.length;
                //this._extraLines= this.getCalcLines(count>0 ? data.ticks[count-1].time : undefined);
                //this._extraLabels= this.work.labels;
            }
        });
    }

    private async _OnTicks(data: tSetTicks) {
        this._updatesCounter++;
        this._tasksCount++;
        let count :number|undefined;
        try {
            count= await this._data.OnTicks(data, { signals: this.mySignals, onSignal: this.onSignal, alert: this._alert, isStopped: this.stopper.isStopped });
        }
        finally { this._tasksCount--;  if (count!=undefined) this._lastCalcTime= count>0 ? data.ticks[count-1].time : undefined; }
    }
}




