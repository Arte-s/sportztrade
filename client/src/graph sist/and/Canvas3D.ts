import * as Gconst from "./const";
import {CLine, ColorString, ILine, Point} from "./const";
import {const_Date, IBars, TF} from "../Nav/Bars";
import {tLoadBar, tSetTicks} from "./interface/IHistoryBase";
import {tInfoInit} from "./history/historyBase";
import {CSystemBox} from "./sytemBox";
import {CSymbolData, tSymbolCallback2} from "./Symbol";
import {CIndicatorAND, CIndicatorsAND} from "./indicatorBaseClass/indicatorAND";
import {CanvasContext2D, ICDivFunc, ICContXY, tGraph, tGraphDiv, tMouse, typeMoveTo, CDivNode} from "./vgraf3";
import {tListEvent, tTick} from "./interface/mini";
import * as BABYLON from 'babylonjs';
import {CColor} from "./color";
//
// import { TrackballControls } from 'three/jsm/controls/TrackballControls.js';
// import * as BufferGeometryUtils from './jsm/utils/BufferGeometryUtils.js';



//let a= BufferGeometryUtils;


class CC3D {


}





class CScaleX {
    scale: number = 16;
    minBar: number = 0;
    _pixmin: number = 0;
    get pixmin(): number {
        return this._pixmin
    }

    set pixmin(pix: number) {
        if (pix == undefined) console.error(pix);
        this._pixmin = pix;
    }

    maxBar: number = 0;
    pixmax: number = 0;//растояние в пикселях с последнего бара с права до края экрана с права
    constructor() {
    }

    Save(a: CScaleX) {
        this.scale = a.scale;
        this.minBar = a.minBar;
        this.pixmin = a.pixmin;
        this.maxBar = a.maxBar;
        this.pixmax = a.pixmax;
    };

    Res() {
        this.scale = 0;
        this.minBar = 0;
        this.pixmin = 0;
        this.maxBar = 0;
        this.pixmax = 0;
    };
}

class CScaleY {
    size: number = 1;
    scale: number = 0;
    minprice: number = 0;
    pixmin: number = 0;
    maxprice: number = 0;
    pixmax: number = 0;

    Save(a: CScaleY) {
        this.size = a.size;
        this.scale = a.scale;
        this.minprice = a.minprice;
        this.pixmin = a.pixmin;
        this.maxprice = a.maxprice;
        this.pixmax = a.pixmax;
    };

    Res() {
        this.size = 0;
        this.scale = 0;
        this.minprice = 0;
        this.pixmin = 0;
        this.maxprice = 0;
        this.pixmax = 0;
    };
}

class CGprr {
    x = new CScaleX();
    y = new CScaleY();
    timeframe: number = 60;//min
    Res() {
        this.y.Res();
        this.x.Res();
        this.timeframe = 0;
    };
}

class CGprrGeneral extends CGprr {
    last = new CGprr();
    step = new CGprr();

    Save() {
        this.last.y.Save(this.y);
        this.last.x.Save(this.x);
        this.last.timeframe = this.timeframe;
    };
}


class CCanvasBase3D {//implements IGraphCanvas {

    // renderer: WebGLRenderer;
    element: HTMLCanvasElement;
 //   canvas: CanvasRenderingContext3D;
    cor: ICContXY;

    constructor(div: HTMLDivElement, cor: ICContXY) {
        // this.renderer = new THREE.WebGLRenderer();
        // this.renderer = canvas3d.InitCanvas(div).renderer;

      //  this.renderer.setSize( window.innerWidth, window.innerHeight );


        // div.appendChild( this.renderer.domElement );
        // this.element=this.renderer.domElement
        this.cor = cor;

        this.element = document.createElement('canvas');
        this.element.style.position = 'absolute';
        div.appendChild(this.element);
        // this.element.imageSmoothingEnabled=false;//сглаживание
       // const buf = this.element.getContext('3d') //as CanvasRenderingContext3D;
       // if (!buf) console.log("errrrror ну удалость создать холст канвас - по факту такое не возможно")
    //   this.canvas = buf
    }

    Init(pare: HTMLElement) {
        this.element = document.createElement('canvas');
        this.element.style.position = 'absolute';
        pare.appendChild(this.element);
        // this.element.imageSmoothingEnabled=false;//сглаживание
     //   this.canvas = this.element.getContext('3d') as CanvasRenderingContext3D;
    }

    Remove() {
        // this.canvas=null;
        this.element?.remove();
    }

    RefreshCoor() {
        if (this.element) {
            const {cor} = this;
            this.element.style.left = cor.x().toString() + 'px';
            this.element.style.top = cor.y().toString() + 'px';
        }
    }

    RefreshSize() {
        const {cor} = this;
        if (this.element) {
            this.element.width = cor.width();
            this.element.height = cor.height();
        }
     //   this.renderer.setSize( cor.width(), cor.height() );
    }

} //класс окна графика, все окна по умолчанию синхронны

class CWinGraph {
    size: { x: number, y: number, width: number, height: number };
    protected cor: ICContXY;

    constructor(div: HTMLDivElement, cor: ICContXY) {
  //      this.fon = new CCanvasBase3D(div, {...cor});
        const [widthD, heightD] = [60, 30];
        this.cor = {...cor};
        const buf = this.cor;
        this.size = {
            x: 0,
            y: 0,
            width: 0,
            height: 0,
        }

        this.work3d = new CCanvasBase3D(div, {
            ...buf,
            width: () => buf.width() - widthD,
            height: () => buf.height() - heightD
        });
        this.Refresh();
        //console.log(size.height());
    }

    work3d: CCanvasBase3D;
    //fon: CCanvasBase3D;

    Remove() {
        this.work3d.Remove();
     //   this.fon.Remove();
    }

    Refresh(): boolean {
        const {cor, size} = this;
        let flag = false;
        if (size.x != cor.x() || size.y != cor.y()) {
            size.x = cor.x();
            size.y = cor.y();
            this.work3d.RefreshCoor();
       //     this.fon.RefreshCoor();
            flag = true;
        }
        if (size.width != cor.width() || size.height != cor.height()) {
            size.width = cor.width();
            size.height = cor.height();
            this.work3d.RefreshSize();
         //   this.fon.RefreshSize();
            flag = true;
        }
        return flag;
    }

    protected RefreshCoor() {
        this.work3d.RefreshCoor();
     //   this.fon.RefreshCoor();
    }

    protected RefreshSize() {
        this.work3d.RefreshSize();
    //    this.fon.RefreshSize();
    }
} //класс окна графика, все окна по умолчанию синхронны



type tStyleBarM = "candle" | "bar" | "line"
type tStyleMouseM = "cross" | "off" | "crossMini"

interface tStyleAndSettingGraph {
    consoleHelper?: boolean;
    styleBar?: tStyleBarM;// 0 - candel  1 - bar 3 - line
    autoSizeGraph?: boolean;
    animation?: boolean;
    styleGrid?: number;
    styleMouse?: tStyleMouseM
}

interface tStyleAndSettingGraph2 extends tStyleAndSettingGraph {
    consoleHelper: boolean;
    styleBar: tStyleBarM;// 0 - candel  1 - bar 3 - line
    autoSizeGraph: boolean;
    animation: boolean;
    styleGrid: number;
    styleMouse: tStyleMouseM
}

class CStyleAndSettingGraph implements tStyleAndSettingGraph2 {
    //для написание геттеров и их реакции
    graph: object;

    constructor(graph: object) {
        this.graph = graph;
    }

    animation = false;
    autoSizeGraph = true;
    consoleHelper = false;
    styleBar: tStyleBarM = "candle";
    styleGrid = 3;
    styleMouse: tStyleMouseM = "cross";
}

type tSetColorBase = {
    switcher?: boolean;
    name?: string,
    value?: string,
    color: string,
    min?: string,
    max?: string,
    step?: string,
}
type tSets = {
    backgroundHtml?: tSetColorBase,
    backgroundCanvas?: tSetColorBase,
    textTable?: tSetColorBase,
    textWater?: tSetColorBase,
    textHL?: tSetColorBase,
    grid?: tSetColorBase,
    lineGraph?: tSetColorBase,
    barUp?: tSetColorBase,
    barDw?: tSetColorBase,
    mouseTarget?: tSetColorBase,
    textGrid?: tSetColorBase
}

interface ISetColors extends tSets {
}

interface ISetColors2 extends ISetColors {
    backgroundHtml: tSetColorBase,
    backgroundCanvas: tSetColorBase,
    textTable: tSetColorBase,
    textWater: tSetColorBase,
    textHL: tSetColorBase,
    grid: tSetColorBase,
    lineGraph: tSetColorBase,
    barUp: tSetColorBase,
    barDw: tSetColorBase,
    mouseTarget: tSetColorBase
    textGrid: tSetColorBase
}

class CSetColors implements ISetColors2 {
    constructor(data?: tSets) {
        return new Proxy<any>(this, { // (*)
            set(target, prop: string, val: tSetColorBase) { // для перехвата записи свойства
                Object.assign(target[prop] as tSetColorBase, val);
                return true;
            }
        })
    }

    backgroundHtml: tSetColorBase = {color: "#1d262c",};
    backgroundCanvas: tSetColorBase = {color: "#1d262c",};
    textGrid: tSetColorBase = {color: "#8d8e8e", switcher: true};
    mouseTarget: tSetColorBase = {color: "#8d8e8e", switcher: true};
    textWater: tSetColorBase = {color: "#28343b", switcher: true};
    textTable: tSetColorBase = {color: "#8d8e8e", switcher: true};
    textHL: tSetColorBase = {color: "#37474f", switcher: true};
    grid: tSetColorBase = {color: "#402119", switcher: true};
    lineGraph: tSetColorBase = {color: "#4072c1"};
    barUp: tSetColorBase = {color: "#4072c1"};
    barDw: tSetColorBase = {color: "#ef5350"};
}

//для загрузки котировок
class CHistoryAndLoadGraph3D {
    historyBars: IBars | undefined;
    //   readonly cwin: CWinCC;
    readonly box: CSystemBox

    constructor({ box}: {  box: CSystemBox }) {
        //    this.cwin = cwin;
        this.box = box;
    }

    loadBars: Promise<void> | null = null;

    _chekAndLoadBars2(time2 = new Date()) {
        const {symbolData, indicators} = this.box
        if (symbolData && symbolData.tf && this.historyBars?.lastTime)
            if (time2.valueOf() - symbolData.tf.valueOf() < this.historyBars.lastTime.valueOf()) return;

        if (!this.loadBars) {
            this.loadBars = new Promise(async (ok, c) => {
                try {
                    await symbolData?.loadHistory(time2, time2);
                    await indicators?.loadHistory(time2, time2);
                    this.loadBars = null;
                    ok();
                } catch (e) {
                    this.loadBars = null;
                }
            })
        }
    }

    //докачка графика с лево BarsLoad - количество закачиваемых баров, stepBarForLoad - шаг при котором наступает загрузка
    _chekAndLoadBars(BarsLoad = 900, stepBarForLoad = 500) {
        // if (this.cwin.win.x.minBar > BarsLoad) return;
        const {symbolData, indicators} = this.box
        if (!this.loadBars) {
            this.loadBars = new Promise(async (ok, c) => {
                try {
                    await symbolData?.loadHistory(BarsLoad)
                    if (symbolData && symbolData.history && symbolData.history.length > 0) await indicators?.loadHistory(symbolData.history[0].time as Date);
                    this.loadBars = null;
                    ok();
                } catch (e) {
                    this.loadBars = null;
                }
            })
        }
    }

    private _timeTo: tTimeTo = {nbars: [], step: 0, start: 0};

    private InitTimeToBar() {//инциализация масива для перевода - время в бары
        if (!this.historyBars) return;
        const t: tTimeTo = this._timeTo;
        t.start = this.historyBars.time(0).valueOf();
        t.step = this.historyBars.Tf.valueOf();
        let _t: number = t.start;
        t.nbars = [];
        t.nbars.length = 0;

        for (let i = 0; i < this.historyBars.count; i++) {
            for (; _t <= this.historyBars.time(i).valueOf(); _t += t.step) {
                t.nbars.push(i);
            }
        }
    }

    private LoadTimeToBar() {//догрузка индексатора времени в бары при появлении новых баров
        if (!this.historyBars) return;
        const t: tTimeTo = this._timeTo;
        if (t.nbars.length == 0) {
            this.InitTimeToBar();
            return;
        }
        let _t: number = t.nbars.length * t.step + t.start;
        for (let i = t.nbars[t.nbars.length - 1]; i < this.historyBars.count; i++) {
            for (; _t < this.historyBars.time(i).valueOf(); _t += t.step) {
                t.nbars.push(i);
            }
        }
    }

    //перевод времени в бары, принимает значения valueOf
    TimeToBar = (time: number): number => {
        time = Math.floor((time - this._timeTo.start) / this._timeTo.step);
        const bars: number[] = this._timeTo.nbars;
        if (time < 0) return time;
        if (time >= bars.length) return time - bars.length + (bars.length > 0 ? bars[bars.length - 1] : 0);
        return this._timeTo.nbars[time];
    }

    OnBars = () => {
        if (this.box.symbolData) this.historyBars = this.box.symbolData.history;
        this.LoadTimeToBar();
    }
    OnHistory = (history: IBars, type: tLoadBar) => {
        if (type == "left") {
            if (this.box.symbolData) this.historyBars = this.box.symbolData.history;
            if (this.historyBars && this.historyBars.count > 2) {
            } else return;
            this.InitTimeToBar();
        }
    }
    OnTicks = (ticks: { ticks: tTick[] }) => {
        if (this.box.symbolData) this.historyBars = this.box.symbolData.history;
    }
    protected _promiseSetSymbol = Promise.resolve();
    OnSetSymbol = (data: tInfoInit) => {
        this._promiseSetSymbol = this._promiseSetSymbol.then(async () => {
            if (this.box.indicators) {
                await this.box.indicators.SetSymbol(data);
            }
        })
    }

}

function FConvectorColor (color: ColorString) {
    const _green= new CColor(color  )
    return [_green.getR()/255, _green.getG()/255, _green.getB()/255, _green.getA()];
}

function FConvectorColor3 (color: ColorString) {
    const _green= new CColor(color  )
    return [_green.getR()/255, _green.getG()/255, _green.getB()/255];
}

function FConvectorColor4 (color: ColorString) {
    return FColorsArray(new BABYLON.Color4(...FConvectorColor(color)));
}

function FColorsArray (color: BABYLON.Color4) {
    return [color,color,color,color,color,color];
}


const cashColors = new Map();

export class CGraphCanvas3D// extends CDivNode
    implements ICDivFunc {
    InitStyle() {
    }

    location: tGraphDiv;
   // _cwin: CWinCC = new CWinCC();
    nodeForGraph: CDivNode|undefined
    SetColors(data: tSets) {
        Object.assign(this.defaultColor, data);
        this.Refresh();
    }

    GetColors(): tSets {
        return this.defaultColor;
    }
    scene: BABYLON.Scene;
    camera: BABYLON.FreeCamera;
  //  container: BABYLON.AssetContainer;

    protected display: CWinGraph;
    // protected renderer: WebGLRenderer;
    // protected camera: PerspectiveCamera|OrthographicCamera;
    // protected scene : Scene;
    // protected control : cFlyControls2;
    // protected clock: THREE.Clock;

    protected otherIndi = [];//остальные индикаторы
    //надо удалить этот метод т.к. он дублирует конструктор
    InitCanvas(location: tGraphDiv, cor: ICContXY) {
        this.location = location;
        this.display = new CWinGraph(this.location.div!, cor)
        this.InitStyle();
    }
    //scene: BABYLON.Scene;


    boxConnect:boolean= false;
    callback :tListEvent<any, tSymbolCallback2>= {
        func:() => {
            return {
                onTick: (e)=>this.OnTicks(e),
                onHistory: (e,a)=>this.OnHistory(e,a),
                onBar: (e)=>this.OnBars(),
                onSetSymbolData: (e)=>this.OnSetSymbol(e)
            }
        },
        OnDel:()=>{
            console.error("диконект с боксом")
            this.boxConnect = false;
        }
    }

    readonly box = new CSystemBox();


    constructor(location: tGraphDiv, cor: ICContXY) {
        this.location = location;
        this.display = new CWinGraph(this.location.div!, cor);

        // Get the canvas DOM element
        const canvas = this.display.work3d.element;


        const engine = new BABYLON.Engine(canvas, true, {preserveDrawingBuffer: true, stencil: true});

        const scene = new BABYLON.Scene(engine);

        this.scene = scene;
        const camera = new BABYLON.FreeCamera('camera1', new BABYLON.Vector3(0, 5, -10), this.scene);

        camera.setTarget(BABYLON.Vector3.Zero());
        camera.attachControl(this.display.work3d.element, true);
        camera.setTarget(BABYLON.Vector3.Zero());
        camera.attachControl(canvas, true);
        camera.inputs.addMouseWheel();
        this.camera = camera;
        this.camera.position.x=0;
        engine.runRenderLoop(()=>{
        this.scene.render();
        });
// the canvas/window resize event handler
        window.addEventListener('resize', function(){
            engine.resize();
        });


  //       const {display} = this;
  //       this.scene = new THREE.Scene();
  //       //OrthographicCamera
  //       this.camera = new THREE.PerspectiveCamera( 75, display.size.width / display.size.height, 0.01, 100 );
  // //      this.camera = new THREE.OrthographicCamera( -display.size.height/2,display.size.height/2 ,display.size.width/2,-display.size.width/2,0.1,100);
  //       this.renderer= this.display.work3d.renderer;
  //
  //
  //
  //
  //
  //       let geometry = new THREE.BoxGeometry( 1, 2, 1 );
  //       let material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
  //       let cube = new THREE.Mesh( geometry, material );
  //       this.scene.add( cube );
  //       this.control = new cFlyControls2(this.camera, this.renderer.domElement);
  //       this.clock = new THREE.Clock();
  //
  //
  //       let animate = () => {
  //
  //           requestAnimationFrame( animate );
  //
  //           render();
  //       }
  //
  //        this.camera.position.z = 5;
  //
  //        let render = () => {
  //
  //            const delta = this.clock.getDelta();
  //
  //
  //            requestAnimationFrame( render );
  //
  //
  //            // cube.rotation.x += 0.1;
  //            // cube.rotation.y += 0.1;
  //            // cube.rotation.z += 0.1;
  //
  //            this.control.update( delta );
  //
  //            this.renderer.render(this.scene, this.camera);
  //        };
  //
  //       render();

        this.box.InitCallback(this.callback)
        this.InitStyle();

     //   this.InitCanvas(location, cor);
    }

    GetCoordinate(){
        return undefined;
    }

    Delete() {
        //  if (this._nodeHistory) this._nodeHistory.DeleteLink();
        this.display.Remove();
    }// удалает себя из списка элементов узлов

    OnKeyDown(e: KeyboardEvent) {
    }

    OnTouchmove(e: tMouse) {
    };

    OnTouchstart(e: tMouse) {
    };


    //ОБновить график, принудительно перерисовать включая все под индикаторы
    MouseTarget(ref?: boolean) {

    }//тут пока зачем то рисование всего графика пресутвует - по условию

    protected RePosition(): boolean {
        return this.display.Refresh();
    }

    checkCanvasSize() {
        if (this.RePosition()) {
            if (this.compliteinit) {
            }
        }
    }

    DrawNow(canvas: CanvasContext2D) {
        this.MouseTarget();
        // super.DrawNow(canvas);
    }


    // _history:IBars;
    get _history(): IBars | undefined {
        return this.historyL.historyBars
    }

    //protected indicatorsGraph:CIndicatorAND[]=[];
    get indicators() {
        return this._indicators
    }

    GetIndicatorsClass() {
        return this._indicators
    }

    OnBars = () => {
        this.historyL.OnBars();
        this.MouseTarget(true);
    }
    OnHistory = (history: IBars, type: tLoadBar) => {
        if (type == "left") {
            this.historyL.OnHistory(history, type);

            if (this._history && this._history.count > 2) this.compliteinit = true;
            else return;

            this.DrawGraph();
            this.DrawIndicators();
            this.MouseTarget(true);
        }
    }
    OnTicks = (data: tSetTicks) => {
        this.historyL.OnTicks(data);
        this.MouseTarget(true);
    }
    protected _promiseSetSymbol = Promise.resolve();
    OnSetSymbol = (data: tInfoInit) => {
        this._promiseSetSymbol = this._promiseSetSymbol.then(async () => {
            if (this._indicators) await this._indicators.SetSymbol(data);
        })
    }



    protected Draw() {
        if (!this.compliteinit) {
            return;
        }
        this.DrawGraph();
        this.DrawPrice();
        for (let i = 0; i < this.otherIndi.length; i++) {
            //   if (this.otherIndi[i]) this.otherIndi[i].MouseTarget(true);
        }
    }

    bufferGraph:any[]=[];
    protected DrawGraphCandle() {
        const {_history,timeD} = this;
        const toY=this.toY3d
        if (_history) {


            const {barUp,barDw} = this.defaultColor;
            const materialUp = new BABYLON.StandardMaterial("up", this.scene);
            const colorUp = FConvectorColor3(barUp.color as ColorString??"rgb(37,194,25)"); //
            const colorUp4 =  new BABYLON.Color4(...colorUp);
            materialUp.emissiveColor = new BABYLON.Color3(...colorUp);

            const materialDw = new BABYLON.StandardMaterial("dw", this.scene);
            const colorDw = FConvectorColor3(barDw.color as ColorString??"rgb(194,25,25)"); //
            const colorDw4 =  new BABYLON.Color4(...colorDw);
            materialDw.emissiveColor = new BABYLON.Color3(...colorDw);

         //   const k=10;
            const {Vector3} = BABYLON;
            const time = this.timeD.valueOf();
            const  tf= _history.Tf.valueOf()
            let i=0;
            const lastTime = _history.last!.time.valueOf();
            let lastEl: BABYLON.Mesh;
            const lines :{lines:BABYLON.Vector3[][], color:BABYLON.Color4[][]} = {lines:[], color:[]}
            for (let iBar of _history) {

                const d =  iBar.open-iBar.close;
                const p =  (iBar.open+iBar.close)/2;
                const bul =  d>0;

                const el = BABYLON.MeshBuilder.CreateBox(`name `, {
                    height: toY(Math.abs(d) ), width: 1.
                }, this.scene);

                this.bufferGraph.push(el);

                const x = this.toX3d(iBar.time.valueOf());// (iBar.time.valueOf() - lastTime)/(tf * 0.5)

                el.position.x=x;
                el.position.y= toY(p) // Math.min(iBar.close , iBar.open) / k
                el.material = bul ? materialUp : materialDw

                lastEl=el;
                const l = [new Vector3(x, toY(iBar.low)),new Vector3(x, toY(iBar.high))]
                lines.lines.push(l);
                const colorE= bul ? colorUp4 : colorDw4;
                const col = [ colorE, colorE ]
                lines.color.push(col);
        //      BABYLON.MeshBuilder.CreateLineSystem("linesystem22", {lines: [l], colors: [col]}, this.scene);
            }

            const linesystem2 = BABYLON.MeshBuilder.CreateLineSystem("linesystem", {lines: lines.lines, colors: lines.color}, this.scene);

            this.bufferGraph.push(linesystem2);
            const p = lastEl!.getAbsolutePosition();
            const xCam = this.camera.position.x;
            if (xCam*0.5*-1<_history.length && xCam<0) {
                this.camera.position.y= toY(_history.open(Math.round(_history.length+xCam*0.5-1)));
            }
            if (xCam>=0) { //
                this.camera.position.y= toY(_history.last!.open);
            }
            if (xCam*0.5*-1>_history.length) {
                this.camera.position.y= toY(_history[0].open);
            }
         //   this.camera.position.x= p._x;
         //   this.camera.position.y= p._y;
         //   this.camera.position.z= p._z-10;

      //      linesystem2.dispose();
            // this.camera. `
        }
    }



    // переводить дату в 3д разметку
    protected lastTimeMSec:number =0;
    toX3d(timeMSec:number) : number {
        if (this.lastTimeMSec==0 && this._history?.last?.time.valueOf())  this.lastTimeMSec= this._history.last.time.valueOf();

        //lastTime
        return (timeMSec - this.lastTimeMSec ) / ( ( this._history?.Tf.valueOf() ?? 2 ) * 0.5);
    }
    toY3d(price:number) : number {
        const k=10;
        return price/k;

    }

    protected DrawGraphLine() {
        const toY=this.toY3d
        const {_history,timeD} = this;
        if (_history) {
            const colorLine = new BABYLON.Color4(...FConvectorColor3(this.defaultColor.lineGraph.color as ColorString??"rgb(37,194,25)")); //
            const {Vector3} = BABYLON
           // const k=10;

            const lastTime = _history.last!.time.valueOf();
            const time = this.timeD.valueOf();
            const  tf= _history.Tf.valueOf()
            const lines :{lines:BABYLON.Vector3[][], color:BABYLON.Color4[][]} = {lines:[[]], color:[[]]}
            const ll= lines.lines[0];
            const cc= lines.color[0];
            for (let iBar of _history) {
                const x = this.toX3d(iBar.time.valueOf());//  (iBar.time.valueOf() - lastTime)/(tf * 0.5)
                ll.push(new Vector3(x, toY(iBar.close)));
                cc.push( colorLine);

            }
            const linesystem2 = BABYLON.MeshBuilder.CreateLineSystem("linesystem", {lines: lines.lines, colors: lines.color}, this.scene);
            this.bufferGraph.push(linesystem2)

            const xCam = this.camera.position.x;
            if (xCam*0.5*-1<_history.length && xCam<0) {
                this.camera.position.y= toY(_history.open(Math.round(_history.length+xCam*0.5-1))) ;
            }
            if (xCam>=0) {
                this.camera.position.y= toY(_history.last!.open);
            }
            if (xCam*0.5*-1>_history.length) {
                this.camera.position.y= toY(_history[0].open);
            }
        }
    }

    DrawLines(line:Gconst.CLine){
        let colorLine = new BABYLON.Color4(...FConvectorColor3(line.color as ColorString??"rgb(37,194,25)"));
        let line1 = BABYLON.MeshBuilder.CreateLines("line",
            {
                points:
                    [
                        new BABYLON.Vector3(this.toX3d(line.begin.x - this._history!.Tf.valueOf()),this.toY3d(line.begin.y),0),
                        new BABYLON.Vector3(this.toX3d(line.end.x),this.toY3d(line.end.y),0)
                    ]
                ,colors:[colorLine,colorLine]
            } );
        return line1;
    }

    DrawIndicator (indicator: CIndicatorAND) {
        let options : {points: BABYLON.Vector3[], updatable?: boolean | undefined, instance?: BABYLON.Nullable<BABYLON.LinesMesh> | undefined, colors?: BABYLON.Color4[] | undefined, useVertexAlpha?: boolean | undefined};
        const toPoint = (point: Gconst.Point) =>{
            return new BABYLON.Vector3(this.toX3d(point.x),this.toY3d(point.y),0)
        }

        const colorLine = new BABYLON.Color4(...FConvectorColor3(this.defaultColor.lineGraph.color as ColorString??"rgb(37,194,25)")); //

//        const lastbar=this._history!.last!;
        // console.log("hihihi");
        // console.log(this.toX3d(lastbar.time!.valueOf()-this._history!.Tf.valueOf()*3));
        // console.log(this.toX3d(lastbar.time!.valueOf()));
        // BABYLON.MeshBuilder.CreateLines("line",
        //     {
        //         points:
        //             [
        //                 new BABYLON.Vector3(this.toX3d(lastbar.time!.valueOf()-this._history!.Tf.valueOf()*3),this.toY3d(lastbar.open),0),
        //                 new BABYLON.Vector3(this.toX3d(lastbar.time!.valueOf()),this.toY3d(lastbar.open*0.95),0)
        //             ]
        //         ,colors:[colorLine,colorLine]
        //     } );
        //
        //
        // BABYLON.MeshBuilder.CreateLines("line",
        //     {
        //         points:
        //             [
        //                 new BABYLON.Vector3(this.toX3d(lastbar.time!.valueOf()-this._history!.Tf.valueOf()*8),this.toY3d(lastbar.open),0),
        //                 new BABYLON.Vector3(this.toX3d(lastbar.time!.valueOf()),this.toY3d(lastbar.open*0.95),0)
        //             ]
        //         ,colors:[colorLine,colorLine]
        //     } );


        for (let line of indicator.lines) {
            console.log(line);
            this.DrawLines(line);

            switch (line.style) {
                case "dash":
            //        line = BABYLON.MeshBuilder.CreateLines("line",)
                    break;
                case "dashdot":
                    break;
                case "dot":
                    break;
                case "solid":
                    break;
                default: break;
            }
        }
    }

    DrawIndicators(){
        if (this.indicators) {
            console.log(1);
            for (let indicator of this.indicators) {
                console.log(indicator.name," indicator.name");
                this.DrawIndicator(indicator);
            }
        }
    }

    protected DrawGraphBars() {

        const toY=this.toY3d
        const {_history,timeD} = this;
        if (_history) {
            const {Vector3} = BABYLON
         //   const k=10;
            const {barUp,barDw} = this.defaultColor;
            const colorUp = FConvectorColor3(barUp.color as ColorString??"rgb(37,194,25)"); //
            const colorUp4 =  new BABYLON.Color4(...colorUp);

            const colorDw = FConvectorColor3(barDw.color as ColorString??"rgb(194,25,25)"); //
            const colorDw4 =  new BABYLON.Color4(...colorDw);

            const time = this.timeD.valueOf();
            const  tf= _history.Tf.valueOf()
            const lines :{lines:BABYLON.Vector3[][], color:BABYLON.Color4[][]} = {lines:[], color:[]}
            let limit=20;
            const lastTime = _history.last!.time.valueOf();

            for (let iBar of _history) {
                const x =  this.toX3d(iBar.time.valueOf());// (iBar.time.valueOf() - lastTime)/(tf * 0.5)
                let v= [
                    new Vector3(x-0.9, toY(iBar.open)) ,
                    new Vector3(x, toY(iBar.open) )

                    ,
                    new Vector3(x, toY(iBar.high)) ,
                    new Vector3(x, toY(iBar.low)) ,
                    new Vector3(x, toY(iBar.close)) ,
                    new Vector3(x+0.9, toY(iBar.close))
                ]

                let vColor=
                    iBar.open<iBar.close?
                        [colorUp4,colorUp4
                            ,colorUp4,colorUp4,colorUp4,colorUp4
                        ] :
                        [colorDw4,colorDw4
                            ,colorDw4,colorDw4,colorDw4,colorDw4
                        ]


          //      BABYLON.MeshBuilder.CreateLineSystem("linesystem2", {lines: [[]], colors: lines.color}, this.scene);
          //      BABYLON.MeshBuilder.CreateLineSystem("linesystem", {lines: lines.lines, colors: lines.color}, this.scene);
          //      BABYLON.MeshBuilder.CreateLineSystem("linesystem2", {lines: [v], colors: [vColor]}, this.scene);
                lines.lines.push(v);
                lines.color.push( vColor
                );

            // if (limit==0)break;
            //     limit--;
            }
           const lineSystem2 = BABYLON.MeshBuilder.CreateLineSystem("linesystem2", {lines: lines.lines, colors: lines.color}, this.scene);

           this.bufferGraph.push(lineSystem2)

            const xCam = this.camera.position.x;
            if (xCam*0.5*-1<_history.length && xCam<0) {
                this.camera.position.y= toY(_history.open(Math.round(_history.length+xCam*0.5-1)));
            }
            if (xCam>=0) {
                this.camera.position.y= toY(_history.last!.open);
            }
            if (xCam*0.5*-1>_history.length) {
                this.camera.position.y= toY(_history[0].open);
            }
        }
    }


    timeD= new Date("2021 08 1 00:00")



    protected DrawGraph(){

        for (let bufferGraphElement of this.bufferGraph) {
            bufferGraphElement.dispose();
        }
        this.bufferGraph=[];

        switch (this.styleGraph.styleBar) {
            case "bar": this.DrawGraphBars(); break;
            case "line": this.DrawGraphLine(); break;
            case "candle": this.DrawGraphCandle(); break;
            default: break;
        }


    }
    protected DrawPrice(){

    }

    //клак хранить всяческие настройки графика
    protected styleGraph: tStyleAndSettingGraph2 = new CStyleAndSettingGraph(this);
    //хранит поставку котировок, котировки с индикаторами  и сам рапределяет тики между индикаторами
    //полностью самодостаточный компонент для получение сигналов


    //обертка для истории, для 2д холста - чтобы создать промежуточные массивы для конвертация времени в бар и прочее
    //закачка котировок при пдвижении экрана в лево
    historyL: CHistoryAndLoadGraph3D = new CHistoryAndLoadGraph3D({  box: this.box})

    protected compliteinit = false;
    //может быть undefined  пока идет процес загрузки списка символов
    get symbolData(): CSymbolData | undefined {
        return this.box.symbolData
    }

    get _indicators(): CIndicatorsAND | undefined {
        return this.box.indicators
    }

    defaultColor = new CSetColors();

    InitGraph() {
        this.compliteinit = true;
    }

    readonly TimeToBar = (time: number): number => {
        return this.historyL.TimeToBar(time);
    }


    protected _testMode: boolean = false;
    //Устанавливает режим Тестер, позволяет работать со своей историей, отключает стандартную функцию онлайн покдкачки котировок для того чтобы работать эмитацией теста
    SetModeTest(flag: boolean) {
        this._testMode = flag;
    }

    //перемотка графика к указанной дате
    MoveTo(time: Date | const_Date) {
        const _history = this._history;
        if (_history) {
        }
    }

    TestMode() {

    }

    //для установки символа таймфрейма и прочее
    async SetInfo(info: tInfoInit) {
        this.symbolData?.Set(info)
        if (this._indicators) await this._indicators.SetSymbol(info);
    }

    SetOther(styleGraph: tStyleAndSettingGraph) {
        this.SetStyleAndSettingGraph(styleGraph);
    }

    GetOther() {
        return this.styleGraph
    }

    //для установки стилей отрисовки, еще есть для устновки цветовой гаммы
    GetStyleAndSettingGraph() {
        return this.styleGraph
    }

    SetStyleAndSettingGraph(styleGraph: tStyleAndSettingGraph) {
        Object.assign(this.styleGraph, styleGraph);
        this.MouseTarget(true);
    }

    Refresh() {
        return this.MouseTarget(true);
    }

    protected GrafEffectMoveTO(nbar: number = -1) {
        const _history = this._history
        if (_history) {

        }
    }// -1 - end bar
    // moveData:
    GraphMoveTo(data: typeMoveTo) {
    }

    protected ConsolText(canvas: CanvasContext2D) {
    }

    protected WaterSymbol(canvas: CanvasContext2D) {
    }


    OnTouchend(e: tMouse) {
        if (!this.compliteinit) return;
    };

    protected _mouseMenu: boolean = false;

    OnMouseDown(e: tMouse) {
        if ((e.e.buttons) == (Gconst.CLICKSCRULL | Gconst.CLICKLEFT)) {

        }//если нажали скрул то рубильник перещелкнулся

    };

    // protected SizeYAuto(){
    //     const mouse=this._cwin.mouse;
    //     const dy=mouse.y.pix-mouse.last.y.pix;
    //     const width=this._cwin.width;
    //     const y=this._cwin.win.y;
    //     let hight=y.maxprice-y.minprice;
    //     let koef=dy/hight;
    //     y.minprice+=dy*y.scale;
    //     y.maxprice-=dy*y.scale;
    //
    //     y.scale=this._cwin.height/(y.maxprice-y.minprice);
    //     //this._cwin.win.Save();
    // };

    OnMouseMove(e: tMouse) {
        if (!this.compliteinit) return;
        this.MouseTarget();
    };

    OnMouseWheel(e: tMouse) {
        if (!this.compliteinit) return;

    };

    OnMouseFinal(e: tMouse) {
        if (!this.compliteinit) return;
    };

    OnMouseOver(e?: tMouse) {
        if (!this.compliteinit) return;
    };

    OnMouseUp(e: tMouse) {
        if (!this.compliteinit) return;
    };

}

type tTimeTo = { nbars: number[], step: number, start: number };






