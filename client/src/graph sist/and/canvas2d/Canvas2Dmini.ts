import {CCanvasBase} from "./Canvas2D";
import {ICContXY} from "../vgraf3";
import {CBar} from "../../Nav/Bars";
import {ColorString} from "../../Nav/CGraphObject";
import {DistancePointToLine2D, DistancePointToLine2DBoolean, SearchMaxMinByArray} from "./Canvas2DCommon";
import {waitRun} from "../../../commons/commons";


export type tCanvas2DMiniData = {
    [key : string] : CBar[];
}

export type tCanvasMini = {show: boolean, name?: string, data: number[], color?: ColorString}
// export type tICCanvas2DMiniData = {key: tKey, data: tCanvasMini}

type tKey = string|number
export type tSetEventByOnFocus = ({x: number, y: number} & tCanvasMini & {delta: number, key: tKey, nowData: number})
export interface ICCanvas2DMini {
    html: HTMLDivElement
    display: CCanvasBase
    map: Map<tKey, tCanvasMini>;
    switchWaterSymbol2: boolean;
    readonly total:tCanvasMini
    setCor(cor: ICContXY): void;
    setHtml({html, cor, result}: { html: HTMLDivElement, cor?: ICContXY, result?: boolean }): void;
    RefreshSize(): void;
    addData2(key: tKey, data: tCanvasMini): void;
    getByKey(key: tKey): tCanvasMini | undefined;
    clean(key?: tKey): void;
    SetData(data: number[]): void;
    getMaxMin(): { min: number; max: number };
    getLengthX(): number| undefined;
    WaterSymbol2({text, y, x, color}: { text: string, x: number, y: number, color: ColorString }): void;
    totalCalculate():number
    setGradient(data: {color1?: ColorString, color2?: ColorString}): void
    offGradient(): void
    // данный ключ рисуется поверх остальных
    Draw(key?:tKey|null): void;
    setEventByOnFocus(func: (data: (tSetEventByOnFocus)) => void):    void
}

export class CCanvas2DMini implements ICCanvas2DMini {
    html!: HTMLDivElement
    display!: CCanvasBase

    setCor(cor: ICContXY) {
        this.display.cor = cor;
        this.display.RefreshSize();
    }

    setHtml({html, cor, result}: { html: HTMLDivElement, cor?: ICContXY, result?: boolean }) {
        this.switchWaterSymbol2 = result ?? true
        this.html = html;
        const _cor: ICContXY = cor ?? {
            x: () => 0,
            y: () => 0,
            width: () => html.offsetWidth,
            height: () => html.offsetHeight,
        }
        this.display = new CCanvasBase(html, _cor)
        this.display.RefreshSize();
        this.focusMouse()
    }

    map: Map<tKey, tCanvasMini> = new Map<tKey, tCanvasMini>()

    RefreshSize() {
        this.display.RefreshSize()
    }

    constructor(data?: {html: HTMLDivElement, cor?: ICContXY, result?:boolean}) {
        if (data) this.setHtml(data)
    }

    addData2(key: tKey, data: tCanvasMini) {
        const {map} = this
        map.set(key, data)
    }

    getByKey(key: tKey) {
        const {map} = this
        return map.get(key)
    }

    //очищает все если не указан ключ
    clean(key?: tKey) {
        const {map} = this
        if (key) map.delete(key)
        else map.clear()
    }

    SetData(data: number[]) {


    }

    getMaxMin() {

        const arr = [...this.map.values()].map(e=>e.data)
        if (this.total.show) arr.push(this.total.data)
        return SearchMaxMinByArray(arr)
        //
        // const {map} = this
        // let max: number
        // let min: number
        // let buffer = map.entries()
        // for (let [key, {show, data}] of buffer) {
        //     if (show && data?.length) {
        //         max ??= data[0]
        //         min ??= data[0]
        //         for (let datum of data) {
        //             if (max < datum) {
        //                 max = datum
        //             }
        //             if (min > datum) {
        //                 min = datum
        //             }
        //
        //         }
        //     }
        // }
        //
        // if (this.total.show) {
        //     const {data} = this.total
        //     max ??= data[0]
        //     min ??= data[0]
        //     for (let datum of data) {
        //         if (max < datum) {
        //             max = datum
        //         }
        //         if (min > datum) {
        //             min = datum
        //         }
        //     }
        // }
        //
        // max ??= 1
        // min ??= 0
        // return {max, min}
    }


    getLengthX() {
        const {map} = this
        let max: number | undefined = undefined;
        let buffer = map.entries()
        for (let [key, {show, data}] of buffer) {
            if (show && data?.length) {
                if (max == undefined || max < data.length) max = data.length
            }
        }
        return max
    }

    switchWaterSymbol2: boolean = true
   // total: boolean = true
    WaterSymbol2({text, y, x, color}: { text: string, x: number, y: number, color: ColorString }) {

        const {display: {canvas}} = this
        canvas.font = '500 8px Inter';
        canvas.fillStyle = color
        canvas.fillText(text, x, y);
    }
    readonly total :tCanvasMini= {show:true, data:[], color:"rgb(0,255,0)"}
    totalCalculate(){
        const {map} = this
        const {data} = this.total
        data.length=0
        data[0]=0
        if (!this.total.show) return 0
        let total =0
        for (const [,value] of map) {
            if (!value.show) continue
            total++
            let b = 0
            value.data.forEach((v, index, array)=>{
                data[index]??= 0
                data[index] += v
                b=v
            })
        }
        return total
    }
    fill = false
    private _gradient?: {color1?: ColorString, color2?: ColorString}
    setGradient(data: {color1?: ColorString, color2?: ColorString}) {
        this._gradient = data
        this.fill = true
    }

    offGradient(){
        this.fill = false
    }
    deltaFocus = 30

    wait = waitRun().refreshAsync2

    DrawAsync(key?:tKey|null){
        this.wait(50,()=>{
            this.Draw(key)
        })
    }
        // tCanvasMini & {delta: number, key:tKey}
    _onFocus?: (data: tSetEventByOnFocus) =>void
    setEventByOnFocus(func :  ((data: tSetEventByOnFocus) => void) ){
        this._onFocus = func
    }

    onFocus({x,y}: {x: number,y: number}){

        const scaleY = this.scaleY
        const scaleX = this.scaleX
        const toX = this.toX
        const toY = this.toY

        if (scaleY && scaleX && toX && toY) {
            const pozX = x/scaleX
            const pozY = x/scaleY
            const p = Math.floor(pozX)
            const arr: (tCanvasMini & {delta: number, key:tKey})[] = []
            this.map.forEach((e,key)=>{
                const [x1,y1,x2,y2] = [
                    toX(p), toY(e.data[p]),
                    toX(p+1), toY(e.data[p+1])
                ]
                const buf = DistancePointToLine2DBoolean({line: {x1,y1,x2,y2}, point: {x,y}, delta: this.deltaFocus})
                if (buf!=-1) {
                    arr.push({...e, delta: buf, key})
                }
            })
            arr.sort((a, b)=>a.delta-b.delta)
            if (arr[0]) {
                this.DrawAsync(arr[0].key)
                this._onFocus?.({x,y,...arr[0], nowData: arr[0].data[p]})
            }
        }
        return
    }

    focusMouse(){
        const {element} = this.display
        element?.addEventListener("mousemove",(e)=>{
            const t=element.getBoundingClientRect();

            const [x,y] = [e.x-t.x, e.y-t.y]
            this.onFocus({x,y})
            /*
            this.x=e.touches[0].pageX-this.divX;
            this.y=e.touches[0].pageY-this.divY;
            * */
        })

    }

    selectByKeys(...keys: tKey[]){

    }

    // данный ключ рисуется поверх остальных

    protected scaleY: number|undefined
    protected scaleX: number|undefined
    protected toY: ((price: number) => number)|undefined
    protected toX: ((nBar: number) => number)|undefined

    Draw(key?:tKey|null) {
        const {display, map} = this
        const {canvas, cor} = display

        let buf =0
        display.RefreshSize()
        const width = cor.width();
        const height = cor.height();
        const y = this.getMaxMin();
        const scaleY = height / (y.max - y.min)
        const x = this.getLengthX()

        if (x == undefined) return

        let wToText = this.switchWaterSymbol2 ? 100 : 0;
        const scaleX = (width - wToText) / (x)


        const toY = (price: number) => height * 0.04 + (y.max - price) * (scaleY * 0.92)
        const toX = (nBar: number) => nBar * scaleX

        const lineTo = (ibar: number, price: number) => canvas.lineTo(toX(ibar), toY(price));
        const moveTo = (ibar: number, price: number) => canvas.moveTo(toX(ibar), toY(price));

        this.scaleX = scaleX
        this.scaleY = scaleY
        this.toY = toY
        this.toX = toX


        const _draw = ({show, data, color}: tCanvasMini) => {
            if (show) {
                if (!(data?.length)) return;
                buf++
                color ??= "rgb(210,210,210)"
                canvas.strokeStyle = color
                let text = data[data.length - 1].toFixed(2)
                if (this.switchWaterSymbol2) this.WaterSymbol2({
                    text,
                    x: toX(data.length - 1) + 10,
                    y: toY(data[data.length - 1]) + 5,
                    color
                })

                canvas.strokeStyle = color ?? "rgb(210,210,210)"
                for (let i = 0; i < data.length; i++) {
                    lineTo(i, data[i]);
                }
                if (this.fill && data.length) {
                    lineTo(data.length-1, data[data.length-1])
                    lineTo(data.length-1, y.min);
                    lineTo(0, y.min);
                    canvas.closePath();
                    const gradient = canvas.createLinearGradient(0, 0, 0, height);
                    gradient.addColorStop(0, this._gradient?.color1 ?? "rgba(243,186,47,0.76)")
                    gradient.addColorStop(1, this._gradient?.color2 ?? "rgba(112,89,255,0)")
                    canvas.fillStyle = gradient;
                    canvas.fill();
                    canvas.beginPath();

                    const gradient2 = canvas.createLinearGradient(0, 0, 0, height*1.1);
                    gradient2.addColorStop(0, this._gradient?.color1 ?? "rgb(243,186,47)")
                    gradient2.addColorStop(1, this._gradient?.color2 ?? "rgb(112,89,255)")

                    for (let i = 0; i < data.length; i++) {
                        lineTo(i, data[i]);
                    }
                    canvas.strokeStyle = gradient2;
                    canvas.stroke();
                }
                else {
                    canvas.stroke();
                }
                canvas.beginPath();
            }
        }

        let n = map.entries()
        canvas.clearRect(0, 0, width, height) // очищение холста
        for (let [_key, data] of n) if (key!=_key) _draw(data)
        if (this.total.show && map.size>1 && buf>1) _draw(this.total)
        //рисуем последний ключ
        if ((key != undefined) && map.has(key)) _draw({...map.get(key)!, color: "rgb(210,210,210)"})
    }
}
