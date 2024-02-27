import {CIndicatorsAND, tIndicatorExport, tIndicatorShortExport} from "./indicatorBaseClass/indicatorAND";
import {CSymbolData, tOnBars, tSymbolCallback2} from "./Symbol";
import {tInfoInit, tInfoInit3} from "./history/historyBase";
import {IBars, IBarsExt} from "../Nav/Bars";
import {tListEvent} from "./interface/mini";
import {tAddressSymbol, tLoadBar, tSetTicks} from "./interface/IHistoryBase";
import {SymbolsLoading} from "../history/history demo";
import {CObjectEvents, CObjectEventsArr, CStaticBase} from "./const";
import {Journal2} from "./static";


export type tSystemBox = Readonly<{
    indicators : CIndicatorsAND|undefined
    readonly symbolData : CSymbolData|undefined
}>

export type tBoxExport = {symbolData: {address: tAddressSymbol, tfSec: number}, indicators: tIndicatorExport[]}

export type tBoxExportShort = {symbolData: {address: tAddressSymbol, tfSec: number}, indicators: tIndicatorShortExport[]}

export interface ICSystemBox extends Readonly<{
    OnSymbolDate: Promise<ICSystemBox | void>;
    readonly symbolData: CSymbolData | undefined;
    indicators: CIndicatorsAND | undefined;
    staticObject: CStaticBase | undefined
    lastBox: CSystemBox | undefined;
    Export(): tBoxExport | undefined;
    ExportShort(): tBoxExportShort | undefined
    ImportShort(data: tBoxExportShort)  : void
    Import(data: tBoxExport) : void
    Delete(): void;
    SetBox(box: ICSystemBox): void;
    GetBox(): ICSystemBox;
}> { }


export class CSystemBox implements tSystemBox, ICSystemBox {
    protected _promiseSetSymbol = Promise.resolve();
    get history() {return this._symbolData?.history; }
    protected readonly defaultCallback : tSymbolCallback2
    static staticId =0
    id =0;

    protected listEvent = new CObjectEventsArr();
    InitCallback(callback: tListEvent<any, tSymbolCallback2>) {
        this.listEvent.Add(callback)
        if (this.listEvent.count()>5) console.error("к одному боксу подозрительно много подписок ",{InitCallback:this.listEvent.count()})
    }

    // данные для обратной связи
    callbackData:tSymbolCallback2
    constructor() {
        this.id = CSystemBox.staticId++
        this.callbackData = {
            onBar :                 (data: tOnBars) =>                  this.listEvent.OnSpecEvent<tSymbolCallback2>((e) => e?.onBar?.(data)),
            onTick :                (data: tSetTicks) =>                this.listEvent.OnSpecEvent<tSymbolCallback2>((e) => e?.onTick?.(data)),
            onHistory :             (history: IBars, type: tLoadBar) => this.listEvent.OnSpecEvent<tSymbolCallback2>((e) => e?.onHistory?.(history,type)),
            onSetSymbolData :       (data: tInfoInit) =>                this.listEvent.OnSpecEvent<tSymbolCallback2>((e) => e?.onSetSymbolData?.(data)),
            Draw :                  () =>                               this.listEvent.OnSpecEvent<tSymbolCallback2>((e) => e?.Draw?.()),
        }
        this.defaultCallback = {
            ...this.callbackData,
            onHistory :             async (history: IBars, type: tLoadBar) =>  {
                if (type=="left" && this._indicators && this.history) await this._indicators.loadHistory(this.history.time(0) as Date);
                this.callbackData.onHistory?.(history, type)
            },
            onSetSymbolData :       (data: tInfoInit) => {

                this._promiseSetSymbol = this._promiseSetSymbol.then(async () => {if (this._indicators) await this._indicators.SetSymbol(data);})

                this.callbackData.onSetSymbolData?.(data)
            }
        }
    }
    // если бокс подключен, то он произведёт перерисовку
    Draw() {
        this.listEvent.OnSpecEvent<tSymbolCallback2>((e) => e?.Draw?.())
    }

    // для подписок к символу обертка с функцией отмены подписки
    callbackForSymbol : tListEvent<any, tSymbolCallback2> = {func:()=>{return this.defaultCallback}}
    async InitSymbol2(symbol: tInfoInit3){
        this.OnSymbolDate = ( async () => {
            this._symbolData = new CSymbolData(symbol, this.callbackForSymbol)
         //   if (!this.history) await this._symbolData.loadHistory(400)
            this._indicators = new CIndicatorsAND(this._symbolData, Journal2);
            this._staticObject = new CStaticBase();
            return this;
        })()
        return this.OnSymbolDate;
    }

    async InitSymbolDefault(){
        this.OnSymbolDate=( async () => {
            const symbolD = await SymbolsLoading.ready()
            this._symbolData = new CSymbolData(symbolD, this.callbackForSymbol)
        //    if (!this.history) await this._symbolData.loadHistory(400)
            this._indicators = new CIndicatorsAND(this._symbolData, Journal2);
            this._staticObject = new CStaticBase();
            return this;
        })()
        return this.OnSymbolDate
    }
    //
    OnSymbolDate: Promise<this | void> = Promise.resolve();
    private _symbolData: CSymbolData | undefined;
    private _indicators: CIndicatorsAND | undefined;
    private _staticObject: CStaticBase | undefined
    get symbolData()  { return this._symbolData; }
    get indicators() { return this._indicators; }
    get staticObject() { return this._staticObject; }
//  {symbolData: {address: tAddressSymbol, tfSec: number}, indicators: tIndicatorsExport[]}
// {symbolData: {address: string[], tfSec: number}, indicators: tIndicatorsExport[]}
    Export(): tBoxExport | undefined {
        if (this._symbolData && this._indicators) return {
            symbolData: this._symbolData.Export(),
            indicators: this._indicators.Export()
        }
        else return undefined;
    }

    ExportShort(): tBoxExportShort | undefined {
        if (this._symbolData && this._indicators) return {
            symbolData: this._symbolData.Export(),
            indicators: this._indicators.ExportShort()
        }
        else return undefined;
    }

    Import = (data: tBoxExport) => {
        if (!this._symbolData) {
            this._symbolData = new CSymbolData(undefined,this.callbackForSymbol);
            this._indicators = new CIndicatorsAND(this._symbolData, Journal2);
        }
        this._symbolData.Import(data.symbolData)
        this._indicators!.Import(data.indicators)
        this.OnSymbolDate = (async ()=> this)()
    }

    ImportShort = (data: tBoxExportShort) => {
        if (!this._symbolData) {
            this._symbolData = new CSymbolData(undefined,this.callbackForSymbol);
            this._indicators = new CIndicatorsAND(this._symbolData, Journal2);
        }
        this._symbolData.Import(data.symbolData)
        this._indicators!.ImportShort(data.indicators)
        this.OnSymbolDate = (async ()=> this)()
    }

    //Не удаляет себя из верхне стоящего москва..... просто отчищает внутренности
    Delete() {
        this.callback.del?.()
        this._symbolData?.Delete();
        this._indicators?.delete();
        this._symbolData = undefined;
        this._indicators = undefined
    }
    //удаление подписок данного бокса к другим боксам
    DeleteMini() {
        this.callback.del?.()
        this._symbolData = undefined;
        this._indicators = undefined
    }

    _lastBox: CSystemBox | undefined;
    get lastBox() {
        return this._lastBox
    }
    //технически не копирует бокс, а берет из него ссылку на символ и индикаторы, чтобы изменять

    callback : tListEvent<any, tSymbolCallback2> = {func:()=>{return this.callbackData}}

    SetBox(box: CSystemBox) {//({indicators, symbolData}:tSystemBox){
        this.callback.del?.();
        box.InitCallback(this.callback);
        this._symbolData = box.symbolData
        this._indicators = box.indicators;
        this._staticObject = box.staticObject
        this._lastBox = box;
        // this._symbolData.history=this._symbolData.link.history()
        // this._indicators.SetDefaultSymbol(()=>this._symbolData);
        // это типа reset в окне с графиком, чтобы мышка синхронизировалось и т.п.

        if (this._symbolData && this.defaultCallback.onHistory && this._symbolData.history) this.defaultCallback.onHistory(this._symbolData.history, "left");
        return this;
    }

    GetBox(): CSystemBox {
        return this;
    }
}


export interface ICSystemBoxArray {
    box: CSystemBox[];
    readonly length: number;

    [Symbol.iterator](): any;
    map<T>(funk: (box: ICSystemBox) => T): T[];
    swapInArray(element: number, to: number): void;
    indexOf(obj: ICSystemBox): any;
    Export(): { box: tBoxExport[] };
    ExportShort(): { box: tBoxExportShort[] };
    ImportShort({box}: { box: tBoxExportShort[]})  : void
    ImportPlus({box}: { box: tBoxExport[] }): void;
    Import({box}: { box: tBoxExport[] }): void;
    splice(start: number, deleteCount: number): any;
    add(box?:ICSystemBox): CSystemBox;
    delete(data?: (ICSystemBox)[] | undefined): any;
    loadHistory(time1: Date | number, time2?: Date): ICSystemBoxArray;
    lastBox(): CSystemBox | undefined
    event :CObjectEvents; // tListEvent
}

export class CSystemBoxArray implements ICSystemBoxArray {
    [Symbol.iterator]() {
        return this.box[Symbol.iterator]()
    }

    event = new CObjectEvents; // tListEvent


    box: CSystemBox[] = [];

    map<T>(funk: (box: CSystemBox) => T): T[] {
        return this.box.map(funk)
    }

    lastBox() {return this.box.length>0?this.box[this.box.length-1]: undefined}
    // protected intiNowSymbol(...obj:CIndicatorAND[])     { for (let cIndicatorAND of obj) cIndicatorAND.SetSymbol(this.nowSymbol().Get())}
    swapInArray(element: number, to: number) {
        console.log("swap")
        const [byf1, buf2] = [this.box[element], this.box[to]];
        [this.box[element], this.box[to]] = [buf2, byf1]
        this.event.OnEvent()
    }

    indexOf(obj: CSystemBox) {
        return this.box.indexOf(obj)
    }

    Export() {
        return {box: this.box.map((box) => box.Export()!).filter(e=>!!e)}
    }

    ExportShort() {
        return {box: this.box.map((box) => box.ExportShort()!).filter(e=>!!e)}
    }

    ImportPlus = ({box}: { box: tBoxExport[] }) => {
        for (let box1 of box) {
            const buf = new CSystemBox();
            buf.Import(box1)
            this.add(buf)
            this.event.OnEvent()
        }
    }

    ImportShort = ({box}: { box: tBoxExportShort[] }) => {
        this.delete();
        for (let box1 of box) {
            const buf = new CSystemBox();
            buf.ImportShort(box1)
            this.add(buf)
            this.event.OnEvent()
        }
    }
    Import = ({box}: { box: tBoxExport[] }) => {
        this.delete();
        for (let box1 of box) {
            const buf = new CSystemBox();
            buf.Import(box1)
            this.add(buf)
            this.event.OnEvent()
        }
    }

    splice(start: number, deleteCount: number = 1) {
        for (let i = start; i < start + deleteCount; i++) {
             this.box[i]?.Delete?.()
        }
        const bud = this.box.splice(start, deleteCount);
        // this.event.OnEvent()
        return bud
    }

    add(box = new CSystemBox()) {
        this.box.push(box);
        this.event.OnEvent()
        return box
    }

    get length() {
        return this.box.length;
    }


    delete(data?: (CSystemBox)[] | undefined) {
        if (!data?.[0]) return this.splice(0, this.length);
        else for (let datum of data) this.splice(this.indexOf(datum));
        this.event.OnEvent()
        return this
    }

    loadHistory(time1: Date | number, time2?: Date) {
        for (let box of this.box) box.symbolData?.loadHistory(time1, time2);
        return this;
    }
}


//
// class Class {
//     constructor() {
//         return new Proxy(this, {
//             set(target: Class, p: string | symbol, value: any, receiver: any): boolean {
//                 // @ts-ignore
//                 target[p] = value;
//                 // @ts-ignore
//                 return true;
//             },
//             get:(target: this, p: string | symbol , receiver: any) =>  {
//                 console.log("555")
//                 // @ts-ignore
//                 return ()=>5 ;
//             }
//         })
//     }
//     nome = ()=> {return 1}
//     two = ()=> {return 2}
// }
//
//
// class Class2 extends Class{
//     two = ()=>{return 4}
// }
//
// const tt = new Class()
//
//
// const t2 = {...tt, two:()=>{return 3}} as Class
// const t3 = new Class2()
//
// console.log("LLLLLLLLL ",tt.nome(),tt.two())
// console.log("LLLLLLLLL ",t2,t2.nome?.(),t2.two())
// console.log("LLLLLLLLL ",t3,t3.nome?.(),t3.two())
