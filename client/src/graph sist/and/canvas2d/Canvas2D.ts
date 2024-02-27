import * as Gconst from "../const";
import {mouseG} from "../cmouse";
import {CBar, const_Date, IBars} from "../../Nav/Bars";
import {BSearch, GetDblPrecision} from "../../Nav/Common";
import {disignnowT, timeoptions} from "../styleother";
import {tLoadBar, tSetTicks} from "../interface/IHistoryBase";
import {tInfoInit} from "../history/historyBase";
import {CSystemBox} from "../sytemBox";
import {CSymbolData, tOnBars, tSymbolCallback2} from "../Symbol";
import {CIndicatorAND, CIndicatorsAND} from "../indicatorBaseClass/indicatorAND";
import {
    CanvasContext2D,
    CDivNode,
    ICContXY,
    ICDivFuncMove,
    ICHistoryAndLoadGraph,
    IICGraphCanvas,
    tGraphDiv,
    tMouse,
    typeMoveTo
} from "../vgraf3";
import {tListEvent, tTick} from "../interface/mini";
import {CListNode} from "../listNode";
import {IGraphObjectB} from "../interface/IIndicator";
import {PreloaderImage, ShowPreloaderImage} from "../preloaderImage";
import {Draw2dIndicatorBase, Draw2dPrice, Draw2dText} from "./draw2d";
import {
    CCanvasColors,
    CStyleAndSettingGraph,
    tSets,
    tStyleAndSettingGraph,
    tStyleAndSettingGraph2
} from "./Canvas2dStyle";
import {CreateDom} from "../../CCreateDom";
import {CColor} from "../color";
import {tCanvasMini} from "./Canvas2Dmini";


class CGMouseBaseX {
    pix: number = 0;
    _nbar: number = 0;
    get nbar() {
        return this._nbar;
    }

    set nbar(t: number) {
        if (t==undefined) {
            console.error("errrr ", t);
        }

        this._nbar = t;
    }

    _time: Date = new Date();
    get time() {
        return this._time;
    }

    set time(t: Date) {

        this._time = t;
    }

    Save(a: CGMouseBaseX) {
        this.pix = a.pix;
        this.nbar = a.nbar;
        this.time = a.time;
    };
}

class CGMouseBaseY {
    pix: number = 0;
    price: number = 0;

    Save(a: CGMouseBaseY) {
        this.pix = a.pix;
        this.price = a.price;
    };
}

class CGMouseBase {
    x = new CGMouseBaseX();
    y = new CGMouseBaseY();
    ev: number = 0;//event 1 - left  2 right 3 srull
    Save(a: CGMouseBase) {
        this.x.Save(a.x);
        this.y.Save(a.y);
        this.ev = a.ev;
    };
}

class CGMouse extends CGMouseBase {
    last = new CGMouseBase();

    override Save() {
        this.last.Save(this);
    };

    ResetEvent() {
        this.last.ev = 0;
        this.ev = 0;
    };
}

export class CWinCC {
    win = new CGprrGeneral();
    mouse = new CGMouse();

    //display: {readonly width: number, readonly height: number} = {width:100, height:100}
    RefreshMaousOnBar() {
        this.mouse.x.nbar = this.win.x.minBar + Math.floor(((this.mouse.x.pix - this.win.x.pixmin)/this.win.x.scale)??0)+1
    };
}


export interface ICScaleBaseX {
    scale: number;
    minBar: number;
    _pixmin: number;
    pixmin: number;
    maxBar: number;
    pixmax: number;
}


export interface ICScaleX extends ICScaleBaseX{
    Save(a: ICScaleX | ICScaleBaseX): void;
    Res(): void;
}

export interface ICScaleBaseY {
    size: number;
    scale: number;
    minprice: number;
    pixmin: number;
    maxprice: number;
    pixmax: number;
}

interface ICScaleY extends ICScaleBaseY{
    Save(a: ICScaleY | ICScaleBaseY): void;
    Res(): void;
}

class CScaleX implements ICScaleX {
    scale: number = 4;
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
    pixmax: number = 600;//растояние в пикселях с последнего бара с права до края экрана с права
    constructor() {
    }

    Save(a: ICScaleX) {
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


class CScaleY implements ICScaleY {
    size: number = 1;
    scale: number = 0;
    minprice: number = 0;
    pixmin: number = 0;
    maxprice: number = 0;
    pixmax: number = 0;

    Save(a: ICScaleY) {
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
    constructor() {
        this.y.size=0.85
    }
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


export class CCanvasBase {
    readonly element: HTMLCanvasElement;
    readonly canvas: CanvasRenderingContext2D;
             cor: ICContXY;

    constructor(div: HTMLDivElement, cor: ICContXY) {
        this.cor = cor;
        this.element = CreateDom.createElement('canvas');
        this.element.style.position = 'absolute';
        div.appendChild(this.element);

        const buf =  this.element.getContext('2d')!;
        if (!buf) console.log("errrrror ну удалось создать холст канвас - по факту такое не возможно")
        this.canvas = buf
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
        if (this.element) {
            const {cor} = this;
            this.element.width = cor.width();
            this.element.height = cor.height();
        }
    }

} //класс окна графика, все окна по умолчанию синхронны

class CWinDisplayGraph {
    size: { x: number, y: number, width: number, height: number };
    //protected cor: ICContXY;
    cor: ICContXY;

    constructor(div: HTMLDivElement, cor: ICContXY,  [widthD, heightD] = [60, 30]) {
        this.fon = new CCanvasBase(div, cor//{...cor}
        );
        this.cor = cor//{...cor};
        const buf = this.cor;
        this.size = {
            x: 0,
            y: 0,
            width: 0,
            height: 0,
        }

        this.work3d = new CCanvasBase(div, {
            ...buf,
            width: () => buf.width() - widthD,
            height: () => buf.height() - heightD
        });
        this.Refresh();
    }

    work3d: CCanvasBase;
    fon: CCanvasBase;

    Remove() {
        this.work3d.Remove();
        this.fon.Remove();
    }

    Refresh(): boolean {
        const {cor, size} = this;
        let flag = false;
        if (size.x != cor.x() || size.y != cor.y()) {
            size.x = cor.x();
            size.y = cor.y();
            this.work3d.RefreshCoor();
            this.fon.RefreshCoor();
            flag = true;
        }
        if (size.width != cor.width() || size.height != cor.height()) {
            size.width = cor.width();
            size.height = cor.height();
            this.work3d.RefreshSize();
            this.fon.RefreshSize();
            flag = true;
        }
        return flag;
    }

    protected RefreshCoor() {
        this.work3d.RefreshCoor();
        this.fon.RefreshCoor();
    }

    protected RefreshSize() {
        this.work3d.RefreshSize();
        this.fon.RefreshSize();
    }
} //класс окна графика, все окна по умолчанию синхронны

class CWinGraphDop extends CWinDisplayGraph {
    constructor(div: HTMLDivElement, cor: ICContXY) {
        super(div,cor,[60,0])
    }
}

export class CGraphCanvas implements IICGraphCanvas {// extends CDivNodef
    InitStyle() {}
    static count:number=0
    location!: tGraphDiv;
    _cwin: CWinCC = new CWinCC();

    nodeForGraph : CDivNode;    //Текущий узел графика разметки рабочей области

    GetCoordinate(){
        return this._cwin;
    }

    SetColors(data: tSets) {
        Object.assign(this.defaultColor, data);
        this.Refresh();
    }

    GetColors(): tSets {
        return this.defaultColor;
    }

    display!: CWinDisplayGraph;
    // Список ведомых экранов
    displayOther: CListNode<CGraphCanvasDop> = new CListNode<CGraphCanvasDop>();

    InitCanvas(location: tGraphDiv, cor: ICContXY) {
        this.location = location;
        this.display = new CWinDisplayGraph(this.location.div!, cor)
        this.InitStyle();
    }

    constructor(location: tGraphDiv, cor: ICContXY, nodeForGraph: CDivNode) {
        CGraphCanvas.count++;
        this.nodeForGraph = nodeForGraph;
        nodeForGraph.graph=this;
        this.InitCanvas(location,cor);
        this.box.InitCallback(this.callback)
        this.boxConnect=true;
    }
    Delete() {
        CGraphCanvas.count--;
        this.callback.del?.();
        this.box.DeleteMini();
        this.nodeForGraph.node?.DeleteLink()
        this.nodeForGraph.graph=undefined;
        this.displayOther?.GetArray().map(e=>e.Delete())
        this.display.Remove();

        //    this.box.Delete();
    }// удаляет себя из списка элементов узлов

    DeleteFull() {
        //  if (this._nodeHistory) this._nodeHistory.DeleteLink();
        CGraphCanvas.count--;
        this.callback.del?.();
        // this.nodeForGraph.Delete()
        this.box.DeleteMini();
        this.nodeForGraph.graph=undefined;
        this.displayOther?.GetArray().map(e=>e.DeleteFull())
        this.display.Remove();
    }// удаляет себя из списка элементов узлов

    OnClick(e: MouseEvent) {
        // При зажатой кнопке Ctrl проинициализируем индикаторы для расчёта до текущего бара под курсором
        if (e.target != this.display.work3d.element) return;
        //if (!isKeyDown("Control")) return;
        if (!e.ctrlKey) return;
        let nbar= this._cwin.mouse.x.nbar;
        let bars= this._history;
        if (!bars) return;
        if (nbar<0 || nbar>=bars.length) return;
        //let nbarBackward= nbar - this._history.length + 1;
        for(let ind of this._indicators??[]) {
            //if (ind instanceof CIndicatorAND)
                ind.setCalcTimeLimit(bars[nbar].time);
        }
    }


    OnKeyDown(e: KeyboardEvent) {
        if ((e.target as HTMLElement).tagName=="INPUT") return;
        if (!this.symbolData) return;
        //console.log(e.target, (e.target as HTMLElement).tagName);
        const {width} = this.display.size;
        const Max = (n1: number, n2: number): number => n1 > n2 ? n1 : n2
        const Min = (n1: number, n2: number): number => n1 < n2 ? n1 : n2
        const Dis = (min: number, n: number, max: number): number => Min(max, Max(n, min))
        //проверка на выходы за пределы
        const winScale = (k: number): number =>  Math.floor(Dis(0, this._cwin.mouse.x.nbar + (k * (width / this._cwin.win.x.scale)), this._history ? this._history.count - 1 : 0))

        const bars= this._history;
        if (e?.code && bars?.length) {
            const moveIndicatorsCalcLimit = (moveBars :number) => {
                for(const ind of this._indicators??[]) {
                    //if (! (ind instanceof CIndicatorAND)) continue;
                    const time= ind.paramValues.lastBarTime ?? new Date(); //).valueOf(); + this._history.
                    let ibar= bars.indexOf(time, "lessOrEqual");
                    let nextBarTime= ibar<bars.length-1 ? bars[ibar+1].time : new Date(bars.at(-1)!.time.valueOf() + bars.Tf.msec);
                    ind.setCalcTimeLimit(nextBarTime);
                }
                this.GraphMoveTo({bar: {target: this._cwin.mouse.x.nbar + moveBars}, repeat: 1})
            }
            switch (e.code) {
                case "ArrowLeft":   moveIndicatorsCalcLimit(-1);  break;
                case "ArrowRight":  moveIndicatorsCalcLimit(1);   break;
                case "PageDown":    this.GraphMoveTo({bar: {target: winScale(-0.5)}, repeat: 1}); break;
                case "PageUp":      this.GraphMoveTo({bar: {target: winScale(+0.5)}, repeat: 1}); break;
                case "Home":        this.GraphMoveTo({bar: {target: 1}, repeat: 15}); break;
                case "End":         this.GraphMoveTo({bar: {target: bars.count - 1}, repeat: 15}); break;
            }
        }
    }

    OnTouchmove(e: tMouse) {
        if (!this.compliteinit) return;
        let touchs = e.e.changedTouches; // [0] - это одно нажатие.... (типо 1 палец)
        if (touchs.length == 1) //одно нажатие и движение одно
        {
            const {x, y} = this.display.size;
            let mouse = this._cwin.mouse;
            mouse.Save();
            mouse.ev = Gconst.CLICKLEFT;
            mouse.x.pix = touchs[0].pageX - x;
            mouse.y.pix = touchs[0].pageY - y;

            let dy = mouse.y.pix - mouse.last.y.pix;
            if (!this.styleGraph.animation && this.styleGraph.autoSizeGraph) dy = 0;
            if (mouse.ev == Gconst.CLICKLEFT) {
                this.GrafMove2(mouse.x.pix - mouse.last.x.pix, dy, this._cwin.win);
            }//
            this.MouseTarget();

        }
    };

    CheckMouse() {
        console.log('mouseG:', mouseG);
        if (mouseG.getGraph() != this)  mouseG.setGraph(this);
    }

    OnTouchstart(e: tMouse) {
        if (!this.compliteinit) return;
        console.log("OnTouchstart")
        let touches = e.e.changedTouches; // [0] - это одно нажатие.... (типо 1 палец)
        if (touches.length == 1) { //одно нажатие и движение одно

            this._cwin.mouse.x.pix = touches[0].pageX;
            this._cwin.mouse.y.pix = touches[0].pageY;
            if (!this.compliteinit) {
                return;
            }
            this.CheckMouse()

            this.stopEffect = true;
            this._cwin.mouse.ev = Gconst.CLICKLEFT;

            this.MouseTarget();
        }
    };
    //рисует сетку времени и цены и саму сетку, на фоновом холсте который и принимает

    protected DrawPrice(canvas: CanvasRenderingContext2D, styleGraph:tStyleAndSettingGraph2= this.styleGraph) {
        if (!this.compliteinit) {
            return;
        }
        const tf = this.symbolData?.tf
        const history = this._history
        this.DrawBackgroundCanvas(canvas)
        const {x, y} = this._cwin.win;
        if (!tf || !history || y.minprice == undefined || y.scale == Infinity || y.scale == 0.0 || y.scale == undefined) return;

        Draw2dPrice({
            canvas: canvas,
            win: {y: this._cwin.win.y, x: this._cwin.win.x},
            size: this.display.size,
            styleGraph: this.styleGraph,
            styleColor: this.defaultColor,
            fixed: this.fixed,
            history,
            tf
        })
    }

    protected DrawBars(bars: readonly CBar[], canvas: CanvasContext2D, toX: (ibar: number) => number, toY: (price: number) => number, corX: number) {
        const lineTo = (ibar: number, price: number) => canvas.lineTo(toX(ibar), toY(price));
        const moveTo = (ibar: number, price: number) => canvas.moveTo(toX(ibar), toY(price));
        const {x, y} = this._cwin.win;
        //рисуем свечи
        const _draw = ({show, data, color}: tCanvasMini) => {
            if (show) {
                if (!(data?.length)) return;

                canvas.strokeStyle = color ?? "rgb(210,210,210)"
                for (let i = 0; i < data.length; i++) {
                    lineTo(i, data[i]);
                }
                {
                    lineTo(data.length-1, data[data.length-1])
                    lineTo(data.length-1, y.minprice);
                    lineTo(0, y.minprice);
                    canvas.closePath();
                    // const height = 1000;
                    // const gradient = canvas.createLinearGradient(0, 0, 0, height);
                    // const  color1 = "rgba(16,184,144,1)"
                    // const  color15 = "rgba(112,89,255,0.81)"//"rgba(243,186,47,0.26)"
                    // const  color2 = "rgba(112,89,255,0)"
                    // gradient.addColorStop(0, color1)
                    // // gradient.addColorStop(0.5, color15)
                    // gradient.addColorStop(1, color2 )
                    // canvas.fillStyle = gradient;
                    // canvas.fill();
                    canvas.beginPath();

                    const  color3 = "rgb(16,184,144)"
                    const  color33 = "rgb(16,184,144)"
                    const  color4 = "rgb(112,89,255)"
                    // const gradient2 = canvas.createLinearGradient(0, 0, 0, height*1.1);
                    // gradient2.addColorStop(0, color3 ?? "rgb(243,186,47)")
                    // // gradient2.addColorStop(0.5, color33)
                    // gradient2.addColorStop(1, color4 ?? "rgb(112,89,255)")

                    for (let i = 0; i < data.length; i++) {
                        lineTo(i, data[i]);
                    }
                    canvas.strokeStyle = color3;
                    canvas.stroke();
                }
                canvas.beginPath();
            }
        }

        if (x.scale < 4) {
            if (bars.length > 0) moveTo(0, bars[0].close);//установить начальное положение для линии
            _draw({show: true, data: bars.map(e=>e.close)})
            return;
        }

        if (this.styleGraph.styleBar == "candle") {
            function drawCandles(color: string, condition: (bar: CBar) => boolean) {
                canvas.fillStyle = color;
                for (let [i, bar] of bars.entries()) {//вся функция отрисовки баров
                    if (condition(bar) == true) {
                        canvas.fillRect(toX(i), toY(bar.low), 1, -(bar.high - bar.low) * y.scale);               //рисуем хвосты
                        if (x.scale > 2) canvas.fillRect(toX(i) - corX, toY(bar.open), corX * 2, -(bar.close - bar.open) * y.scale);     //рисуем тело
                    }
                }
            }

            drawCandles(this.defaultColor.barDw.color, (bar) => bar.open > bar.close);
            drawCandles(this.defaultColor.barUp.color, (bar) => bar.open <= bar.close);
        }
        //рисуем бары
        if (this.styleGraph.styleBar == "bar") {
            let width = x.scale * 0.1;
            if (width < 1) width = 1;

            function drawBars(color: string, condition: (bar: CBar) => boolean) {
                canvas.fillStyle = color; //
                for (let [i, bar] of bars.entries()) { //let i=startBar; i<=endBar; i++){ bar=bars[i];//вся функция отрисовки баров
                    if (condition(bar) == true) {
                        canvas.fillRect(toX(i), toY(bar.low), width, -(bar.high - bar.low) * y.scale);               //рисуем хвосты

                        if (x.scale > 2) {
                            canvas.fillRect(toX(i) - corX, toY(bar.open), corX, -3);
                            canvas.fillRect(toX(i), toY(bar.close), corX, -3);
                        }    //рисуем тело
                    }
                }
            }

            drawBars(this.defaultColor.barDw.color, (bar) => bar.open > bar.close)
            drawBars(this.defaultColor.barUp.color, (bar) => bar.open <= bar.close)
        }
        //рисуем график линией
        if (this.styleGraph.styleBar == "line") {
            canvas.strokeStyle = this.defaultColor.lineGraph.color;//disignnowT.barup;




            if (bars.length > 0) moveTo(0, bars[0].close);//установить начальное положение для линии
            _draw({show: true, data: bars.map(e=>e.close)})
            // for (let [i, bar] of bars.entries()) { //for (let i=startBar; i<=endBar; i++){ bar=bars[i];//вся функция отрисовки баров
            //     lineTo(i, bar.close);
            // }
            // canvas.stroke();
            // canvas.beginPath();
        }
    }


    private DrawIndicatorP = Draw2dIndicatorBase();

    protected DrawIndicator(canvas: CanvasRenderingContext2D, indicator: CIndicatorAND, bars: IBars|undefined  = this._history, window?: IGraphObjectB|undefined ){
        if (!this.compliteinit || !bars) return;
        const tf = this.symbolData?.tf
        if (!tf || !this._history) return;

        if (!indicator.visible) return;

        if (!window) window=indicator;
        if (!window) return;
        this.DrawIndicatorP.base({
            canvas,
            win: this._cwin.win,
            history: this._history,
            tf,
            TimeToBar: this.TimeToBar,
            window,
            indicator,
            styleGraph: this.styleGraph,
            size: this.display.size
        })
    }


    DrawClean(canvas: CanvasRenderingContext2D){
        const {width, height} = this.display.size;
        canvas.fillStyle = this.defaultColor.backgroundCanvas.color;//disignnowT.backgraound;
        canvas.clearRect(0, 0, width, height);
    }

    protected DrawBackgroundCanvas(canvas: CanvasRenderingContext2D){
        const {width, height} = this.display.size;
        // canvas.fillStyle = this.defaultColor.backgroundCanvas.color;//disignnowT.backgraound;
        canvas.fillStyle = '#16131c';
        canvas.fillRect(0, 0, width, height);
    }

    protected DrawGraf(canvas: CanvasRenderingContext2D, bars: IBars | undefined = this._history) {
        if (!this.compliteinit || !bars) return;
        if (!this.symbolData?.tf || !this._history) return;
        if (this.display.size.width== 0) return;

        const {x,y} = this._cwin.win;
        let pmin= x.pixmin - x.scale;

        const corX = x.scale * 0.4;
        const toY = (price: number) => (y.maxprice - price) * y.scale;
        const toX = (ibar: number) => (ibar - x.minBar) * x.scale + pmin + corX;
        this.DrawClean(canvas);

        if (x.minBar > bars.length) {
            const buf = x.maxBar - x.minBar;
            x.minBar = bars.length - 1;
            x.maxBar = x.minBar + buf;
        }
        const startBar: number = x.minBar > 0 ? x.minBar - 1 : 0;
        const endBar: number = Math.min(x.maxBar < bars.length - 1 ? x.maxBar + 1 : x.maxBar, bars.length - 1);

        {
            this.DrawBars(bars.data.slice(startBar, endBar + 1), canvas, (ibar) => toX(ibar + startBar), toY, corX);
        }
        if (this._indicators) {
            for (let indicator of this._indicators) {
                this.DrawIndicator(canvas,indicator, bars);
            }
          //  this.saveOldNewVisualInfo()
        }
        else {
            //потом надо расчширить бокс
        }
        if (this.box?.staticObject) {
            //      this.DrawIndicator(canvas,this.box.staticObject, bars);
        }
    }


    protected _lastprice: number = 0;
    protected _lasttstyle = new CColor('rgb(255,255,255)');

    _LastTick(can: CanvasRenderingContext2D) {
        const _history = this._history;
        if (!_history) return;
        const {width} = this.display.size;
        let win = this._cwin.win;

        let lastBar = _history.length - 1;
        let close = _history[lastBar].close;
        let _lastPriceY = Math.round((this._cwin.win.y.maxprice - close) * this._cwin.win.y.scale);

        if (this._lastprice > close) {
            this._lasttstyle = new CColor('rgb(16, 184, 144)').setHexString(this.defaultColor.barDw.color);
        }
        if (this._lastprice < close) {
            this._lasttstyle = new CColor('rgb(238,83,80)').setHexString(this.defaultColor.barUp.color);
        }
        this._lastprice = close;

        // ===
        let widthValue = can.measureText(this.toFixed(close)).width+12;

        can.beginPath();
        can.strokeStyle= this._lasttstyle.getString();
        can.fillStyle= this._lasttstyle.getString();;
        can.moveTo(width - widthValue, _lastPriceY - 7);
        can.lineTo(width - widthValue, _lastPriceY + 5);
        can.lineTo(width - widthValue-5, _lastPriceY - 2);

        can.closePath();
        can.fill();
        can.stroke();

        // ===

        can.fillStyle = this._lasttstyle.getString();
        if (lastBar <= win.x.maxBar) {
            let color = new CColor(this._lasttstyle);
            color.set(undefined, undefined, undefined, 0.2);
            can.strokeStyle = color.getString();

            can.moveTo(width - win.x.pixmax, _lastPriceY);
            //   can.lineTo(width-win.x.pixmax,close);
            can.lineTo(width - 60, _lastPriceY);
            can.stroke();
            can.beginPath();
        }

        // let widthValue = can.measureText(this.toFixed(close)).width+12;



        can.fillRect(width - widthValue, _lastPriceY - 8, widthValue, 14);
        can.fillStyle = '#FFF';
        can.font = '500 8px Inter';
        can.fillText(this.toFixed(close), width - widthValue + 5, _lastPriceY);

    }


    _DisplayOther(can: CanvasRenderingContext2D) {
        const {styleGraph} = this;
        const {styleMouse} = styleGraph
        if (styleMouse == "off") {
            return
        }
        const {height, width} = this.display.size;
        let mouse = this._cwin.mouse;
        can.strokeStyle = '#EA580C';

        if (styleMouse == "crossMini") {
            const deltaPx = 30;
            const budDeltaPix = deltaPx * 0.5;

            can.moveTo(mouse.x.pix, mouse.y.pix - budDeltaPix);
            can.lineTo(mouse.x.pix, mouse.y.pix + budDeltaPix);
            can.stroke();
            can.beginPath();
            can.moveTo(mouse.x.pix - budDeltaPix, mouse.y.pix);
            can.lineTo(mouse.x.pix + budDeltaPix, mouse.y.pix);
            can.stroke();
            can.beginPath();
            //   return;
        }

        if (styleMouse == "cross") {
            can.moveTo(mouse.x.pix, 0);
            can.lineTo(mouse.x.pix, height - 2);
            can.stroke();
            can.beginPath();
            can.moveTo(0, mouse.y.pix);
            can.lineTo(width - 2, mouse.y.pix);
            can.stroke();
            can.beginPath();
        }

        can.font = '500 8px Inter';
        // can.fillStyle = '#10B890';
        can.fillStyle = '#10B890';
        let widthValue = can.measureText(this.toFixed(this._cwin.win.y.maxprice - (mouse.y.pix / this._cwin.win.y.scale))).width+12;
        let widthValue2 = can.measureText(this._cwin.mouse.x.time.toLocaleDateString("en-GB", timeoptions)).width+12;
        can.fillRect(width - widthValue, mouse.y.pix - 8, widthValue, 14);

        can.beginPath();
        can.strokeStyle= '#10B890';
        can.fillStyle= '#10B890';
        can.moveTo(width - widthValue, mouse.y.pix - 7);
        can.lineTo(width - widthValue, mouse.y.pix - 7 + 12);
        can.lineTo(width - widthValue-5, mouse.y.pix - 1);

        can.closePath();
        can.fill();
        can.stroke();

        if (styleGraph.timeMouse) can.fillRect(mouse.x.pix - 40, height - 20, widthValue2, 14);

        can.fillStyle = '#FFFFFF';
        can.fillText(this.toFixed(this._cwin.win.y.maxprice - (mouse.y.pix / this._cwin.win.y.scale)), width - widthValue + 5, mouse.y.pix);
        if (styleGraph.timeMouse)  can.fillText(this._cwin.mouse.x.time.toLocaleDateString("en-GB", timeoptions), mouse.x.pix - 35, height - 12); // oLocaleString('ru-GB')

    } // крестик


    protected _SetTimeMouse() {
        const _history = this._history;
        if (!this.symbolData) return;
        const {tf} = this.symbolData
        if (!_history || !tf) return;

        const ti = this._cwin.mouse.x;
        let _tiD;
        if (ti.nbar < 0) {
            _tiD = _history[0].time.getTime() + ti.nbar * tf.sec * 1000;
        } else if (ti.nbar >= _history.length) {
            _tiD = _history[_history.length - 1].time.getTime() + (ti.nbar - _history.length + 1) * tf.sec * 1000;
        } else {
            _tiD = _history[ti.nbar].time.getTime();
        }
        ti.time.setTime(_tiD);

    }// Установка времени мышки

    protected __lastTimePrice: const_Date | undefined;
    protected __lastTimePriceMaxBar: const_Date | undefined;
    protected __lastMAxBars:number =0;
    protected __lastDate: const_Date | undefined;

    //
    MouseRefresh({history}:{history:IBars}) {
        if (!this._cwin.win.x.maxBar) {
            this._cwin.mouse.x.nbar = history.length-1;
        } else {
            this._cwin.RefreshMaousOnBar();
        }
        this._SetTimeMouse();
    }

    CheckLoadHistory() {
        this.historyL._checkAndLoadBars();
        this.historyL._checkAndLoadBars2();
    }

    //Обновить график, принудительно перерисовать включая все под индикаторы
    MouseTarget(ref?: boolean) {
        //console.warn("MouseTarget")
        const can = this.display.fon.canvas;
        const canW = this.display.work3d.canvas;
        if (!this.symbolData) {
            this.WaterSymbol2(can,"нет данных")
            return;
        }

        if (!this._history || this._history.count<2) {
           this.CheckLoadHistory();
           this.WaterSymbol2(can," ")

            if (this.box.staticObject?.text) this.WaterSymbolFunc(can,this.box.staticObject?.text?.() ?? "ожидаем" ?? this.textForWaterSymbol?.(), 240,58);
         //   if (this.textForWaterSymbol) this.WaterSymbolFunc(can,this.textForWaterSymbol(), 240,58);
            //console.log("меньше 3х баров не отображаем");
            return;
        }


        if (!this.compliteinit) {
            console.log("не завершена прочая инициализация");
            return;
        }

        if (ref) this.backgraundsave = true;
        const history = this._history;
        this.MouseRefresh({history})


        const lastTime = history.lastTime as Date
        this.__lastTimePrice??= lastTime;
        this.__lastMAxBars??= history.length
        // this.__lastTimePriceMaxBar??= this._history[this._cwin.win.x.minBar]?.time
        // если появляется новый бар и бар или бары и это происходит в пределах видимости, то происходит смещение на количество новых баров
        if (this.__lastTimePrice!=lastTime) {
            const {length} = history
            if (this.__lastMAxBars< length-1 && history[this.__lastMAxBars]?.time.valueOf()==this.__lastTimePrice.valueOf()) {
                if (this._cwin.win.x.pixmin<this._cwin.win.x.scale) {
                    this._cwin.win.x.minBar +=  length - this.__lastMAxBars -1
                    //  this._cwin.win.x.pixmin -=  this._cwin.win.x.scale
                }
                else {
                    this._cwin.win.x.pixmin -=  this._cwin.win.x.scale * (length - this.__lastMAxBars -1)
                }
                this._cwin.win.x.maxBar +=  length - this.__lastMAxBars -1
            }

            this.__lastMAxBars=length-1
            this.__lastTimePrice=lastTime
        }

        if (this.styleGraph.autoSizeGraph) {
            if (this._history.last!.high > this._cwin.win.y.maxprice || this._history.last!.low < this._cwin.win.y.minprice) {
                this.FGrafRef2();
            }
        }


        if (this.backgraundsave) {
            if (!this._testMode) {
                this.CheckLoadHistory();
            }
            this.Draw();
            this.backgraundsave = false;
        } else this.DrawPrice(can);

        this._LastTick(can);//изменение последнего тика
        this._DisplayOther(can);//крестик мышки
        this.ConsoleText(can); //текст всякий

        if (this.box.staticObject?.text) this.WaterSymbolFunc(can,this.box.staticObject?.text?.() ?? "ожидаем" , 240,58);
      //  if (this.textForWaterSymbol) this.WaterSymbolFunc(can,this.textForWaterSymbol(), 240,116);

    }//тут пока зачем то рисование всего графика пресутвует - по условию

    enablePreloaderImage = true;

    // запуск отображения гифки при расчёте индикаторов
    private runPreloaderImageViewer() {
        let img : PreloaderImage | undefined; // ReturnType<typeof ShowPreloaderImage> | undefined; //
        let calculating = false;
        return setInterval(()=>{
            const isCalculating= this._indicators?.indicators.some((ind)=>ind.isCalculating());
            const element= this.display.fon.element.parentElement;
            //if (this._indicators?.indicators[0]?.paramValues["animation"])
            if (isCalculating && element && this.enablePreloaderImage) {
                img ??= ShowPreloaderImage(element);
                if (!calculating) img.show(); //img.hidden= false;
                calculating= true;
                const ind0= this._indicators?.indicators.find((ind)=>ind.isCalculating());
                const startTimeVal= ind0?.calculationStartTime?.valueOf();
                if (ind0?.calculationProgress_percent!=null)
                    //img.setText(ind0.calculationProgress_percent.toFixed(0)+"%");;
                    img.setProgressState({percent: ind0.calculationProgress_percent, elapsed_ms: startTimeVal ? Date.now()-startTimeVal : undefined} );
            }
            else if (img && calculating) { img.hide();  img.setText("");  calculating=false; }
            //img?.remove();  img= undefined; }
            //img?.hhh();
            //if (isCalculating) console.log("Calculating");
        }, 50);
    }

    private _preloadImageTimer : NodeJS.Timer|undefined;

    Draw() {
        if (!this.compliteinit) return;
        this._preloadImageTimer ??= this.runPreloaderImageViewer();
        this.checkCanvasSize();
        const {display} = this;
        this.DrawGraf(display.work3d.canvas);
        this.DrawPrice(display.fon.canvas);
        this.CheckMouse(); //mouse
    }

    protected RePosition(): boolean {
        return this.display.Refresh();
    }

    checkCanvasSize() {
        if (this.RePosition()) {
            this.backgraundsave = true;
            if (this.compliteinit) {
                this.SinForX();
                this.FGrafRef2();
            }
        }
        return true
    }

    InitOtherWindows() {
        //console.trace()
        //  this.displayOther?.GetArray().map(e=>e.Delete())
        let data=this.displayOther.GetArray()
        let windows: {i: CIndicatorAND, w: IGraphObjectB }[] =[]

        if (this._indicators)
            for (const indicator of this._indicators) {
                indicator.windows.forEach((w)=>{windows.push({w, i:indicator})})
            }
        let dataWin = windows.map(e=>this.getGraphObjectId(e.w))
        let dataWin2 = data?.map(e=>e.idWindows)

        data?.forEach(
            e=>{if (dataWin.indexOf(e.idWindows)==-1) {
                console.log(e.idWindows," idWindows");
                e.Delete();
            }}
        )
        windows.forEach(
            e=>{
                if (dataWin2.indexOf(this.getGraphObjectId(e.w))==-1) {
                    new CGraphCanvasDop(this,{window:e.w,indicator:e.i})
                }
            }
        )

        //     this.nodeForGraph.GetFunkAll(e=>e?.graph?.checkCanvasSize())

    }

    private static _graphIdMap = new Map<IGraphObjectB, number>();
    private static _graphId = 0;

    protected getGraphObjectId(object : IGraphObjectB) : number {
        let id= CGraphCanvas._graphIdMap.get(object);
        if(id==null) CGraphCanvas._graphIdMap.set(object, id= CGraphCanvas._graphId++);
        return id;
    }

    DrawNow(canvas: CanvasContext2D) {
        this.MouseTarget();
        // super.DrawNow(canvas);
    }

    // _history:IBars;
    get _history(): IBars | undefined {
        return this.historyL.historyBars
    }

    //маштабирование колексиком
    protected SisWeel() {
        const {width} = this.display.size;
        const xwin = this._cwin.win.x;
        const xmouse = this._cwin.mouse.x;
        const {scale} = xwin;
        const {_history} = this;

        let pixMin = ((xmouse.pix - (scale >> 1)) % scale);

        let minBar = Math.floor(xmouse.nbar - ((xmouse.pix - pixMin) / scale));
        let maxBar = minBar + Math.trunc((width - pixMin) / scale);
        let pixMax = width - (maxBar - minBar) * scale - pixMin;
        if (_history && maxBar >= _history.length) {
            pixMax += (maxBar - _history.length + 2) * scale;
            maxBar = _history.length - 1;
        }
        if (minBar < 0) {
            pixMin += -1 * minBar * scale;
            minBar = 0;
        }
        xwin.minBar = minBar;
        xwin.maxBar = maxBar;
        xwin.pixmin = pixMin;
        xwin.pixmax = pixMax;
    };

    protected SinForX(reload:boolean=false) {
        const {_history, _cwin: {mouse, win: {x, y}}} = this;
        const {width} = this.display.size;
        const dist = 300 // расстояние мышки по умолчанию от правого края
        if (!_history) {
            return;
        }

        if (!x.maxBar || reload) {
            x.maxBar = _history.length - 1;
            mouse.x.nbar = x.maxBar;
            x.minBar = x.maxBar - Math.trunc((width-dist) / x.scale) - 1;// установка растояния по количеству баров
            x.pixmin = width - (x.scale * (x.maxBar - x.minBar));
            x.pixmax = dist;
            mouse.x.pix = width - dist;
        } else {
            mouse.x.nbar = BSearch(_history, mouse.x.time, (a, b) => a.time.valueOf() - b.valueOf(), -1);
            this.SisWeel();
        }
    }// синхронизирует график опираясь не время у бура у мышки

    protected neewdwin = new CGprrGeneral();//типо целевые значени окна - до куда идет анимация.... пока сделано так - так то надо переработать только не придумал как именно


    //выравнивание по высоте графика
    protected FGrafRef3(y = this.neewdwin.y) {
        const h = this._history;
        const cwin = this._cwin;
        const {maxBar, minBar} = cwin.win.x;
        const {height} = this.display.size;
        if (!h || !h[maxBar] || !h[minBar]) return;

        let [min, max] = [h[minBar].close, h[minBar].close];
        for (let i = minBar; (i <= maxBar) && h[i]; i++) {
            const {low, high} = h[i]
            if (min > low) min = low;
            if (max < high) max = high;
        }
        const heightBuf = (max - min) *  (cwin.win.y.size ** 3);
        y.maxprice = (max + min) * 0.5 + heightBuf;
        y.minprice = (max + min) * 0.5 - heightBuf;
        y.scale = height / (y.maxprice - y.minprice);
    };
//выравнивание по высоте графика
    protected FGrafRef2(h = this._history) {
        this.FGrafRef3(this._cwin.win.y)
    };

    //protected indicatorsGraph:CIndicatorAND[]=[];
    get indicators() {
        return this._indicators
    }

    GetIndicatorsClass() {
        return this._indicators
    }

    OnBars (data:tOnBars) {
        this.historyL.OnBars();
        this.MouseTarget(true);
    }

    OnHistory (history: IBars, type: tLoadBar) {
        this.historyL.OnHistory(history, type);
        if (type == "left") {
            const tickSize = this.symbolData?.link?.getInfo()?.tickSize || 0.001;
            this.fixed =  GetDblPrecision(tickSize, 8)
            if ((this._history?.count??0) > 2) this.compliteinit = true;
            else return;
            this.SinForX();
            this.FGrafRef2();
            this.GraphLastEffect();
            this.MouseTarget(true);

            this.displayOther?.forEach(item => {
                item.OnHistory(history,type)
                // if (this.box.symbolData) item.box.symbolData?.Set(this.box.symbolData.Get());
                // //   item.old.OnMouseMove(e,resource ?? {})
                // item._cwin.win.x.minBar =   this._cwin.win.x.minBar;
                // item._cwin.win.x.scale =    this._cwin.win.x.scale;
                // item._cwin.win.x._pixmin =  this._cwin.win.x._pixmin;
            })

            //   this._indicators.refresh().then(()=>{this.MouseTarget(true)});
        }

        if (this.__lastTimePrice && this._history?.lastTime && this.__lastTimePrice.valueOf()!=this._history?.lastTime.valueOf()) {
            this.MouseTarget(true);
        }
        this.InitOtherWindows();
        this.displayOther?.forEach(item => {

            // if (this.box.symbolData) item.box.symbolData?.Set(this.box.symbolData.Get());
            // //   item.old.OnMouseMove(e,resource ?? {})
            // item._cwin.win.x.minBar =   this._cwin.win.x.minBar;
            // item._cwin.win.x.scale =    this._cwin.win.x.scale;
            // item._cwin.win.x._pixmin =  this._cwin.win.x._pixmin;
        })
    }
    stopOnTick: boolean = false

    OnTicks (data: tSetTicks) {
        if (this.stopOnTick) return;
        // console.log("11111 ", this.symbolData?.symbol??"", data.ticks[0]?.price, data.ticks[0]?.time.toISOString())
        this.historyL.OnTicks(data);
        this.InitOtherWindows();
        this.MouseTarget(true);
    }
    protected _promiseSetSymbol = Promise.resolve();
    OnSetSymbol  (data: tInfoInit) {
        // что делать если произошла переустановка символа, работа с индикатором уже выполняется в боксе
        // необходимо настроить камеру, или параметр для оси х

        this.historyL.OnSetSymbol(data)

        const tickSize = this.symbolData?.link?.getInfo()?.tickSize || 0.001;
        this.fixed =  GetDblPrecision(tickSize, 8)
        this.SinForX();
        if (this.styleGraph.autoSizeGraph) this.FGrafRef2()
        const {autoSizeGraph} = this.styleGraph
        const {minBar,maxBar,scale:scaleX} = this._cwin.win.x
        const {maxprice,minprice,scale:scaleY} = this._cwin.win.y
        // console.log({autoSizeGraph,minBar,maxBar,scaleX,maxprice,minprice,scaleY})
        this.MouseTarget(true)
        this.displayOther?.forEach(item => {
            // if (this.box.symbolData) item.box.symbolData?.Set(this.box.symbolData.Get());
            // //   item.old.OnMouseMove(e,resource ?? {})
            item._cwin.win.x.minBar =   this._cwin.win.x.minBar;
            item._cwin.win.x.scale =    this._cwin.win.x.scale;
            item._cwin.win.x._pixmin =  this._cwin.win.x._pixmin;
            //   item.Draw();
        })
    }

    //клак хранить всяческие настройки графика
    protected styleGraph: CStyleAndSettingGraph = new CStyleAndSettingGraph();
    //хранит поставку котировок, котировки с индикаторами  и сам рапределяет тики между индикаторами
    //полностью самодостаточный компонент для получение сигналов


    boxConnect: boolean= false;
    callback: tListEvent<any, tSymbolCallback2>= {
        func: () => {
            return {
                onTick: (e)=>this.OnTicks(e),
                onHistory: (e,a)=>this.OnHistory(e,a),
                onBar: (e)=>this.OnBars(e),
                onSetSymbolData: (e)=>this.OnSetSymbol(e),
                Draw: ()=>{this.Draw()}
            }
        },
        OnDel: () => {
            console.warn("дисконект с основным боксом")
            this.boxConnect = false;
        }
    }

    readonly box :CSystemBox= new CSystemBox();

    SymbolReady(){return this.box.OnSymbolDate}

    //обертка для истории, для 2д холста - чтобы создать промежуточные массивы для конвертация времени в бар и прочее
    //закачка котировок при пдвижении экрана в лево
    historyL: CHistoryAndLoadGraph = new CHistoryAndLoadGraph({cwin: this._cwin, box: this.box})

    protected compliteinit = false;
    protected backgraundsave = true;
    protected mousetarget_ = false;

    //может быть undefined  пока идет процес загрузки списка символов
    get symbolData(): CSymbolData | undefined {
        return this.box.symbolData
    }

    get _indicators(): CIndicatorsAND | undefined {
        return this.box.indicators
    }

    defaultColor = new CCanvasColors();

    InitGraph() {
        this.SinForX();
        this.FGrafRef2();
        this.GraphLastEffect();
        this.compliteinit = true;
        this.backgraundsave = true;
    }

    readonly TimeToBar = (time: number): number => {
        return this.historyL.TimeToBar(time);
    }

    readonly Bar = (iBar: number): CBar|undefined => {
        return this.historyL.historyBars?.[iBar];
    }
    //точность знаков после запятой при переводе в строку
    protected fixed = 2;

    //точность знаков после запятой при переводе в строку
    toFixed(x: number | undefined, b?: number): string {
        return (x != undefined )? Number(x).toFixed(b ?? this.fixed) : "";
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
            let bar = BSearch(_history, time, (a, b) => {
                return a.time.getTime() - b.getTime()
            }, -1);
            this.GraphLastEffect((this._cwin.mouse.x.nbar - bar) * this._cwin.win.x.scale / this.replaymoveefectDefolt);
        }
    }

    TestMode() {

    }

    //для установки символа таймфрейма и прочее
    async SetInfo(info: tInfoInit) {
        this.symbolData?.Set(info)
        await this._indicators?.SetSymbol(info);
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
        //   Object.assign(this.styleGraph, styleGraph);
        this.styleGraph.Set(styleGraph)
        this.displayOther?.forEach(item => item.SetStyleAndSettingGraph(styleGraph))
        this.MouseTarget(true);
        this.GraphLastEffect();
    }

    Refresh() {
        this.GraphLastEffect();
        this.displayOther?.forEach(item => item.Refresh())
        return this.MouseTarget(true);
    }

    protected replaymoveefect = 0;
    readonly replaymoveefectDefolt = 1;

    protected efdx: number = 0;
    protected efdy: number = 0;
    protected effect: boolean = false;

    protected GrafEffectMoveTO(nbar: number = -1) {
        const _history = this._history
        if (_history) {
            this.replaymoveefect = 200;
            if (nbar == -1) nbar = _history.length - 1;
            this.efdx = (this._cwin.mouse.x.nbar - nbar) * this._cwin.win.x.scale / this.replaymoveefect;
            setTimeout(() => this.GraphLastEffectEv(), 15);
        }
    }// -1 - end bar

    protected GraphLastEffect(dx?: number, dy?: number) {
        const {win, mouse} = this._cwin
        const {animation} = this.styleGraph
        win.Save();

        if (dx) {
            this.efdx = dx;
            this.stopEffect = false;
            this.replaymoveefect = this.replaymoveefectDefolt;
        }
        {
            if (animation) {
                this.efdx = (mouse.x.pix - mouse.last.x.pix) * 1;
                this.replaymoveefect = this.replaymoveefectDefolt;
            }
            if (animation) {
                this.efdy = (mouse.y.pix - mouse.last.y.pix) * 1;
                this.replaymoveefect = this.replaymoveefectDefolt;
            }

            if (!this.effect) {
                if (this.efdx != 0 || this.efdy != 0) setTimeout(() => this.GraphLastEffectEv(), 15);
                else {
                    if (this.replaymoveefect > 0) this.replaymoveefect = 0;
                    setTimeout(() => this.GraphLastEffectEv(), 15);
                }
            }
        }
    }

    protected stopEffect: boolean = false;
    protected effectMoveTo: boolean = false;

    BarToPix(dBar: number): number {
        return dBar * this._cwin.win.x.scale;
    };

    TimeToPix(dTime: number): number {
        const tf = this.symbolData?.tf;
        if (!tf) console.log("ну установлен тф")
        return tf ? this.BarToPix(dTime / tf.valueOf()) : 0;
    };

    PriceToPix(dPrice: number): number {
        return dPrice * this._cwin.win.y.scale;
    };

    // moveData:
    GraphMoveTo(data: typeMoveTo) {
        this.displayOther?.forEach(item => {
            item.GraphMoveTo({...data})
        })
        this._GraphMoveTo({...data} );
    }
    protected _GraphMoveTo(data: typeMoveTo) {
        // const {_history} = this;
        // if (_history) {
        //     if (data.bar && data.bar.target<0) {
        //         if (_history!.time(0).valueOf() < -1 * data.bar.target * _history?.Tf.valueOf()) {
        //
        //         }
        //     }
        //
        //     if (data.time) {
        //         if (_history!.time(0).valueOf() < data.time.target) {
        //
        //         }
        //     }
        // }
        //

        if (data.repeat < 0) {
            this.effectMoveTo = false;
            this.stopEffect = true;
            return;
        }
        this.effectMoveTo = true;
        const cwin= this._cwin;
        let nowBar = cwin.mouse.x.nbar;
        let nowTime = cwin.mouse.x.time.valueOf();
        // const nowTime = (this._history![this._cwin.win.x.minBar].time.valueOf() +  this._history![this._cwin.win.x.maxBar].time.valueOf())/2 //[this._cwin.win.x.minBar].;// this._cwin.mouse.x.time.valueOf();
        let nowPrice = cwin.mouse.y.price;

        if (data.linkTo && data.linkTo!="mouse") {
            let [ibar, priceFunc] = (() : [number, ((bar :CBar)=>number)|undefined] => {
                switch (data.linkTo) {
                    case "left": return[cwin.win.x.minBar, (bar :CBar)=>bar.open];
                    case "right": return[cwin.win.x.maxBar, (bar :CBar)=>bar.close];
                    case "middle": return[Math.trunc((cwin.win.x.minBar + cwin.win.x.maxBar)/2), (bar :CBar)=>bar.close];
                    default: return [-1, undefined]
                }
            }) ();
            if (! priceFunc) return;
            nowBar= ibar;
            let bar= this.Bar(nowBar);  if (!bar) return;
            nowTime= bar.time.valueOf();
            nowPrice= priceFunc(bar);
            //console.warn(new Date(nowTime),"->",data.time?.target ? new Date(data.time.target) : "", data);
        }


        let {bar, time, price} = data;


        if (time && this.historyL.historyBars) {
            bar = { target: this.historyL.historyBars.indexOf(new Date(time.target), -1), speed: time.speed };;
            time= undefined;
        }

        if (bar?.speed) {
            if (bar.speed > 0 && bar.target < nowBar ||
                bar.speed < 0 && bar.target > nowBar
            ) {
                bar.speed = 0;
            }
        }
        if (time?.speed) {
            if (time.speed > 0 && time.target < nowTime ||
                time.speed < 0 && time.target > nowTime
            ) {
                time.speed = 0;
            }
        }
        if (price?.speed) {
            if (price.speed > 0 && price.target < nowPrice ||
                price.speed < 0 && price.target > nowPrice
            ) {
                price.speed = 0;
            }
        }

        if (data.repeat > 0) {
            if (bar?.target) {
                bar.speed = this.BarToPix((nowBar - bar.target) / data.repeat);
            }
            // некорректный способ!
            if (time?.target) {
                time.speed = this.TimeToPix((nowTime - time.target) / data.repeat);
            }
            if (price?.target) {
                price.speed = this.PriceToPix((nowBar - price.target) / data.repeat);
            }
        }

        if (!bar?.speed && !price?.speed && !time?.speed || data?.repeat <= 0) {
            this.effectMoveTo = false;
            if (this.stopEffect) this.GraphLastEffectEv();
            return;
        }

        if (time?.speed || bar?.speed || price?.speed) {
            data.repeat--;
            this.GrafMove2((bar?.speed) ? bar.speed : time?.speed ?? 10, price?.speed, this._cwin.win);
            this._cwin.RefreshMaousOnBar();
            this.MouseTarget(true);
            if (data.repeat>0) setTimeout(() => this._GraphMoveTo(data), 15);
        }
    }
    t: NodeJS.Timeout|undefined
    protected GraphLastEffectEv() {
        this.effect = true;
        this.GrafMove2(this.efdx, this.efdy, this._cwin.win);
        if (this.replaymoveefect < -20) {
            this.towayY = 0;//чтобы не повисло если вдруг выйдем за пределы видимости графика


            //режим отладки
        }//towayY
        if (this.efdx < 1 && this.efdy < 1) this.stopEffect = true;
        if (this.stopEffect) this.replaymoveefect = 0;
        if (this.replaymoveefect <= 0) {
            this.efdx = 0;
            this.efdy = 0;
        }
        this.MouseTarget(true);//отрисовкеа находиться тут
        if (this.replaymoveefect <= 0 && this.towayY <= 0) {
            clearTimeout(this.t);
            this.effect = false;
        } else {
            --this.replaymoveefect;
            this.t=setTimeout(() => this.GraphLastEffectEv(), 5);
        }
    }

    protected ConsoleTextData(printName :(s:string)=>void, printValue :(s:string|number)=>void){

        const h = this._history;
        const nbar = this._cwin.mouse.x.nbar;
        const bar = h?.at(nbar);

        printName("B: "+nbar
            +"   T: "+this._cwin.mouse.x.time.toLocaleDateString("en-GB", timeoptions));
        printName("O: "+this.toFixed(bar?.open)
            +"   H: "+this.toFixed(bar?.high)
            +"   L: "+this.toFixed(bar?.low)
            +"   C: "+this.toFixed(bar?.close)
            +"   V: "+this.toFixed(bar?.volume));

        //name("Подключенные индикаторы:");

        if (this._indicators?.length) {
            for (let indicators of this._indicators) {
                printName("______________________________");
                printName(indicators.name);
                for (let iBuffer of indicators.iBuffers) {
                    if (iBuffer.BarToString) {
                        printName(iBuffer.BarToString(nbar));
                    }
                }

                //name("______________________________");
            }
        }

    }

    protected ConsoleText(canvas: CanvasContext2D) {
        const ctx : CanvasContext2D = canvas;
        const h = this._history;
        const nbar = this._cwin.mouse.x.nbar;

        //     Gconst.timeconvert.setTime(h[nbar].time);
        if (this.mousetarget_) {
            ctx.strokeStyle = disignnowT.mousetargetON;
            const {x, y, height, width} = this.display.size;
            ctx.font = '8px Inter';
            let step: number = 0;
            let step2 = 18;
            let xLeft = 50;
            let medium = 170;
            ctx.fillStyle = disignnowT.textbigconsol;

            let lastStep:number=0;
            function printName(s:string) {
                ctx.fillText(s, xLeft, step += step2);
                lastStep=step;
            }
            function printValue(s:number|string) {
                ctx.fillText(String(s), medium, lastStep);
            }
            this.ConsoleTextData(printName,printValue)


        } else {
            if (this.defaultColor.textHL.switcher) {
                ctx.strokeStyle = this.defaultColor.mouseTarget.color;//disignnowT.mousetargetOFF;
                ctx.fillStyle = this.defaultColor.textHL.color;//disignnowT.textminiconsol;
                ctx.font = '10px Inter';
                let bar= h?.at(nbar);
                ctx.fillText((
                    "B: " + String(nbar)
                    + "   T: " + this._cwin.mouse.x.time.toLocaleDateString("en-GB", timeoptions)
                ), 10, 15);
                let offset = 10 + ctx.measureText("B: " + String(nbar)
                    + "   T: " + this._cwin.mouse.x.time.toLocaleDateString("en-GB", timeoptions)).width;

                ctx.fillText(("   O: "), offset, 15);
                offset += ctx.measureText(("   O: ")).width;
                ctx.fillStyle = this.defaultColor.lineGraph.color;
                ctx.fillText((this.toFixed(bar?.open)), offset, 15);
                offset += ctx.measureText(this.toFixed(bar?.open)).width;
                ctx.fillStyle = this.defaultColor.textHL.color;

                ctx.fillText(("   H: "), offset, 15);
                offset += ctx.measureText(("   H: ")).width;
                ctx.fillStyle = this.defaultColor.lineGraph.color;
                ctx.fillText((this.toFixed(bar?.high)), offset, 15);
                ctx.fillStyle = this.defaultColor.textHL.color;

                offset += ctx.measureText(this.toFixed(bar?.high)).width;
                ctx.fillText(("   L: "), offset, 15);
                offset += ctx.measureText(("   L: ")).width;
                ctx.fillStyle = this.defaultColor.lineGraph.color;
                ctx.fillText((this.toFixed(bar?.low)), offset, 15);
                ctx.fillStyle = this.defaultColor.textHL.color;

                offset += ctx.measureText(this.toFixed(bar?.low)).width;
                ctx.fillText(("   С: "), offset, 15);
                offset += ctx.measureText(("   С: ")).width;
                ctx.fillStyle = this.defaultColor.lineGraph.color;
                ctx.fillText((this.toFixed(bar?.close)), offset, 15);
                ctx.fillStyle = this.defaultColor.textHL.color;

                offset += ctx.measureText(this.toFixed(bar?.close)).width;
                ctx.fillText(("   V: "), offset, 15);
                offset += ctx.measureText(("   V: ")).width;
                ctx.fillStyle = this.defaultColor.lineGraph.color;
                ctx.fillText((this.toFixed(bar?.volume)), offset, 15);
                ctx.fillStyle = this.defaultColor.textHL.color;
            }
        }
        this.WaterSymbol(ctx);
    }

    protected WaterSymbolData() {
        if (this.box.staticObject?.text) return ""
        return this.symbolData?.symbol.toLocaleUpperCase() + " " + this.symbolData?.tf?.name
    }
    textForWaterSymbol : (()=>string) |undefined
    protected WaterSymbolFunc(canvas: CanvasContext2D, text: string , w=440, h=58) {
        if (!this.defaultColor.textWater.switcher) return;
        const can: CanvasRenderingContext2D = canvas;
        const {width,height} = this.display.size;

        canvas.fillStyle = this.defaultColor.backgroundCanvas.color;//disignnowT.backgraound;
        can.strokeStyle = this.defaultColor.textWater.color;//disignnowT.watersymbol;
        can.fillStyle = this.defaultColor.textWater.color;//"rgb(150,150,150)";//disignnowT.watersymbol;
        can.font = '48px Roboto';
        can.fillText( text, width - can.measureText(text).width, h);
    }

    protected WaterSymbol2(canvas: CanvasContext2D, text?:string|undefined) {
        if (!this.defaultColor.textWater.switcher) return;
        const can = canvas;
        const {width,height} = this.display.size;

        canvas.fillStyle = this.defaultColor.backgroundCanvas.color;//disignnowT.backgraound;
        canvas.clearRect(0, 0, width, height);
        can.strokeStyle = this.defaultColor.textWater.color;//disignnowT.watersymbol;
        can.fillStyle = this.defaultColor.textWater.color;//"rgb(150,150,150)";//disignnowT.watersymbol;
        can.font = '48px Roboto';
        can.fillText( text ?? this.WaterSymbolData(), width - 440, 58);
    }

    protected WaterSymbol(canvas: CanvasContext2D, text?:string|undefined) {
        if (!this.defaultColor.textWater.switcher) return;
        const can = canvas;
        const {width} = this.display.size;
        can.strokeStyle = this.defaultColor.textWater.color;//disignnowT.watersymbol;
        can.fillStyle = this.defaultColor.textWater.color;//disignnowT.watersymbol;
        can.font = '48px Roboto';
        can.fillText( text ?? this.WaterSymbolData(), width - 340, 58);
    }

    //ОБновить график, принудительно перерисовать включая все под индикаторы

    protected towayY: number = 0; // to way Y  пусть для синхронизации по высоте
    GrafMove2(dx: number = 0, dy: number = 0, win = this._cwin.win, autosize = this.styleGraph.autoSizeGraph) {
        if (!this.compliteinit) {
            return;
        }
        const _history = this._history;
        if (_history) {
            const {styleGraph} = this
            const {height} = this.display.size;
            const nlastbar = ((_history.length) - 1);
            if (styleGraph.animation) this.efdx = this.efdx * 0.98;
            if (styleGraph.animation) this.efdy = this.efdy * 0.98;
            let needY = this.neewdwin.y;
            //if (Math.abs(dx)>Math.abs(dy)*1.5)
            if (autosize) {
                this.FGrafRef3();

                //    this.FGrafRef2();
                this.towayY = this.replaymoveefectDefolt;
                if (win.step.y.maxprice == undefined) win.step.y.Res();
                let ymaxstep = (needY.maxprice - win.y.maxprice) / this.replaymoveefectDefolt;
                let yminstep = (needY.minprice - win.y.minprice) / this.replaymoveefectDefolt;
                if (Math.abs(win.step.y.maxprice) < Math.abs(ymaxstep)) win.step.y.maxprice = ymaxstep;
                if (Math.abs(win.step.y.minprice) < Math.abs(yminstep)) win.step.y.minprice = yminstep;

            }//тут будет авто подгон по высоте

            if (win.y.minprice != needY.minprice || win.y.maxprice != needY.maxprice) {//форматирование по высоте
                if (Math.abs(needY.maxprice - win.y.maxprice) < Math.abs(win.step.y.maxprice)) {
                    win.y.maxprice = needY.maxprice;
                    win.step.y.maxprice = 0.0;
                }
                if (Math.abs(needY.minprice - win.y.minprice) < Math.abs(win.step.y.minprice)) {
                    win.y.minprice = needY.minprice;
                    win.step.y.minprice = 0.0;
                }
                win.y.maxprice += win.step.y.maxprice;
                win.y.minprice += win.step.y.minprice;
                win.y.scale = height / (win.y.maxprice - win.y.minprice);

                if (win.y.scale < 0) {

                }

                this.backgraundsave = true;
            } else {
                this.towayY = 0;
                win.step.y.Res();
            }


            if (dx != 0) {//left click
                let xwin = win.x;
                xwin.pixmax -= dx;
                xwin.pixmin += dx;
                //    let xsum=xwin.pixmax-dx;
                if (xwin.pixmin > 0 || xwin.pixmin <= -1 * xwin.scale) {
                    let last = xwin.minBar;
                    xwin.minBar -= Math.round(xwin.pixmin / xwin.scale + 0.5);// xwin.pixmax+=Math.trunc(xsum/xwin.scale);}
                    if (xwin.minBar < 0) xwin.minBar = 0;
                    xwin.pixmin -= (last - xwin.minBar) * xwin.scale;
                }
                if (xwin.pixmax < 0 || xwin.pixmax >= xwin.scale) {
                    let last = xwin.maxBar;
                    xwin.maxBar += Math.round(xwin.pixmax / xwin.scale - 0.5);// xwin.pixmax+=Math.trunc(xsum/xwin.scale);}
                    if (xwin.maxBar > nlastbar) xwin.maxBar = nlastbar;
                    xwin.pixmax += (last - xwin.maxBar) * xwin.scale; //вроде верно))) как то больно быстро написал скоре всего гдето баг // тут надо отслеживать позицию правого бара --- надо бы перенести этот кусок кода

                } else {
                }
                this.backgraundsave = true;
            }

            if (dy != 0) {
                let ywin = win.y;
                ywin.maxprice += dy / ywin.scale;
                ywin.minprice += dy / ywin.scale;
                this.backgraundsave = true;
            }
        }

    }//само смещение графика
    //нажатие кнопок

    OnTouchend(e: tMouse) {
        if (!this.compliteinit) return;
        this.GraphLastEffect();



        let touchs = e.e.changedTouches; // [0] - это одно нажатие.... (типо 1 палец)
        if (touchs.length == 1) //одно нажатие и движение одно
        {

        }
        this._cwin.mouse.Save();

        this.displayOther?.forEach(item => item.old.OnTouchend(e))
    };

    protected _mouseMenu: boolean = false;

    OnMouseDown(e: tMouse) {
        if ((e.e.buttons) == (Gconst.CLICKSCRULL | Gconst.CLICKLEFT)) {
            this.mousetarget_ = !this.mousetarget_;
            if (this.mousetarget_) {
            } else {
            }
        }//если нажали скрул то рубильник перещелкнулся
        this.CheckMouse()
        this.displayOther?.forEach(item => item.old.OnMouseDown(e))
    };

    protected SizeY() {
        const mouse = this._cwin.mouse;
        const {height} = this.display.size;
        const dy = mouse.y.pix - mouse.last.y.pix;
        const yWin = this._cwin.win.y;
        yWin.size += dy / height;
        if (yWin.size < 0.01) yWin.size = 0.01;
        if (yWin.size > 4) yWin.size = 10;
    }

    protected SizeYNonAuto() {
        const mouse = this._cwin.mouse;
        const dy = mouse.y.pix - mouse.last.y.pix;
        const {width, height} = this.display.size;
        const y = this._cwin.win.y;
        // let hight = y.maxprice - y.minprice;
        // let koef = dy / hight;
        y.minprice -= dy / Math.abs(y.scale);
        y.maxprice += dy / Math.abs(y.scale);
        y.scale = height / (y.maxprice - y.minprice);
        //this._cwin.win.Save();
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

    //resource сли сигнал дублируеться из под окна чтобы отключить некоторые функции у ведомова окна
    OnMouseMove(e: tMouse, resource?:object) {
        if (!this.compliteinit) return;
        //if (!resource) this.mouseDelta(e);
        this.mouseDelta(e);

        this.displayOther?.forEach(item => {
            item._cwin.win.x.minBar =   this._cwin.win.x.minBar;
            item._cwin.win.x.scale =    this._cwin.win.x.scale;
            item._cwin.win.x._pixmin =  this._cwin.win.x._pixmin;
            if (resource!=item) item.old.OnMouseMove(e,resource ?? {})
        })

        const mouse =               this._cwin.mouse;
        const {autoSizeGraph} =     this.styleGraph;
        const dy = (!this.OnMouseMoveByPrice(e,resource)  && !autoSizeGraph && (!resource || resource==this) ) ?
            mouse.y.pix - mouse.last.y.pix :0;

        if (this.towayY > 0 || this.efdx > 0.0 || this.efdy > 0.0) this.GraphLastEffect();  //для анимации
        if (mouse.ev == Gconst.CLICKLEFT) this.GrafMove2(mouse.x.pix - mouse.last.x.pix, dy, this._cwin.win);
        this.MouseTarget();

    };//Тут надо кодить


    //Обновиться мышку
    mouseDelta(e: tMouse) {
        // this.displayOther?.forEach(item => {
        //     item._cwin.win.x.minBar=this._cwin.win.x.minBar;
        //     item._cwin.win.x.scale=this._cwin.win.x.scale;
        //     item._cwin.win.x._pixmin=this._cwin.win.x._pixmin;
        //     item.mouseDelta(e)
        // })

        const mouse = this._cwin.mouse;
        const {x, y} = this.display.size;
        if (mouse.last.ev == Gconst.CLICKLEFT) this.stopEffect = true;
        mouse.ev = e.e.buttons;
        mouse.Save();
        mouse.x.pix = e.x - x
        mouse.y.pix = e.y - y;
    }

    //Наведена ли мышка на ценовую панэль
    MouseOnPricePanel(){
        const mouse = this._cwin.mouse;
        const {width} = this.display.size;
        return mouse.ev == Gconst.CLICKLEFT && mouse.x.pix > width * 0.9
    }

    OnMouseMoveByPrice(e: tMouse, resource?:object) {
        if (!this.compliteinit) return false;


        const mouse = this._cwin.mouse;
        const {width} = this.display.size;
        const {styleGraph} = this;
        if (!resource && mouse.ev == Gconst.CLICKLEFT && mouse.x.pix > width * 0.9 ) {
            if (styleGraph.autoSizeGraph) this.SizeY();
            if (!styleGraph.autoSizeGraph) this.SizeYNonAuto();
            return true;
        }
        return false
    }


    OnMouseWheel(e: tMouse) {
        if (!this.compliteinit) return;
        //маштаб

        const {x} = this._cwin.win;
        let lscale = x.scale;
        const deltaY = e.e.deltaY
        if (deltaY!=0) {
            const data = x.scale * (deltaY<0? 1.5:0.8)
            const minstep = 0.1;
            x.scale = data > 2 ? Math.trunc(data) : (Math.trunc(data / minstep)) * minstep + minstep
        }
        // if (x.scale < 1.0) x.scale = 1;


        if (lscale != x.scale) {
            this.SisWeel()
            this.FGrafRef2();
            this.backgraundsave = true;
            this.MouseTarget();
        }

        this.displayOther?.forEach(item => item.old.OnMouseWheel(e))
    };

    OnMouseFinal(e: tMouse) {
        if (!this.compliteinit) return;
        this.GraphLastEffect();

        this._cwin.mouse.ResetEvent();

        this.displayOther?.forEach(item => item.old.OnMouseFinal(e))
    };

    OnMouseOver(e?: tMouse) {
        // if (!this.compliteinit) return;
        // this._cwin.mouse.ResetEvent();
        // this._cwin.mouse.Save();
        // this.MouseTarget();
        // if (this.styleGraph.animation) this.GraphLastEffect();
        // this.displayOther?.forEach(item => item.old.OnMouseOver(e))
    };

    OnMouseUp(e: tMouse) {
        if (!this.compliteinit) return;
    };

}


type tTimeTo = { nbars: number[], step: number, start: number };

class CHistoryAndLoadGraph implements ICHistoryAndLoadGraph{
    readonly cwin: CWinCC;
    readonly box: CSystemBox

    constructor({cwin, box}: { cwin: CWinCC, box: CSystemBox }) {
        this.cwin = cwin;
        this.box = box;

    }
    get historyBars() : IBars | undefined {return  this.box.history} ;

    loadBars: Promise<void|undefined> | null = null;
    get busy() {return !!this.loadBars}

    _checkAndLoadBars2(time2 = new Date()) {
        // const {symbolData, indicators} = this.box
        // console.log(" 33 ")
        // if (symbolData && symbolData.tf && this.historyBars?.lastTime)
        //     if (time2.valueOf() - symbolData.tf.valueOf() < this.historyBars.lastTime.valueOf()) return;
        //
        // console.log(" 44 ", time2, time2)
        // if (this.loadBars == null ) {
        //     this.loadBars =  (async () => {
        //         await symbolData?.loadHistory(time2, time2)
        //         this.loadBars = null;
        //         return
        //     } )()
        // }
    }

    //докачка графика с лево BarsLoad - количество закачиваемых баров, stepBarForLoad - шаг при котором наступает загрузка
    _checkAndLoadBars(BarsLoad = 900, stepBarForLoad = 500) {
        if (this.cwin.win.x.minBar > BarsLoad ) return;
        const {symbolData, indicators} = this.box
        if (this.loadBars==null) {
            this.loadBars = (async () => {
             //   const time = new Date(((symbolData?.history && symbolData.history.length > 1) ? symbolData.history[0].time : new Date()).valueOf() - ((symbolData?.tf.valueOf()) ?? 1000*60*60)*BarsLoad);
                await symbolData?.loadHistory(this.cwin.win.x.minBar ? BarsLoad: 499)
                this.loadBars = null;
                return
            } )()
        }
    }

    private _timeTo: tTimeTo = {nbars: [], step: 0, start: 0};

    InitTimeToBar() {//инциализация масива для перевода - время в бары
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
        for (let i = t.nbars[t.nbars.length - 1];  i < this.historyBars.count;  i++) {
            for (; _t < this.historyBars.time(i).valueOf(); _t += t.step) {
                t.nbars.push(i);
            }
        }
    }

    //перевод времени в бары, принимает значения valueOf
    TimeToBar = (time: number): number => {
        let n = Math.floor((time - this._timeTo.start) / this._timeTo.step);
        const bars: number[] = this._timeTo.nbars;
        if (n < 0) return n;
        if (n >= bars.length) return n - bars.length + (bars.length > 0 ? bars[bars.length-1] + 1 : 0);
        return bars[n];
    }

    OnBars = () => {
        //  if (this.box.symbolData) this.historyBars = this.box.history;
        this.LoadTimeToBar();
    }
    OnHistory = (history: IBars, type: tLoadBar) => {
        if (type == "left") {
            //  this.historyBars= this.box.history
            //  if (this.box.symbolData) this.historyBars = this.box.history;
            if (this.historyBars && this.historyBars.count > 2) {
            } else return;
            this.InitTimeToBar();
        }
    }
    OnTicks = (ticks: { ticks: readonly tTick[] }) => {
        //if (this.box.symbolData) this.historyBars = this.box.history;
    }
    protected _promiseSetSymbol = Promise.resolve();
    OnSetSymbol = (data: tInfoInit) => {
        if (!this.historyBars) this.cwin.win.x.minBar =0;
        this.InitTimeToBar();
        //это делается в боксе
        // this._promiseSetSymbol = this._promiseSetSymbol.then(async () => {
        //     if (this.box.indicators) {
        //         await this.box.indicators.SetSymbol(data);
        //     }
        // })
    }

}

type DataIndicator = undefined|{
    indicator:CIndicatorAND,
    window:IGraphObjectB
}
export class CGraphCanvasDop extends CGraphCanvas{
    private _dataIndicator: DataIndicator;
    idWindows:number;
    get dataIndicator(): DataIndicator {
        return this._dataIndicator;
    }
    set dataIndicator(value: DataIndicator) {
        this._dataIndicator = value;
        this.idWindows= this.getGraphObjectId(value!.window);
    }
    parentsGraph: CGraphCanvas;
    old: ICDivFuncMove;
    override InitCanvas(location: tGraphDiv, cor: ICContXY) {
        this.location = location;
        this.display = new CWinGraphDop(location.div!, cor)
        this.InitStyle();
    }
    protected styleGraphDop:tStyleAndSettingGraph= {} //объявлен в конструкторе
    override SetStyleAndSettingGraph(styleGraph: tStyleAndSettingGraph) {
        super.SetStyleAndSettingGraph({...styleGraph,...this.styleGraphDop});
    }

    constructor (baseWindows: CGraphCanvas, value?: DataIndicator) {
        const {location, nodeForGraph} = baseWindows
        const nodeNow = new CDivNode();
        nodeForGraph.parents!.getdown(nodeNow);
        nodeNow.height= ()=>100-nodeNow._h();
        super(location, nodeNow, nodeNow);
        if(value) this.dataIndicator=value
        this.styleGraphDop={
            time: false,
            timeMouse:false,
            styleMouse:"cross"
        }
        const symbols = baseWindows.symbolData?.Get();
        if (symbols) this.symbolData?.Set(symbols)
        this.defaultColor= baseWindows.defaultColor
        this.parentsGraph = baseWindows;

        this.idWindows= value ? this.getGraphObjectId(value.window) : 0;
        this.box.SetBox(baseWindows.box);
        //
        this.old={
            OnTouchmove:    (e:tMouse)=>super.OnTouchmove(e),
            OnTouchstart:   (e:tMouse)=>super.OnTouchstart(e),
            OnTouchend:     (e:tMouse)=>super.OnTouchend(e),

            OnMouseDown:    (e:tMouse)=>super.OnMouseDown(e),
            // OnMouseMove(e, второй параметр отменяет изменение размера по высоте)
            OnMouseMove:    (e:tMouse, r)=>super.OnMouseMove(e, r),
            OnMouseWheel:   (e:tMouse)=>super.OnMouseWheel(e),
            OnMouseFinal:   (e:tMouse)=>super.OnMouseFinal(e),
            OnMouseOver:    (e:tMouse)=>super.OnMouseOver(e)
        }
        //
        this.OnTouchmove=   (e)=>baseWindows.OnTouchmove(e)
        this.OnTouchstart=  (e)=>baseWindows.OnTouchstart(e)
        this.OnTouchend=    (e)=>baseWindows.OnTouchend(e)
        this.OnMouseDown=   (e)=>baseWindows.OnMouseDown(e)

        this.OnMouseMove=   (e)=>{baseWindows.OnMouseMove(e,this); super.OnMouseMove(e);};
        this.OnMouseWheel=  (e)=>baseWindows.OnMouseWheel(e)
        this.OnMouseFinal=  (e)=>baseWindows.OnMouseFinal(e)
        this.OnMouseOver=   (e)=>baseWindows.OnMouseOver(e)
        this.parentsGraph.displayOther??= new CListNode<CGraphCanvasDop>() // displayOther=
        const node=        this.parentsGraph.displayOther.AddEnd(this)
        this.Delete=        ()=>{
            node.DeleteLink();
            this.nodeForGraph.node?.DeleteLink()
            this.nodeForGraph.AllDel()

            CGraphCanvas.count--;
            this.callback.del?.();
            this.box.DeleteMini();
            this.nodeForGraph.graph=undefined;
            this.displayOther?.GetArray().map(e=>e.Delete())
            this.display.Remove();

        }
        this._cwin.win.y.size=0.82; // отвечает за зум окна, 100% - это видимая часть (ровна не пустотам) сверху и снизу
        this.SetStyleAndSettingGraph(baseWindows.GetStyleAndSettingGraph())


        this.display.Refresh();
        this.Refresh();
    }
    override CheckMouse(){}
    override CheckLoadHistory() {};

    override OnSetSymbol = (data: tInfoInit) => {
        // что делать если произошла переустановка символа, работа с индикатором уже выполняется в боксе
        // необходимо настроить камеру, или параметр для оси х
        super.OnSetSymbol(data);
    }

    override MouseRefresh({history}: { history: IBars }) {
        this._cwin.win.x.minBar =   this.parentsGraph._cwin.win.x.minBar;
        this._cwin.win.x.scale =    this.parentsGraph._cwin.win.x.scale;
        this._cwin.win.x._pixmin =  this.parentsGraph._cwin.win.x._pixmin;
        super.MouseRefresh({history});
    }

     protected override DrawGraf(canvas: CanvasRenderingContext2D, bars: IBars | undefined = this._history) {

        // this._cwin.win.x.minBar =   this.parentsGraph._cwin.win.x.minBar;
        // this._cwin.win.x.scale =    this.parentsGraph._cwin.win.x.scale;
        // this._cwin.win.x._pixmin =  this.parentsGraph._cwin.win.x._pixmin;

        if (this.display.size.width== 0) return;
        if (this._dataIndicator) {
            this.DrawClean(canvas)
            if (this.display.work3d.canvas) this.DrawClean(this.display.work3d.canvas)
            this.DrawIndicator(canvas, this._dataIndicator.indicator, bars, this._dataIndicator.window)
        }
        else {
            super.DrawGraf(canvas, bars);
        }


    //    this.saveOldNewVisualInfo()

    }
    DrawSizeIndicators(start:number, end:number){
        const iBuffers = this._dataIndicator?.window?.iBuffers
        let itog: {min:number, max:number}|undefined
        if (iBuffers) {
            for (let iBuffer of iBuffers) {
                const size = iBuffer.getDrawRange(start,end)
                if (size) {
                    itog??={...size}
                    if (itog.min>size.min) itog.min = size.min;
                    if (itog.max<size.max) itog.max = size.max;
                }
            }
        }
        return itog
    }
    override FGrafRef3(y = this.neewdwin.y) {
        if (this._dataIndicator) {
            const cwin = this._cwin;
            const {maxBar, minBar} = cwin.win.x;
            const {height} = this.display.size;
            const size = (this.DrawSizeIndicators(minBar,maxBar) ?? {max:1,min:0});
            const {max,min} = size
            const heightBuf = (max - min) * (cwin.win.y.size ** 3);
            y.maxprice = (max + min) * 0.5 + heightBuf;
            y.minprice = (max + min) * 0.5 - heightBuf;
            y.scale = height / (y.maxprice - y.minprice);
        }
        else super.FGrafRef3(y)


    }
     protected override WaterSymbolData() {
        return (this._dataIndicator?.indicator.name??this.symbolData?.symbol.toLocaleUpperCase()) + " " + this.symbolData?.tf?.name
    }

    override Draw() {
        if (!this.compliteinit) return;
        this.checkCanvasSize();
        const {display} = this;
        this.DrawGraf(display.work3d.canvas);
        this.DrawPrice(display.fon.canvas);
    }
    ParentsGraph() {return this.parentsGraph}
    override get _history(){
        return this.ParentsGraph()?._history
    }

    override get symbolData(){
        return this.ParentsGraph()?.symbolData
    }

    override InitOtherWindows() {}

    //ОБновить график, принудительно перерисовать включая все под индикаторы
    override MouseTarget(ref?: boolean) {
        super.MouseTarget(ref)

    }//тут пока зачем то рисование всего графика пресутвует - по условию

    protected override ConsoleTextData(name:(s:string)=>void, value:(s:string|number)=>void){

        const nbar = this._cwin.mouse.x.nbar;
        //name("Значение буферов данного окна:");

        if (this._dataIndicator) {
            name(this._dataIndicator.indicator.name);
            for (const iBuffer of this._dataIndicator.window.iBuffers)  if (iBuffer.BarToString) name(iBuffer.BarToString(nbar));
        }

        /*name("другие подключенные индикаторы:");

        if (this._indicators?.length) {
            for (let i = 0; i < this._indicators.length; i++) {
                const indicators =  this._indicators.indicators[i];
                name(indicators.name);
                for (const iBuffer of indicators.iBuffers) if (iBuffer.BarToString) name(iBuffer.BarToString(nbar));
                name("______________________________");
            }
        }*/

    }
    // protected DrawGraf(canvas: CanvasRenderingContext2D, bars: IBars | undefined = this._history) {
    //     if (this.dataIndicator) {
    //
    //     }
    //     super.DrawGraf(canvas, bars);
    // }
}


