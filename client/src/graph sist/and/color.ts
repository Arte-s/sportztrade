import {ColorString, ColorRGB, ColorRGBA} from "../Nav/color";
export * from "../Nav/color";


export interface IColor extends ColorRGBA {
    getR(): number;
    getG(): number;
    getB(): number;
    getA(): number;
    getString(): ColorString;
    getHexString(): string; //24 или 32 битное значение
    getHexString32(): string; //32-битное значение
    getHexNumber(): number; //32-битное значение
    getHexNumberMini(): number; //24-битное значение
    equals(other :IColor) :boolean; // сравнение на равенство
    toStruct() : ColorRGBA;
    to(color : Partial<ColorRGBA>) : IColor;
}

export class CColor implements IColor {

    get r(): number {return this._r;}

    set r(value: number) {this._r = value; this._strHex=this._str=undefined;}

    get g(): number {return this._g;}

    set g(value: number) {this._g = value; this._strHex=this._str=undefined;}

    get b(): number {return this._b;}

    set b(value: number) {this._b = value; this._strHex=this._str=undefined;}

    get a(): number {return this._a;}

    set a(value: number) {this._a = value; this._strHex=this._str=undefined;}

    private _str?:ColorString;
    private _strHex?:string;
    private _r:number=0;
    private _g:number=0;
    private _b:number=0;
    private _a:number=1;
    private createStringRGB() {
        const hasA= this._a!=null && this._a!=1;
        return (hasA ? 'rgba' : 'rgb')+'('+ this._r + ',' + this._g + ',' + this._b + (hasA ?(','+this._a): '')+')' as ColorString;
    }

    constructor(int32: number);
    constructor(red: number, green: number, blue: number, alpha?: number);
    constructor(rgb? :ColorString|ColorRGBA);

    constructor(firstArg? :ColorString|IColor|ColorRGBA|number, g?: number, b?:number, a?:number) { //[red: number, green: number, blue: number, alpha?: number]){

        if (typeof(firstArg)=="string") {
            this.setString(firstArg as ColorString);
        }
        else
        if (typeof(firstArg)=="object") {
            if ((firstArg as IColor).getR!=null)
                this.setCopy(firstArg as IColor)
            else this.setStruct(firstArg as ColorRGBA);
        }
        else
        //if (typeof(rgbOrRedOrString)=="number")
        if (firstArg!=null && g==null)
            this.setHexNumber(firstArg);
        else this.set(firstArg ??0, g ??0, b ??0, a ?? 1);
    }
    set(r:number|null|undefined, g:number|null|undefined, b:number|null|undefined, a:number|null|undefined) {
        if (r!=null) this._r=r;
        if (g!=null) this._g=g;
        if (b!=null) this._b=b;
        if (a!=null) { this._a=a;  if (a<0 || a>1) throw "Wrong color alpha: "+a; }
        this._strHex=this._str=undefined;
        return this;
    }

    setStruct(color :Partial<ColorRGBA>) { this.set(color.red, color.green, color.blue, color.alpha);  return this; } //console.log("set ",color, "->", this);

    setCopy(color :IColor) {
        this.set(color.getR(), color.getG(), color.getB(), color.getA());
        //this.Set(color.red, color.green, color.blue, color.alpha)
        if (color instanceof CColor) { this._str= color._str;  this._strHex= color._strHex; }return this
    }
    getString(): ColorString { return this._str ??= this.createStringRGB(); }

    get red() { return this._r; }
    get green() { return this._g; }
    get blue() { return this._b; }
    get alpha() { return this._a; }

    toStruct() : ColorRGBA { return { red : this._r,  green : this._g,  blue : this._b,  alpha : this._a } }
    // преобразование в новый объект цвета
    to(color : Partial<ColorRGBA>) { return new CColor(this).setStruct(color); }
    //toString() { return this.GetString(); }

    getR(): number { return this._r; }

    getG(): number { return this._g; }

    getB(): number { return this._b; }

    getA(): number { return this._a; }

    setA(value :number) { this.set(null, null, null, value); }

    setString(rgbaOrHex :string) {
        let str= rgbaOrHex;
        let a = str.match(/^rgb?[\s+]?\([\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?/i);
        if (!a || a[1]==null) a= str.match(/^rgba?[\s+]?\([\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?/i);
        if (a) {
            let nums : number[]= a.slice(1).map((str)=>parseInt(str) );
            if (nums.length<3) { throw "не удалось распознать цвет: "+str; }
            for(let num of nums) if (isNaN(num)) { throw "не удалось распознать цвет: "+str; }
            this.set(nums[0], nums[1], nums[2], nums[3]);
        }
        else {
            this.setHexString(str)
        }
        return this
    };

    getHexString() { return (this._a!=1 && this.a!=null) ? this.getHexString32() : this.GetHexString24(); }

    getHexString32() { return this._strHex ??= "#" + this.getHexNumber().toString(16); }
    GetHexString24() { return this._strHex ??= "#" + this.getHexNumberMini().toString(16); }

    //в миним версии не учитывается прозрачность
    getHexNumberMini(): number {
        return ((this._r & 256) << 16) | ((this._g & 256) << 8) | ((this._b & 256));
    }

    getHexNumber() { return this.getHexNumberMini() | Math.round(this._a*255)<<24; }

    //в миним версии не учитывается прозрачность
    setHexNumberMini(int24: number) {
        let r = (int24 >> 16) & 255;
        let g = (int24 >> 8) & 255;
        let b = int24 & 255;
        this.set(r,g,b, 1);
        return this;
    }

    setHexNumber(int32 :number) { this.setHexNumberMini(int32);  this._a= (int32>>24) & 255; }

    static HexStrToNumber(str :string) {
        str= str.trim();  if (str[0]!="#") throw "Wrong string: "+str;
        let numStr= str.slice(1);
        let len= numStr.length;
        if (len<6 || len==7 || len>8) throw "Wrong string: "+str;
        let bigint = parseInt(numStr, 16);  if (isNaN(bigint)) throw "Wrong string: "+numStr;
        if (len==6) bigint |= 0xFF000000;
        return bigint;
    }

    setHexString(str: string) {
        let num= CColor.HexStrToNumber(str);
        this.setHexNumberMini(num);
        return this;
    }

    equals(other :IColor) { return this.red==other.red && this.green==other.green && this.blue==other.blue && this.alpha==other.alpha; }

    static fromHexString(str :string) { return new CColor().setHexString(str); }
    static fromString(str :string)    { return new CColor().setString(str); }
}