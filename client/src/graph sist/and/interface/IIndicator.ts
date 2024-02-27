import {ILine, IObjects} from "../../Nav/CGraphObject";
import {IGraphLabel} from "../labels";
import {tAlertMini, tOnInitSymbol, tOnInitSymbols, tTick} from "./mini";
import {CRBaseMapAll2} from "../history/historyBase";
import {IBuffer} from "../buffer";
import {IParams, IParamsReadonly, SimpleParams} from "../CParams";
import {CQuotesHistory, CBar, IBars, IBarsExt, IBarsImmutable, TF} from "../../Nav/MarketData";
import {IIndicator} from "../../Nav/Indicator";
import {SignalAPI} from "../../ind/Signal"
import {tAddressSymbol, tSetTicks,tSymbolInfoBase} from "./IHistoryBase";
//import {CIndicatorGraphObject} from "../const";
export type {tAlert, tAlertMini, tOnInitSymbol, tOnInitSymbols, tTick} from "./mini";


export interface IGraphObject {
    readonly lines: readonly ILine[]; //линии
    readonly lines2: IObjects; //линии
    readonly labels: readonly IGraphLabel[]; // текстовые метки
}

export interface IGraphObjectB extends IGraphObject{
    //буферы - хранят данные для отображения
    readonly iBuffers: readonly IBuffer[];
}



export type IndicatorGraphics = IGraphObjectB & {
    readonly windows?: readonly IGraphObjectB[];
}


export type tIndSymbol = string;

type TypeT<T> = { readonly [Symbol.species]: T };

export type IndicatorID<T extends interfaceIndicator = interfaceIndicator> = TypeT<T>; //"IndicatorID" };

export type IndData<T extends interfaceIndicator> = ReadonlyFull<Omit<T, keyof interfaceIndicator>>;

export function newIndicatorID(): IndicatorID {
     return {[Symbol.species]: undefined as unknown as interfaceIndicator};//"IndicatorID"};
 }
//loadHistory вызывает загрузку котировок,
// индикатор не замораживается на время закачки котировок, и все основные функции  продолжают работать
// сложность замрозки в том что метод загрузки не всегда может быть доступен к примеру в ТЕСТЕРЕ
export type tOnInitIndicator = Readonly<{
    //allBars: IBars,
    tf :TF,
    hasTf :boolean
    startDate? :const_Date,
    //loadHistory(loadBar: number | const_Date) : void,
    loadHistory(from :const_Date) : void,
    loadHistory(nbars :number) : void,
    alert(data: tAlertMini) : void,
    symbol: tOnInitSymbol,
    symbols: tOnInitSymbols,
    // получить инфу по другому символу
    getOtherSymbol(symbol :string) : tOnInitSymbol|undefined,
    // подписка на символ
    subscribeOtherSymbol(symbol :string, loadHistory? :Readonly<{from :const_Date, nbars?:undefined} | { nbars :number, from?:undefined}>) : boolean;
}>;

export type tOnInitIndicatorShort = Readonly<{tf :TF, symbol :string, symAddress? :tAddressSymbol}>;

export function isInitIndicatorShort(data :tOnInitIndicator|tOnInitIndicatorShort) : data is tOnInitIndicatorShort { return typeof data.symbol=="string"; }

export function createIndicatorInitData(symbolInfo :tSymbolInfoBase|string, symAddress :tAddressSymbol, tf :TF|undefined) : tOnInitIndicator {
    function throwErr(name :keyof (tOnInitIndicator & tOnInitIndicator["symbol"] & tSymbolInfoBase)) : never { throw "Команда "+name+" недоступна!"}
    if (typeof symbolInfo=="string")
        symbolInfo= Object.freeze({
            name: symbolInfo,
            get quoteAsset() { return throwErr("quoteAsset"); },
            get baseAsset() { return throwErr("baseAsset"); }
        });
    else symbolInfo= {...symbolInfo};
    const symInfo= symbolInfo;
    symAddress=[...symAddress];
    return {
        get tf() { return tf ? tf : throwErr("tf") },
        hasTf: tf!=null,
        loadHistory: ()=>throwErr("loadHistory"),
        alert: ()=>{},
        symbol: {
            info: symbolInfo,
            getAddress: ()=>symAddress,
            LoadHistoryForEvent : ()=>throwErr("LoadHistoryForEvent"),
            LoadHistoryForEventMini : ()=>throwErr("LoadHistoryForEventMini"),
        },
        get symbols() { return throwErr("symbols"); },
        getOtherSymbol(symbol:string) { return symbol==symInfo.name ? this.symbol : undefined; },
        subscribeOtherSymbol : ()=>throwErr("subscribeOtherSymbol")
    }
}


export type IndicatorSignalBase = Readonly<{ volume :number; price? :number; name? :string }>

export type IndicatorSignalPartial = IndicatorSignalBase & { readonly bar? :CBar }

export type IndicatorSignalPartialOnBar = IndicatorSignalPartial & { readonly bar :CBar }; //, realTime? :boolean }

export type IndicatorSignal = RequiredExcept<IndicatorSignalBase,"name">; export type IndicatorSignalExt = IndicatorSignal & { readonly time : const_Date }; export type IndicatorOnBarAPIBase = Readonly<{
     alert: (data: tAlertMini) => void,
     _drawSignal(signal :IndicatorSignalPartial | (()=>IndicatorSignalPartial)) :void;
 }>

export type IndicatorOnBarsAPI = IndicatorOnBarAPIBase; export type IndicatorOnBarAPI = IndicatorOnBarAPIBase & Readonly<{
     signals : SignalAPI;
     getIndicatorData<T extends interfaceIndicator>(id :IndicatorID<T>) : IndData<T>;
 }>;

export type IndicatorOnBarAPIEasy = Omit<IndicatorOnBarAPI,"getIndicatorData">; export type tOnBarsIndicator = Readonly<{
     newBars :IBars;
     newBarIndex :number;
     allBars :IBarsExt;
     getBars(tf :TF) : IBarsImmutable | undefined,
     api :IndicatorOnBarsAPI,
 }>



export type tOnBarIndicatorExt = Readonly<{
    bar :CBar,
    closed :boolean,
    tf :TF,
    index :number,
    allBars :IBarsExt,
    getBars(tf :TF) : IBarsImmutable | undefined,
    otherSymbols : readonly Readonly<{ symbol :tIndSymbol, bar :CBar, allBars :IBars, getBars(tf :TF) :IBarsImmutable|undefined }>[],
    finish :boolean,
    api :IndicatorOnBarAPI
}>;

export type tOnBarIndicatorExtEasy = ReplaceKeyType<tOnBarIndicatorExt, "api", IndicatorOnBarAPIEasy>;

export type tOnBarIndicator = tOnBarIndicatorExt;

 // структура без сигналов
 //export type tOnBarIndicatorBase = ReplaceKeyType<tOnBarIndicator, "api", IndicatorOnBarAPIBase>

export type tOnTickExt = Readonly<{ tick: tTick , bars?: IBars, history?: CQuotesHistory, api :IndicatorOnBarAPI }>;

// структура без сигналов
export type tOnTick= ReplaceKeyType<tOnTickExt, "api", IndicatorOnBarAPIBase>;

export type tOnTicks = ReadonlyFull<tSetTicks>;



export interface IIndicatorFunk extends Readonly<{
    //служит для перволительной проверки закаченной истории и запроса доп истории, при её подкачке - индщикатор переиницилизируется через удаление и его новый вызов
    //для множетсвенного подключения котировок воспользутесь скриптами с подключением на подписки
    OnInit?(init: tOnInitIndicator): void;

    //При иницилизации истории тоже вызывается. - вся базовая история входит в параметр, также есть параметр новыеБары - гд масив чисто новых бар
    OnBars?(data: tOnBarsIndicator, isStopped: ()=> boolean|Promise<boolean>): Promise<number|void> | number|void;

    //присылает по одному новому бару с самого начала, эмулируя всю историю
    OnBar?(data: tOnBarIndicatorExt): void;

    //OnNewBarMulti?(data :tOnBarIndicatorMulti) : void;

    //событие при новых тиках
    OnTicks?(data: tOnTicks, isStopped: ()=> boolean|Promise<boolean>): Promise<number|void> | number|void;

    //присылает по одному новому тику с самого начала
    OnTick?(data: tOnTickExt): void;

    //печать статистики
    printStatistics?() :void;
    // использует ли индикатор сигнал
    useSignal? :boolean;
}> { }

export type IIndicatorFunkEasy = ReplaceKeyType<IIndicatorFunk,"OnBar",(data :tOnBarIndicatorExtEasy)=>void>;


export interface IServiceFunk extends Readonly<{
    //служит для перволительной проверки закаченной истории и запроса доп истории, при её подкачке - индщикатор переиницилизируется через удаление и его новый вызов
    //для множетсвенного подключения котировок воспользутесь скриптами с подключением на подписки
    OnInit(history: CRBaseMapAll2): void;
}> { }




export type IIndicatorBase<TParams extends IParamsReadonly =IParams> = {
    readonly name?: string;
    readonly version?: string;
    readonly param?: SimpleParams<TParams>;
}


export interface interfaceIndicator<TParams extends IParamsReadonly =IParams>  extends IIndicatorBase<TParams>, IndicatorGraphics, IIndicatorFunk {
    readonly fixedLines? : readonly ILine[];
    readonly fixedLabels? : readonly IGraphLabel[];
    //readonly signals? : CMySignals; //readonly Signal[] | CMySignals;
}

export type interfaceIndicatorBase = ReplaceKeyType<interfaceIndicator, "OnBar", (data: tOnBarIndicator)=>void>;

export interface interfaceService extends IIndicatorBase, IndicatorGraphics, IServiceFunk {
}

export type IndicatorData<TParams extends IParamsReadonly =IParams> = IIndicatorBase<TParams> & IndicatorGraphics & Required<Pick<IIndicatorBase, "name">>;

export type IndicatorDataFull<TParams extends IParamsReadonly =IParams> = Required<IndicatorData<TParams>>;

export type IndicatorDataExt<TParams extends IParamsReadonly =IParams> = Partial<IIndicator> & IndicatorData;

