import {TF} from "./Nav/Time";
import {CBar} from "./Nav/Bars";

import {CSystemBox, tSystemBox} from "./and/sytemBox";
import {BHistory, Sessions} from "./and/static";
import {CSymbolData} from "./and/Symbol";


import {Indicator,IndicatorAny,indicatorConstructor} from "./and/const";

import {CCanvas, mouseAPI} from "./and/canvasAPI";
import {CDivNode, LinkTo, tGraph, tGraphDiv, tInfoInit, typeMoveTo} from "./and/vgraf3";
//подключение стратегий
import {CIndicatorsAND} from "./and/indicatorBaseClass/indicatorAND";
import {TradeData} from "./Nav/myTester";
import {interfaceIndicator} from "./and/interface/IIndicator";
import {
    interfaceFont,
    interfacePoint,
    interfacePricePanel,
    interfaceTimePanel,
    tColor,
    tFont,
    tListEvent,
    tPix
} from "./and/interface/mini";
import {CWinCC} from "./and/canvas2d/Canvas2D";
import {tSets, tStyleAndSettingGraph, tStyleBarM} from "./and/canvas2d/Canvas2dStyle";
import {CIndicatorPrototype} from "./and/indicatorBaseClass/CIndicatorPrototype";
import indicators from "./indicators";

export * from "./and/interface/mini";
export * from "./and/interface/IHistoryBase";

//export const TestApi: interfaceTestApi=new CTesterApi() as interfaceTestApi;
export * from "./and/indicatorBaseClass/indicatorAND";
export * from "./and/history/historyBase";
export * from "./and/const";
export * from "./and/canvasAPI";
export * from "./Nav/Common";
export * from "./Nav/Time";
export * from "./Nav/TesterAPI";
//export * from "./and/TesterNav";
export * from "./Nav/Data_MSTrade";
export * from "./and/history/historyBase";
export * from "./and/vgraf3";
export * from "./and/sytemBox";
export * from "./and/Session";
export * from "./and/СJournal";
export * from "./and/CParams";
export * from "./and/save/serverSave";
export * from "./and/color";
export {CIndicatorPrototype} from "./and/indicatorBaseClass/CIndicatorPrototype";
export * from "./and/interface/IIndicator";

export {createIndicatorInstance} from "./and/indicatorBaseClass/indWorkBase";



let _LoadHistorySetting:()=>void=()=>{}
export function LoadHistorySetting(data:()=>void){_LoadHistorySetting=data;}


//список всех индикаторов

//function createIndicatorPrototype<T extends IParams>(indicator :Indicator<T>) {
export function createIndicatorPrototype(indicator :IndicatorAny): CIndicatorPrototype {

    return new CIndicatorPrototype({
        name: indicator.Name,
        paramDefault: indicator.paramInfo,
        paramInfo: indicator.paramInfo,
        construct: indicatorConstructor(indicator), //indicator.construct,
        version: indicator.Version
    });
}
//
const IndicatorsPrivate: CIndicatorPrototype[] = indicators.map(ind=>createIndicatorPrototype(ind));
//
//
export type IIndicators = readonly CIndicatorPrototype[] & { find(data: Readonly<{name:string, version?:string|undefined}>) : CIndicatorPrototype|undefined};
//
//
export class CIndicators extends Array<CIndicatorPrototype> implements IIndicators {

    //get data() : CIndicatorPrototype[] { return this; }

    override find({name,version} : Readonly<{name:string, version?:string|undefined}>) : CIndicatorPrototype|undefined{
        //сперва ищем строгое соответствие версии
        if (version) {
            let ind= super.find((ind) => ind.name==name && ind.version==version);
            if (ind) return ind;
        }
        //если по версии найти не удалось, ищем первый совпадающий по названию
        return super.find((ind) => ind.name==name);
    }
}

export const Indicators : IIndicators = new CIndicators(...IndicatorsPrivate);
export const AllIndicators = Indicators;

//все стандартные заранее выбранные таймфреймы
export const MainTimeframes : readonly TF[]= [TF.M1, TF.M5, TF.M15, TF.H1, TF.H4, TF.D1, TF.W1];
//все математически доступные таймфреймы, включены все нестандартные таймфреймы
export const AllTimeframes : readonly TF[] = [...TF.all];



export interface interfaceEquity extends interfaceIndicator{
    //выбор по номеру позиции/ордера / меняет цвет ордера на графике - делает его выделенным
    SetSelectOrder(num :number) :void;
    //добавить историю символов, для построения по ним equity
    SetHistory(his :readonly TradeData[]) :void;
    //добавить бар equity с тестера, выходные параметры: номер ара, сам бар
    SetBar( num :number, barEquity : CBar ) :void;
    //добавить массив баров
    SetBars(barEquity : CBar[] ) :void;
    PushBar( barEquity : CBar ) :void;
    PushBars( barEquity : CBar[] ) :void;
}

//
export interface interfaceMouseAPI{
    // Получить активный график, график на который последний раз нажали мышкой,
    // valueOf():CGraphBaseAPI;
    // Примечание:
    // последний созданный график автоматически становиться активным
    active:interfaceGraphAPI|undefined;
    // Установить график активным, при установки выдавиться список событий Callback
   // AddCallbackOnSelect(callback:()=>void):void;
    AddCallbackOnSelect2(callback:tListEvent):void;
    // Выводит в консоль все текущие events
    logsEvent():void

    // Выполняет сценарий callback связанных с внешними установками front по смене графика. Принудительно
    OnEventGraph():void;
}

export class CDPoint implements interfacePoint{
    protected data:interfacePoint;
    constructor() {
        this.data={};
    }
    SetSign(data:interfacePoint)    {Object.assign(this.data,data);}
    set x(data:tPix)            {this.data.x=data;      if (data!=undefined) this.SetSign({bar:undefined,time:undefined})}
    get bar()                   {return this.data.x!;}
    set bar(data:tPix)          {this.data.time=data;   if (data!=undefined) this.SetSign({x:undefined,time:undefined})}
    get time()                  {return this.data.time!;}
    set time(data:tPix)         {this.data.time=data;   if (data!=undefined) this.SetSign({x:undefined,bar:undefined})}
    get x()                     {return this.data.x!;}
    set y(data:tPix)            {this.data.y=data;      if (data!=undefined) this.SetSign({price:undefined})}
    get y()                     {return this.data.y!;}
    set price(data:tPix)        {this.data.y=data;      if (data!=undefined) this.SetSign({y:undefined})}
    get price()                 {return this.data.y!;}
}

export class CFont implements interfaceFont{
    constructor(data?:interfaceFont) {
    }
    background:tColor|undefined;
    color!:tColor;
    font!:tFont;
    size!:tPix;
    with:tPix|undefined
}

const defaultFont:CFont={
    background:undefined,
    color:()=>{return "rgb(255,255,255)"},
    font:()=>{return "Roboto"},
    size:()=>(10),
    with:undefined
};

const defaultFontSelect:CFont={
    background:()=>{return "rgb(255,255,255)"},
    color:()=>{return "rgb(0,0,0)"},
    font:()=>defaultFont.font(),
    size:()=>(10),
    with:undefined
};


export interface interfaceTextDisplay{
    point:interfacePoint;
    readonly font:interfaceFont;
    fontSet(data:interfaceFont):void
}

//класс панели цены
export class CPricePanel implements interfacePricePanel{
    with!:tPix;
    readonly font:interfaceFont={...defaultFont};
    //массовая установка свойств
    fontSet(data:interfaceFont) {Object.assign(this.font,data)}
    readonly fontSelect:interfaceFont={...defaultFontSelect};
    //массовая установка свойств
    fontSelectSet(data:interfaceFont) {Object.assign(this.fontSelect,data)}
}

//класс панели времени
export class CTimePanel implements interfaceTimePanel{
    height!:tPix;
    readonly font:interfaceFont={...defaultFont};
    //массовая установка свойств
    fontSet(data:interfaceFont) {Object.assign(this.font,data)};
    readonly fontSelect:interfaceFont={...defaultFontSelect};
    //массовая установка свойств
    fontSelectSet(data:interfaceFont) {Object.assign(this.fontSelect,data)}
}

//класс метки на экране
export class CTextDisplay implements interfaceTextDisplay{
    protected _point:interfacePoint=new CDPoint();
    set point(data:interfacePoint) { // @ts-ignore
        this._point.SetSign(data);}
    get point() {return this._point;}
    font:interfaceFont={...defaultFont};
    //массовая установка свойств
    fontSet(data:interfaceFont) {Object.assign(this.font,data)}
    text!:()=>string;
}


export interface interfaceCanvasAPI{
    //   CreatGraph?(div:HTMLDivElement):interfaceGraphAPI;
    //возвращает количество окон
    //  TotalGraphs():number;
    //выбирает окно по номеру индекса
    //  SelectGraphs(index:number);
    location:tGraphDiv
    _divParents:HTMLElement | undefined;

    //Устанавливает див для canvas
    Init(div:HTMLDivElement):void
    Init3D(div:HTMLDivElement):void

    //добавляет график
    AddGraphLvl(data?:tInfoInit, location?:tGraphDiv, node?:CDivNode):interfaceGraphAPI | undefined;
    AddGraph(data?:tInfoInit, location?:tGraphDiv, node?:CDivNode):interfaceGraphAPI | undefined;
    AddGraph3D(data?:tInfoInit):interfaceGraphAPI | undefined;
    //полное удаление canvas
    Delete():void
    //обновить размер всех подокон графика
    RefreshSize():void
    //
    ReSizeAndDraw():void

    //установить метод закачки котировок

    //установить метод закачки котировок по определенным группам символов

    //установить метод тиков

    //установить метод тиков по определенным группам символов
}

const forRefresh:{display:{refresh:(()=>void)|undefined}|undefined} = {display:undefined}
//Обновляет React на экране - если React вообще подключен
export function DisplayRefresh(){
    console.log(forRefresh);
    forRefresh.display?.refresh?.();
}

type tCreatCanvas = {forRefresh:{refresh:(()=>void)|undefined},div?:HTMLDivElement, style?:tSets}
//создает ресурс подвязанный к диву на котором будет создан canvas, необходимо либо сразу установить див либо потом проинициализировать класс
export function CreatCanvasAPI({div,forRefresh:_f,style}: tCreatCanvas):interfaceCanvasAPI {
    forRefresh.display =  _f;

    _LoadHistorySetting(); return new CCanvas({div,style});
}

// export function HistoryEventByInitEasy(data:()=>void) {return HistoryEventByInit(data)}
export function GetHistoryClass() {return BHistory}
export function GetSessionClass() {return Sessions}
//ссылка на статический класс мышки
export function CreatMouseApi() :interfaceMouseAPI {return new mouseAPI();}
//export function CreatGraph(div:HTMLDivElement):interfaceGraphAPI {return new CGraphBaseAPI(new div);};


//настройка прочих настроек которые будут
export type settingGraphOther={
    mouse:"cross"|"off"|"crossMini"
}

//интерфейс АПИ графика
export interface interfaceGraphAPI{
    location : tGraphDiv
    _data:tGraph
    //Узел родительского элемента
    _node:CDivNode|undefined
    indicators :CIndicatorsAND | undefined

    symbolData: CSymbolData | undefined;


    //Перемотка - центром перемотки является указатель мышки
    GetSystemBox():CSystemBox;
    SetSystemBox(data:tSystemBox):void;

    //перемотать к концу графика принимает значение количества кадров для анимации, если не установлено берет значение по умолчанию
    MoveToEnd():void;
    //перемотать к началу графика принимает значение количества кадров для анимации, если не установлено берет значение по умолчанию
    MoveToStart():void;

    //перемотать к структуре
    MoveToStruct(data:typeMoveTo):void;

    //перемотать к бару
    MoveToBar(bar:number, link?: LinkTo):void;

    //перемотать ко времени
    MoveToTime(time :const_Date|number, link?: LinkTo):void;

    //перемотать к цене - работает только при отключенном авто масштабировании
    MoveToPrice(price:number):void;

    //перемотать к цене и времени - по цене работает только при отключенном авто масштабировании
    MoveToTimePrice(time:number, price:number):void;

    //анимация при перемотке не обязательный параметр количества кадров.....
    AnimationForMoveOn(frameRepeat?:number):void;

    //выключить анимацию, чтобы происходила перемотка за 1 кадр
    AnimationForMoveOff():void;

    //вернуть количество кадров при перемотке если 1 кадр то перемотка мгновенная
    AnimationForMoveGetFrameRepeat():number;

    //авто высота
    AutoHeight : boolean;

    GetCoordinate():CWinCC|undefined;


    //нижняя полоска времени
    //включить выключить
    //размер текущий
    //изменить размер
    //положение сверху снизу
    //стили

    //стили
    //стиль рисования бары линии свечи


    SetWaterSymbol3(func:(()=>string)|undefined) : void

    //данный тип выключает другие стили которые
    SetStyleGraph(data:tStyleBarM):void
    SetStyleGraphByBar():void
    SetStyleGraphByLine():void
    SetStyleGraphByCandle():void

    GetStyleGraph():tStyleBarM

    SetOther(data:tStyleAndSettingGraph):void
    GetOther():tStyleAndSettingGraph

    SetColors(data:tSets):void
    GetColors():tSets

    //задать цвет определенному бару
    //_SetBarColor(bar:any):void;

    //получение номера бара по времени
    TimeToBar(time :number|const_Date):number;

    //получение времени бара
    BarToTime(bar:number) : number|undefined;

    //конвектор перевода бара во время
    BarToDate(bar:number) : const_Date|undefined;

    //включить режим тестирования, выключает авто подкачку котировок, нужен для имитации своей истории
    ModeTest(test:boolean):void;

    //принудительно перерисовать график
    Draw():void;

    //удаляет текущий график, не удаляет общий блок canvas
    Delete():void;

    //обновить размер блока
    SizeRefresh():void;

}

