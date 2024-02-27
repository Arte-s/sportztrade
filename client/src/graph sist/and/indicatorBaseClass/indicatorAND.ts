import {
    CLine, CObjectEvents,
    IBars, IBarsExt, IBuffer,
    Indicators, IObjects,
    tAddressSymbol,
    TF,
    tInfoInit, tInfoInit3, tListEvent,
    IndicatorConstructor,IndicatorConstructorAPI,
} from "../../API";

import {CParams, GetSimpleParams, IParamsReadonly, ReadonlyFull, SimpleParams} from "../CParams";
import {CSymbolData, ISymbolDataReadonly} from "../Symbol";
import {deepCloneObject, deepEqual, sleepAsync} from "../../Nav/Common"
import {IGraphObjectB, interfaceIndicator} from "../interface/IIndicator";
import {CIndicatorThread, CIndicatorWork} from "./indicatorWorker";
import {CIndicatorPrototype, IndParamsInfoExport, IndParamsExport,CIndicatorPrototypeMutable} from "./CIndicatorPrototype";
import {ICJournal2} from "../СJournal";
import {IGraphLabel} from "../labels";

type tIndicatorExportBase = { symbolData: { address: tAddressSymbol, tfSec: number } };

export interface tIndicatorExport extends tIndicatorExportBase {
    symbolData: { address: tAddressSymbol, tfSec: number },
    // setup: CIndicatorBaseParam,
    indicator: IndParamsInfoExport
}

export interface tIndicatorShortExport extends tIndicatorExportBase {
    symbolData: { address: tAddressSymbol, tfSec: number },
    // setup: CIndicatorBaseParam,
    indicator: IndParamsExport
}

function isIndicatorShortExportStruct(struct :tIndicatorExport|tIndicatorShortExport) : struct is tIndicatorShortExport {
    return (struct as tIndicatorExport).indicator.paramInfo==undefined;
}


export type TIndicatorSet<TParams extends IParamsReadonly =IParamsReadonly> = Readonly<{
    construct: IndicatorConstructor, paramDefault: TParams, name: string, version: string
    //construct: (param: SimpleParams) => interfaceIndicator, paramDefault: TParams, name: string, version: string
}>

export type tIndicatorPrototype<TParams extends IParamsReadonly = IParamsReadonly> = { readonly paramInfo: TParams } & TIndicatorSet

export type tIndicatorBaseParams = CIndicatorBaseParam;


type tInputString = { value: string, range: string[], name: string }

export type tIndicatorBaseParam = ReadonlyFull<{
    name: string,
    value: {
        exchange: tInputString,
        symbol: tInputString,
        tf: tInputString,
        historyLoad: { value: number, range: { min: number, max: number, step: number }, name: string },
        historyV: { value: number, range: { min: number, max: number, step: number }, name: string }
    }
}>;

export class CIndicatorBaseParam {
    readonly param: tIndicatorBaseParam

    constructor(info: { exchange: tInputString, symbol: tInputString, tf: tInputString }) {
        this.param = {
            name: "базовые параметры",
            value: {
                exchange: info.exchange,
                symbol: info.symbol,
                tf: info.tf,
                historyLoad: {value: 0, range: {min: 0, max: 50000, step: 100}, name: "подкачка баров"},
                historyV: {value: 0, range: {min: 0, max: 50000, step: 100}, name: "эмуляция истории'"}
            }
        }
    }
}


function normalizeDate(date :const_Date, step :number) { return new Date(Math.floor(date.valueOf() / step)*step); }


export class CParamsExtra extends CParams {
   //lastBarShift= { name: "Last_Bar", value: 0, range: { defaultMin:-10000, max:0, step:1 }, hidden: true };
   lastBarTime= { name: "Last_Time", value: normalizeDate(new Date(), 60000) as const_Date, enabled: false, range: { step: 60000 } };
   useSound = { name: "Звуковой сигнал", value: false };
}


export type ParamsReadonlyExt = ReadonlyFull<CParamsExtra>; //ReadonlyFull<ReturnType<typeof _paramsInfoToExt>>;



export type tIndicatorSetup = CIndicatorBaseParam;

function _paramsInfoToExt(params :IParamsReadonly) { return Object.assign(new CParamsExtra(), params); }


function paramsInfoToExt(params :IParamsReadonly, tf_or_stepMs: number|TF= TF.M1) : ParamsReadonlyExt {
    let step_ms= typeof tf_or_stepMs=="object" ? tf_or_stepMs.msec : tf_or_stepMs;
    let pExt= params as ParamsReadonlyExt;
    //if (pExt.lastBarShift!=undefined &&
    if (pExt.lastBarTime!=undefined)
        if (step_ms==null || pExt.lastBarTime.range.step==step_ms) return pExt;
    let newObj = _paramsInfoToExt(params);
    newObj.lastBarTime.range.step= step_ms ?? 1;
    return newObj;
}




export interface IIndicatorANDBase {
    readonly baseInfo: tIndicatorPrototype; //Readonly<{ paramInfo: IParamsReadonly } & TIndicatorSet>;
    readonly iBuffers: readonly IBuffer[];
    readonly lines: readonly CLine[];
    readonly lines2: IObjects;
    readonly labels: readonly IGraphLabel[];
    //под окна индикатора в интерфейсе индикатора
    readonly windows: readonly IGraphObjectB[] | undefined;
    //ссылка на фактическое окно
    // windowsObj:ICDivFunc[];
    readonly name: string;
    readonly version: string;
    readonly paramValues: SimpleParams;
    readonly paramInfos: ParamsReadonlyExt;

    readonly visible :boolean;
    updatesCount(): number;
    isCalculating(): boolean;
    SetSymbol(symbolInfo: tInfoInit): void;
    Disconnect(): void;
    //Reload(symbolData?: CSymbolData): void;
    AddEventForReloadParams(f: tListEvent): void;
}
interface IIndicatorAND extends IIndicatorANDBase{
    readonly symbolData: ISymbolDataReadonly;
    ReloadOnParams(params: IParamsReadonly): Promise<void>;
    Export(): tIndicatorExport;
    Import(data: tIndicatorExport): Promise<void>;
    ExportShort(): tIndicatorShortExport;
}

export class CIndicatorANDMini implements IIndicatorANDBase {
    visible:boolean = true;
    // private _visible:boolean = true
    // get visible(): boolean { return this._visible; }
    // set visible(value: boolean) { this._visible = value; }

    protected _indInfo: CIndicatorPrototype;// = new CIndicatorPrototype;

    private _work: interfaceIndicator; // базовый рабочий класс инициализируется в конструкторе

    private _updatesCounter = 0;  // счётчик изменений состояний основного объекта (только увеличивается)
    //поставить метку на перерисовку графика
    updatesCounterNext() {this._updatesCounter++}

    // счётчик изменений основного объекта
    updatesCount() { return this._updatesCounter; }

    // проверяет, выполняется ли расчёт индикатора в текущий момент
    isCalculating() { return false; }

    get baseInfo() { return this._indInfo.base; }


    private set work(data: interfaceIndicator) {
        console.log("set work");
        this._work = data;
        this._updatesCounter++;
        //this._calcBarTime= undefined;
    }

    private get work() {
        return this._work;
    }

    constructor(indicatorBase: tIndicatorPrototype) {
        this._indInfo = new CIndicatorPrototype({...indicatorBase, paramInfo: paramsInfoToExt(indicatorBase.paramInfo) });
        this._work= this._indInfo.construct({} as IndicatorConstructorAPI); // TODO: Делаем заглушку через as, т.к. весь тот класс - один большой костыль
    }

    get iBuffers() { return this.work?.iBuffers ?? []; };

    //private _emptyLines : readonly ILine[] = [];
    //private _emptyLabels : readonly IGraphLabel[] = [];

    get lines() { return this.work.lines ?? []; }

    get lines2() { return this.work?.lines2 ?? []; };

    get labels() { return this.work.labels ?? []; }

    get windows() { return this.work?.windows ?? []; };

    get name() { return this._indInfo.name; };

    get version() { return this._indInfo.version; };

    get paramValues() { return this._indInfo.paramsValues; };

    get paramInfos() { return paramsInfoToExt(this._indInfo.paramInfo); }


    AddEventForReloadParams(f: tListEvent): void {
    }

    Disconnect(): void {
    }

    async ImportShort(data: tIndicatorShortExport) {
    }

    // async ReloadOnParams(params: IParamsReadonly) {
    // }

    SetSymbol(symbolInfo: tInfoInit): void {
    }

}




export class CIndicatorAND implements IIndicatorAND {

    //показывать индикатор или нет
    private _visible:boolean = true
    get visible(): boolean { return this._visible; }
    set visible(value: boolean) { this._visible = value; }

    private thread : CIndicatorThread;

    private get work() { return this.thread.work; }

    private symbolInfo : tInfoInit3;
    //private _symbolData: CSymbolData;
    get     symbolData() : ISymbolDataReadonly { return this.thread.symData; }

    private _indInfo: CIndicatorPrototypeMutable< ParamsReadonlyExt >;// = new CIndicatorPrototype;
    private _logger? : ICJournal2;

   // readonly setup: tIndicatorSetup;

    //поставить метку на перерисовку графика
    updatesCounterNext() { this._updatesCounter++; }//work.updatesCounterNext(); }

    // счётчик изменений основного объекта
    private _updatesCounter = 0;
    updatesCount() { return this._updatesCounter + this.thread.updatesCount; }

    // проверяет, выполняется ли расчёт индикатора в текущий момент
    isCalculating() { return this.work.isCalculating(); }

    get calculationProgress_percent() { return this.work.calculationProgress_percent; }

    get calculationStartTime() { return this.work.calculationStartTime; }

    get baseInfo() { return this._indInfo.base; }

    stop() { this.work.stop(); }

    get currentTask() { return this.work.currentTask; }

    private createNewSymbolInfo(data :Readonly<{address: tAddressSymbol, tfSec: number}>) : tInfoInit3 {
        return {...this.symbolInfo,  address: data.address,  tf : TF.fromSec(data.tfSec) ?? (()=>{throw "невозможно получить TF по переданным секундам: "+data.tfSec;})() };
    }

    Export(): tIndicatorExport {
        return {
            symbolData: this.symbolData.Export(),
            indicator: this._indInfo.export()
        }
    }
    async Import(data: tIndicatorExport) {
        this.symbolInfo= this.createNewSymbolInfo(data.symbolData);
        //this._symbolData= new CSymbolData(this.symbolInfo);
        //this._symbolData.Import(data.symbolData);
        this._indInfo.importParams(paramsInfoToExt(data.indicator.paramInfo, data.symbolData.tfSec*1000));
        await this.ReloadOnParams();
    }

    ExportShort(): tIndicatorShortExport {
        return {
            symbolData: this.symbolData.Export(),
            indicator: { name: this.name, version: this.version, params: this._indInfo.paramsValues }
        }
    }

    async ImportShort(data: tIndicatorShortExport) {
        this.symbolInfo= this.createNewSymbolInfo(data.symbolData);
        this._indInfo.importParamsValues(data.indicator.params);
        this._indInfo.paramInfo = paramsInfoToExt(this._indInfo.paramInfo, data.symbolData.tfSec*1000);
        //console.warn(data);
        await this.ReloadOnParams();
    }

    constructor(indicatorBase: tIndicatorPrototype, symbolInfo: tInfoInit3, logger? :ICJournal2) {
        this._indInfo = new CIndicatorPrototypeMutable({...indicatorBase, paramInfo: paramsInfoToExt(indicatorBase.paramInfo, symbolInfo.tf) });
        this.symbolInfo= {...symbolInfo};
        this._logger= logger;
        this.thread= this._createNewThread();
    }

    SetSymbol(symbolInfo: tInfoInit3) {
        console.log("SetSymbol: ",{symbolInfo});
        //this._symbolData.Set(symbolInfo);
        this.symbolInfo= symbolInfo;
        //this._symbolData = new CSymbolData(symbolInfo);
        this.ReloadOnParams(paramsInfoToExt(this.paramInfos, symbolInfo.tf));  // перезагружаем с возможно новым таймфреймом
    }
    // включает/выключает выполнение onBars и onTick
    set calc(flag :boolean) { this.thread.calc= flag;  }
    get calc()              { return this.thread.calc; }

    // Создать поток выполнения
    private _createNewThread() {
        let srcParams= this._indInfo.paramsValues;
        let params = {...srcParams};
        let mutable : Partial<typeof params> = params;  delete mutable.useSound;  delete mutable.lastBarTime;
        return new CIndicatorThread(
            this._indInfo.indicator,
            params, this.symbolInfo,
            { calc: this.thread?.calc, timeLimit: srcParams.lastBarTime, useSound: srcParams.useSound},
            this._logger
        );
    }

    private Init() {
        this.thread.stop(); //выключает действующий расчет индикатора
        this.thread = this._createNewThread();
        this._updatesCounter++;
    }

    // колбэк который исполняется при перезапуске параметров
    private funksBR = new CObjectEvents; //tListEvent<T>

    AddEventForReloadParams(f:tListEvent) {
        this.funksBR.Add(f);
    }

    async ReloadOnParams(params? :IParamsReadonly, runCallback = true) {
        //console.log("Reload on params");
        if (params) this._indInfo.paramInfo= {...this._indInfo.paramInfo, ...params}; //paramsInfoToExt(params);
        this.Init();
        // console.log({history}, history?.length)
        if (runCallback) this.funksBR.OnEvent();
        await this.work.currentTask;
    }
    // задать границу окончания расчёта по времени
    setCalcTimeLimit(time :const_Date, runCallback = true) {
        let params= {...this.paramInfos};
        params.lastBarTime= { ...params.lastBarTime, value: time, enabled: true };
        this._indInfo.paramInfo = params; //.importParams(params);
        this.thread.setTimeLimit(time);
        if (runCallback) this.funksBR.OnEvent();
        //return this.ReloadOnParams(params);
    }
    // смена параметров
    async changeParams(paramValues :SimpleParams, runCallback = true) {
        let oldParams= this.paramValues;
        let newParams= (paramValues as typeof oldParams);
        this._indInfo.importParamsValues(paramValues);
        // если параметры отличаются только lastBarTime или useSound, то меняем только их без переинициализации индикатора
        if (deepEqual<typeof oldParams>( oldParams, {...newParams, lastBarTime: oldParams.lastBarTime!, useSound: oldParams.useSound} )) {
            if (newParams.lastBarTime?.valueOf()!=oldParams.lastBarTime?.valueOf())
                this.thread.setTimeLimit(newParams.lastBarTime ?? undefined);
            this.work.useSound= newParams.useSound ?? false;
        } else {
            this.Init();
        }
        if (runCallback) this.funksBR.OnEvent();
        await this.work.currentTask;
    }

    Disconnect() { return this.thread.DeleteStream(); }

    get iBuffers() { return this.work.iBuffers; }

    get lines() { return this.work.lines; }

    get lines2() { return this.work.lines2; }

    get labels() { return this.work.labels; }

    get windows() { return this.work.windows; };

    //массив окон на которых отображается наш индикатор, возможно несколько окон для одно индикатора
    // readonly windowsObj: ICDivFunc[] =[]

    get name() { return this._indInfo.name };

    get version() { return this._indInfo.version };

    get paramValues() { return this._indInfo.paramsValues };

    get paramInfos() { return this._indInfo.paramInfo; }
}



export class CIndicatorsAND implements Iterable<CIndicatorAND>  {
    //readonly [key : number] : IIndicatorAND;
    [Symbol.iterator]() {
        return this._indicators[Symbol.iterator]()
    }

    private static idStatic = 0;
    private id= CIndicatorsAND.idStatic++;
    private nowSymbol: CSymbolData;

    protected _indicators: (CIndicatorAND)[] = [];
    protected _logger? :ICJournal2;


    constructor(nowSymbol: CSymbolData, logger :ICJournal2) {
        //console.log( {id: this.id})
        this.nowSymbol = nowSymbol;
        this._logger= logger;
    }

    //выключает текущий расчет у всех индикаторов
    StopCalculateAll() {
        for (let indicator of this._indicators) {
            indicator.stop();
        }
    }

    Export() {
        return this._indicators.map((indicator) => indicator.Export())
    }

    ExportShort() {
        return this._indicators.map((indicator) => indicator.ExportShort())
    }

    private _Import(data: readonly tIndicatorExport[]|readonly tIndicatorShortExport[]) {
        this.delete();
        for (let item of data) {
            if (!item) continue;
            const indInfo = Indicators.find(item.indicator)
            if (!indInfo) { console.error("Не найден импортируемый индикатор:",item.indicator); continue; }
            const ind = new CIndicatorAND(indInfo.base, this.nowSymbol.Get(), this._logger);
            if (isIndicatorShortExportStruct(item))
                ind.ImportShort(item);
            else
                ind.Import(item);
            //console.warn("!!!! ",(item.indicator as IndParamsExport).params);
            this._indicators.push(ind)
        }
    }

    Import(data: readonly tIndicatorExport[]) {
        this._Import(data)
    }

    ImportShort(data: readonly tIndicatorShortExport[]) {
        this._Import(data)
    }

    //{symbolData: {address: tAddressSymbol, tfSec: number}, setup: CIndicatorBaseParam, indicator: {name: string, paramInfo: CParams}}[]
    // protected intiNowSymbol(...obj:CIndicatorAND[])     { for (let cIndicatorAND of obj) cIndicatorAND.SetSymbol(this.nowSymbol().Get())}

    indexOf(obj: CIndicatorAND) {
        return this._indicators.indexOf(obj)
    }

    splice(start: number, deleteCount: number = 1) {
        const end = Math.min(start+deleteCount, this._indicators.length)
        for (let i=start; i<end; i++) this._indicators[i]?.Disconnect();
        return this._indicators.splice(start, deleteCount);
    }

    //   deleteByClass(obj:CIndicatorAND)                    {const buf=this.indexOf(obj); if (buf>=0) this.splice(buf)}
    //   deleteALl()                                         {for (let indicator of this._indicators) if (indicator.Delete) indicator.Delete(); this._indicators=[]; return this;}

    add(...objects: (CIndicatorPrototype | tIndicatorPrototype)[]) {
        const indicators = objects.map(
            (obj) => new CIndicatorAND(obj instanceof CIndicatorPrototype ? obj.base : obj, this.nowSymbol.Get(), this._logger)
        );
        return this._indicators.push(...indicators);
    }
    //пробная функция
    addMini(...objects: (CIndicatorPrototype | tIndicatorPrototype)[]) {
        const indicators = objects.map(
            (obj) => new CIndicatorANDMini(obj instanceof CIndicatorPrototype ? obj.base : obj)
        );
        return this._indicators.push(...(indicators as [] as CIndicatorAND[])); // TODO: Сашина заглушка с подменой типов!
    }

    get length() {
        return this._indicators.length;
    }

    get indicators() {
        return this._indicators;
    }

    at(index :number) { return this._indicators.at(index); }

    async SetSymbol(symbolInfo: tInfoInit) {
        try {
            for (let indicator of this._indicators) await indicator.SetSymbol(symbolInfo);
        } catch (e) {
            console.error(e);
        }
    }

    delete(...indicators: (CIndicatorAND|undefined)[]) {
        if (indicators.length==0) return this.splice(0, this.length);
        else for (let ind of indicators) if (ind) this.splice(this.indexOf(ind));
        return this;
    }

    async loadHistory(time1: const_Date|number, time2?: const_Date) {
        for (let indicator of this._indicators) if (indicator.calc) indicator.symbolData?.loadHistory(time1, time2);
        return this;
    }
}
