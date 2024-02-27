//import {CListNode, iListNodeMini} from '../listNode';
import {CBar, CBars, TF, CQuotesHistoryMutable, IBars, IBarsExt, OHLC} from "../../Nav/MarketData";
import {CJournal} from "../СJournal";
import {
    iLinkMini,
    iMega,
    tAddressSymbol, tCallbackForRefreshSymbol,
    tCallbackSocket,
    tGetAll, tGetSymbol,
    tInfoForLoad, tInfoForLoadHistory,
    tLoad,
    tLoadBar,
    tSet,
    tSetBars,
    tSetHistoryD,
    tSetHistoryData,
    tSetTicks,
    tSocket, tSocketAll,
    tSocketInput, tSocketKlineAll, tSymbolInfo, tUpDateAllKline
} from "../interface/IHistoryBase";
import {CObjectEvents} from "../const";
import {tListEvent, tTick} from "../interface/mini";
import {CTestOrdersAND} from "../CHystoryOrdersAnd";
import { sleepAsync } from '../../Nav/Common';


type tHistoryReqDate =  {tf: TF, time1: Date, time2: Date, right?:boolean}
type tHistoryReq =  {tf: TF, time1: number | Date, time2? : Date, right?:boolean}
// {history: CQuotesHistoryMutable, link: any}

//кориктеровка времени относительно действующей истории перед отправкой запроса на закачку истории
function CorrPreLoadHTime (buf :IBars , info : tHistoryReq) : tHistoryReqDate {
    const {right} = info
    if (info.time1 instanceof Date) {
        if (buf && buf.count>0 && buf.lastTime) {
            //надо чтобы сперва отправлялся запрос на докачку графика с правой стороны, а потом уже с левой
            if (buf.time(0)>info.time1) {
                return {
                    tf: info.tf,
                    time1: info.time1,
                    time2: new Date(buf.time(0).valueOf()),
                    right: right
                    }
                }
            else {
                return {
                    tf: info.tf,
                    time1: new Date(buf.lastTime.valueOf()),
                    time2: info.time2??new Date(),
                    right: right
                    }
                }
        }
        else {
            if (!info.time2)
                return {
                    tf: info.tf,
                    time1: info.time1,
                    time2: new Date(),
                    right: right
                }
            else
                return {
                    tf: info.tf,
                    time1: info.time1,
                    time2: info.time2,
                    right: right
                }
        }
    }
    else {
        if (buf && buf.count>0 && buf.last) {
            return right ?
                {
                tf: info.tf,
                time1: new Date(buf.last.time.valueOf()-1*info.tf.msec),
                time2: new Date(buf.last.time.valueOf()+info.time1*info.tf.msec),
                right: right}
                : {
                    tf: info.tf,
                    time1: new Date(buf.time(0).valueOf()-info.time1*info.tf.msec),
                    time2: new Date(buf.time(0).valueOf()),
                    right: right}
                ;
            }
        else {
            return {
                tf: info.tf,
                time1: new Date(new Date().valueOf()-info.time1*info.tf.msec),
                time2: new Date(),
                right: right
            }
        }
    }
}

function CorrPreLoadHTime2(buf :IBars , info : tHistoryReq) : tHistoryReqDate|undefined {
    const result = CorrPreLoadHTime(buf,info)
    //закачивать нечего
    if (result.time1>=result.time2) return undefined
    return result
}

//функция для форматирования загруженных котировок в исторические бары
//


function ConvertToBarsEasy(data: {tf :TF ,bars :tSetHistoryData[]}) : {tf:TF, bars:CBar[]}{
    return {
        tf : data.tf,
        bars : data.bars.map((buf)=>new CBar(buf.time ,buf.open ,buf.high ,buf.low ,buf.close ,buf.volume, buf.tickVolume))
    };
}

function FLoadToBar2(data:{history :CQuotesHistoryMutable, tf :TF ,bars :CBar[], type?:tLoadBar}): tLoadBar{
    const history = data.history.Bars( data.tf );
    const {bars,type} =  data;

    if (bars.length <= 0) {
        return "Nan";
    }
    const newBars = new CBars(data.tf,data.bars)
    if (history) {
        //подгрузка справа
        if (bars[0]?.time.valueOf() > history.time(0).valueOf()) {
            data.history.AddEndBars( newBars);
            return type??"right"
        }
        //подгрузка слева
        else {
            data.history.AddStartBars( newBars);
            return type??"left"
        }
    }
    else {
        console.warn("пустая история")
        data.history.AddStartBars( newBars);
        return type??"left"
    }
}


export interface tInfoInit {
    tf?: TF,
    symbol?: string,
    address?: readonly string[],
    history?: IBarsExt|IBars,
    link?: CRBaseMapAll2
    //ссылка на  архив истории, в том числе и эмулированной
    baseHistory?: CRBaseMapAll2
}

export interface tInfoInit2 extends tInfoInit {
    tf: TF,
    symbol: string | undefined,
    address: readonly string[],
    history: IBarsExt|IBars | undefined;
    link: CRBaseMapAll2 | undefined;
    //ссылка на  архив истории, в том числе и эмулированной
    baseHistory?: CRBaseMapAll2
}


export type tInfoInit3 = Readonly<{
    tf?: TF,
    address?: readonly string[],
    history?: IBarsExt|IBars,
    link?: CRBaseMapAll2
    //ссылка на  архив истории, в том числе и эмулированной
    baseHistory?: CRBaseMapAll2
}>;


export interface tInfoInit4 extends tInfoInit3 {
    tf: TF,
    // symbol: string | undefined,
    address: readonly string[],
    history: IBarsExt|IBars | undefined;
    link: CRBaseMapAll2 | undefined;
    //ссылка на  архив истории, в том числе и эмулированной
    baseHistory?: CRBaseMapAll2
}

export type tLoadRequest = {tf : TF, right? : boolean, time1 : const_Date | Date | number, time2?: const_Date | Date}

export const HistoryStopLoad = {stop:false}



//класс подписок

export class CRBaseMapAll2 extends Map<string,CRBaseMapAll2> { //implements iMega<string,CRBaseMapAll22>
    static nums:number=0;
    protected _k:number;
    key:        string;
    name:       string;
    constructor(key:string, par?:CRBaseMapAll2) {
        super();
        this.key = key;
        this.name = key;
        this.par = par;
        this._k=CRBaseMapAll2.nums++;
    }
    //всякая информация
    protected _info?:tSymbolInfo;
    get info() { return this._info; }
    getInfo() { return this._info; }
    setInfo(info:tSymbolInfo|undefined) {this._info =info;}

    getKeys()                           {
        return [...this.keys()]; // as const;
    }

    getValues() : /*readonly*/ CRBaseMapAll2[] {
        return [...this.values()];// as const;
    }
    override set(key:string)                                 {super.set(key,new CRBaseMapAll2(key, this));  return this;}

    add(key: string): CRBaseMapAll2                 {let buf =  this.get(key); if (!buf) this.set(key); return this.get(key)!;}
    addArrayEl(keys :readonly string[])             {if (keys) for (let i of keys) {this.add(i);} return this;}
    addArrayObject(obj: readonly tGetSymbol[])      {
        for (let i of obj) {this.add(i.name).setInfo(i);} return this;
    }

    //возвращает адрес класса и базовый класс
    getSymbolDate():tInfoInit                       {return {address: this.getFistSymbol().getAddress(), baseHistory: this.getBaseClass()}}

    //Возвращает базовый родительский класс по иерархии, т.е. CRBaseMapAll22 класс
    getBaseClass():CRBaseMapAll2                   {return this.par?.getBaseClass() ?? this;}
    // метод возвращает доступ к первому символу в первых подкатегорий Пример(первый символ, первой схемы, у первой биржи) // относительно текущего выбора
    // вернет сам себя в случаи если данный символ уже конечный
    getFistSymbol() {
        return this.values().next().value?.getFistSymbol() ?? this;
    }

    addByAddress(address: readonly string[]): CRBaseMapAll2 {
        let par:CRBaseMapAll2 = this.getBaseClass();
        for (const item of address) par = par.add(item)
        return par;
    }
    getByAddress(address: tAddressSymbol): CRBaseMapAll2 | undefined {
        let par: CRBaseMapAll2 | undefined = this.getBaseClass();
        for (const item of address) {
            par = par.get(item);
            if (!par) {
                console.error(`при получение символа по адресу ${address} не найден элемент ${item}`)
                break
            }
        }
        return par;
    }

    //сохранить тик и отправить его всем
    SetTicks(data: tSocketInput) {
        if (data.ticks) {
         //   this.history.AddTicks(data.ticks);
            this.history.AddNewTicks(data.ticks)
            //      this._socketNode.forEach((i)=>i(data));//this.SetTicks(data);
        }

    }

    SetBars(data: {bars: CBar[], tf: TF}  ){
        // console.log(this.name);
        FLoadToBar2({history: this.history,...data})
        this._eventRefresh?.OnEvent({history: this.history, link: this})
        return;
    }

    //временно тут, ордера символа
    //_orders:undefined|CTestOrdersAND

    //загружает и сохраняет с постановкой в очередь

    //подписать на обновление символа - установка новых баров
    // CObjectEvents
    private _eventRefresh: CObjectEvents <tCallbackForRefreshSymbol>|undefined
    AddEventRefreshData(callback:tListEvent <tCallbackForRefreshSymbol>) {
        (this._eventRefresh ??= new CObjectEvents).Add(callback)
    }
    //подписать на тики // хотя по факту историю тоже можно присылать
    private _eventNewTicks: CObjectEvents <tSetTicks> | undefined
    AddEventNewTicks(callback: tListEvent <tSetTicks>) {
        (this._eventNewTicks ??= new CObjectEvents).Add(callback)

        if (!this._socketStatus && !this._socketStatusAll) {  //  (!this._socketStatus || !this._socketStatusAll)
            console.warn("символ пытается независимо сам подключиться к котировкам!!!")
            this._socketStatus = true;
            const disable = ()=> !(this._eventNewTicks?.length ?? this._eventNewTicksNoSave?.length)
            const callback: tCallbackSocket = (data)=>{this._setNewTicksFast(data)}
            const statusOff = ()=>{
                this._socketStatus=false
                console.warn("отключено сокет подключение к уникальным котировкам")
            }
            console.log("getFunkSocket ",this._socketStatus , this._socketStatusAll)
            console.log(this.getFunkSocket())
            this.getFunkSocket()?.({name:this.name},callback,disable,statusOff)
        }
    }
    //подписать на тики // хотя по факту историю тоже можно присылать
    private _eventNewTicksNoSave: CObjectEvents<tSetTicks>|undefined
    AddEventNewTicksNoSave(callback:tListEvent<tSetTicks>) {
        (this._eventNewTicksNoSave ??= new CObjectEvents).Add(callback)
    }
    //принудительная закачка значений без сохранения (ограничена максимальным запросом)
    private async Load2NoSave(data:tHistoryReqDate){
        const func = this.getFunkHistoryLoad()
        if (!func) return undefined
        const buf = await func({name:this.name,...data})
        return buf? ConvertToBarsEasy(buf) : undefined
    }

    private _loading = Promise.resolve()
    LoadHistoryForEvent(tf:TF, time1:const_Date|number, time2?:const_Date, right?:boolean, callback?:(percent:number)=>void) : Promise<undefined | void> {
        return this._loading = this._loading.then(()=>this.LoadHistoryForEvent2(tf,time1,time2,right,callback))
    }
    //сперва загрузит требуемую историю всю, потом инициализирует
    private async LoadHistoryForEvent2(tf:TF, time1:const_Date|number, time2?:const_Date, right?:boolean, callback?:(percent:number)=>void) : Promise<undefined> {
        if (HistoryStopLoad.stop) return ;
        if (this.IsTest()) return ;

        const history = this.history.Bars(tf) ?? new CBars(tf,[]);
        const info = CorrPreLoadHTime2(history,{tf:tf, time1:time1 as Date|number, time2:time2 as Date,right});
        //закачивать нечего
        if (!info) return undefined
        if (info.time2.valueOf() - info.time1.valueOf()<tf.valueOf()) return undefined
        const result =  await this.loadHistoryAbsNoSave2(info,callback)

        if (result?.bars?.length) {
            for (let i = 1; i < result.bars.length; ) {
                if (result.bars[i].time.valueOf()==result.bars[i-1].time.valueOf()) {result.bars.splice(i,1)}
                else i++
            }
        }
        if (result) this.SetBars(result)
        return undefined;
    }
    // загружает сколько можно по минимуму так сказать за один мах

    LoadHistoryForEventMini(tf:TF, time1:const_Date|number, time2?:const_Date, right?:boolean) : Promise<undefined|void> {
        return this._loading = this._loading.then(()=>this.LoadHistoryForEventMini2(tf,time1,time2,right))
    }

    private async LoadHistoryForEventMini2(tf:TF, time1:const_Date|number, time2?:const_Date, right?:boolean) : Promise<undefined> {
        if (HistoryStopLoad.stop) return undefined;
        if (this.IsTest()) return undefined;
        const history = this.history.Bars(tf) ?? new CBars(tf,[]);
        const info = CorrPreLoadHTime2(history,{tf:tf, time1:time1 as Date|number, time2:time2 as Date,right});
        //закачивать нечего
        if (!info) return undefined
        if (info.time2.valueOf() - info.time1.valueOf()<tf.valueOf()) return undefined
        const result =  await this.Load2NoSave(info)
        if (result) this.SetBars(result)
        return undefined;
    }
    //
    private async loadHistoryAbsNoSave2(data: tHistoryReqDate, callback?:(percent:number)=>void) {
        //сколько в итоге должно быть баров примерно
        let needBars = (data.time2.valueOf() - data.time1.valueOf())/data.tf.valueOf()
        //если должно быть очень много

        //новая история больше не приходит
        let result = await this.Load2NoSave(data)
        if (result?.bars.length && result?.bars.length>1) {
            let time1 = result.bars[0].time;
            let time2 = result.bars[result.bars.length-1].time;

            callback?.(result?.bars.length/needBars);

            if (Math.abs(data.time1.valueOf()-time1.valueOf())< data.tf.valueOf()) return result;

            if (Math.abs(data.time1.valueOf()-time1.valueOf())>= data.tf.valueOf()) {
                while (1) {     //закачиваем с лево
                    let buf = await this.Load2NoSave({...data,time2:time1 as Date})
                    if (!(buf?.bars?.length && buf.bars.length>4)) break
                    result.bars=[...buf.bars,...result.bars]
                    time1 = result.bars[0].time;
                    callback?.(result?.bars.length/needBars);
                    if (Math.abs(data.time1.valueOf()-time1.valueOf())< data.tf.valueOf()) break;
                }
            }

            time1 = result.bars[0].time;
            time2 = result.bars[result.bars.length-1].time;

            if (Math.abs(data.time2.valueOf()-time2.valueOf())>= data.tf.valueOf()) {
                while (1) {     //закачиваем с право
                    let buf = await this.Load2NoSave({...data,time1:time2 as Date})
                    if (!(buf?.bars?.length && buf.bars.length>4)) break
                    result.bars=[...buf.bars,...result.bars]
                    time2 = result.bars[result.bars.length-1].time;

                    callback?.(result?.bars.length/needBars);
                    if (Math.abs(data.time2.valueOf()-time2.valueOf())< data.tf.valueOf()) break;
                    if (Math.abs(data.time2.valueOf()-time2.valueOf())< data.tf.valueOf()) break;
                }
            }
        }

        return result;
    }


    //установит функцию получения списка элементов с интернета
    setFunkNames(all:tGetAll)                 {this._all=all;}

    //вызывает список инструментов
    async loadNames(){
        if (this._all) {return this._all()}
        else {console.error("не объявлена функция закачки по адресу "+this.Address()); console.trace()}
    }

    protected async allInitSymbols(): Promise<CRBaseMapAll2|undefined>{
        const buf = await this.loadNames();
        return buf ? this.addArrayObject(buf.symbols) :undefined;
    }

    protected statusInit: Promise<CRBaseMapAll2|undefined>|undefined;
    StatusInit = Promise.resolve();

    //проверка произошла ли подкачка названий инструментов и прочее
    async allInit(reload?:boolean): Promise<CRBaseMapAll2|undefined> {
        if (reload) return (this.statusInit=this.allInitSymbols())
        return this.statusInit ??= this.allInitSymbols();
    }
    protected _all:tGetAll|undefined;

    testMode?:boolean;
    //если режим тестирования, то не будет работать подкачка и прочие обычные вещи
    IsTest():boolean {
        return this.testMode??this.par?.IsTest()??false;
    }

    //возвращает ближайшую функцию подключения сокета согласно иерархии
    getFunkSocket(): tSocket | undefined {
        return this._socket?? this.par?.getFunkSocket()
    }
    //возвращает ближайшую функцию загрузки котировок согласно иерархии
    getFunkHistoryLoad(): tLoad | undefined             {return this._load?? this.par?.getFunkHistoryLoad()}


    // базовая имитация установки тика с минимальным TF М1
    _setNewTicksBase(tick: tTick) {
        const last =this.history.Bars(TF.M1)?.last
        let bar : CBar;
        // console.log({time: tick.time, price: tick.price, volume: tick.volume})
        this.history.AddTicks([{time: tick.time, price: tick.price, volume: tick.volume}]) ///TODO: временная реализация через тики
        if (last && last.time.valueOf() + TF.M1.valueOf() >= tick.time.valueOf()) {
            // bar = CBar.new((last.time) as const_Date,
            //     {
            //         open: last.open,
            //         close: tick.price,
            //         low: Math.min(last.low,tick.price),
            //         high: Math.max(last.high,tick.price)
            //     }, last.volume);
            // this.history.AddEndBars(new CBars(TF.M1,[bar]))
        }
        else {
            // ///TODO: здесь создается новый бар, но если есть подписка на объемы - там так же приходят новые бары, они могу не затереться а создаться два бара !!!
            // // создание нового бара
            // if (last) {
            //     bar = CBar.new((new Date(last.time.valueOf() + TF.M1.valueOf())) as const_Date,
            //         {
            //             open: tick.price,
            //             close: tick.price,
            //             low: Math.min( tick.price,tick.price),
            //             high: Math.max( tick.price,tick.price)
            //         }, last?.volume ?? 0);
            //     this.history.AddEndBars(new CBars(TF.M1,[bar]))
            // }
        }
    }

    //функция для подписки к тикам, причем создается соединение которое не будет сохранять котировки
    //принимает и передает тики не сохраняя их (роутер) - позволят сделать несколько подключений к одному потоку
    _eventTicks = Promise.resolve()
    _setNewTicks(data: tSetTicks, info?: Partial<tSymbolInfo>) {
        //если есть подписки на тики
        if (this._eventNewTicks?.length) {
            data.ticks.forEach((e) => this._setNewTicksBase(e))

            // this.history.AddNewTicks(data.ticks);

            if (this._info && info) { // @ts-ignore
                this._info = Object.assign(this._info, info)
            }

            (async ()=>{
                await sleepAsync()
                this._eventNewTicksNoSave?.OnEvent(data)
                this._eventNewTicks?.OnEvent(data)
            })()
        }
    }


    _setNewTicksFast(data: tSetTicks) {
        if (this._eventNewTicks?.length) {
            this.history.AddNewTicks(data.ticks)
            this._eventNewTicksNoSave?.OnEvent(data)
            this._eventNewTicks?.OnEvent(data)
        }

    }


    _setNewBar(data:  Partial<tUpDateAllKline>, info?: Partial<tSymbolInfo>) {
        //если есть подписки на тики
        const {c,h,o,l,v,t, i:tf} = data

        if (tf && c && h && o && l && v && t) {
            const ohlc : OHLC = {high: h, low:l, open:o, close:c}
            this.history.AddEndBars(new CBars(tf,[CBar.new((new Date(t)) as const_Date, ohlc,v)]))
            // this.history.
        }

    }


    //  protected _load:any=                         (SymbolInfo :tSymbolInfo) => {return this.par?.load(SymbolInfo)}
    par?:                           CRBaseMapAll2 | undefined;
    _upDateAllKline:                tSocketKlineAll | undefined
    setSetting(data:tSet):this {
        if (data.loadHistory)   {this.setFunkLoadHistory(data.loadHistory);}
        if (data.socketAll)     {this.setFunkSocketAll(data.socketAll);}
        if (data.socket)        {this.setFunkSocket(data.socket);}
        if (data.allInit)       {this.setFunkNames(data.allInit);}
        if (data.upDateAllKline){this._upDateAllKline= data.upDateAllKline}

        return this;
    }
    nameType?                                   :string;
    getNameElement() :string                    {return this.name;}
    //текущий адрес всегда должен быть известен и про инициализирован
    getAddress() :tAddressSymbol {
        if (!this.par) return [];
        return [...this.par.getAddress(), this.getNameElement()];
    }
    Address() :tAddressSymbol                   {return this.getAddress();}
    //установить функцию потоковых котировок
    setFunkSocket(socket:tSocket)               {this._socket=socket;}
    setFunkSocketAll(socket:tSocketAll)         {this._socketAll=socket;}
    setFunkLoadHistory(load:tLoad)              {this._load=load;}
    _socketStatus:boolean=false;
    _socketStatusAll:boolean=false;
    //необходимо запустить из ветки где есть такая функция - дает массовые тики по всем инструментам, не может быть отключена из одного символа
    //может сам переподключиться
    RunSocketAll()                              {
        if (this._socketAll) {

            this.forEach((e)=>{e._socketStatusAll=true;});

            this._socketAll( (mas:{data: tSetTicks, info?: Partial<tSymbolInfo> , name: string}[])=>{
                for (const ma of mas) {
                    this.get(ma.name)?._setNewTicks(ma.data, ma.info);
                }
            },() => false,()=>{this.RunSocketAll()})
        }
        return this;
    }
    mapKlineRefresh = new Map<object, string[]>()
    RunUpdateKlineAll()                              {

        const run = (tt: string[]) => {
            if (this._upDateAllKline) {
                this._upDateAllKline(
                    (data) => {
                        this.get(data.data.s??"")?._setNewBar(data.data);


                        // (async ()=>{
                        //     await sleepAsync()
                        //     this._eventNewTicksNoSave?.OnEvent(data)
                        //     this._eventNewTicks?.OnEvent(data)
                        // })()

                        /// _setNewBar

                    }
                    ,() => false,()=>{
                        // this.RunUpdateKlineAll()
                    }
                    , {names: tt }
                )
            }
        }

        const arr = this.getValues();
        let step = 300
        for (let i = 0; i < arr.length; i+=step) {
            if (arr.length - i < step) step = arr.length - i
            const names = arr.slice(i,i+step).map(e=>e.name)
            run(names)

        }
        // const tt = this.getValues().filter(e=>e._info?.quoteAsset == "USDT").map(e=>e.name)

        return this;
    }

    protected _socket:tSocket|undefined;
    protected _socketAll:tSocketAll|undefined;
    protected _load:tLoad|undefined;
    //ссылка хранения самой истории
    history:CQuotesHistoryMutable = new CQuotesHistoryMutable; //сама история

    journal:CJournal=new CJournal;

}
