import {AlignH, Color, ColorString, LineStyle, Point} from "../Nav/CGraphObject";

export type LabelType = "ArrowUp"|"ArrowDown";


type CanvasContext2D = CanvasRenderingContext2D //| OffscreenCanvasRenderingContext2D;

export abstract class CGraphLabel {
    readonly type : LabelType;
    //pointsObj? : Point[];
    point : Point;
    //static? : boolean;
    color : Color;
    style? : LineStyle;// = "solid";
    width? : number;// = 1;  // толщина линии
    text? : string;
    fill? : boolean;
    selected? : boolean;
    size : number = 1;// размер лэйбла
    //sizeAuto? : number; // размер лэйбла
    objectAlign? : AlignH;
    textAlign? : AlignH;// = "center";  // выравнивание текста
    tooltip? : string;  // всплывающая подсказка

    constructor(type :LabelType, color :Color, point :Point, size :number=1) {//}, sizeAuto?:number) {
        //this.sizeAuto = sizeAuto;
        this.type= type;
        this.color= color;
        this.point = point;
        this.size= size;
    }

    protected StyleInit(canvas :CanvasContext2D){
        canvas.beginPath();
        if (this.fill) {canvas.fillStyle=this.color;}
        if (this.color) {canvas.strokeStyle=this.color;}
    }
    protected StyleEnd(canvas :CanvasContext2D){
        canvas.strokeStyle=this.color;
        canvas.stroke();
        if (this.fill) {canvas.closePath(); canvas.fill();}
        canvas.beginPath();
    }

    Draw(timetoX: (time:number)=>number, toX: (ibar:number)=>number, toY: (price:number)=>number, canvas: CanvasContext2D|CanvasRenderingContext2D, scale: number){// scale - маштаб
        if (!this.point) {console.log("нет точки для отображения отметки"); return;}
        this.StyleInit(canvas);
        this.Draw_(timetoX, toX, toY, canvas, scale);
        this.StyleEnd(canvas);
    }
    protected abstract Draw_(timetoX: (time:number)=>number, toX: (ibar:number)=>number, toY: (price:number)=>number, canvas: CanvasContext2D, scale: number): void; // scale - маштаб
}

export type IGraphLabel = ReadonlyFull<CGraphLabel>


export class CArrow extends CGraphLabel {
    protected up :boolean;
    protected upShiftPixels : number;  // смещение в пикселях вверх
    protected scale :number;
    constructor(point :Point, up :boolean, color :ColorString, upShiftPixels=0, scale=1) {
        super(up ? "ArrowUp" : "ArrowDown", color, point);
        this.scale= scale;
        this.up= up;
        this.fill=true;
        this.upShiftPixels= upShiftPixels;
    }
    protected Draw_(timetoX: (time:number)=>number, toX: (ibar:number)=>number, toY: (price:number)=>number, canvas: CanvasContext2D, scale: number): void {// scale - маштаб
        canvas.strokeStyle=this.color;
        let x:number=toX(timetoX(this.point!.x));
        let y:number=toY(this.point!.y);
        let k=0.3;
        let nap= this.up ? -1 : 1;
        if (this.selected) { k=k*2;  canvas.fillStyle="rgb(255,185,0)"; }
        y += this.upShiftPixels;

        let size= (this.size * scale * k + 4) * this.scale;
        //пол умолчанию включили всегжа
        // if (this.sizeAuto || 1) {
        //     size= (this.size * scale * k *(this.sizeAuto??8)*10)**0.4;
        // }
        canvas.moveTo(x, y);
        canvas.lineTo(x+=nap*size, y+=-nap*1.5*size);
        canvas.lineTo(x+=-nap*size, y+=+nap*0.4*size);
        canvas.lineTo(x+=-nap*size, y+=-nap*0.4*size);
        //canvas.lineTo(x             ,y); линия завершиться и так
    }
}

export class CArrowUp extends CArrow{
    constructor(point:Point, color? :ColorString, upShiftPixels=0, scale=1) { super(point, true, color??"rgba(0,255,0,0.5)", upShiftPixels, scale); }//"rgb(250,250,250)"
}

export class CArrowDown extends CArrow{
    constructor(point:Point, color? :ColorString, upShiftPixels=0, scale=1) { super(point, false, color??"rgba(255,0,0,0.5)", upShiftPixels, scale); }//"rgb(250,250,250)"
}


export function newArrow(point:Point, direction : 1|-1, absShiftPixels=0, scale=1) {
    return direction==1 ? new CArrowUp(point, undefined, absShiftPixels, scale) : new CArrowDown(point, undefined, -absShiftPixels, scale);
}

