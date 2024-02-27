import {IBars} from "../Nav/Bars";
import {tStyleAndSettingGraph2} from "./canvas2d/Canvas2dStyle";
import {ICScaleBaseX,ICScaleBaseY} from "./canvas2d/Canvas2D";
import {ColorString, Color} from "./color";

export interface IBuffer
{
    readonly values? : readonly(number|undefined)[]
    readonly name? : string;
    readonly show?: boolean;
    Draw(canvas :CanvasRenderingContext2D, start:number, end:number, toX:(x :number)=>number, toY:(y :number)=>number, other?:{bars:IBars, style:tStyleAndSettingGraph2,  win: {x: ICScaleBaseX, y: ICScaleBaseY} }) : void;
    BarToString? (nBar:number) : string;
    //возвращает диапазон цен для отображения по высоте
    getDrawRange(startBar:number, endBar:number): {min:number, max:number}|undefined
}


export abstract class CBuffBaseA<T extends number|undefined = number|undefined> implements IBuffer {
    readonly values: T[] = []; //цена нумерация должна быть согласно основного графика
    abstract getColor(i :number) : string;
    abstract getWidth(i :number) : number;
    show: boolean = true

    Draw(canvas :CanvasRenderingContext2D, start:number, end:number, toX:(ibar:number)=>number, toY:(price:number)=>number){
        if (!this.show) return;
        let step=1;
        let lastColor="";
        let lastWidth=0;
        //let price : number|undefined;
        //if (++__count <3) { console.log("Draw: ",start,"-",end, "bufSize="+this.price.length, "color=",this.getColor(0),"\n", this.price); }
        //canvas.strokeStyle=this.color[0];
        const lineTo= (x:number,y:number)=>canvas.lineTo(toX(x),toY(y));
        const moveTo= (x:number,y:number)=>canvas.moveTo(toX(x),toY(y));
        for (let i=start; i<=end; i+=step) {
            let color= this.getColor(i);
            let width= this.getWidth(i);
            let price= this.values[i];// ?? price;
            if (this.values[i-1]==null && price) {
                moveTo(i, price);
            }
            if ((color && color!=lastColor) || width!=lastWidth) {
                canvas.stroke();
                canvas.beginPath();
                canvas.strokeStyle= color;
                canvas.lineWidth= width;
                lastColor= color;
                lastWidth= width;
                if (this.values[i-step]!=null)
                    lineTo(i-step, this.values[i-step]!);
            }
            if (price!=null) lineTo(i, price);
            //if (this.getWidth(i)) canvas.lineWidth= this.getWidth(i);
        }
        canvas.stroke(); canvas.beginPath();
    }

    // так же как и Draw является обязательным параметром.... в нем надо рассчитывать максимум и минимум в отображаемом подокне по высоте, ...... если окно статично то так и указываем в возвращаемых значениях статичные данные
    getDrawRange(startBar:number, endBar:number): {min:number, max:number}|undefined {
        if (this.values?.length) {
            const {values} = this;
            let min:number|undefined, max:number=0;
            for (let i=startBar; i<endBar; i++) {
                let value= values[i];
                if (value==undefined) continue;
                if (min==undefined) min=max=value;
                else
                if (value<min) min=value; else
                if (value>max) max=value;
            }
            // временно
            if (min==max && min!=null)
                if (min>0) min=0; else
                if (max<0) max=0;
            return min!=null ? {min, max} : undefined
        }
    }
    // style: undefined|{
    //
    // }
}


export class CBuffPriceBase<T extends number|undefined> extends CBuffBaseA<T> {
    readonly color:string[]=[];//цвет
    readonly width:number[]=[];//толщина
    getColor(i :number) { return this.color[i]; }
    getWidth(i :number) { return this.width[i]; }
    constructor({show}:{show:boolean} = {show:true}) {
        super();
        this.show=show;
    }
    BarToString(nBar:number) {return String(this.values[nBar] + (this.show?"":" *"))}
}

// буфер со значениями number|undefined
export class CBuffPriceNullable extends CBuffPriceBase<number|undefined> {
}


// буфер со значениями number
export class CBuffPrice extends CBuffPriceBase<number> {
}


export class CBuffColorBars implements IBuffer {
    readonly color:string[]=[];//цвет
    setColor(i :number, color:Color) { this.color[i] = color; }

    Draw(canvas: CanvasRenderingContext2D, start: number, end: number, toX: (x: number) => number, toY: (y: number) => number, other:{bars:IBars, style:tStyleAndSettingGraph2, win: {x: ICScaleBaseX, y: ICScaleBaseY}}): void {
        if (!other) return;
        const {bars, style, win} = other
        const {x,y} = win
        const corX = x.scale * 0.4;
        if (style.styleBar != "bar") {
            for (let i = start; i < end; i++) {
                if (this.color[i] && bars[i]) {
                    canvas.fillStyle = this.color[i];
                    const bar = bars[i]
                    canvas.fillRect(toX(i), toY(bar.low), 1, -(bar.high - bar.low) * y.scale);               //рисуем хвосты
                    if (x.scale > 2) canvas.fillRect(toX(i) - corX, toY(bar.open), corX * 2, -(bar.close - bar.open) * y.scale);     //рисуем тело
                }
            }
        }
        //рисуем бары
        if (style.styleBar == "bar") {

            let width = x.scale * 0.1;
            if (width < 1) width = 1;

            for (let i = start; i < end; i++) {
                if (this.color[i] && bars[i]) {
                    canvas.fillStyle = this.color[i];
                    const bar = bars[i]
                    canvas.fillRect(toX(i), toY(bar.low), width, -(bar.high - bar.low) * y.scale);               //рисуем хвосты

                    if (x.scale > 2) {
                        canvas.fillRect(toX(i) - corX, toY(bar.open), corX, -3);
                        canvas.fillRect(toX(i), toY(bar.close), corX, -3);
                    }    //рисуем тело

                }
            }

            // let width = x.scale * 0.1;
            // if (width < 1) width = 1;
            //
            // function drawBars(color: string, condition: (bar: CBar) => boolean) {
            //     canvas.fillStyle = color; //
            //     for (let [i, bar] of bars.entries()) { //let i=startBar; i<=endBar; i++){ bar=bars[i];//вся функция отрисовки баров

            //         }
            //     }
            // }

        }

    }

    getDrawRange(startBar: number, endBar: number): { min: number; max: number } | undefined {
        return undefined;
    }
}



// простой буфер с единым цветом и толщиной

export class CBuffSimple<T extends number|undefined = number|undefined> extends CBuffBaseA<T> {
    readonly color : ColorString;
    readonly width : number;
    readonly name? : string;
    constructor(data : {color :ColorString, lineWidth? :number, name? :string, show? :boolean} | ColorString) {
        const {color, lineWidth=1, name=undefined, show=true} = typeof data=="object" ? data : {color: data};
        super();
        this.color= color;
        this.width= lineWidth;
        this.name= name;
        this.show= show
    }
    getColor(i :number) { return this.color; }
    getWidth(i :number) { return this.width; }
    push(value :T) { this.values.push(value); }
    updateLast(value :T) { this.values[Math.max(this.values.length-1, 0)]= value; }
}



export class CBuffPriceHistogram<T extends number|undefined = number|undefined> extends CBuffPriceBase<T> {

    static Draw(buf: CBuffBaseA, canvas: CanvasRenderingContext2D, start: number, end: number, toX: (ibar: number) => number, toY: (price: number) => number) {
        if (!buf.show) {return;}
        const step=1;
        const corX = (toX(0)-toX(1))*0.4
        const y0 = toY(0)
        for (let i=start; i<=end; i+=step) {
            let color= buf.getColor(i);
            if (color) canvas.fillStyle = color;
            const val = buf.values[i];
            if (val) canvas.fillRect(toX(i) -corX , y0, corX*2,  toY(val) -y0);     //рисуем тело
        }
        canvas.stroke(); canvas.beginPath();
    }
    override Draw(canvas: CanvasRenderingContext2D, start: number, end: number, toX: (ibar: number) => number, toY: (price: number) => number) {
        CBuffPriceHistogram.Draw(this, canvas, start, end, toX, toY);
    }
    override BarToString(nBar:number) {return String(this.values[nBar])}
}


export class CBuffHistogramSimple<T extends number|undefined = number|undefined> extends CBuffSimple<T> {

    override Draw(canvas: CanvasRenderingContext2D, start: number, end: number, toX: (ibar: number) => number, toY: (price: number) => number) {
        return CBuffPriceHistogram.Draw(this, canvas, start, end, toX, toY);
    }
    BarToString(nBar:number) {return String(this.values[nBar])}
}