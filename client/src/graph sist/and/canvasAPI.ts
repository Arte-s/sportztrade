
import {
    interfaceGraphAPI,
    interfaceCanvasAPI,
    interfaceMouseAPI,
    tInfoInit,
    tGraph,
    tListEvent,
    LinkTo,
    SymbolsLoading
} from "../API";
import {CSymbolData} from "./Symbol";

import {CIndicatorsAND} from "./indicatorBaseClass/indicatorAND";

import {CDivNode, typeMoveTo} from "./vgraf3";
import {mouseG} from "./cmouse";

import { const_Date } from "../Nav/Time";

import {
    Event
} from './load';
import { TF} from "../Nav/Time";
import {
    CSystemBox,
    tBaseLocation, tGraphDiv
} from "../API";
import {CGraphCanvas, CGraphCanvasDop} from "./canvas2d/Canvas2D";
import {CGraphCanvas3D} from "./Canvas3D";
import {tSets, tStyleAndSettingGraph, tStyleBarM} from "./canvas2d/Canvas2dStyle";
import {CIndicatorPrototype} from "./indicatorBaseClass/CIndicatorPrototype";
import {CreateDom} from "../CCreateDom";



//обертка функционала для АПИ графика
export class CGraphBaseAPI implements interfaceGraphAPI{
    protected data:tGraph;
    constructor(graph:tGraph) {
        this.data=graph;
    }
    get location()                                      {return this.data?.location}
    get symbolData(): CSymbolData  | undefined          {return this.data?.symbolData}
    //получить исходный класс графика
    get _data():tGraph                                  {return this.data}
    get indicators() :CIndicatorsAND | undefined        {return this.data?.indicators}
    //Узел родительского элемента
    get _node()                                 {return this.data.nodeForGraph.parents}

    protected _frameRepeat={default:50,data:50};

    GetSystemBox()                              {return this.data?.box.GetBox()};
    SetSystemBox(box:CSystemBox)                {
        this.data?.box.SetBox(box)
        // mouseG.setGraph(this.data)
    }

    //перемотать к концу графика принимает значение количества кадров для анимации, если не установлено берет значение по умолчанию
    MoveToEnd(_frameRepeat?:number)             {
        if (this.symbolData && this.symbolData.history)
            this.MoveToStruct({bar: {target: this.symbolData.history.count},repeat:_frameRepeat??this._frameRepeat.data});
    }
    //перемотать к началу графика принимает значение количества кадров для анимации, если не установлено берет значение по умолчанию
    MoveToStart(_frameRepeat?:number)           {this.MoveToStruct({bar:{target:1},repeat:_frameRepeat??this._frameRepeat.data});}

    //Перемотка - центром перемотки является указатель мышки

    MoveToStruct(data:typeMoveTo)               {if (!data.repeat) {data.repeat=this._frameRepeat.data} this.data?.GraphMoveTo(data);}
    //перемотать к бару
    MoveToBar(bar:number, link?: LinkTo)       {this.data?.GraphMoveTo({bar:{target:bar},repeat:this._frameRepeat.data, linkTo: link});}

    //перемотать ко времени
    MoveToTime(time :number|const_Date, link?: LinkTo)  {
        this.data?.GraphMoveTo({time:{target:time.valueOf()},repeat:this._frameRepeat.data, linkTo: link});
    }

    //перемотать к цене - работает только при отключенном автомаштабировании
    MoveToPrice(price:number)                   {this.data?.GraphMoveTo({price:{target:price},repeat:this._frameRepeat.data});}

    //перемотать к цене/времени - по цене работает только при отключенном автомаштабировании
    MoveToTimePrice(time:number,price:number)   {this.data?.GraphMoveTo({time:{target:time},price:{target:price},repeat:this._frameRepeat.data});}

    //анимация при перемотке не обязательный параметр количества кадров.....
    AnimationForMoveOn(frameRepeat?:number)     {
        this._frameRepeat.data= frameRepeat ?? this._frameRepeat.default;
    }

    //выключить анимацию, чтобы происходила перемотка за 1 кадр
    AnimationForMoveOff()                           {this.AnimationForMoveOn(1);}

    //вернуть количество кадров при перемотке если 1 кадр то перемотка мгновенная
    AnimationForMoveGetFrameRepeat():number         {return this._frameRepeat.data;}

    //авто высота
    set AutoHeight(flag :boolean) { this.SetOther({autoSizeGraph:flag}); }

    get AutoHeight() { return this.GetOther()?.autoSizeGraph ?? false; }


    GetCoordinate()                                 {return this.data?.GetCoordinate()}

    //нижняя полоска времени
    //включить выключить
    //размер текущий
    //изменить размер
    //положение сверху снизу
    //стили

    //стили
    //стиль рисования бары линии свечи


    SetWaterSymbol3(func:(() => string)| undefined)     {if (this.data) this.data.textForWaterSymbol = func;}

    SetStyleGraph(styleBar:tStyleBarM)                  {this.SetOther({styleBar:styleBar});}
    GetStyleGraph():tStyleBarM                          {return this.GetOther().styleBar as tStyleBarM}


    SetOther(styleGraph:tStyleAndSettingGraph)          {this.data?.SetOther(styleGraph);}
    GetOther()                                          {return this.data?.GetOther()}

    SetStyleGraphByBar()                                {this.SetStyleGraph("bar");}
    SetStyleGraphByLine()                               {this.SetStyleGraph("line");}
    SetStyleGraphByCandle()                             {this.SetStyleGraph("candle");}


    SetColors(data:tSets)                               {this.data?.SetColors(data);}
    GetColors():tSets                                   {return this.data?.GetColors();}

    //шрифты
    //полоска цены с права размер
    //водяной символа цвет шрифт
    //крестик цвет, толщина
    //цвет свечи вверх обводка
    //цвет свечи вниз обводка
    //цвет свечи вверх заполнения
    //цвет свечи вниз заполнения
    //цвет бара вверх
    //цвет бара вниз
    //цвет линии

    //задать цвет определенному бару
    //_SetBarColor(bar:any) {}

    //конвектор перевода времени в номер бара
    TimeToBar(time :number|const_Date):number           {return this.data?.TimeToBar(time.valueOf()); }
    //конвектор перевода бара во время
    BarToTime(bar:number):number|undefined              {return this.data?.symbolData?.history?.time(bar)?.valueOf();}
    //конвектор перевода бара во время
    BarToDate(bar:number):const_Date|undefined          {return this.data?.symbolData?.history?.time(bar);}

    //включить режим тестирования, выключает авто подкачку котировок, нужен для имитации своей истории
    ModeTest(test:boolean)                              {this.data?.SetModeTest(test);}

    //принудительно перерисовать график
    Draw()                                              {this.data?.MouseTarget(true);}

    //удаляет текущий график, не удаляет общий блок canvas
    Delete()                                            {this.data?.Delete();}

    //обновить размер блока
    SizeRefresh()                                       {this.data?.checkCanvasSize();}
}


export class CCanvas implements interfaceCanvasAPI{
    //div, где расположен график
    protected common:canvasAPI=new canvasAPI()

    get location()              {return this.common.location}
    _divParents:HTMLDivElement|undefined;
    protected totalGraph:number=0;
    //устанавливает див для canvas
    defaultStyle :tSets | null | undefined = null
    constructor({div,style}: { div?: HTMLDivElement, style?:tSets }) {
        if (div) this.Init(div);
        this.defaultStyle = style;
    }


    Init(div:HTMLDivElement)                                            {
        if (this._divParents!=div && div) {
            this._divParents=div;
            this.common.Init(div);
            div.style.cursor = "none";
        }
    };
    Init3D(div:HTMLDivElement)                                            {
        if (this._divParents!=div && div) {
            this._divParents=div;
            this.common.Init(div);
        }
    };

    //добавляет график
    AddGraphLvl(data?:tInfoInit, location?: tGraphDiv, node?: CDivNode):interfaceGraphAPI|undefined                         {
        const buf = this.common.GraphicAddLevl(location,node);
        if (!buf) {
            console.log("смотри ошибку выше");
            return undefined;
        }
        const a = new CGraphBaseAPI(buf);
        a.SetColors(this.defaultStyle??{})
        return a
    }
    //добавляет график
    AddGraph(data?:tInfoInit, location?: tGraphDiv, node?: CDivNode):interfaceGraphAPI|undefined                         {
        const buf = this.common.GraphicAdd(location, node);
        if (!buf) {
            console.log("смотри ошибку выше");
            return undefined;
        }
        const a = new CGraphBaseAPI(buf);
        a.SetColors(this.defaultStyle??{})
        return a
    }

    AddGraph3D(data?:tInfoInit):interfaceGraphAPI|undefined                         {
        const buf = this.common.Graphic3DAdd(data);
        if (!buf) {
            console.log("смотри ошибку выше");
            return undefined;
        }
        return  new CGraphBaseAPI(buf);
    }

    //полное удаление canvas
    Delete()                                                            {this.common.DeInit();}
    //обновить размер всех подокон графика
    RefreshSize()                                                       {this.common.ChekRefreshSize();}

    ReSizeAndDraw(){this.location.node?.GetFunkAll(e=>{e.graph?.checkCanvasSize(); e.graph?.MouseTarget()})}

    //установить метод закачки котировок

    //установить метод закачки котировок по определенным группам символов

    //установить метод потока тиков

    //установить метод потока тиков по определенным группам символов
}


export class mouseAPI implements interfaceMouseAPI{

    //  valueOf():CGraphBaseAPI                                 {return this.active;}
    //Получить активный график
    get active():CGraphBaseAPI|undefined                    {
        const buf = mouseG.getGraph()
        return buf ? new CGraphBaseAPI(buf) : undefined;
    }
    //Установить график активным, при установке выдавать список событий Callback
    set active(graph:CGraphBaseAPI|undefined)               {
        console.log("set active", graph)
        if (graph) mouseG.setGraph(graph._data);}
    //установить событие при выборе графика активным

    SetByBox(box: CSystemBox){
        mouseG.getGraph()?.box.SetBox(box);
        this.OnEventGraph()
    }

   // AddCallbackOnSelect(callback:()=>void)                  { mouseG.addEventGraph(callback)}
    AddCallbackOnSelect2(callback:tListEvent)               { mouseG.addEventGraph(callback)}
    logsEvent()                                             { mouseG.logsEvent()}
    OnEventGraph()                                          {this.active=this.active}
}

export interface ICanvasApi extends tBaseLocation{
    _mouseMenu: boolean;
    _panelMenu: boolean;
    ChekRefreshSize(): void
    DeInit(): void
    // GraphAddAnyDiv(divEl:HTMLDivElement, symbol?: string, tf?:TF): CGraphCanvas
    GraphicAddLevl(location?: tGraphDiv): tGraph|undefined
    GraphicAdd(location?: tGraphDiv, node?: CDivNode): tGraph|undefined
    Init(par: HTMLDivElement ): void
    MenuMouse(a: boolean): void
    Remove(): void
}

function  creatEl(par:HTMLDivElement,tagName:string,h?:string,w?:string,y?:string,x?:string){
    let buf=CreateDom.createElement(tagName);
    console.log("buf", buf)
    buf.style.position='absolute';
    if (!w) buf.style.width='100%'; else buf.style.width=w;
    if (!h) buf.style.height='100%'; else buf.style.height=h;
    if (x)  buf.style.left=x;
    if (y)  buf.style.top=y;
    par.appendChild(buf);
    return buf;
}



export class canvasAPI implements ICanvasApi{

    //расположение узлов и текущего и наследуемого дива
    location :tGraphDiv = {div:undefined,node:undefined,parDiv:undefined};

    _mouseMenu:boolean=true;
    _panelMenu:boolean=true;

    // Возвращает апи графика на который последний раз нажали кнопку, сделали активным
    static get activated(){return new mouseAPI;}

    Init(parDiv:HTMLDivElement){
        const {location} = this
        parDiv.style.position='relative';

        location.div=           creatEl(parDiv,'div') as HTMLDivElement;
        location.parDiv=        parDiv;
        location.node=          new CDivNode();

        const {node}=           location
        node.location=          location;

        node.height=            ()=>parDiv.getBoundingClientRect().height;
        node.width=             ()=>parDiv.getBoundingClientRect().width;
        node.x=                 ()=>0;
        node.y=                 ()=>0;
        node.CheckResizeBlock();
        //  setInterval(()=>{node.CheckResizeBlock();},100);

       if (document) Event(parDiv,node,undefined);
    }//создание самого окна заключается в том чт омы внутри дива создаем собственный див с которым работаем

    Remove()    {this.DeInit();}
    DeInit() {
        //вроде пока что не удалям созданный див
        const {location} = this
        location.node?.AllDelFullReliz();
        location.node=undefined;
    }

    MenuMouse(a:boolean) {
        this._mouseMenu=a;
    }                                                   //Активация/деактивация, стандартного меню мышки по графику

    ChekRefreshSize(){
        const {location} = this
        if (this.location.div?.style.display!="none") location.node?.CheckResizeBlock();
    }

    GraphicAddLevl(location?: tGraphDiv, node?: CDivNode):tGraph|undefined {
        node??= this.location.node
        if (!node) {console.log("не установлен див для графика"); return undefined;}
        const nodeForGraph=     new CDivNode();
        node.gettop(nodeForGraph,false,false);
        const buf=    new CDivNode();
        nodeForGraph.getother(buf,false,false);

        const graph1=new CGraphCanvas(this.location,buf, buf);
        const buf2 = node;
        nodeForGraph.height=()=> ((buf2?.height()??1)/ (nodeForGraph.node?.count??1 ))- nodeForGraph._h();

        node?.GetFunkAll(e=>e?.graph?.checkCanvasSize());
        return graph1;
    }

    //Создает еще один график, возвращает handle графика
    GraphicAdd(location?: tGraphDiv, node?: CDivNode):tGraph|undefined {
        node??= this.location.node
        if (!node) {console.log("не установлен див для графика"); return undefined;}
        const nodeForGraph = new CDivNode();
        node.getleft(nodeForGraph, false, false);
        const buf = new CDivNode();
        nodeForGraph.getother(buf,false,false);
        const graph1 = new CGraphCanvas(this.location,buf, buf);
        const buf2 = node;
        nodeForGraph.width=()=> ((buf2?.width()??1)/ (nodeForGraph.node?.count??1 ))- nodeForGraph._w();

        node?.GetFunkAll(e=>e?.graph?.checkCanvasSize());

        return graph1;
    }

    Graphic3DAdd(data?:tInfoInit):tGraph|any|undefined {
        const {node} = this.location
        if (!node) {console.log("не установлен див для графика"); return undefined;}
        const nodeForGraph=     new CDivNode();
        const buf=    new CDivNode();
        node.getleft(nodeForGraph,false,false);
        nodeForGraph.getother(buf,false,false);

        console.log(buf.height(),buf.width());
        const graph1 = new CGraphCanvas3D(this.location,
            // {x:buf.x,y:buf.y,height:buf.height,width:buf.width}
            buf
        );
        // TODO: !!! Временно сделал приведение канваса 3D к 2D, т.к. убрал тип 3D для удобства
        buf.graph= graph1 as unknown as CGraphCanvas;

        console.log(buf.height(),buf.width());

        nodeForGraph.CheckResizeBlock();
        if (node.base.left) {
            for (let i=node.base.left.Next(); i && i.data; i=i.Next()) {
                i.data.width=()=>{return node.width()*1.0/nodeForGraph.node!.count;} //устанавливает размер всех окон заново
            }
        }
        const initParam=(param:tInfoInit)=> {
            graph1.SetInfo(param);
            mouseG.setGraph(graph1)
        }

        //инициализация параметров символ имя там
        if (data) {initParam(data);}
        else SymbolsLoading.ready().then((param)=>{if (param) initParam(param)});

        //установка объекта по умолчанию на мышку
        return graph1 ;
    }
    //возвращает активированный класс самого индикатора
}// Описание всех методов
