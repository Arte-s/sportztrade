

enum __E_TF {
    S1=1,  S2, S3, S4, S5, S6, S10, S12, S15, S20, S30,
    M1, M2, M3, M4, M5, M6, M10, M12, M15, M20, M30,
    H1,H2,H3,H4,H6,H8,H12,
    D1,
    W1
};

export const H1_S = 3600;
export const D1_S = 3600*24;
export const W1_S = D1_S * 7;

export const W1_MS= W1_S * 1000;
export const D1_MS= D1_S * 1000;
export const H1_MS= H1_S * 1000;
export const M1_MS= 60 * 1000;

const __Tf_S= [0, 1, 2, 3, 4, 5, 6, 10, 12, 15, 20, 30,  60, 120, 180, 240, 300, 360, 600, 720, 900, 1200, 1800,  H1_S, H1_S*2, H1_S*3, H1_S*4, H1_S*6, H1_S*8, H1_S*12, D1_S ,W1_S];

type __E_TF_KEY = keyof typeof __E_TF;


export function GetEnumKeys<TT extends {[key:string]:any}> (T :TT) : readonly (keyof typeof T)[] { return Object.keys(T).filter(k => isNaN(k as any)); }
//-------------------------------------

export class TIME_UNIT {
    readonly index : number;
    readonly msec : number;
    readonly sec: number;
    readonly name :string;
    readonly sign :string;
    private static _lastIndex=0;

    private constructor(msec : number, name: string, shortName :string) {
        this.index= ++TIME_UNIT._lastIndex;
        this.msec= msec;  this.sec= Math.floor(msec/1000);
        this.name= name;  this.sign= shortName;
    }
    static readonly MSecond : TIME_UNIT= new TIME_UNIT(1, "millisecond", "MS");
    static readonly Second : TIME_UNIT= new TIME_UNIT(1000, "second", "S");
    static readonly Minute : TIME_UNIT= new TIME_UNIT(60*1000, "minute", "M");
    static readonly Hour : TIME_UNIT= new TIME_UNIT(H1_S*1000, "hour", "H");
    static readonly Day : TIME_UNIT= new TIME_UNIT(D1_S*1000, "day", "D");
    static readonly Week : TIME_UNIT= new TIME_UNIT(D1_S*1000*7, "week", "W");
    readonly [key : number] : void;
    //static readonly all : readonly TIME_UNIT[] = []
}

declare type Nominal<T, Name extends string> = T & { readonly [Symbol.species]: Name; }

export type TFIndex = Nominal<number, 'TFIndex'>;


export interface IPeriod
{
    readonly msec : number;
    readonly name : string;
    //readonly [key : number] : void;
}


export class TF implements IPeriod
{	// Секунды
    readonly sec : number;
    // Миллисекунды
    readonly msec : number; //   get  msec() : number { return this.sec*1000; }
    readonly name : string;
    // единица измерения
    readonly unit : TIME_UNIT;
    // количество единиц
    readonly unitCount : number;
    readonly index : TFIndex; //number;
    readonly [key : number] : void;  // для запрета использования индексации
    valueOf() { return this.msec; }
    toString() { return this.name; }

    private constructor(sec : number, name : string) {
        this.sec= sec;  this.name=name;
        this.msec= sec*1000;
        this.index= __Tf_S.indexOf(sec) as TFIndex;
        this.unit= sec%D1_S==0 ?  TIME_UNIT.Day :   sec%H1_S==0 ?  TIME_UNIT.Hour :  sec%60==0 ?  TIME_UNIT.Minute  : TIME_UNIT.Second;
        this.unitCount= sec / this.unit.sec;
    }
    // Получение таймфрейма по имени
    static get<T extends string>(name : T) : TF|(T extends __E_TF_KEY ? never : null) {
        let key= __E_TF[name as __E_TF_KEY];  if (key) return this.all[key];  return null as (T extends __E_TF_KEY ? never : null);
    }
    // Получение таймфрейма по имени
    static fromName<T extends string>(name : T)  { return this.get(name); }
    // Получение таймфрейма из секунд
    static fromSec(value : number) : TF|null { return this._mapBySec[value]; }

    static readonly all : readonly TF[] = function() {
        let i=1;
        let arr : TF[]= [];
        for(let key of GetEnumKeys(__E_TF)) { arr[__E_TF[key]]= new TF(__Tf_S[i], key);  i++; }
        return arr;
    }();

    private static readonly _mapBySec  = function() {
        let map : { [key :number] : TF|null } = {};
        for(let i of __Tf_S.keys())  map[__Tf_S[i]]= TF.all[i];
        return map;
    }();
    static readonly S1 : TF = TF.get("S1");
    static readonly M1 : TF = TF.get("M1");
    static readonly M5 : TF = TF.get("M5");
    static readonly M15 : TF = TF.get("M15");
    static readonly M30 : TF = TF.get("M30");
    static readonly H1 : TF = TF.get("H1");
    static readonly H4 : TF = TF.get("H4");
    static readonly D1 : TF = TF.get("D1");

    static min() : never;
    /** Минимальное значение таймфрейма из списка */
    static min(...args : [TF,...TF[]] | [[TF,...TF[]]]) : TF;
    static min(...args : TF[] | [Iterable<TF>]) : TF|null;
    static min(...args : TF[] | [Iterable<TF>]) : TF|null {
        let tfs= ((args[0] && !(args[0] instanceof TF)) ? args[0] : args) as Iterable<TF>;
        let index=999;  for(let tf of tfs) if (tf) index= Math.min(tf.index, index);  return index!=999 ? this.all[index] : null;
    }
    static max() : never;
    /** Максимальное значение таймфрейма из списка */
    static max(...args : [TF,...TF[]] | [[TF,...TF[]]]) : TF;
    static max(...args : TF[] | [Iterable<TF>]) : TF|null;
    static max(...args : TF[] | [Iterable<TF>]) : TF|null {
        let tfs= ((args[0] && !(args[0] instanceof TF)) ? args[0] : args) as Iterable<TF>;
        let index=-1;  for(let tf of tfs) if (tf) index= Math.max(tf.index, index);  return index!=-1 ? this.all[index] : null;
    }
    //static min(...args : TF[]) : TF { let index=999;  for(let tf of args) if (tf) index= Math.min(tf.index, index);  return index!=999 ? this.all[index] : null; }
    //static max(...args : TF[]) : TF { let index=-1;  for(let tf of args) if (tf) index= Math.max(tf.index, index);  return index!=-1 ? this.all[index] : null; }
}



function GenerateBar({}) {

}

export class CreatHistory{

}
