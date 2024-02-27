//symbol - просто имя символа - никак не относиться к выбору символа
import {CRBaseMapAll2, HistoryStopLoad, tInfoInit, tInfoInit3, tInfoInit4} from "./history/historyBase";
import {IBars, IBarsExt, IBarsImmutable, TF} from "../Nav/Bars";
import {iListNodeMini} from "./listNode";
import {SymbolDefault} from "./static";
import {
    iLinkMini, tCallbackForRefreshSymbol,
    tCallbackSocket,
    tCallbackSocket2,
    tLoadBar,
    tSetTicks,
    tSocketInput
} from "./interface/IHistoryBase";
import {interfaceIndicator} from "./interface/IIndicator";
import {tListEvent} from "./interface/mini";
import {CObjectEventsArr} from "./const";

export type tOnBar =  { history:IBars, timeLastBar?:number}
export type tOnBars = tOnBar& {newBars: IBars, timeLastBar:number }


export type tSymbolCallback = {
    onTick?: tCallbackSocket,
    onHistory?:(history: IBars, type: tLoadBar)=>void,
    onBar?:(data:tOnBars)=>void
    onSetSymbolData?: (data:tInfoInit) => void
}

export type tSymbolCallback2 = {
    onTick?: tCallbackSocket2,
    onHistory?:(history: IBars, type: tLoadBar)=>void,
    onBar?:(data:tOnBars) => void
    onSetSymbolData?:(data:tInfoInit)=>void
    Draw?:()=>void

}

export type tOnFunc = {
    OnTick: (data: tSocketInput) => void
    OnBar: (data:tOnBar) => void
    //вызывается при подгрузке истории с двух сторон с указанием стороны в type
    OnHistory:(link: iLinkMini,type:tLoadBar)=>void
}

class CHistoryParam {
    static _key:number=0;
    _key:number=0;
    constructor()   { this._key = CHistoryParam._key++; }
    get key()       { return this._key }
    node: iListNodeMini | undefined;
}
//Клас для хранения символа, обертка с настройкой ТФ
//при установке нового символа - все callback по получению котировок, сокет подключения и т.д. автоматически переходят на новый символ
//Можно устанавливать только один callback

export interface iCSymbolData {
    SetCallback(data:tSymbolCallback|tSymbolCallback2) : this
    SetCallbackBar(callback:(data:tOnBars)=>void) : this
    SetCallbackHistory(callback:(history:IBars,type:tLoadBar)=>void) : this
    SetCallbackTick(callback: tCallbackSocket) : this
    SetCallbackSymbolData(callback: (data:tInfoInit)=>void)  : this


    loadHistory(time1:const_Date|number, time2?:const_Date, tf?:TF): Promise<{link: iLinkMini, type: tLoadBar} | undefined>
    loadHistoryAbs(time1:const_Date|number, time2?:const_Date, tf?:TF): Promise<void>
}


export interface iCSymbolData2 {
    loadHistory(time1:const_Date|number, time2?:const_Date, tf?:TF): Promise<void | undefined>
    loadHistoryAbs(time1:const_Date|number, time2?:const_Date, tf?:TF): Promise<void>
}

export type ISymbolDataReadonly = iCSymbolData2 & Readonly< Pick<CSymbolData, "symbol"|"address"|"tf"|"Export"  > >


export class CSymbolData implements tInfoInit4,iCSymbolData2 {
    private _info:tInfoInit4= {...SymbolDefault as tInfoInit4};
    // synchronization - приостанавливает учет новых котировок в данном классе на время переключения таймфрейма/символа
    synchronization=true;
    get tf()                        {return this._info.tf;}
    set tf(tf)                  {if (!(tf==this._info.tf)) {this._info.tf=tf; this.OnInit();}}

    get address()                   {return this._info.link?.getAddress() ?? ["load..."];}
    set address(address :readonly string[])   {
        if (!this._info.baseHistory) {console.log("не установлен класс базовой истории"); return;}
        if (address.length>0) {
            this.link = this._info.baseHistory.getByAddress(address);
            }
        else {
            this.link = this._info.baseHistory
        }
    }

    logs() {
        return {
            tf: this.tf.name,
            address: this.address,
            history: this.history,
            link: this.link
        }
    }

    get link()                      {return this._info.link;}
    set link(link)     {
        if (link && !(link==this.link)) {
            this._info.link = link;
            this.SetConnectToLink(this._info.link);
            this.OnInit();
        }}

    get info()                      {return this._info}



    protected listEvent = new CObjectEventsArr();
    callbackData = {
        onBar :                 (data: tOnBars) =>                  this.listEvent.OnSpecEvent<tSymbolCallback2>((e) => e?.onBar?.(data)),
        onTick :                (data: tSetTicks) =>                this.listEvent.OnSpecEvent<tSymbolCallback2>((e) => e?.onTick?.(data)),
        onHistory :             (history: IBars, type: tLoadBar) => this.listEvent.OnSpecEvent<tSymbolCallback2>((e) => e?.onHistory?.(history,type)),
        onSetSymbolData :       (data: tInfoInit) =>                this.listEvent.OnSpecEvent<tSymbolCallback2>((e) => e?.onSetSymbolData?.(data))
    }

    InitCallback(callback: tListEvent<any, tSymbolCallback2>) {
        this.listEvent.Add(callback)
        if (this.listEvent.count()>15) console.error("к одному боксу подозрительно много подписок ",{InitCallback:this.listEvent.count()})
    }
    addCallback(callback : tListEvent<any,tSymbolCallback2> | (Readonly< tSymbolCallback2 & Pick<tSymbolCallback2,"onTick">>)) {
        let callbackEvent=
            (callback as tSymbolCallback2).onTick
            ? {func:()=>(callback as tSymbolCallback2)}
            : callback as tListEvent<any,tSymbolCallback2>
        return this.InitCallback(callbackEvent);
    }

    _callbackTick:tListEvent<tSetTicks> = {
        func:(data1) => {
            if (data1) this._OnTick(data1)
        }
    }
    _callbackRefresh:tListEvent<tCallbackForRefreshSymbol> = {
        func:(data1) => {
            this._OnHistory(data1);
        }
    }

    timeBars: {start: Date| undefined, end: Date| undefined, lastNum:number} = {start: undefined, end: undefined, lastNum: 0}

    _OnTick(data1: tSetTicks){
        this.callbackData.onTick({...data1, history: this.link?.history, bars: this.history})
        //фиксируем новый бар
        this._OnNewBars();
    }

    _OnNewBars() {
        const {timeBars,history} = this
        if ((history?.length) && (!timeBars.end ||  timeBars.end.valueOf()<history.lastTime!.valueOf())) {
        //    console.log("new Bars 1")
            if (timeBars.lastNum==0) timeBars.lastNum = history.length
            const {lastNum} = timeBars
            // полагаю тут надо убрать массив новых баров
            const newBars = history.slice(lastNum)
            // console.log(newBars.length, this.history.length)
            if (newBars.count) this.callbackData.onBar({history, newBars: newBars ,timeLastBar:lastNum})
            timeBars.lastNum = history.length
        }
    }
    // Вызывается при любой загрузке истории
    _OnHistory(data?:tCallbackForRefreshSymbol){
        const {timeBars,history} = this
        let type: tLoadBar = "left"
        if (history?.length) {
            if (timeBars.start?.valueOf()==history[0].time.valueOf()) {
                type = "right"
                this._OnNewBars();
            }
            else timeBars.start = history[0].time as Date
        }
     //   console.log( this.history.length,type)
        if (this.history) this.callbackData.onHistory(this.history, type)
    }
    protected OnInit() {
        if (!this.synchronization) return;
        this.timeBars.lastNum = 0;
        this.timeBars.end = undefined;
        this.callbackData.onSetSymbolData(this.info as  tInfoInit)
        // if (!(this.history)) {// && this.history.count>2)) {
        //     this.loadHistory(400)
        // }
    }

    // tCallbackForRefreshSymbol
    protected SetConnectToLink(link:CRBaseMapAll2){
        //отписываемся от старой подписки на котировки если она есть
        this._callbackTick.del?.();
        this._callbackRefresh.del?.();
        //создаем новую подписку
        link.AddEventNewTicks(this._callbackTick)
        link.AddEventRefreshData(this._callbackRefresh)
    }

    Delete() {
        this._callbackTick.del?.();
        this._callbackRefresh.del?.();
    }

    Export(){
        return {address: this.address, tfSec: this.tf.sec}}
    Import({address,tfSec} : Readonly<{address:readonly string[],tfSec:number}>){
        const tf=TF.fromSec(tfSec);  //console.log("!!!",tfSec, tf);
        if (!tf) {console.log("не получилось восстановить TF по переданным секундам!",tfSec); return;}
        this.Set({address:address, tf:tf})
    }
    //  set info(info)          {this._info=info}

    constructor(symbol?: tInfoInit3, callback?: tListEvent<any,tSymbolCallback2> | (Readonly< tSymbolCallback2 & Pick<tSymbolCallback2,"onTick"> >)) {
        if (symbol) this.Set(symbol);
        if (callback) this.addCallback(callback);
    }
    //Универсальная установка символа тф и прочее ... лучше использовать её
    Set(info:tInfoInit3) {
        this.synchronization = false;

        if (info.baseHistory && !(info.baseHistory == this._info.baseHistory)) {
            console.info("меняем базовую историю");
            this._info.baseHistory=info.baseHistory;
        }
        if (info.link?.getAddress()?.length == 0) {this._info.baseHistory = info.link}
        if (info.link) this._info.link = info.link;
        if (!info.link && info.address) {
            this._info.link=this._info.baseHistory?.getByAddress(info.address);
        }
        if (info.tf) this._info.tf = info.tf;
        if (this.link) this.SetConnectToLink(this.link)
        this.synchronization = true;

        this.OnInit();
        return this;
    }
    Get(): tInfoInit                {return {tf: this.tf, symbol: this.symbol, address: this.address, history: this.history, link: this.link, baseHistory: this.info.baseHistory}}


    //этот метод в будующем будет удален
    //сомнительный метод
    get symbol()                    {return this.link?.name ?? "load...";}
    //меня подписываемый символ по имени!, ну и подписывается на него
    set symbol(name:string)         { this.address= [...this.address.slice(0,-1), name]; }
    //сомнительный метод
    // set history(history:IBars)      {this._info.history=history;}
    //сомнительный метод каждый тик заново запрашивается история и сохраняется в this._info.history
    get history() : IBars|undefined  {
      //  if (!this.link?.history?.Bars(this.tf)) console.log({link: this.link, history: this.link?.history})
        return this.link?.history?.Bars(this.tf) as IBars //! ?? (()=>{console.error("bars is undefined. САША ИСПРАВЬ!"); })();
        //  return this._info.history?? this.link?.history?.Bars(this.tf) as IBarsExt|IBars
    };


    isTest() {
        return this.link?.IsTest()
    }
    // тест не через линк истории
    #testSymbols : boolean = false;
    setTestSymbols (data:boolean) {this.#testSymbols = data}
    getTestSymbols () {return this.#testSymbols }

    //  protected _loadPromise:Promise<{link: iLinkMini, type: tLoadBar}|undefined>|undefined;
    protected _loadPromise:Promise<void> = Promise.resolve();

    protected timeStartBar = new Date();
    // чтобы не собирались большие стеки
    protected _time1Last = 0
    loadHistory(time1:const_Date|number, time2?:const_Date) {
        if (this.isTest() || this.getTestSymbols() || HistoryStopLoad.stop) return  this._loadPromise
        if (typeof time1 == "number") {
            if (this._time1Last<=time1) this._time1Last=time1
            else return this._loadPromise
        }

        // console.log({time1});
        this._loadPromise = this._loadPromise.then(async ()=>{
            try {
                await this.link?.LoadHistoryForEventMini(this.tf,time1,time2)
                this._time1Last=0;
            }
            catch (e) {
                console.log(e);
            }
            return;
        })
        return this._loadPromise
    }


    loadHistoryAbs(time1 :const_Date|number, time2? :const_Date, tf?:TF, callback?:(percent:number)=>void) {
        this._loadPromise = this._loadPromise.then(async ()=>{
            await this.link?.LoadHistoryForEvent(this.tf, time1, time2, undefined, callback)
            return;
        })
        return  this._loadPromise
    }
}


