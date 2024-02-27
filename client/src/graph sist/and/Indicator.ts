import {IGraphLabel} from "./labels";
import {AlignH, CObjectsAndr, Color, ILine, ITimeLine, LineStyle, Point, typeNewObjectGraph} from "../Nav/CGraphObject";

import {enableAllParams, GetSimpleParams, IParams, IParamsReadonly, ReadonlyFull, SimpleParams} from "./CParams";

import {
    IGraphObjectB,
    IIndicatorFunk,
    IndicatorID,
    interfaceIndicator,
    interfaceIndicatorBase,
    interfaceService,
    newIndicatorID,
    tOnBarIndicator,
    tOnBarIndicatorExt,
    tOnBarsIndicator,
    tOnInitIndicator,
    tOnTick,
    tOnTickExt,
    tOnTicks
} from "./interface/IIndicator";
import {CRBaseMapAll2} from "./history/historyBase";

import {CBar, IBarsExt} from "../Nav/Bars";

import {createEmptySignalAPI} from "../ind/Signal";

import {CCachedValue2, isObjectCastableTo} from "../Nav/Common";

import {iterateDeepObjectEntries, objectGetValueByPath} from "../Nav/objectPath";

//import {createIndicatorInstance} from "./indicatorBaseClass/indWorkBase";

import {CBuffSimple, IBuffer} from "./buffer";

export * from "../Nav/CGraphObject";

export * from "./buffer";

export * from "./interface/IIndicator";




//type Indicator2 = IndicatorBase & (new (params :SimpleParams)=>interfaceIndicator);

// & ( // Создание индикатора через метод, либо через конструктор (если это класс)
//     { construct(params :SimpleParams) : interfaceIndicator; }
//     | (T: new (params :SimpleParams)=>interfaceIndicator)
// )
// >
//
// type Indicator<T> = Readonly< {
//         Name :string;
//         Version :string;
//         paramInfo :ReadonlyFull<IParams>;
//     } & ( // Создание индикатора через метод, либо через конструктор (если это класс)
//     { construct(params :SimpleParams) : interfaceIndicator; }
//     | (T: new (params :SimpleParams)=>interfaceIndicator)
//     )
// >

//type Indicator<TParams extends IParams= IParams> = Readonly< {
//     Name :string;
//     Version :string;
//     paramInfo :ReadonlyFull<TParams>;
// } & ( // Создание индикатора через метод, либо через конструктор (если это класс)
//     { construct(params :SimpleParams<TParams>) : interfaceIndicator; }
//     | (new (params :SimpleParams<TParams>)=>interfaceIndicator)
//     )
//     >


export type IndicatorInfo<TParams extends IParamsReadonly= IParams> = Readonly< {
    Name :string;
    Version :string;
    paramInfo :IParamsReadonly & ReadonlyFull<TParams>;
    //useSignal? :boolean;
}>;

export type IndicatorConstructorAPI = Readonly<{
    addIndicator<TParams extends IParamsReadonly, TInstance extends interfaceIndicator>(
        indicator :IndicatorAny<TParams,TInstance>, params :SimpleParams<TParams>
    ) : IndicatorID;
}>;

//export const emptyIndicatorConstructorApi : IndicatorConstructorAPI = { add}


export type Indicator<TParams extends IParamsReadonly= IParamsReadonly, TInstance extends interfaceIndicator= interfaceIndicator> =
    IndicatorInfo<TParams> & Readonly<{ construct(params :SimpleParams<TParams>, api :IndicatorConstructorAPI) : TInstance; }>


export type IndicatorClass<TParams extends IParamsReadonly, TInstance extends interfaceIndicator= interfaceIndicator> =
    IndicatorInfo<TParams> & (new (params :SimpleParams<TParams>, api :IndicatorConstructorAPI)=>TInstance);




//type IParamsT<T>= {[key in keyof T] :T[key]} extends { [key in string] :IParams[key]} ? T : never;

export type IndicatorAny<TParams extends IParamsReadonly=IParamsReadonly, TInstance extends interfaceIndicator =interfaceIndicator> = Indicator<TParams,TInstance>|IndicatorClass<TParams,TInstance>;

// export type IndicatorAny2<TParams extends IParamsT<TParams>> = Indicator<TParams>|IndicatorClass<TParams>;
//
// type B<T>= T extends number ? string : boolean;
//
// type A<T extends B<T>> = number

//type IndicatorClassFull = IndicatorBase & (new (params :SimpleParams<IParams>)=>interfaceIndicator);

//export type IndicatorClassFull<T> = T extends IndicatorBase ? T extends (new (params :SimpleParams<T["paramInfo"]>)=>interfaceIndicator) ? T : never : never;


//export type Indicator<T> = T extends IndicatorBase ? T extends IndicatorClass | ((new (params :SimpleParams<T["paramInfo"]>)=>interfaceIndicator)) ? T : never : never;

//export type Indicator<T> = T extends IndicatorBase ? T extends IndicatorClass | IndicatorClassFull2<T["paramInfo"]> ? T : never : never;

//export type Indicator<T> = T extends IndicatorBase ? T extends IndicatorClass<T["paramInfo"]> | IndicatorClassFull2<T["paramInfo"]> ? T : never : never;

// type IndicatorArgs<TParams extends IParamsReadonly, TInstance extends interfaceIndicator, TInd extends IndicatorAny<TParams,TInstance>>
//     = TInd extends Indicator ? Parameters<TInd["construct"]> : TInd extends IndicatorClass<any,any> ? ConstructorParameters<TInd> : never;

export type IndicatorArgs<TInd extends {readonly construct :(...args: any)=>any } | (abstract new(...args: any)=>any)> //IndicatorAny<IParamsReadonly,interfaceIndicator>>
    = TInd extends Indicator ? Parameters<TInd["construct"]> : TInd extends (abstract new(...args: any)=>any) ? ConstructorParameters<TInd> : never;

//type ExtraArgs<TArgs extends (TArgs extends [any, ...infer T2] ? [] : never)> = T2;

type ExtraArgs<TArgs extends [...any]> = TArgs extends [unknown, ...infer T] ? [...T] : [];

//function getClassConstructor<T extends (new(...args :any)=>any)>(classObj :T) { return (...args :ConstructorParameters<T>)=>new classObj(...args); }

// type IndicatorExtraArgs<TParams extends IParamsReadonly, TInstance extends interfaceIndicator, TInd extends IndicatorAny<TParams,TInstance>>
//     = ExtraArgs<IndicatorArgs<TParams, TInstance, TInd>>;

// type IndicatorExtraArgs<TParams extends IParamsReadonly, TInstance extends interfaceIndicator, TInd extends IndicatorAny<TParams,TInstance>
//     = ExtraArgs<>;

type _IndicatorConstructor< TParams extends IParamsReadonly, TInstance extends interfaceIndicator, TInd extends IndicatorAny<TParams,TInstance> > =
     (params :SimpleParams<TParams>, ...args: ExtraArgs<IndicatorArgs<TInd>>) => TInstance;

export type IndicatorConstructor<TInd extends IndicatorAny<any,any> =Indicator> =
     TInd extends IndicatorAny<infer TParams, infer TInstance> ? _IndicatorConstructor<TParams, TInstance, TInd> : never;


export function indicatorConstructor<TParams extends IParamsReadonly, TInstance extends interfaceIndicator, TInd extends IndicatorAny<TParams,TInstance>>
    (ind :IndicatorAny<TParams,TInstance>&TInd)  : _IndicatorConstructor<TParams, TInstance, TInd> {//IndicatorAny<TParams,TInstance>) {
        return ((ind as Indicator<TParams,TInstance>).construct ?? ((...args)=>new (ind as IndicatorClass<TParams,TInstance>)(...args as [any,any?])) //Object.getPrototypeOf(ind).constructor)
        ) as (params :SimpleParams<TParams>, extra? :any)=>TInstance;
            //?? ((params: SimpleParams<TParams>)=> new (ind as IndicatorClass<TParams,TInstance>)(params));
}

// export type IndicatorConstructor2<TInd extends IndicatorAny<any,any> =Indicator> =
//     TInd extends IndicatorAny<infer TParams, infer TInstance> ? ReturnType<typeof indicatorConstructor<TParams, TInstance, TInd>> : never;


// export function createIndicatorInstance<TParams extends IParamsReadonly, TInstance extends interfaceIndicator, TInd extends IndicatorAny<TParams,TInstance>, TExtraArgs extends ExtraArgs<IndicatorArgs<TInd>>>
//     (indicator : IndicatorAny<TParams,TInstance>&TInd, params :SimpleParams<TParams>, ...extraArg :TExtraArgs) {//indicatorConstructor<TParams>) {
//         let obj= indicatorConstructor<TParams,TInstance,TInd>(indicator) (params, ...extraArg); //, extraArg);
//         let baseData : Required<IIndicatorBase<TParams>> = { name: indicator.Name, version: indicator.Version, param: params, };//windows: obj.windows ?? []};
//         let fullObj : Omit<typeof obj,"param"> & IndicatorDataFull<TParams> = Object.assign(obj, {...baseData, windows: obj.windows ?? []}); // исключаем "param", т.к. иначе потом может быть баг с конфликтом типов (ESLint:TotalFunctions)
//         let _prevCalculatedExt :number|undefined = 0;
//         let fullObj2= Object.assign(fullObj, {
//             onBarExt2(bar :CBar, allBars :IBarsExt) {
//                 if (! obj.OnBars && !obj.OnBar) throw "OnBar and OnBars is not defined!";
//                 _prevCalculatedExt = indicatorOnBar(obj, bar, allBars, _prevCalculatedExt);
//             },
//             onBarExt(data :tOnBarIndicator) { return this.onBarExt2(data.bar, data.allBars); }
//         } as const);
//         return fullObj2;
// }

// export function createIndicatorInstance<TParams extends IParamsReadonly, TInstance extends interfaceIndicator, TInd extends IndicatorAny<TParams,TInstance>>
//     (indicator : IndicatorAny<TParams,TInstance>&TInd, params :SimpleParams<TParams>) {//indicatorConstructor<TParams>) {
//         return createIndicatorInstance2<TParams,TInstance,TInd>(indicator, params);
//     }
//
//

export function createIndicatorInstanceBase<TParams extends IParamsReadonly, TInstance extends interfaceIndicator, TInd extends IndicatorAny<TParams,TInstance>, TExtraArgs extends ExtraArgs<IndicatorArgs<TInd>>>
    (indicator : IndicatorAny<TParams,TInstance>&TInd, params :SimpleParams<TParams>, ...extraArg :TExtraArgs) {//indicatorConstructor<TParams>) {
        return indicatorConstructor<TParams,TInstance,TInd>(indicator) (params, ...extraArg); //, extraArg);
}





export function Indicator<TParams extends IParamsReadonly>(ind :IndicatorAny<TParams>) : Indicator {
    const constructor= indicatorConstructor(ind);
    const requiredParams= GetSimpleParams(enableAllParams(ind.paramInfo, false));
    if (requiredParams==null) console.warn("!!! ",ind.Name);
    return {
        Name: ind.Name,
        construct: (params, api)=> {
            for(let [key,param,path] of iterateDeepObjectEntries(requiredParams))
                if (param!=undefined)
                    console.assert(objectGetValueByPath(params,path) != undefined, // || (typeof(ind.paramInfo[key])=="object" && ind.paramInfo[key] as IParamBaseReadonly)?.enabled!=null,
                        "param ["+key+"] is not defined for indicator "+ind.Name //+" : "+JSON.stringify(ind.paramInfo[key])
                    );
            return constructor(params as SimpleParams<TParams>, api);
        },
        Version: ind.Version,
        paramInfo: ind.paramInfo
    };
}

function createIndicatorFake(ind :IndicatorAny) {
    return createIndicatorInstanceBase(ind, GetSimpleParams(ind.paramInfo), {addIndicator: ()=>newIndicatorID()});
}


export function indicatorIsUsingSignal(ind :IndicatorAny) {
    //let instance = createIndicatorInstance(ind, GetSimpleParams(ind.paramInfo)) as interfaceIndicator;
    let instance= createIndicatorFake(ind);
    return instance.useSignal && instance.OnBar;
}


// type IndicatorHasMethods<T extends IIndicatorFunk> = (T["OnBar"] | T["OnBars"] | T["OnTick"] | T["OnTicks"]) extends never ? false : true;
//
// type IndicatorCheckMethods<T extends IIndicatorFunk> = IndicatorHasMethods<T> extends true ? T : never;


export const __defaultEmptySignalAPI = createEmptySignalAPI();

// export function indicatorOnBar(ind :Pick<IIndicatorFunkEasy,"OnBars"|"OnBar">, bar :CBar, allBars :IBarsExt, prevCalculated? :number, signalAPI= __defaultEmptySignalAPI) {
//     //if (!ind.OnBars) throw "OnBars is undefined";
//     let barsLength= allBars.length;
//     if (ind.OnBar) {
//         ind.OnBar({
//             bar: bar,
//             index: barsLength-1,
//             allBars,
//             closed: allBars.lastBarClosed,
//             tf: allBars.Tf,
//             finish: false,
//             api : {alert: (msg)=>{}, _drawSignal() {}, signals: signalAPI },
//             getBars :(tf)=> allBars.toBarsImmutable(tf) ??undefined,
//             otherSymbols : []
//         });
//         return allBars.length;
//     }
//     let res= ind.OnBars?.({
//         //newBars: new CBars(allBars.Tf, [bar], allBars.tickSize),
//         newBars: new CBars(allBars.Tf, prevCalculated==null ? [bar] : allBars.data.slice(prevCalculated), allBars.tickSize),
//         newBarIndex: prevCalculated==null ? barsLength-1 : prevCalculated,
//         allBars,
//         getBars :(tf)=>allBars.toBarsImmutable(tf),
//         api: {alert: (msg)=>{}, _drawSignal() {} }
//     }, ()=>false);
//     if (res instanceof Promise) res.then((n)=>{if (n!=null && n!=barsLength) throw "Wrong OnBars result: "+n+".  Expected: "+barsLength});
//     //console.warn(prevCalculated," -> ",res);
//     return typeof res=="number" ? res : undefined;
// }


export type tOnBarIndicatorShort = Pick<tOnBarIndicator, "bar"|"index"|"allBars"|"closed"|"tf">;

export function createOnBarStructShort(bar: CBar, allBars: IBarsExt) : tOnBarIndicatorShort {
    return {bar: bar, allBars, index: allBars.length-1, tf: allBars.Tf, closed: allBars.lastBarClosed};
}


// export type IndLines = readonly ILine[] & { readonly fixedLines : readonly ILine[]; }
//
// class CIndLines extends Array<ILine> implements IndLines {
//     fixedLines : readonly ILine[] = [];
// }
//
// function pushFixedLines



function toILine(line :ILine|ITimeLine) : ILine { return {...line, begin: {x: line.begin.x.valueOf(), y: line.begin.y}, end: {x: line.end.x.valueOf(), y: line.end.y}}; }




function createGraphObjectsArray<T extends ILine|IGraphLabel>() {
    type IArr= readonly T[];
    type IArrPushable= IArr & Pick<T[],"push">;
    return new class {
        private _fixedObjCache= new CCachedValue2<[IArrPushable, number], IArrPushable>();
        private _tempObjCache= new CCachedValue2<[IArrPushable, number], IArrPushable>();
        private _allObjCache= new CCachedValue2<[IArrPushable, IArrPushable], IArr>();

        private __fixedObjects : IArrPushable = [];
        tempObjects : IArrPushable = [];
        get fixedObjects() { return this.__fixedObjects; }

        get fixedObjectsImm() {
            let items= this.fixedObjects;
            this.__fixedObjects = this._fixedObjCache.getOrSet([items, items.length], ()=>[...items]);
            return Object.freeze(items);
        }
        get tempObjectsImm() {
            let items= this.tempObjects;
            this.tempObjects = this._tempObjCache.getOrSet([items, items.length], ()=>[...items]);
            return Object.freeze(items);
        }

        get objectsImm() : IArr { return this._allObjCache.getOrSet([this.fixedObjectsImm, this.tempObjectsImm], ()=>Object.freeze(this.fixedObjectsImm.concat(this.tempObjectsImm))); }
    };
}



type IndicatorGraphObjectParams = Readonly<{ showLegend?: boolean, name?: string }>;

export class CIndicatorGraphObject implements IGraphObjectB {

    private static _indicatorObjectId=0;

    readonly indicatorObjectId = CIndicatorGraphObject._indicatorObjectId++;

    public    get iBuffers() : readonly IBuffer[] { this.beforeDrawing?.(); return this._buffers; } //: return readonly IBuffer[]=[];

    // метод вызывается перед рисованием
    protected beforeDrawing?() { }

    private readonly _linesArray= createGraphObjectsArray<ILine>();
    private readonly _labelsArray= createGraphObjectsArray<IGraphLabel>();

    public    get lines() : readonly ILine[] { this.beforeDrawing?.();  return this._linesArray.objectsImm; }
    // массив фиксированных линий (старые элементы не могут меняться, а только добавляться новые)
    public    get fixedLines() : readonly ILine[] { return this._linesArray.fixedObjects; }
    // массив временных линий (может меняться полностью)
    public    get tempLines() { this.beforeDrawing?.();  return this._linesArray.tempObjectsImm; }
    protected get _tempLines() { return this._linesArray.tempObjects; }
    protected set _tempLines(lines) { this._linesArray.tempObjects= [...lines]; }
    protected get _fixedLines() { return this._linesArray.fixedObjects; }

    public    get labels() : readonly IGraphLabel[] { this.beforeDrawing?.();  return this._labelsArray.objectsImm; };
    // массив фиксированных лэйблов (старые элементы не могут меняться, а только добавляться новые)
    public    get fixedLabels() : readonly IGraphLabel[] { return this._labelsArray.fixedObjects; }
    // массив временных лэйблов (может меняться полностью)
    public    get tempLabels() { this.beforeDrawing?.();  return this._labelsArray.tempObjectsImm; }
    protected get _tempLabels() { return this._labelsArray.tempObjects; }
    protected set _tempLabels(labels) { this._labelsArray.tempObjects= [...labels]; }
    protected get _fixedLabels() { return this._labelsArray.fixedObjects; }


    public    get lines2() : CObjectsAndr { this.beforeDrawing?.(); return this._lines2; }
    protected set lines2(a : CObjectsAndr | typeNewObjectGraph | readonly typeNewObjectGraph[])   {
        if (a instanceof CObjectsAndr) {
            this._lines2 = a;
        }
        else
        if (Array.isArray(a)) {
            this._lines2 = new CObjectsAndr();
            this._lines2.push(...a);
        }
        else {
            this._lines2 = new CObjectsAndr();
            this._lines2.push(a);
        }
    }

    private _lines2 = new CObjectsAndr();

    protected _buffers: IBuffer[]= [];

    readonly name: string;

    protected addLine(line :ILine|ITimeLine) { this._fixedLines.push(toILine(line)); }
    protected addLabel(label :IGraphLabel) { this._fixedLabels.push({...label}); }

    constructor(...buffers  :readonly IBuffer[]);
    constructor(name :string, ...buffers  :readonly IBuffer[]);
    constructor(params :IndicatorGraphObjectParams, ...buffers  :readonly IBuffer[]);

    constructor(nameOrBufferOrParams :string|IBuffer|IndicatorGraphObjectParams="", ...buffers  :readonly IBuffer[]) {
        const arg1= nameOrBufferOrParams;
        function objIsBuffer(obj :object) : obj is IBuffer { return (arg1 as IBuffer).Draw!=null; }
        let [name="", allBuffers=[], params=undefined] = typeof arg1=="string" ? [arg1, buffers] : objIsBuffer(arg1) ? ["", [arg1 as IBuffer, ...buffers]] : [arg1.name, buffers, arg1];
        //console.log("this.indicatorObjectId_ ",this.indicatorObjectId_)
        this._buffers.push(...allBuffers);
        this.name= name;
        if (params?.showLegend) this.showLegend();
    }

    private showLegend() {
        let n=0;
        for(let [i,buf] of this._buffers.entries()) {
            if (! isObjectCastableTo<CBuffSimple>(buf, ["color"])) continue;
            let y= 30 + 15*n;
            this._fixedLines.push({
                begin: {x: 5, y},
                end: { x: 20, y},
                static: true,
                color: buf.color,
                text: " "+(buf.name ?? "buffer#"+i),
                textPosH: "right",
                width: buf.width
            });
            n++;
        }
        //console.log(lines.at(-1));
    }
}



export class CIndicatorNamedObject extends CIndicatorGraphObject {
    //readonly name : string;
    constructor(buffer : IBuffer & { readonly name: string}) {
        super(buffer.name, buffer);
        //this.name= buffer.name;
    }
}

export class CIndicatorGraphObjectEditable extends CIndicatorGraphObject {
    override get fixedLines() { return this._fixedLines; }
    override get tempLines() { return this._tempLines; }
    override get fixedLabels() { return this._fixedLabels; }
    override get tempLabels() { return this._tempLabels; }
             get buffers() { return this._buffers; }
}

abstract class CIndicatorGraphObjectWithWindows extends CIndicatorGraphObject {
    private _windows: IGraphObjectB[]= [];
    public    get windows(): IGraphObjectB[] {return this._windows;}
    protected set windows(value: IGraphObjectB[]) {this._windows = value;}
}


export abstract class CIndiBase<T extends (IndicatorInfo & IndicatorClass<IParamsReadonly & T["paramInfo"]>) |never = never> extends CIndicatorGraphObjectWithWindows implements interfaceIndicatorBase
{
    //readonly signals = new CMySignals();

    // constructor(name :string= "") {
    //     super(name);
    // }
    //readonly useSignal = false;
    readonly useSignal = true;

    OnInit?(init: tOnInitIndicator):  void;

    OnBar?(data: tOnBarIndicator):  void;

    OnBars?(data: tOnBarsIndicator, isStopped: () => boolean|Promise<boolean>) : Promise<number|void>;

    OnTick?(data: tOnTick):  void;

    OnTicks?(data: tOnTicks, isStopped: () => boolean|Promise<boolean>) : Promise<number|void>;

    printStatistics?() : void;
}


export abstract class CIndiBaseExt<T extends (IndicatorInfo & IndicatorClass<IParamsReadonly & T["paramInfo"]>) |never = never> extends CIndicatorGraphObjectWithWindows implements interfaceIndicator
{
    readonly useSignal = true;
    //readonly signals = new CMySignals();

    // constructor(name :string= "") {
    //     super(name);
    // }

    OnInit?(init: tOnInitIndicator):  void;

    OnBar?(data: tOnBarIndicatorExt):  void;

    OnTick?(data: tOnTickExt):  void;

    printStatistics?() : void;
}



export abstract class CIndiBaseVal1<T extends (IndicatorInfo & IndicatorClass<IParamsReadonly & T["paramInfo"]>) |never = never> extends CIndiBase<T>
{
    get buffer() { return this.iBuffers[0] ?? (()=>{throw "Undefined buffer"})(); }
    get value() { return this.buffer.values?.at(-1); }
}



export class CStaticBase extends CIndiBase {
    text: (()=>string) | null = null;
}



export abstract class CServiceBase extends CIndicatorGraphObject implements interfaceService {
    abstract OnInit(history: CRBaseMapAll2): void;
}




