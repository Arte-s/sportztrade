import {CBar, CBarsMutableExt, IBars, IBarsExt, IBarsImmutable, TF, } from "../../Nav/MarketData";

import {Indicator, IndicatorAny, __defaultEmptySignalAPI, createIndicatorInstanceBase,tOnBarIndicatorShort,isInitIndicatorShort,tOnInitIndicatorShort,createIndicatorInitData} from "../Indicator";
import {SimpleParams, IParamsReadonly} from "../CParams";
import {
    IIndicatorBase,
    IIndicatorFunk,
    IndData,
    IndicatorDataFull,
    IndicatorID,
    IndicatorSignalExt,
    IndicatorSignalPartial,
    IndicatorSignalPartialOnBar,
    interfaceIndicator, newIndicatorID,
    tIndSymbol,
    tOnBarIndicatorExt,
    tOnInitIndicator
} from "../interface/IIndicator";
import {tAlertMini, tTick} from "../interface/mini";
import {tSetTicks, tSymbolInfo,tSymbolInfoBase} from "../interface/IHistoryBase";
//import {tOnBarsExt} from "./indicatorWorker";
import {createDeepComparerMap} from "../../Nav/myHashMap"

import {CMySignals, Signal, SignalAPI, SignalExt, UserSignal} from "../../ind/Signal";
import {tOnBars} from "../Symbol";



export function createSignalAPI() {
    let _mySignals = new CMySignals();
    let _lastTick : Pick<tTick, "price"|"time">; //{ price :number, time :const_Date };
    function convertSignal(signal :UserSignal) : Signal {
        if (!_lastTick) throw "_lastTick is not defined";
        return (signal.price!=null && signal.type!=null) ? signal : {...signal, price: _lastTick.price, type: "stop" };
    }
    let _api : SignalAPI = {
        set(signals, onActivate? :(signal :SignalExt, time :const_Date)=>void) {
            return _mySignals.set(signals.map(signal=>convertSignal(signal)), {onActivate});
            },
        add(signal, onActivate? :(signal :SignalExt, time :const_Date)=>void) {
            return _mySignals.add(convertSignal(signal), {onActivate});
            },
        delete: _mySignals.delete
    };
    return {

        onBar(bar :CBar, onEnter :(signal :Signal)=>void) {
            _mySignals.onBar(bar, onEnter);
            _lastTick= {time: bar.time, price: bar.close};  //return _api;
        },
        onTick(tick :tTick, onEnter :(signal :Signal)=>void) {
            _mySignals.onTick(tick.time, tick.price, onEnter);
            _lastTick= tick;  //return _api;
        },

        get api() { return _api; },

        updateByLastPrice(onEnter :(signal :Signal)=>void) {
            if (!_lastTick) throw "_lastTick is not defined";
            _mySignals.onBarClose(_lastTick.time, _lastTick.price, onEnter);
        }
    } as const;
}

type MySignalAPI = ReturnType<typeof createSignalAPI>;


export type HistoryAPI = Readonly<{
    getBars(tf :TF) : IBars|undefined,
    getBar?(tf :TF) :CBar|undefined,
    getOtherBars(symbol :tIndSymbol, tf :TF) : IBars|undefined,
    getOtherBar?(symbol :tIndSymbol, tf :TF) :CBar|undefined;
    otherSymbols :readonly Readonly<{ symbol :tIndSymbol, allBars :IBars, bar :CBar|undefined}>[]
}>;

export type IndParamsKey = Pick<Indicator,"Name"|"Version"> & {readonly params: SimpleParams};

export type IndWorkData= { work :interfaceIndicator, id :IndicatorID, key :IndParamsKey, children :Map<IndicatorID, IndWorkData>, barsCounted? :number }; //, calcCounter :number };




export type tOnBarsShort = Omit<Readonly<tOnBars>, "timeLastBar">;

export type tOnBars_ = tOnBarsShort & HistoryAPI;

//tOnBarIndicator["otherSymbols"] };

//export type tOnBarsDop = tOnBars & {timeLastBar: number, indicator :interfaceIndicator, prevCalculatedBars:number}
export type tOnBarsDop = tOnBars_ & { prevCalculatedBars:number}

export type tOnBarsExt = tOnBarsDop & {history:IBarsExt}

export type tOnBarSymbol = tOnBarsDop & {history:IBarsExt}

function* iterateWorkDatas(data :IndWorkData) : Generator<IndWorkData> { for(let child of data.children.values()) yield *iterateWorkDatas(child);  yield data; }





export class CIndWork {
    private workData : IndWorkData;
    get work() : Omit<interfaceIndicator, "OnBar"|"OnBars"> { return this.workData.work; }

    private paramsToDataMap = createDeepComparerMap<IndParamsKey, IndWorkData>();
    private symbolInfo? : tSymbolInfoBase; //tOnInitSymbol;

    constructor(indicator :IndicatorAny, params :SimpleParams, onInitData :tOnInitIndicator) //constructorExtraParams :
    {
        let symbolInfo = onInitData?.symbol.info;
        this.symbolInfo= symbolInfo ? (Object.isFrozen(symbolInfo) ? symbolInfo : {...symbolInfo}) : undefined;
        //console.log("Индикатор #"+this.id+": создание: ",params);

        //let instance = indicator.construct(params);
        //instance.OnInit?.(onInitData);

        function addIndicatorWork(ind :IndicatorAny, params :SimpleParams, paramToData :Map<IndParamsKey,IndWorkData>) : IndWorkData { //, otherDatas: Map<IndicatorID,IndWorkData>)=> {
            let key : IndParamsKey = { Name: ind.Name, Version: ind.Version, params: params };
            let data= paramToData.get(key);
            if (data) return data;
            let childrenData= new Map<IndicatorID, IndWorkData>()
            let work= createIndicatorInstanceBase(ind, params, {
                addIndicator: (ind2, params2)=>{
                    let data= addIndicatorWork(ind2 as IndicatorAny, params2, paramToData);
                    childrenData.set(data.id, data);
                    return data.id;
                }
            });
            //if (onInitData)
            work.OnInit?.(onInitData);
            const id= newIndicatorID();
            data = {work, id, key, children: childrenData};//, calcCounter:0};
            //console.log("add indicator",data);
            paramToData.set(key, data);
            return data;
        }
        //
        this.workData = addIndicatorWork(indicator, params, this.paramsToDataMap);
        const work= this.workData.work;
        if (work.OnBars && work.OnBar) throw "В индикаторе "+indicator.Name+" одновременно определены OnBars и OnBar";
    }


    OnBar(data :{
        bar :CBar,
        allBars :IBarsExt,
        historyAPI? :HistoryAPI,
        signalAPI :SignalAPI,
        drawSignal?(signal :IndicatorSignalPartialOnBar) :void,
        alert?(data :tAlertMini) :void,
        finish? :boolean
    })
    {
        const {bar, allBars, signalAPI, drawSignal, alert, finish} = data;
        //console.log("OnBar",data);
        const symbol= this.symbolInfo?.name;
        const historyAPI = data.historyAPI ?? {
            getBars(tf :TF) { return allBars.toBars(tf); },
            getOtherBars(sym :tIndSymbol, tf :TF) { return sym==symbol ? this.getBars(tf) : undefined; },
            otherSymbols :[]
        };
        //if (indicator.OnBars && indicator.OnBar) throw "В индикаторе одновременно определены OnBars и OnBar";

        function indicatorOnBar(work :interfaceIndicator, barData :tOnBarIndicatorExt, prevCalculated :number = 0) {
            const barsLength= barData.index+1;
            if (work.OnBar) { work.OnBar(barData);  return barsLength; }
            else if (work.OnBars) {
                const allBars= barData.allBars;
                let newBars = allBars.slice(prevCalculated,barsLength);
                let res= work.OnBars({...barData, newBars, newBarIndex: prevCalculated}, ()=>false);
                if (res instanceof Promise) res.then((n)=>{if (n!=null && n!=barsLength) throw "Wrong OnBars result: "+n+".  Expected: "+barsLength});
                if (typeof res!="number") return barsLength;
                const totalCount= res;
                if (totalCount>barsLength) throw "Wrong OnBars result: "+totalCount+" > "+barsLength;
                return totalCount;
            }
        }

        let index= allBars.length-1;
        //console.log("!!!",data.otherSymbols);
        for(let workData of this.paramsToDataMap.values()) {
            const {work, children, barsCounted} = workData;
            const res = indicatorOnBar(work, {
                bar,
                closed :allBars.lastBarClosed,
                tf: allBars.Tf,
                index,
                allBars,
                getBars :(tf:TF)=> historyAPI.getBars(tf)?.toImmutable(),
                get otherSymbols() {
                    return historyAPI.otherSymbols.map(symData=>({
                        _allBars :undefined as IBars|undefined,
                        _bar :undefined as CBar|undefined,
                        symbol: symData.symbol,
                        get allBars() { return this._allBars ??= symData.allBars; }, //?? (()=>{throw "bars is undefined!"})(); },
                        get bar() { return this._bar ??= symData.bar!;/* приводим к nonNullable, т.к. дальше идёт фильтр */ },// ?? (()=>{throw "bar is undefined!"})(); },
                        getBars(tf :TF) { return historyAPI.getOtherBars(symData.symbol, tf)?.toImmutable(); }
                    })).filter(item=>item.bar!=null); //allBars.length>0);
                },
                finish: Boolean(finish),
                api: {
                    alert : alert ?? (()=>{}),
                    signals: signalAPI,
                    _drawSignal(signal) {
                        const sig= typeof signal=="function" ? signal() : signal;
                        drawSignal?.( {...sig, bar: sig.bar ?? bar}); //,  realtime: !sig.bar || sig.bar==bar} );
                    },
                    getIndicatorData<T extends interfaceIndicator>(id :IndicatorID<T>) {
                        //const species= id.[Symbol.species];
                        return children.get(id)!.work as object as IndData<T>; //<typeof species>;
                    }
                }
            }, barsCounted);
            workData.barsCounted = res;
        }
            //if (indicator.signals) indicator.signals._print= bar.time.valueOf()==Date.parse("2022-02-23 14:00");
    }


    async OnBars(
        data :Readonly<tOnBarsExt>,
        api: {
            onBar(index:number) :void,
            drawSignal(signal :IndicatorSignalPartialOnBar) :void,
            signals :MySignalAPI,
            alert(data: tAlertMini) :void,
            isStopped() : boolean | Promise<boolean>
        }
    ){
        let {history:allBars, newBars, prevCalculatedBars} = data;
        const {onBar, drawSignal, signals, alert, isStopped} = api;
        const indicator= this.workData.work;
        //console.log("OnBars",data);
        // for(let [i,b] of allBars.entries())
        //     if (i>0 && b.time <= allBars[i-1].time)
        //         console.error("Wrong bar by index",i,": ",b.time);
        if (prevCalculatedBars != allBars.length - newBars.length)
            newBars= allBars.slice(prevCalculatedBars);

        let totalCalculated :number = 0;
        if (indicator.OnBars && indicator.OnBar) throw "В индикаторе одновременно определены OnBars и OnBar";
        if (indicator.OnBars) {
            const time= allBars.lastTime;
            const tfDatas : (IBarsImmutable|null|undefined)[] = [];
            for(let {work,key} of this.paramsToDataMap.values()) {
                let   firstTotalCalculated :number|undefined;
                if (! work.OnBars) throw "Отсутствует OnBars в индикаторе "+key.Name;
                totalCalculated= await work.OnBars({
                        newBarIndex: prevCalculatedBars,
                        allBars,
                        newBars,
                        getBars: (tf:TF)=> tfDatas[tf.index] ??= time ? data.getBars(tf)?.sliceByTime(null, time) ?? undefined : undefined,
                        api :{
                            alert,
                            _drawSignal(signal) {
                                const sig= typeof signal=="function" ? signal() : signal;
                                drawSignal( {bar: allBars.at(-1)!, ...sig}); //,  realtime: !sig.bar || sig.bar==bar} );
                            },
                        }
                    },
                    isStopped
                ) ?? allBars.count;
                firstTotalCalculated ??= totalCalculated;
                if (totalCalculated!=firstTotalCalculated) throw key.Name+`: totalCalculated (${totalCalculated}) != firstTotalCalculated (${firstTotalCalculated})`;
            }
            //totalCalculated = typeof totalCalculated=="number" ? totalCalculated : allBars.count;
            onBar(totalCalculated-1);
        }

        // async function indicatorOnBars(work :interfaceIndicator, barsData :tOnBarsIndicator, isStopped :()=>bool|Promise<bool>) {
        //     if (work.OnBars) return work.OnBars(barsData, isStopped);
        //     for(let )
        // }

        if (indicator.OnBar) {
            //console.log("Tick", {newBarsLength: newBars.length});
            //console.log(prevCalculatedBars, newBars.length, allBars.length);
            let bars= new CBarsMutableExt(allBars.Tf, allBars.data.slice(0, prevCalculatedBars), allBars.tickSize);
            let index= prevCalculatedBars;
            //console.log("!!!",data.otherSymbols);
            for (const [i,bar] of newBars.entries()) {
                bars.push(bar);
                function onBarSignal(signal :Signal) { drawSignal({...signal, bar}); }
                signals.onBar(bar, onBarSignal);
                const closed= i<newBars.length-1 || allBars.lastBarClosed;
                bars.lastBarClosed= closed;
                function syncBars(bars? :IBars|null) { return bars?.sliceByTime(null, bar.time); }
                function syncBar(bars? :IBars|null) { let i= bars?.indexOfLessOrEqual(bar.time) ?? -1;  if (i!=-1) return bars?.at(i);  return undefined; }

                this.OnBar({
                    bar,
                    allBars: bars,
                    historyAPI: {
                        getBars: (tf :TF)=> syncBars(data.getBars(tf)),
                        getBar: (tf :TF)=> syncBar(data.getBars(tf)),
                        getOtherBars: (symbol, tf)=> syncBars(data.getOtherBars(symbol, tf)),
                        getOtherBar: (symbol, tf)=> syncBar(data.getOtherBars(symbol, tf)),
                        get otherSymbols() {
                            return data.otherSymbols.map(symData=>({
                                symbol: symData.symbol,
                                get bar() { return syncBar(symData.allBars); },
                                get allBars() { return syncBars(symData.allBars) ?? (()=>{throw "bars is undefined!"})(); }
                            }));
                        }
                    },
                    signalAPI: signals.api,
                    drawSignal,
                    alert,
                    finish: i==newBars.length-1
                });

                //if (indicator.signals) indicator.signals._print= bar.time.valueOf()==Date.parse("2022-02-23 14:00");
                signals.updateByLastPrice(onBarSignal);
                onBar(index);
                index++;
                //if ((i+1)%2==0) {
                if (i>0) {
                    let stopped= isStopped();
                    if (typeof stopped!="boolean") stopped= await stopped;
                    if (stopped) break;
                }
            }
            totalCalculated= index;
        }
        if (prevCalculatedBars==0 && isStopped()!=true) indicator.printStatistics?.();
        return totalCalculated;
    }


    async OnTicks(
        data: tSetTicks,
        api :{
            signals: MySignalAPI,
            onSignal(signal :IndicatorSignalExt, currentTime? :const_Date) :void,
            isStopped :()=>boolean|Promise<boolean>,
            alert(data: tAlertMini) :void
        }
    ){
        const {signals, alert, isStopped} = api;
        let count :number|undefined;
        if (this.work.OnTicks) {
            for(let {work, children, key} of this.paramsToDataMap.values())
                if (work.OnTicks)
                    count= await work.OnTicks(data, api.isStopped) ?? data.ticks.length;
                else throw "Отсутствует OnTicks в индикаторе "+key.Name;
        }
        else
        if (this.work.OnTick) //{
            for(let {work, children, key} of this.paramsToDataMap.values()) {
                let mySignals= signals;
                count= 0;
                for (let tick of data.ticks) {

                    const onSignal = (signal :Omit<IndicatorSignalPartial,"bar">) => {
                        api.onSignal({price: tick.price, time: tick.time, ...signal}, tick==data.ticks.at(-1) ? tick.time : undefined);
                    }
                    mySignals.onTick(tick, onSignal);
                    if (! work.OnTick) throw "Отсутствует OnTick в индикаторе "+key.Name;
                    work.OnTick({
                        tick,
                        api: {
                            alert: alert,
                            signals: mySignals.api,
                            _drawSignal(signal) {
                                const sig= typeof signal=="function" ? signal() : signal;
                                if (sig.bar) throw "signal.bar is not supported!";
                                onSignal(sig);
                            },
                            getIndicatorData<T extends interfaceIndicator>(id :IndicatorID<T>) {
                                return children.get(id)!.work as object as IndData<T>; //<typeof species>;
                            }
                        }
                    });
                    mySignals.updateByLastPrice(onSignal);
                    count++;
                    if (count%10==9 && await isStopped()) return;
                }
        }
        return count;
    }
}


type ProxyHandlerT<T extends object, K extends keyof T= keyof T> = { get(target: T, prop: K):T[K], set?(target :T, prop: K, val: T[K]) :boolean};

function myProxyHandler<T extends object, K extends keyof T= keyof T>(handler : ProxyHandlerT<T, K>) { return handler; }

function myProxy<T extends object>(target :T, handler :ProxyHandlerT<T>) { return new Proxy(target, handler as ProxyHandler<T>); }

//function ProxyT<T extends object>(target: T, handler: ProxyHandler<T>): T { return new Proxy(); }

//type ExtraArgs<TArgs extends [...any]> = TArgs extends [unknown, ...infer T] ? [...T] : [];


export function createIndicatorInstance<TParams extends IParamsReadonly, TInstance extends interfaceIndicator, TInd extends IndicatorAny<TParams,TInstance>> //, TExtraArgs extends ExtraArgs<IndicatorArgs<TInd>>>
    (indicator : IndicatorAny<TParams,TInstance>&TInd, params :SimpleParams<TParams>, onInitData? :tOnInitIndicator|tOnInitIndicatorShort|TF) {//}, constructorAPI? :IndicatorConstructorAPI) {//, ...extraArg :TExtraArgs) {//indicatorConstructor<TParams>) {
        onInitData ??= createIndicatorInitData("undefined", ["undefined"], undefined);
        if (onInitData instanceof TF) onInitData= { symbol: "undefined", tf: onInitData };
        if (isInitIndicatorShort(onInitData))
            onInitData= createIndicatorInitData(onInitData.symbol, onInitData.symAddress ?? [onInitData.symbol], onInitData.tf);

        let wrapper= new CIndWork(indicator as IndicatorAny, params as SimpleParams, onInitData);
        let obj= wrapper.work as TInstance;
        if (! obj.OnBars && !obj.OnBar) throw "OnBar and OnBars is not defined in "+indicator.Name;
        //let obj= indicatorConstructor<TParams,TInstance,TInd>(indicator) (params, ...extraArg); //, extraArg);
        let baseData : Required<IIndicatorBase<TParams>> = { name: indicator.Name, version: indicator.Version, param: params, };//windows: obj.windows ?? []};
        let fullObj : Omit<typeof obj,"param"|keyof IIndicatorFunk> & IndicatorDataFull<TParams> = Object.assign(obj, {...baseData, windows: obj.windows ?? []}); // исключаем "param", т.к. иначе потом может быть баг с конфликтом типов (ESLint:TotalFunctions)
        let obj2= {
            onBar2(bar :CBar, allBars :IBarsExt, signalAPI :SignalAPI = __defaultEmptySignalAPI) {
                wrapper.OnBar({bar, allBars, signalAPI});
            }
        } as const;
        type fullType= Omit<typeof fullObj,keyof typeof obj2> & typeof obj2;
        const handler= myProxyHandler<fullType>({
            get: (target, prop)=> prop=="onBar2" ? obj2.onBar2 : (fullObj as any)[prop],
            set(target, prop) { throw "Setters is not available for proxy of "+indicator.Name; }
        });
        const proxy= myProxy(fullObj as fullType, handler);
        return proxy;
        //if ((obj as object as typeof obj2)["onBar2"])  throw "Попытка перезаписать имеющийся метод 'onBar2' в индикаторе "+indicator.Name;
        //return Object.assign(fullObj, obj2);
    }