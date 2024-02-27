import * as Gconst from "./const"
import {CMouse, mouseG} from './cmouse';
import {CListNode} from './listNode';

// @ts-ignore
import {OffscreenCanvasRenderingContext2D} from "@types/offscreencanvas"
import {CCanvasBase, CGraphCanvas, CWinCC} from "./canvas2d/Canvas2D";
import {CGraphCanvas3D} from "./Canvas3D";
import {const_Date, IBars} from "../Nav/Bars";
import {CIndicatorsAND} from "./indicatorBaseClass/indicatorAND";
import {tLoadBar, tSetTicks} from "./interface/IHistoryBase";
import {tInfoInit} from "./history/historyBase";
import {CSystemBox, ICSystemBox} from "./sytemBox";
import {CSymbolData, tOnBars} from "./Symbol";
import {tTick} from "./interface/mini";
import {tSets, tStyleAndSettingGraph} from "./canvas2d/Canvas2dStyle";

export * from "./history/historyBase";
export * from "../history/history demo";
//const CListNode = require('./listNode');



export type CanvasContext2D = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;


//
// interface ISetColorBase extends tSetColorBase {
//     switcher?:boolean;
//     name?:string,
//     value?:string,
//     color?:string,
//     min?:string,
//     max?:string,
//     step?:string
// }
//
// class CSetColorBase implements ISetColorBase{
//
// }



type typeMoveBase={target:number; speed?:number;};

export type LinkTo = "mouse"|"left"|"middle"|"right";

export type typeMoveTo={bar?:typeMoveBase; time?:typeMoveBase; price?:typeMoveBase; repeat:number; linkTo? :LinkTo};

function windowToCanvas(canvas:Element, x:number, y:number) {
    let bbox = canvas.getBoundingClientRect();
    return { x: x - bbox.left, y: y - bbox.top};
}


export interface ICContXY {
    //позиция у блока по Х в пикселях отгосительно текущего узла(графика)
    x:()=>number;
    //позиция у блока по Н в пикселях отгосительно текущего узла(графика)
    y:()=>number;
    //позиция у блока по высоте в пикселях отгосительно текущего узла(графика)
    width:()=>number;
    //позиция у блока по ширине в пикселях отгосительно текущего узла(графика)
    height:()=>number;
    //позиция у блока по высоте в пикселях отгосительно базовго дива канваса в котром он находиться
    heightAbsolute?:()=>number;
    //позиция у блока по ширине в пикселях отгосительно базовго дива канваса в котром он находиться
    widthAbsolute?:()=>number;
}

interface ICContOther {
    parents:CDivNode|undefined;
    node:CListNode<tNodeG>|undefined; //текущий узел (текщуего класа) в вышестоящей связи
    //переменные
    //позиция у блока по Х в пикселях отгосительно текущего узла(графика)
    //Проверяет фокус мышки на блоке
    focusBool:(mouse:{x:number,y:number})=>boolean;
}


export class CContXY implements ICContXY,ICContOther{
    parents:CDivNode|undefined=undefined;
    node:CListNode<tNodeG>|undefined; //текущий узел (текщуего класа) в вышестоящей связи
    //корректировка по высоте
    _h:()=>number=              ()=> 0
    //корректировка по ширине
    _w:()=>number=              ()=> 0
     // protected __x(){return this.node?.dataPrev?.y() ?? this.parents?.y() ?? 0;}
     // protected __y(){return this.node?.dataPrev?.y() ?? this.parents?.y() ?? 0;}
    //переменные
    //позиция у блока по Х в пикселях относительно текущего узла(графика)
    x:()=>number=               ()=>this.node?.dataPrev?.x() ?? this.parents?.x() ?? 0;
    //позиция у блока по Н в пикселях относительно текущего узла(графика)
    y:()=>number=               ()=>this.node?.dataPrev?.y() ?? this.parents?.y() ?? 0;


    //позиция у блока по высоте в пикселях относительно текущего узла(графика)
    height:()=>number=          ()=>this.node?.dataPrev?.height() ?? this.parents?.height() ?? this._h()
    //позиция у блока по ширине в пикселях относительно текущего узла(графика)
    width:()=>number =          ()=>this.node?.dataPrev?.width() ?? this.parents?.width() ??  this._w()
    //позиция у блока по высоте в пикселях относительно базово дива канваса в котором он находиться
    heightAbsolute:()=>number=  ()=>this.y()+this.height()
    //позиция у блока по ширине в пикселях относительно базово дива канваса в котором он находиться
    widthAbsolute:()=>number=   ()=>this.x()+this.width()
    //Проверяет фокус мышки на блоке
    focusBool:(mouse:{x:number,y:number})=>boolean=({x,y}:{x:number,y:number})=>{
        return x>this.x() && x<this.widthAbsolute() && y>this.y() && y<this.heightAbsolute();
    };
}//описание расчета x y height width

class CPositionNum{
    x: number= 0;
    y: number= 0;
    w: number= 0;
    h: number= 0;
}

export type tNodeG= CDivNode & tBaseLocation;
export type tGraph= CGraphCanvas;//|CGraphCanvas3D// |CBlockCIndi;
export type tMouse= CMouse;

// своя вресия виртуальных усзлов, чтобы опставить несколько кгрфиков на один экран
export type tGraphDiv = {
    parDiv: HTMLDivElement|undefined,
    div: HTMLDivElement|undefined,
    //главный узел
    node?:CDivNode|undefined,
}

export type tBaseLocation = {
    //
    location :tGraphDiv|undefined;
}


interface ICDivNode extends ICContXY ,tBaseLocation{
    //Проверка размеров окна в пикселях у канваса относительно дива в которое он вложе
    _last:{height:number,width:number};
    CheckResizeBlock():void

}


export type tDivNode={
    top?:CListNode<tNodeG>|undefined;//=   new CListNode<tNodeG>();
    down?:CListNode<tNodeG>|undefined;//=  new CListNode<tNodeG>();
    right?:CListNode<tNodeG>|undefined;//= new CListNode<tNodeG>();
    left?:CListNode<tNodeG>|undefined;//=  new CListNode<tNodeG>();
    fly?:CListNode<tNodeG>|undefined;//=   new CListNode<tNodeG>();//free windows or other
    other?:CListNode<tNodeG>|undefined;//= new CListNode<tNodeG>();//free windows or other
}

export interface ICDivFuncMove {

    OnTouchmove(e:tMouse):void;
    OnTouchstart(e:tMouse):void;
    OnTouchend(e:tMouse):void;

    OnMouseDown(e: tMouse): void;
    OnMouseMove(e: tMouse, resource?: object): void;
    OnMouseWheel(e: tMouse): void;
    OnMouseFinal(e: tMouse): void;
    OnMouseOver(e?: tMouse): void;
}

export interface ICDivFunc extends ICDivFuncMove{
    Delete():void;
    InitCanvas(location:tGraphDiv, cor:ICContXY):void;
    InitStyle():void;
    checkCanvasSize():void;
    DrawNow(canvas:CanvasContext2D):void;
}

type CGraphCanvas3D_= {[key in keyof CGraphCanvas3D] : CGraphCanvas3D[key]};


export class CDivNode extends CContXY implements ICDivNode,ICDivFunc{
    static counter:number=0;
    id:number;
    constructor() {
        super();
        this.id=CDivNode.counter++;
        const {id} = this;
    }

    // graph : CGraphCanvas|CGraphCanvas3D|undefined
    graph : CGraphCanvas| undefined; // TODO: временно убрал тип Canvas3D, иначе поиск постоянно переходит на его методы
    location :tGraphDiv|undefined;

    //Проверка размеров окна в пикселях у канваса относительно дива в которое он вложе
    _last={height:0,width:0};

    CheckResizeBlock(){//это главный див
        let flag=false;
        if (this.location?.node && this.location.div){
            //console.time("resize");
            if (this._last.height!=this.location.node.height()) {
                flag=true;
                this._last.height = this.location.div.clientHeight;
            }
            if (this.location.node && this._last.width!=this.location.node.width()) {
                flag=true;
                this._last.width=this.location.div.clientWidth;
            }
            //console.timeEnd("resize");
            if (flag) {
                //console.time("resize2");
                let n=0;
                function OnResizeFunk(div:CDivNode) {
                    div.checkCanvasSize();  n++;
                    //if (div.MouseTarget) div.OnMouseOver(); else {div.DrawNow();}
                }
                this.location.node.GetFunkAll((div)=>OnResizeFunk(div));
                //console.timeLog("resize2", {n});
                //console.timeEnd("resize2");
            }
        }
    }

    //список блоков сверху
    base:tDivNode={}


    protected _lastP:CPositionNum=new CPositionNum();
    //удалит все внутри и себя
    AllDelFullReliz()        { this.GetFunkAll(div=>div.Delete());}
    //удалит все что ниже, себя не удалит
    AllDel()        {
        const to=(buf:CListNode<tNodeG>|undefined)=>{buf?.GetArray().forEach((e)=>e.GetFunkAll((div)=>div.Delete()))  }
        const {base:{fly,other,top,down,right,left}} = this;
        [top,down,left,right,other,fly].map(e=>to(e))
        this.base={}
    }
    AllDrawNow()    { this.GetFunkAll(div=>div.DrawNow());}

    DrawNow(canvas?:CanvasContext2D) {
        this.graph?.DrawNow?.(canvas);
    }

    logs(mouse:{x:number,y:number}={x:0,y:0}) {
        const {x,y,height,width,heightAbsolute,widthAbsolute,focusBool} = this
        let n:{[key:string]:object|number}={}
        for (let [key,data] of Object.entries(this.base)) n[key] = data?.GetArray().map(e=>e.logs(mouse))
        if (this.graph) n["graph"]={id:this.graph.location.node!.id, id2:this.graph.nodeForGraph!.id}
        return {
            id: this.id,
            coordinates: {
                x:x(),y:y(),height:height(),width:width(),heightAbsolute:heightAbsolute(),widthAbsolute:widthAbsolute(),focusBool:focusBool(mouse)
            }, ...n
        }
    }

    // AllRef()      { this.GetFunkAll(div=>div.Delete());}
    // удалает текущий блок из списка элементов узлов
    Delete(){
        this.graph?.Delete?.();
        this.node?.DeleteLink();
        CDivNode.counter--;
        this.node=undefined;
    }
    InitCanvas(location:tGraphDiv, cor:ICContXY){
        this.graph?.InitCanvas?.(location,cor);
        this.InitStyle();
    };
    InitStyle(){
        {if (this.graph?.InitStyle) this.graph.InitStyle();};
    };
    protected index=  Number();

    protected findFocusByType=(mouse:tMouse,type:CListNode<tNodeG>)=>{
        for (let next=type.Next(); next; ) {
            if (!next.data?.node) {let buf=next; next=next.Next(); buf.DeleteLink(); continue;}
            if (next.data.focusBool(mouse)) {return next;}
            next=next.Next();
        }
        return undefined;
    };//возвращает найденный элемент
    findFocus = (mouse : CMouse) => {
        const {fly,other,top,down,right,left} = this.base;
        for (const datum of [fly,other,top,down,right,left]) {
            if (datum) {const buf= this.findFocusByType(mouse,datum); if (buf) return buf;}
        }
        return undefined;
    };//возвращает найденный элемент
    private addToEnd(data:tNodeG, buf:CListNode<tNodeG>) {
        data.node =     buf.AddEnd(data);
        data.parents =  this;
        data.location = this.location;
    }
    private addToStart(data:tNodeG, buf:CListNode<tNodeG>) {
        data.node =     buf.AddStart(data);
        data.parents =  this;
        data.location = this.location;
    }

    gettop = (data:tNodeG, x=false, y=false)=>{
        this.addToEnd(data,this.base.top??= new CListNode<tNodeG>());
        if (!y) data.y=()=>     data.node?.dataPrev?.heightAbsolute() ?? data.parents?.y() ?? 0;
  //      if (!x) data.x=()=>     data.node?.dataPrev?.widthAbsolute() ?? data.parents?.x() ?? 0;
    };
    getdown = (data:tNodeG, x=false, y=false)=>{
        this.addToEnd(data,this.base.down??= new CListNode<tNodeG>());
        if (!y) data.y=()=>     (data.node?.dataPrev?.y() ?? data.parents?.heightAbsolute() ?? 0) -data.height();
    //    if (!x) data.x=()=>     data.node?.dataPrev?.widthAbsolute() ?? data.parents?.x() ?? 0;
     //   if (!x) data.x=this.__x
    };
    getleft = (data:tNodeG, x=false, y=false)=>{
        this.addToEnd(data,this.base.left??= new CListNode<tNodeG>());
     //   if (!y) data.y=this.__y
        if (!x)  data.x=()=>     data.node?.dataPrev?.widthAbsolute() ?? data.parents?.x() ?? 0;
    };
    getleftFirst = (data:tNodeG, x=false, y=false)=>{
        this.addToStart(data,this.base.left??= new CListNode<tNodeG>());
    //    if (!y) data.y=this.__y
        if (!x)         data.x=()=>     data.node?.dataPrev?.widthAbsolute() ?? data.parents?.x() ?? 0;
    };
    getright = (data:tNodeG, x=false, y=false)=>{
        this.addToEnd(data,this.base.right??= new CListNode<tNodeG>());
        if (!x)         data.x=()=>     (data.node?.dataPrev?.x() ?? data.parents?.widthAbsolute() ?? 0)-data.width();
    //    if (!y) data.y=this.__y
    //    if (!y)         data.y=()=>     data.node?.isPrev()? data.node.Prev()!.data!.y()                   : data.parents.y();
    };
    getother = (data:tNodeG, x=false, y=false, w=false, h=false)=>{
        this.addToEnd(data,this.base.other??= new CListNode<tNodeG>());
        if (!y) data.y=()=>             data.parents?.base.top?.dataPrev?.heightAbsolute() ?? this?.y() ?? 0;
        if (!x) data.x=()=>             data.parents?.base.left?.dataPrev?.widthAbsolute() ?? this?.x() ?? 0;
        if (!h) data.height=()=>        {
    //        console.log({getother:this});
            return (data.parents?.base.down?.dataPrev?.y() ?? this?.heightAbsolute() ?? 0) - data.y()
        }
        if (!w) data.width=()=>         (data.parents?.base.right?.dataPrev?.x() ?? this?.widthAbsolute() ?? 0) - data.x()
    };
    getfly = (data:tNodeG,x=false,y=false)=>{
        this.addToEnd(data,this.base.fly??= new CListNode<tNodeG>());

        // if (!x)         data.x=this.__x
        // if (!y)         data.y=this.__y
        // if (!x)         data.x=()=>     data.node?.Prev()?.data?.x()  ?? data.parents.x();
        // if (!y)         data.y=()=>     data.node?.Prev()?.data?.x()  ?? data.parents.y();
    };

    //визуальный эфект от наведения нажатия либо перемещения
    mouseEfect=(e:tMouse)=>{};
    needveew=true;

    GetFunkAll(funk?:(div:CDivNode)=>void) {
        funk?.(this);
        const to=(buf:CListNode<tNodeG>|undefined)=>{buf?.GetArray().forEach((e)=>e.GetFunkAll(funk))  }
        const {base:{fly,other,top,down,right,left}} = this;
        [top,down,left,right,other,fly].map(e=>to(e))
    }//Вызывает данную функцию у всей подветки
    _drowFrame:boolean=true; //нарисовать рамку по умолчанию включено

    checkCanvasSize() {
        this.graph?.checkCanvasSize?.()
    }
    OnTouchmove(e:tMouse) {
        this.graph?.OnTouchmove?.(e)
    }
    OnTouchstart(e:tMouse){
        this.graph?.OnTouchstart?.(e)
    }
    OnTouchend(e:tMouse){
        this.graph?.OnTouchend?.(e)
    }
    static needToRef:boolean=false;

    ByBlockReSize(){

    }

    OnMouseDown(e:tMouse){
        const {base} = this;
        this.graph?.OnMouseDown?.(e);
        if (e.e.buttons==Gconst.CLICKLEFT){
            let minpix=15;//минимальнео растоянеи для активации
            let othercount= base.other?.countRef();
            let next:CListNode<tNodeG>|undefined;
            let flag:boolean=false;



            const mainV = (el :  CListNode<tNodeG>, top=true)=>{
                if (mouseG.e.buttons!=Gconst.CLICKLEFT || !this.focusBool(mouseG)) return -1;
                const result=el.data!._h()+mouseG.dy*(top?1:-1);
                el.data!._h= ()=>result;

                const next = el.dataNext
                if (next) {
                    const result2= next._h()-mouseG.dy*(top?1:-1);
                    next._h= ()=>result2
                }

                this.GetFunkAll(e=>e.graph?.checkCanvasSize())
                this.AllDrawNow();
            }

            const mainH = (el :  CListNode<tNodeG>,left=true)=>{
                if (mouseG.e.buttons!=Gconst.CLICKLEFT || !this.focusBool(mouseG)) return -1;
                const result = el.data!._w()+mouseG.dx*(left?1:-1);
                el.data!._w= ()=>result;

                const next = el.dataNext
                if (next) {
                    const result2= next._w()-mouseG.dx*(left?1:-1);
                    next._w= ()=>result2
                }
                this.GetFunkAll(e=>e.graph?.checkCanvasSize())
                this.AllDrawNow();
            }

            const dFunc = (f:(el :  CListNode<tNodeG>, t:boolean)=>undefined|number, el: CListNode<tNodeG>, t:boolean=true) => {
                flag=true;
                if (e.e.buttons==Gconst.CLICKLEFT) {
                    const buffer = el;
                    mouseG.setListEvent(()=>f(buffer,t));
                }
            }

            if (base.top?.count)
                for (next=base.top.Next(); next && next.data && (othercount || next.Next()); next=next.Next()){
                    const cor=next.data.heightAbsolute();
                    if (cor+minpix>e.y && cor-minpix<e.y) dFunc(mainV,next)
                }
            if (base.down?.count)
                for (next=base.down.Next(); next && (othercount || next.Next()); next=next.Next()){
                    const cor=next.data!.y();
                    if (cor+minpix>e.y && cor-minpix<e.y) dFunc(mainV,next, false)
                }
            if (base.left?.count)
                for (next=base.left.Next(); next && (othercount || next.Next()); next=next.Next()){
                    const cor=next.data!.widthAbsolute();
                    if (cor+minpix>e.x && cor-minpix<e.x) dFunc(mainH,next)
                }
            if (base.right?.count)
                for (next=base.right.Next(); next && (othercount || next.Next()); next=next.Next()){
                    const cor=next.data!.x();
                    if (cor+minpix>e.x && cor-minpix<e.x) dFunc(mainH,next, false)
                }


         //   if (flag) {CDivNode.needToRef=flag; this.AllDrawNow();}
            if (base.fly?.countRef()){

            }
        }
    };
    OnMouseMove(e:tMouse){
        const {base} = this;
        this.graph?.OnMouseMove?.(e);
        let minpix=5;//минимальнео растоянеи для активации
        let othercount= base.other?.countRef();
        let next:CListNode<tNodeG>|undefined;
        let flag:boolean=false;
        if (base.top?.count){
            for (next=base.top.Next(); next && (othercount || next.Next()); next=next.Next()){
                let cor=next.data!.heightAbsolute();
                if (cor+minpix>e.y && cor-minpix<e.y){

                    flag=true;
                }
            }
        }
        if (base.down?.count){
            for (next=base.down.Next(); next && (othercount || next.Next()); next=next.Next()){
                let cor=next.data!.y();
                if (cor+minpix>e.y && cor-minpix<e.y){
                    flag=true;
                }
            }

        }
        if (base.left?.count){
            for (next=base.left.Next(); next && (othercount || next.Next()); next=next.Next()){
                let cor=next.data!.widthAbsolute();
                if (cor+minpix>e.x && cor-minpix<e.x){
                    flag=true;
                }
            }
        }
        if (base.right?.count){
            for (next=base.right.Next(); next && (othercount || next.Next()); next=next.Next()){
                let cor=next.data!.x();
                if (cor+minpix>e.x && cor-minpix<e.x){
                    flag=true;
                }
            }
        }

        if (flag==true) CDivNode.needToRef=flag;
        if (base.fly?.count){

        }
    };
    OnMouseWheel(e:tMouse){
        this.graph?.OnMouseWheel?.(e);
    };
    OnMouseFinal(e:tMouse){
        this.graph?.OnMouseFinal?.(e);};
    OnMouseOver(e:tMouse){
        this.graph?.OnMouseOver?.(e);};
    protected enumresizeobj=Gconst.CDIVRESIZE_DEFAULT;// разрешение на изменение обьекта мышкой
    //0 запрет, 1 можно только по умолчанию, 2 можно как угодно в пределах родительского дива(только для правого края или для низа (т.е. изменяеться параметр ширина высота))

    // mouseFocus=(e:tMouse)=>{
    //     {if (this.graph?.mouseFocus) this.graph.mouseFocus(e);};};
    // protected mouseDown=(e:tMouse)=>{
    //     {if (this.graph?.mouseDown) this.graph.mouseDown(e);}};
    // protected mouseMove=(e:tMouse)=>{
    //     {if (this.graph?.mouseMove) this.graph.mouseMove(e);}};
}//Это типо див, контейнер с возможностью стандартного размещения внутрь, он же являеться узлом в которм хранитсья ссылка на родительский клас

class CGraf extends CDivNode{
    //сохраняем позицию мышки размер экрана самый левый и самый правый бар и прочее

    /* CreateHistoryRandom(){
         let data=new CCBarsBase;
         let a=this._history;

         data.AddRandm(1000,1578164225000,216000000);
         for (let i=0; i<10000; i++){
             a.Get(data);
             let z=a.i-1;
             data.AddRandm(a[z].close,a[z].time);
         }
     };*/
}


export class CBlockCZ2 extends CDivNode{  //в паланах сделаь это базовым классом по обработке данных под канвас - но пока что так  //canvas;     element;           //для обработки - ссылка на канвас с которым работаем и его окружение(статична)

}

export type typeColor={color:string}
export type typeLine="line"|"dash";
export type typePoz="UP"|"LEFT"|"DOWN"|"RIGHT";
export type typeFont={font:string, size:number} &typeColor;
export type typeColorLine ={width?:number, styleLine?:typeLine} &typeColor;
export type typeCoordinates ={x:number,y:number}


export type typeGraphStyle={
    background?:typeColor,
    grid?:typeColor,
    font?:typeFont,
    fontPrice?:typeFont,
    waterSymbol?:typeFont &{pix:typeCoordinates, percent:typeCoordinates}&typePoz,
}

export class CGraphStyle{

}



export interface ICWinGraph {
    size: { x: number, y: number, width: number, height: number };
    cor: ICContXY;
    work3d: object;
    fon: object|undefined;
    Remove() : void
    Refresh(): boolean
}

export interface ICWinGraph2D extends ICWinGraph{
    work3d: CCanvasBase;
    fon: CCanvasBase;
}

export interface ICWinGraph3D extends ICWinGraph{
    work3d: object;
    fon: undefined;
}


export interface ICHistoryAndLoadGraph {
    historyBars: IBars | undefined;
    readonly cwin: CWinCC;
    readonly box: CSystemBox

    loadBars: Promise<void> | null
    _checkAndLoadBars2(time2:Date) :void

    //докачка графика с лево BarsLoad - количество закачиваемых баров, stepBarForLoad - шаг при котором наступает загрузка
    _checkAndLoadBars(BarsLoad:number, stepBarForLoad :number) :void
    //перевод времени в бары, принимает значения valueOf
    TimeToBar(time: number): number

    OnBars() :void
    OnHistory(history: IBars, type: tLoadBar) :void
    OnTicks(ticks: { ticks: tTick[] }) :void
    OnSetSymbol(data: tInfoInit) :void
}

export interface IICGraphCanvas  extends ICDivFunc {
    InitStyle():void
    location: tGraphDiv;
    _cwin: CWinCC;
    nodeForGraph : CDivNode;    //Текущий узел графика разметки рабочей области

    GetCoordinate(): CWinCC
    SetColors(data: tSets):void
    GetColors(): tSets

    //  protected display: CWinGraph;
    display: ICWinGraph2D|ICWinGraph3D;
    // Список ведомых экранов
    displayOther: CListNode<object> |undefined

    InitCanvas(location: tGraphDiv, cor: ICContXY) :void
    Delete():void// удалает себя из списка элементов узлов кроме бокса
    DeleteFull():void// удалает себя из списка элементов узлов
    InitGraph() : void


    //ОБновить график, принудительно перерисовать включая все под индикаторы
    MouseTarget(ref?: boolean) : void//тут пока зачем то рисование всего графика пресутвует - по условию

    checkCanvasSize() : void
    DrawNow(canvas: object) : void
    DrawClean(canvas: object) :void

    //хранит поставку котировок, котировки с индикаторами и сам рапределяет тики между индикаторами
    //полностью самодостаточный компонент для получение сигналов
    readonly box :ICSystemBox
    //обертка для истории, для 2д холста - чтобы создать промежуточные массивы для конвертация времени в бар и прочее
    //закачка котировок при пдвижении экрана в лево
    historyL: ICHistoryAndLoadGraph
    //может быть undefined пока идет процес загрузки списка символов
    get symbolData(): CSymbolData | undefined
    get _indicators(): CIndicatorsAND | undefined
    get indicators() : CIndicatorsAND | undefined
    GetIndicatorsClass() : CIndicatorsAND | undefined
    get _history(): IBars | undefined

    OnBars(data:tOnBars): void
    OnHistory(history: IBars, type: tLoadBar): void
    OnTicks(data: tSetTicks): void
    OnSetSymbol(data: tInfoInit) : void



    TimeToBar (time: number): number

    //точность знаков после запятой при вереводе в строку
    toFixed(x: number | undefined, b?: number): string

    //Устанавливает режим Тестер, позволяет работать со своей историей, отключает стандартную функцию онлайн покдкачки котировок для того чтобы работать эмитацией теста
    SetModeTest(flag: boolean) : void
    TestMode() : void

    //для установки символа таймфрейма и прочее
    //для установки стилей отрисовки, еще есть для устновки цветовой гаммы
    SetInfo(info: tInfoInit) :Promise<void>
    SetOther(styleGraph: tStyleAndSettingGraph) : void
    GetOther():tStyleAndSettingGraph
    GetStyleAndSettingGraph():tStyleAndSettingGraph
    SetStyleAndSettingGraph(styleGraph: tStyleAndSettingGraph) : void
    defaultColor : object;

    readonly replaymoveefectDefolt :number;

    BarToPix(dBar: number) : number;
    TimeToPix(dTime: number) : number
    PriceToPix(dPrice: number) : number

    // moveData:
    GraphMoveTo(data: typeMoveTo) : void
    MoveTo(time: Date | const_Date) : void
    //ОБновить график, принудительно перерисовать включая все под индикаторы
    Refresh() : void


    //Обновиться мышку
    mouseDelta(e: tMouse) : void

    //Наведена ли мышка на ценовую панэль
    MouseOnPricePanel() :boolean
    OnMouseMoveByPrice(e: tMouse, resource?:object) :boolean


    OnClick(e: MouseEvent) : void
    OnKeyDown(e: KeyboardEvent) : void
    OnTouchmove(e: tMouse) : void
    OnTouchstart(e: tMouse) : void
    OnTouchend(e: tMouse): void
    OnMouseDown(e: tMouse) : void
    OnMouseMove(e: tMouse, resource?:object) : void
    OnMouseWheel(e: tMouse) : void
    OnMouseFinal(e: tMouse) : void
    OnMouseOver(e?: tMouse) : void
    OnMouseUp(e: tMouse) : void

}





export * from "./interface/IHistoryBase";
