import {
    CBars,
    CIndiBase,
    ILine,
    IBars,
    IBuffer,
    IParamsOld, TF, tLoadBar, tSetTicks,
    tSocketInput, tInfoInit
} from "../../API";
import {IGraphLabel} from "../labels";
import {CParams, GetSimpleParams, IParams, ReadonlyFull, SimpleParams, SimpleParamsMutable} from "../CParams";
//import {CParamsZZ} from "../../ind/iZigNew";
import {CSymbolData} from "../Symbol";
import {sleepAsync} from "../../Nav/Common"
import {Journal} from "../СJournal";
import {tAlert, tAlertMini} from "../interface/mini";
import {interfaceIndicator, interfaceService} from "../interface/IIndicator";

export type tOnCalculate = { prev_calculated: number, bars: IBars, tick_volume: number, volume: number, spread: number }
export type TServiceSet = { construct:(param:SimpleParams<IParams>)=>interfaceService, paramDefault:ReadonlyFull<CParams>, name:string}

export type tServicePrototype = {paramInfo:CParams} & TServiceSet
//
// export class CServicePrototype implements tServicePrototype{
//     static numId:number=0;
//     readonly numId;
//     ///dsdsd
//     set base(data:tServicePrototype) {console.error("изменение всего класса запререщено"); }
//     get base() {return this._base;}
//     protected _base:tServicePrototype={construct:undefined,paramInfo:undefined,paramDefault:undefined, name:undefined}
//     constructor(data?:tServicePrototype) {
//         if (data) Object.assign(this,data)
//         this.numId=++CServicePrototype.numId;
//     }
//
//     set name(name:string)                                   {this.base.name=name}
//     get name()                                              {return this.base.name}
//
//     set paramInfo(paramInfo:ReadonlyFull<CParams>|CParams)  {
//         if (paramInfo) this.base.paramInfo= CloneObject(paramInfo);  //JSON.parse(JSON.stringify(paramInfo))
//     }
//     get paramInfo()                                         {
//         if (!this.base.paramInfo) {this.paramInfo=this.paramDefault;}
//         return this.base.paramInfo
//     }
//
//     set paramDefault(paramDefault:ReadonlyFull<CParams>)    {this.base.paramDefault=paramDefault};
//     get paramDefault()                                      {return this.base.paramDefault}
//
//     get simpleParams()                                      {return GetSimpleParams(this.paramInfo as IParams)}
//
//     //портотип класса, незнаю как он в тайпскрипте обозначается
//     set construct(construct:(param:SimpleParams<IParams>)=> interfaceService) {this.base.construct=construct;}
//     get construct()                                         {return this.base.construct}
//     Set(data:tServicePrototype) {
//         this._base.paramDefault=data.paramDefault;
//         this._base.name=data.name;
//         this._base.construct=data.construct;
//         this._base.paramInfo=CloneObject(data.paramInfo??data.paramDefault);
//     }
// }




class CIsStopped {
    private data:boolean = false;
    private _time0=Date.now();
    readonly check= async () => {
        if (this.data) return true;
        if (Date.now()-this._time0<50) return false;
        await sleepAsync(0);
        this._time0= Date.now();
        return false;
    }
    stop() { this.data= true; }
}
// биржа
// символ
// таймфрейм
// перезагрузка
// востоновить значения по умолчанию
// сохранить
// загрузить
// минимальное количество баров
//
//

class paramsIndicator {
    reset={}
}
//
// export class CServiceAND {
//     //клас парметров
//     protected _params:CServicePrototype;// = new CIndicatorPrototype;
//
//     get params(): CServicePrototype {return this._params}
//     set params(params: CServicePrototype) {
//         this._params.Set(params)
//         //  Object.assign(this._params,params)
//     }
//
//     protected _work:interfaceService; // базовый рабочий класс
//     set work(data:interfaceService) {this._work=data;} // базовый рабочий класс
//     get work() {return this._work;} // базовый рабочий класс
//
//     protected isStopped = new CIsStopped();
//     protected prev_calculated :number = 0;
//
//     //paramInfo:CParams;
//     constructor(indicatorBase:tServicePrototype, symbolData:tInfoInit) {
//         this._params = new CServicePrototype;
//         this._params.Set(indicatorBase)
//     }
//
//     SetDeleteEvent(funk:(onj:this)=>void) {}
//
//     private CreateNewInstance() {
//         this.isStopped.stop();
//         this.isStopped=new CIsStopped();
//         const indicator = this.params.construct(this.GetSimpleParams());
//         if (indicator.OnInit) indicator.OnInit({
//             getLoadHistory: this.getLoadHistory,
//             alert:(data:tAlertMini)=>{Journal.add({...data, name:this._params.name, symbol: this.symbolData.address, tf: this.symbolData.tf})}
//         })
//         return indicator;
//     }
//
//     async ReloadOnParams()  {
//         let service = this.CreateNewInstance();
//         this.prev_calculated = 0;
//         this.work= service;
//     };
//
//     // ReLoadHistory(symbolData?:CSymbolData)     {
//     //     if (symbolData) this.symbolData.Set(symbolData.Get());
//     // };
//
//     get iBuffers()          {return this.work?.iBuffers};
//     get lines()             {return this.work?.lines};
//     get labels()            {return this.work?.labels};
//     get display()           {return this.work?.display};
//     get name()              {return this.work?.name};
//     GetSimpleParams()       {return this._params.simpleParams};
//     get paramDefault()      {return this._params.paramDefault};
//
//     //вызывается только при наличии истории
//     // protected OnInitEasy() {
//     //     this.work= this.CreateNewInstance();
//     //     this.prev_calculated = 0;
//     // }
//     //
//     // private _PromiseOnBars: Promise<void> = Promise.resolve();
//     //
//     // protected OnBarsEasy = async (history: IBars, newBars:IBars, timeLastBar: number) => {
//     //     return this._PromiseOnBars= this._PromiseOnBars.then(()=>this._OnBarsEasy(history, newBars, timeLastBar));
//     // }
//     //
//     // private _OnBarsEasy= async (history: IBars, newBars:IBars, timeLastBar: number, indicator= this.work) => {
//     //     if (indicator.OnBars) await indicator.OnBars({newBarIndex: this.prev_calculated, allBars: history, newBars: newBars}, this.isStopped.check);
//     //     if (indicator.OnBar) for (let Bar of newBars) { indicator.OnBar({newBar: Bar}); if (await this.isStopped.check()) return; }
//     //     this.prev_calculated=history.count;
//     // }
//     //
//     // private _PromiseOnTicks: Promise<void> = Promise.resolve();
//     //
//     // protected OnTicksEasy = (data: tSetTicks) => {
//     //     return this._PromiseOnTicks= this._PromiseOnTicks.then(()=>this._OnTicksEasy(data));
//     // }
//     //
//     // private _OnTicksEasy= async (data: tSetTicks) => {
//     //     if (this.work.OnTicks) await this.work.OnTicks(data, this.isStopped.check);
//     //     if (this.work.OnTick) for (let tick of data.ticks) { this.work.OnTick({tick}); if (await this.isStopped.check()) return; }
//     // }
//     //
//     // protected OnHistoryEasy= async (history: IBars, type: tLoadBar) => {
//     //     if (type == "left") {
//     //         this.OnInitEasy();
//     //         await this._OnBarsEasy(history, history, 0);
//     //     }
//     // }
// }
//
// export class CServicesAND implements Iterable<CServiceAND>{
//     [Symbol.iterator]() {return this._indicators[Symbol.iterator]()}
//     private nowSymbol:()=>CSymbolData;
//     constructor(nowSymbol:()=>CSymbolData) {
//         this.nowSymbol=nowSymbol;
//     }
//     protected _indicators:CServiceAND[]=[];
//
//     // protected intiNowSymbol(...obj:CIndicatorAND[])     { for (let cIndicatorAND of obj) cIndicatorAND.SetSymbol(this.nowSymbol().Get())}
//
//     indexOf(obj:CServiceAND)                          {return this._indicators.indexOf(obj)}
//
//     splice(start: number, deleteCount: number = 1)      {
//         return this._indicators.splice(start,deleteCount);
//     }
//     SetDefaultSymbol(nowSymbol: ()=>CSymbolData)             {
//         this.nowSymbol=nowSymbol;
//     }
//     //   deleteByClass(obj:CIndicatorAND)                    {const buf=this.indexOf(obj); if (buf>=0) this.splice(buf)}
//     //   deleteALl()                                         {for (let indicator of this._indicators) if (indicator.Delete) indicator.Delete(); this._indicators=[]; return this;}
//
//     push(...obj:CServicePrototype[])                  {
//         const buf=obj.map((e)=>new CServiceAND(e,this.nowSymbol().Get()));
//         return this._indicators.push(...buf);
//     }
//     add(...obj:CServicePrototype[])                   {return this.push(...obj); }
//     get length()                                        {return this._indicators.length;}
//     get indicators()                                    {return this._indicators;}
//     // async SetSymbol(symbolInfo: tInfoInit)              {
//     //     try {
//     //         for (let indicator of this._indicators) await indicator.SetSymbol(symbolInfo);
//     //     }
//     //     catch (e) {
//     //         console.error(e);
//     //     }
//     // }
//     delete(...data:(CServiceAND)[]|undefined)         {
//         if (!data || !data[0]) return this.splice(0,this.length);
//         else for (let datum of data) this.splice(this.indexOf(datum));
//         return this
//     }
//     // async loadHistory(time1:Date|number,time2?:Date)        {
//     //     for (let indicator of this._indicators) await indicator.symbolData.loadHistory(time1,time2);
//     //     return this;
//     // }
//
//     async refresh(...data:(CServiceAND)[]|undefined)        {
//         try {
//             // if (!data || !data[0]) for (let indicator of this._indicators) indicator.ReLoad(this.nowSymbol());
//             // else for (let datum of data) this._indicators[this.indexOf(datum)].ReLoad(this.nowSymbol());
//             // return this;
//         }
//         catch (e) {
//             console.error(e);
//         }
//     }
// }

