import {BSearch, SearchMatchMode} from "../Nav/Common";
import {IBuffer, IColor, CColor} from "../and/const";

export interface IZigNodeBase {
    readonly price: number;
    readonly nbarFull: number;
    readonly up: boolean;
    readonly time: const_Date;
    //readonly main : boolean;
}

export interface IZigNode extends IZigNodeBase {
    readonly nbar: number;
}

export type IZigNodeExt = IZigNode & { readonly color?: IColor; }
export type IZigNodeExtBase = IZigNodeBase & { readonly color?: IColor; }

export type ZigNodeID = {readonly [Symbol.species] : "ZigNodeID"};


export class CZigNode implements IZigNodeExt {
    // Update(price: number, nbarFull: number, time: const_Date, color?: IColor) {
    //     this.price = price;
    //     this.nbar = Math.trunc(nbarFull);
    //     this.nbarFull = nbarFull;
    //     this.time = time;
    //     this.color = color;
    // }
    constructor(price :number, nbarFull :number, time :const_Date, up :boolean, color? :IColor, id? :ZigNodeID) { //}, main = true) {
        //this.Init(price, nbar, time, color);
        this.price = price;
        this.nbar = Math.trunc(nbarFull);
        this.nbarFull = nbarFull;
        this.time = time;
        this.color = color;
        this.up = up;
        this.id= id ?? new class{readonly [Symbol.species] = "ZigNodeID"; }();  //{} as ZigNodeID}();
        //this.main= true;
    }

    static new(data: IZigNodeExtBase, id? :ZigNodeID) {
        return new CZigNode(data.price, data.nbarFull, data.time, data.up, data.color, id);
    }

    price: number;
    nbar: number;
    nbarFull: number;
    time: const_Date;
    color?: IColor;
    readonly up: boolean;
    readonly id: ZigNodeID;

    //main : boolean;

    toText(): string {
        return "\t\tprice " + String(this.price) + "   \t\tnbar " + String(this.nbar) + "   \t\ttime " + String(this.time)
    }
}

export abstract class IZig implements Iterable<IZigNode> {
    readonly [key: number]: void; //CCZigData;
    abstract [Symbol.iterator](): Iterator<IZigNode>; // {return this._data[Symbol.iterator]();}
    abstract readonly colorDefault: IColor;

    //abstract get mainPntIndex() : number;

    abstract get data(): readonly IZigNode[];

    // получение узла (свинга)
    abstract at(i: number): IZigNode;

    // последний узел (свинг)
    get last(): IZigNode { return this.at(-1); }

    get lastNullable(): IZigNode | null {
        return this.length > 0 ? this.last : null;
    }
    // число узлов
    get length(): number { return this.data.length; }
    // число узлов
    count(): number { return this.length; }
    // цена
    price(i: number = -1) : number { return this.at(i).price; }
    // номер бара
    nbar(i: number = -1) : number { return this.at(i).nbar; }
    // номер бара полный (с дополнительной дробной частью)
    nbarFull(i: number = -1) : number { return this.at(i).nbarFull; }
    // время
    time(i: number = -1) : const_Date { return this.at(i).time; }
    // направление вверх
    napUp(i: number = -1) : boolean { return this.at(i).up; }
    // направление вниз
    napDw(i: number = -1): boolean { return !this.at(i).up; }

    abstract id(i :number) : ZigNodeID;

    abstract isMain(i: number): boolean; // основная точка или второстепенная
    abstract isMain(): boolean;

    abstract lastMainIndex(i: number): number; // индекс последней (ближайшей) основной точки
    abstract lastMainIndex(): number;

    abstract juniorPointIndex(i: number): number | undefined;

    //abstract mainSwingPoint(i :number) : IZigData;
    abstract mainStartPrice(i: number): number | undefined;

    indexByBar(nbar: number, mode: SearchMatchMode = "equal", napUp?: boolean) {  // получить индекс бара
        let i = BSearch(this.data, nbar, (pnt, ibar) => pnt.nbar - ibar, mode);
        if (napUp != null && this.napUp(i) == napUp) return i;
        if (i >= 1 && this.nbar(i) == nbar && this.nbar(i - 1) == nbar) {
            i--;
            if (napUp != null && this.napUp(i) != napUp) return -1;
        }
        return i;
    }

    findByBar(nbar: number, mode: SearchMatchMode = "equal", napUp?: boolean) {
        let i = this.indexByBar(nbar, mode, napUp);
        return i >= 0 ? this.at(i) : null;
    }

    indexByTime(time: const_Date, mode: SearchMatchMode = "equal", napUp?: boolean) {  // получить индекс бара
        let i = BSearch(this.data, time, (pnt, pntTime) => pnt.time.valueOf() - pntTime.valueOf(), mode);
        if (napUp != null && this.napUp(i) == napUp) return i;
        if (i >= 1 && this.time(i).valueOf() == time.valueOf() && this.time(i - 1).valueOf() == time.valueOf()) {
            i--;
            if (napUp != null && this.napUp(i) != napUp) return -1;
        }
        return i;
    }

    // Копия точки зигзага:
    pointCopy(i: number = -1): CZigNode {
        let pnt = this.at(i);
        return CZigNode.new(pnt);
    }

    iHighest(ifrom: number, ito: number) {
        let [value, ipnt] = [Number.MIN_VALUE, -1];
        for (let i = ifrom; i <= ito; i++) if (this.price(i) > value) [value, ipnt] = [this.price(i), i];
        return ipnt;
    }

    iLowest(ifrom: number, ito: number) {
        let [value, ipnt] = [Number.MAX_VALUE, -1];
        for (let i = ifrom; i <= ito; i++) if (this.price(i) < value) [value, ipnt] = [this.price(i), i];
        return ipnt;
    }
}

export abstract class IZigExt extends IZig {
    abstract override readonly colorDefault: IColor;

    abstract infoForBar(i: number): string;

    abstract color(i: number): IColor | undefined;
}

export type IZigExt2 = Readonly<IZigExt & {
    volumes: readonly number[];
    avrgVolumes: readonly number[];
}>


export class CZig extends IZigExt { //implements Iterable<CZigData> {

    protected _data: Readonly<CZigNode>[] = [];
    protected _isMains: boolean[] = [];
    protected _mainPntIndex = 0;
    protected _juniorIndexes: (number | undefined)[] = [];
    //protected _mainSwingPnts : (IZigData|undefined)[] = [];
    protected _mainPrices: (number | undefined)[] = [];
    //get mainPntIndex() { return this._mainPntIndex; }
    colorDefault: IColor = new CColor('rgb(255,255,255)');

    clear() {
        this._data.length = 0;
        this._isMains = [];
        this._juniorIndexes = [];
        this._mainPntIndex = 0;
        this._mainPrices = [];
    }// this._mainSwingPnts= []; }
    get data(): readonly IZigNodeExt[] {
        return this._data;
    }

    private validateIndex(i: number) {
        let n = i < 0 ? this._data.length + i : i;
        if (n < 0 || n >= this._data.length) {
            console.error("обращение вне масива: i=" + i + " length=" + this.length);
            console.trace();
            throw("обращение вне масива: i=" + i + " length=" + this.length);
        }
        return n;
    }

    //private setJuniorPointIndex(i :number, jnrIndex :number) { this._juniorIndexes[this.validateIndex(i)]= jnrIndex; }

    // saveState() {
    //     return {
    //         length: this._data.length,
    //
    //     }
    // }

    crop(length: number) {  // уменьшить длину
        console.log("zigzag crop");
        if (length > this.length) throw "Попытка увеличить длину зигзага!";
        this._data.length = length;
        this._isMains.length = length;
        for (let i= length-1; i>=0; i--)
            if (this._isMains[i]) {
                this._mainPntIndex = i;
                return;
            }
        this._mainPntIndex = 0;
    }

    // добавить копию точки в конец, с проверкой её направления
    pushCopy(pnt: IZigNodeExtBase, main = true): IZigNodeExt {
        if (this.lastNullable?.up == pnt.up) throw "Направление новой точки зигзага совпадает с прошлой: новая точка #" + (this.length - 1) + " " + JSON.stringify(pnt);
        let obj = Object.freeze(CZigNode.new(pnt));
        this._data.push(obj);
        if (main) this._mainPntIndex = this.length - 1;
        this._isMains.push(main);
        return obj;
    }
    // обновить последнюю точку зигзага
    updateLast(data : Omit<IZigNodeExtBase,"up">) { //"price"|"time"|"nbarFull"|"color">) {//Readonly<{ price: number, nbarFull: number, time: const_Date, color?: IColor}>) { //pnt :IZigDataExtBase) {
        const i= this._data.length-1;
        if (i==-1) throw "Trying to update an element of empty zigzag";
        const oldData= this._data[i];
        if ((data as IZigNodeBase).up!=null && (data as IZigNodeBase).up!=oldData.up) throw "Wrong point direction";
        return this._data[i] = Object.freeze(CZigNode.new({...data, up: oldData.up}, oldData.id)); //{...this._data[i], price: data.price, nbarFull: data.nbarFull, time: data.time, color: data.color);
        //this.updateLast(this.data[0]);
    }

    // добавить копию точки в конец, её направление определить автоматически (противоположно направлению прошлой точки)
    pushCopyNext(pnt: Omit<IZigNodeExtBase, "up"> & { up?: undefined }, main = true): IZigNodeExt {
        if (this.length == 0) throw "Failed to call pushCopyNext for empty array!"
        return this.pushCopy({...pnt, up: !this.lastNullable!.up}, main);
    }

    setMain(i: number, iJuniorPointIndex: number, startMainPrice: number | undefined) { //mainSwingPnt : IZigData) {
        let n = this.validateIndex(i);
        this._isMains[n] = true;
        this._juniorIndexes[n] = iJuniorPointIndex;
        this._mainPrices[n] = startMainPrice;
        //this._mainSwingPnts[n]= Object.isFrozen(mainSwingPnt) ? mainSwingPnt : {...mainSwingPnt};
    }

    isMain(i: number = -1): boolean {
        return this._isMains[i < 0 ? this._data.length + i : i] ?? (() => {
            throw("обращение вне масива: i=" + i + " length=" + this.length)
        })();
    }

    mainStartPrice(i: number = -1) {
        i = this.validateIndex(i);
        return this._mainPrices[i];
    }

    //mainSwingPoint(i :number=-1) { i= this.validateIndex(i);  return this._mainSwingPnts[i]; }

    lastMainIndex(i: number = -1) {
        i = this.validateIndex(i);
        for (; i >= 0; i--) if (this._isMains[i]) return i;
        return -1;
    }

    juniorPointIndex(i: number): number | undefined {
        return this._juniorIndexes[this.validateIndex(i)];
    }

    [Symbol.iterator]() {
        return this._data[Symbol.iterator]();
    }

    at(i: number = -1): IZigNodeExt {
        let n = this.validateIndex(i);
        return this._data[n];
    }

    override get last(): IZigNodeExt {
        return this.at(-1);
    }

    override get lastNullable() {
        return this._data[this.length - 1] ?? null;
    }

    id(i :number) { return this._data[this.validateIndex(i)].id; }

    color(i: number = -1): IColor | undefined {
        return this.at(i).color;
    }

    infoForBar(i: number): string {
        return this._data[i].toText();
    }
}


export class CBufZig implements IBuffer { //extends CIndiBase {

    readonly data: IZigExt;
    readonly name: string | undefined; //() :string { return "none"; }
    majorZigzag?: IZig;
    juniorZigzag?: IZig;
    visible = true;
    //color:CColor=new CColor('rgb(255,255,255)');//'rgb(255,255,255)'
    width: number = 1;

    BarToString(nBar: number): string {
        const i = this.data.indexByBar(nBar, "lessOrEqual");
        if (i < 0) {
            console.trace();
            throw "Wrong bar index";
        }
        return this.data.infoForBar(i);
    }

    constructor(name?: string, data?: IZigExt, majorZig?: IZig, juniorZig?: IZig) {
        this.name = name;
        this.data = data ?? new CZig();
        this.majorZigzag = majorZig;
        this.juniorZigzag = juniorZig;
    }

    Draw(canvas: CanvasRenderingContext2D, iStart: number, iEnd: number, toX: (bar: number) => number, toY: (price: number) => number) {
        if (!this.visible) return;
        //return;
        let data = this.data;
        const lineTo = (bar: number, price: number) => canvas.lineTo(toX(bar), toY(price));
        const moveTo = (bar: number, price: number) => canvas.moveTo(toX(bar), toY(price));
        let start = data.indexByBar(iStart, -1);
        if (start < 0) start = 0;
        let end = data.indexByBar(iEnd, 1);
        if (end == -1) end = data.length - 1;
        let step = 1;
        let lastColor: IColor | undefined;
        let lastMain: boolean | undefined;
        let lastMajorIsSameBar: boolean | undefined;
        let juniorZigzag = this.juniorZigzag;

        for (let i = start; i <= end; i += step) {

            let color = data.color(i) ?? data.colorDefault;
            if (this.majorZigzag) {
                let isSameBar = this.majorZigzag.indexByBar(data.nbar(i)) >= 0;
                //let clr= color;
                if (isSameBar && lastMajorIsSameBar) { // если линия совпадает со старшим зигзагом, то делаем её частично прозрачной
                    color = new CColor({...color.toStruct(), alpha: color.getA() / 3});
                    // if (lastColor && !color.Equals(clr))
                    //     console.log("$$$$",color, clr);
                }
                lastMajorIsSameBar = isSameBar;
            }
            let isMain = data.isMain(i);

            if (isMain != lastMain || (isMain && data.mainStartPrice(i) != undefined) || color != lastColor) {
                canvas.stroke();
                canvas.beginPath();
                if (color != lastColor) {
                    canvas.strokeStyle = color.getString();
                    lastColor = color;
                }

                if (i > 0)
                    moveTo(data.nbar(i - 1), data.price(i - 1));

                if (isMain && i >= 2 && juniorZigzag) { //&& lastMain==false
                    let price = data.mainStartPrice(i) ?? data.price(i - 1);
                    // let iLastMain= data.lastMainIndex(i-1);
                    // if (iLastMain==-1) iLastMain= i;
                    // let iJnr= data.juniorPointIndex(iLastMain)!;
                    // if (data.napUp(i)!=data.napUp(iLastMain)) iJnr--;
                    // let price= juniorZigzag.price(iJnr);
                    //let price= data.price(i-2);
                    let k = (price - data.price(i - 1)) / (data.price(i) - data.price(i - 1));
                    // if (this.name=="Zig2" && data.time(i).valueOf()==Date.parse("2021-10-06 03:00"))
                    //     console.log("last:",data.time(i-1)," junior:",juniorZigzag.time(iJnr), "k:",k);
                    if (k > 0 && k < 1) {
                        //console.log("k=",k, "time=",data.time(i));
                        let x = toX(data.nbar(i - 1)) + (toX(data.nbar(i)) - toX(data.nbar(i - 1))) * k;
                        let y = toY(price);
                        canvas.setLineDash([8, 6]);
                        canvas.lineTo(x, y);
                        canvas.stroke();
                        canvas.beginPath();
                        canvas.moveTo(x, y);
                        //moveTo(data.nbar(i-1), data.price(i-1));
                    }
                    canvas.setLineDash([]);
                } else canvas.setLineDash(isMain ? [] : [8, 6]);

                lastMain = isMain;
            }

            lineTo(data.nbar(i), data.price(i));
        }
        canvas.stroke();
        canvas.beginPath();
    }

    getDrawRange(startBar:number, endBar:number): {min:number, max:number}|undefined {
        let i= this.data.indexByBar(startBar, "greatOrEqual");
        if (i==-1) return undefined;
        let min= Number.MAX_VALUE, max= Number.MIN_VALUE;
        for(; i<this.data.length; i++) {
            let price= this.data.data[i].price;
            min= Math.min(price, min);
            max= Math.max(price, max);
            if (this.data.data[i].nbar>=endBar) break;
        }
        return {min, max};
    }
}