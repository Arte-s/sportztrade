///<reference path="./BaseTypes.d.ts"/>

import * as lib from "./Common";

import {CreateArrayProxy} from "./Common";

//export * from "./Common";


//export type const_Date = Omit<Date, "setTime"|"setFullYear"|"setMonth"|"setDate"|"setHours"|"setMinutes"|"setSeconds"|"setMilliseconds"|"setUTCFullYear"|"setUTCMonth"|"setUTCDate"|"setUTCHours"|"setUTCMinutes"|"setUTCSeconds"|"setUTCMilliseconds">;

type const_Date_ = const_Date;

// @ts-ignore
export { const_Date_ as const_Date }


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

//function PeriodSeconds(tf : TF) { return __Tf_S[tf.index]; }

//function PeriodName(tf : TF)  { return TF[tf.index]; }

//function PeriodStartTime(tf : TF,  currentTime : Date) { let tfmsec=PeriodSeconds(tf)*1000;  return new Date(Math.floor(currentTime.valueOf()/tfmsec)*tfmsec); }


export interface IPeriod
{
	readonly msec : number;
	readonly name : string;
	//readonly [key : number] : void;
}
//-------------------------------------

//function getTF(str : string) { return TF.get(str)!; }

type __E_TF_KEY = keyof typeof __E_TF;


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


// /**
//  * Tests if two types are equal
//  */
// export type Equals<T, S> =
// 	[T] extends [S] ? (
// 		[S] extends [T] ? true : false
// 		) : false
// 	;



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
	// Получение таймфрейма по имени, иначе null
	static get<T extends string>(name : T) : TF|(T extends __E_TF_KEY ? never : null) {
		let key= __E_TF[name as __E_TF_KEY];  if (key) return this.all[key];  return null as (T extends __E_TF_KEY ? never : null);
	}
    // гарантированное получение таймфрейма, иначе выбрасывается исключение
    static getAsserted(name :string) : TF { return TF.get(name) ?? (()=>{throw "Unknown timeframe: "+name;})(); }

	// Получение таймфрейма по имени, иначе null
	static fromName<T extends string>(name : T)  { return this.get(name); }
	// Получение таймфрейма из секунд
	static fromSec(value : number) : TF|null { return this._mapBySec[value]; }

	//static fromValue(value : )

	static readonly all : readonly TF[] = function() {
		let i=1;
		let arr : TF[]= [];
		for(let key of lib.GetEnumKeys(__E_TF)) { arr[__E_TF[key]]= new TF(__Tf_S[i], key);  i++; }
		return arr;
	}();

	private static readonly _mapBySec  = function() {
		let map : { [key :number] : TF|null } = {};
		for(let i of __Tf_S.keys())  map[__Tf_S[i]]= TF.all[i];
		return map;
	}();

	static readonly S1 : TF = TF.get("S1");
	static readonly S2 : TF = TF.get("S2");
	static readonly S3 : TF = TF.get("S3");
	static readonly S4 : TF = TF.get("S4");
	static readonly S5 : TF = TF.get("S5");
	static readonly S6 : TF = TF.get("S6");
	static readonly S10 : TF = TF.get("S10");
	static readonly S12 : TF = TF.get("S12");
	static readonly S15 : TF = TF.get("S15");
	static readonly S20 : TF = TF.get("S20");
	static readonly S30 : TF = TF.get("S30");
	static readonly M1 : TF = TF.get("M1");
	static readonly M2 : TF = TF.get("M2");
	static readonly M3 : TF = TF.get("M3");
	static readonly M4 : TF = TF.get("M4");
	static readonly M5 : TF = TF.get("M5");
	static readonly M6 : TF = TF.get("M6");
	static readonly M10 : TF = TF.get("M10");
	static readonly M12 : TF = TF.get("M12");
	static readonly M15 : TF = TF.get("M15");
	static readonly M20 : TF = TF.get("M20");
	static readonly M30 : TF = TF.get("M30");
	static readonly H1 : TF = TF.get("H1");
	static readonly H2 : TF = TF.get("H2");
	static readonly H3 : TF = TF.get("H3");
	static readonly H4 : TF = TF.get("H4");
	static readonly H6 : TF = TF.get("H6");
	static readonly H8 : TF = TF.get("H8");
	static readonly H12 : TF = TF.get("H12");
	static readonly D1 : TF = TF.get("D1");
	static readonly W1 : TF = TF.get("W1");

	/*
	private static __create = function() {
		TF.A= new TF(0,"");
		TF.S1= new TF(0,"");
		return;
		let i=1;  console.log(Object.keys(TF).length);
  		for(let key of Object.keys(TF)) { console.log(key); TF[key]= new TF(__Tf_S[i+1], key);  i++; }
  	}();
  	*/

	//static func0<T extends [Iterable<TF>]|[...TF[]]>(...args : T) : ([...T][0] extends TF|Iterable<TF> ? (T extends [TF,...TF[]] ? TF : TF|null) : never);

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



//function getTF(str : __E_TF_KEY) { return TF.get(str); }


//console.log(TF.min(TF.M5, TF.M2, TF.D1));

//TF.prototype.valueOf= ()=>this.msec;

//console.log("!!!");
//console.log((TF.get("H1") as TF) > (TF.get("M1") as TF));


function TimeAddMilliseconds(time : const_Date, shift : number) : Date { return new Date(time.valueOf() + shift); }


class MyDate extends Date
{
	ToShiftedMsTime(shiftMs : number) { return TimeAddMilliseconds(this, shiftMs); }  // Время, сдвинутое на заданное число миллисекунд
}

export type MyDate_const = Omit<MyDate, keyof Date> & const_Date;

//----------------------------------------------


export class PeriodSpan
{
	readonly period : Period;
	readonly index : number;
	readonly [key : number] : void;

	constructor(period : Period|TF, indexOrTime : number|const_Date) {
		this.period= period instanceof Period ? (period as Period) : new Period(period as TF);
		this.index= indexOrTime instanceof Date ? this.period.IndexFromTime(indexOrTime) : (indexOrTime as number);
	}
	next() : PeriodSpan { return new PeriodSpan(this.period, this.index+1); }
	prev() : PeriodSpan { return new PeriodSpan(this.period, this.index-1); }

	get startTime() { return Period.StartTimeForIndex(this.period.tf, this.index); }
	get endTime()   { return Period.StartTimeForIndex(this.period.tf, this.index+1).ToShiftedMsTime(-1); }
}
//---------------------------------

//interface MMM { (zzz?: number): any[]; }


export class Period implements IPeriod //, MMM
{
	readonly tf : TF;
	get sec() : number { return this.tf.sec; }
	get msec() : number { return this.tf.msec; }
	get name() : string { return this.tf.name; }

	valueOf() { return this.msec; }

	readonly [key : number] : PeriodSpan;

	span(time : const_Date) : PeriodSpan { return new PeriodSpan(this.tf, time); }

	//fff() { Array(0); }

	constructor(tf : TF) { this.tf= tf;  return CreateArrayProxy(this, (i)=>new PeriodSpan(tf, i)); }

	static Seconds(tf : TF) { return tf.sec; }

	static Name(tf : TF)  { return tf.name }

	IndexFromTime(time :const_Date) {
		return Period.IndexFromTime(this.tf, time);
	}

	getStartTime(currentTime :const_Date) { return Period.StartTime(this.tf, currentTime); }

	static StartTimeForIndex(tf : TF,  index : number) {
		let tfmsec=Period.Seconds(tf)*1000;
		if (tf==TF.W1) {
			return new MyDate(index * W1_MS - this.getW1Shift_ms());
		}
		return new MyDate(index*tfmsec);
	}

	private static getW1Shift_ms() {
		const day0= new Date(0).getUTCDay();
		const tshift= D1_MS * Math.trunc((day0+6)%7);
		return tshift;
	}

	// private static getParamsForTF(tf :TF) : { shift_ms :number, period_ms :number} {
	// 	if (tf==TF.W1) {
	// 		const day0= new Date(0).getDay();
	// 		const shift_ms= D1_MS * Math.trunc((day0+6)%7);
	// 		return { shift_ms, period_ms : W1_MS }
	// 	}
	// 	return { shift_ms: 0, period_ms : }
	// }

	static IndexFromTime(tf :TF, time :const_Date) {
		if (tf==TF.W1) {
			return Math.floor((time.valueOf() + Period.getW1Shift_ms()) / W1_MS);
		}
		const tfmsec= Period.Seconds(tf)*1000;
		return Math.floor(time.valueOf()/tfmsec);
	}

	static StartTime(tf : TF,  currentTime : const_Date, shiftPeriods=0) : MyDate {
		if (tf==TF.W1) {
			const tshift= Period.getW1Shift_ms();
			return new MyDate(Math.floor((currentTime.valueOf() + tshift) / W1_MS + shiftPeriods) * W1_MS - tshift);
		}
		const tfmsec= Period.Seconds(tf)*1000;
		return new MyDate(Math.floor(currentTime.valueOf()/tfmsec + shiftPeriods) * tfmsec);
	}

	static EndTime(tf : TF,  currentTime : const_Date) { return Period.StartTime(tf, currentTime, +1).ToShiftedMsTime(-1); }
}




function str2(n :number) { return n<=9 ? '0'+n : ''+n; }
function str3(n :number) { return (n<=9 ? '00' : n<=99 ? '0' : '') +n; }

export function timeToStr_hhmmss_ms(date : const_Date) { return str2(date.getUTCHours())+":"+str2(date.getUTCMinutes())+":"+str2(date.getUTCSeconds())+"."+str3(date.getUTCMilliseconds()); }

export function timeToStr_hhmmss(date : const_Date) { return str2(date.getUTCHours())+":"+str2(date.getUTCMinutes())+":"+str2(date.getUTCSeconds()); }

export function timeToStr_yyyymmdd_hhmm(date : const_Date, dateDelim="-") { return date.getUTCFullYear()+dateDelim+str2(date.getUTCMonth()+1)+dateDelim+str2(date.getUTCDate())+" "+str2(date.getUTCHours())+":"+str2(date.getUTCMinutes()); }

export function timeToStr_yyyymmdd_hhmmss(date : const_Date, dateDelim="-") { return timeToStr_yyyymmdd_hhmm(date, dateDelim)+":"+str2(date.getUTCSeconds()); }

export function timeToStr_yyyymmdd_hhmmss_ms(date : const_Date, dateDelim="-") { return timeToStr_yyyymmdd_hhmmss(date, dateDelim)+"."+str3(date.getUTCMilliseconds()); }


export function timeLocalToStr_hhmmss(date : const_Date) { return str2(date.getHours())+":"+str2(date.getMinutes())+":"+str2(date.getSeconds()); }

export function timeLocalToStr_hhmmss_ms(date : const_Date) { return timeLocalToStr_hhmmss(date) + str3(date.getMilliseconds()); }

export function timeLocalToStr_yyyymmdd(date : const_Date, dateDelim="-") { return date.getFullYear()+dateDelim+str2(date.getMonth()+1)+dateDelim+str2(date.getDate()); }

export function timeLocalToStr_yyyymmdd_hhmm(date : const_Date, dateDelim="-") { return timeLocalToStr_yyyymmdd(date, dateDelim)+" "+str2(date.getHours())+":"+str2(date.getMinutes()); }

export function timeLocalToStr_yyyymmdd_hhmmss(date : const_Date, dateDelim="-") { return timeLocalToStr_yyyymmdd_hhmm(date, dateDelim)+":"+str2(date.getSeconds()); }

export function timeLocalToStr_yyyymmdd_hhmmss_ms(date : const_Date, dateDelim="-") { return timeLocalToStr_yyyymmdd_hhmmss(date, dateDelim)+"."+str3(date.getMilliseconds()); }

//export function timeToString_yyyymmdd_hhmm_offset(date : const_Date) { let offset=date.getTimezoneOffset(); return timeLocalToStr_yyyymmdd_hhmm(date).replace(" ","T")+ "GMT"+(offset<0 ?'+' :'')+(-offset/60);   }
export function timeToString_yyyymmdd_hhmm_offset(date : const_Date) { let offset=date.getTimezoneOffset(); return timeLocalToStr_yyyymmdd_hhmm(date)+ " GMT"+(offset<0 ?'+' :'')+(-offset/60); }


export function timeToString_yyyymmdd_hhmmss_offset(date : const_Date) { let offset=date.getTimezoneOffset();  return timeLocalToStr_yyyymmdd_hhmmss(date)+ " GMT"+(offset<0 ?'+' :'')+(-offset/60); }

Date.prototype.toString= function(this) { return timeToString_yyyymmdd_hhmmss_offset(this); }  //" GMT+0300 " +
Date.prototype.toDateString= function(this) { return timeLocalToStr_yyyymmdd(this); }
Date.prototype.toTimeString= function(this) { let offset= this.getTimezoneOffset(); return timeLocalToStr_hhmmss(this)+ " GMT"+(offset<0 ?'+' :'')+(-offset/60) }

// console.warn("!!!!!",{
//     obj: new Date(),
//     toStr: new Date().toString(),
//     toDateStr: new Date().toDateString(),
//     toTimeStr: new Date().toTimeString(),
//     toLocaleStr: new Date().toLocaleString(),
//     toLocaleDateStr: new Date().toLocaleDateString(),
//     toLocaleTimeStr: new Date().toLocaleTimeString()
// });


function _getStructCopyWithTimeStrings(arg :any, objectsMap? :Map<object,object>) {
    if (!arg) return arg;
    if (arg instanceof Date) return arg.toString();
    let clone : {[key :number|string] : any};
    if (Object.getPrototypeOf(arg)==Object.prototype)  // если структура
        clone= {};
    else
    if (Object.getPrototypeOf(arg)==Array.prototype) { // если простой массив (ненаследуемый)
        clone= [];
    }
    else return arg;
    let mapVal= objectsMap?.get(arg);
    if (mapVal) return mapVal;
    objectsMap ??= new Map();
    objectsMap.set(arg, clone);
    for(let key in arg) clone[key]= _getStructCopyWithTimeStrings(arg[key], objectsMap);
    return clone;
}

export function convertDatesToStrings(arg :any) { return _getStructCopyWithTimeStrings(arg); }

export function toPrintObject(arg :any) { return convertDatesToStrings(arg); }


// заменяем команды печати в консоли, чтобы Date выводилось в нормальном удобном виде
function replaceConsoleCommands() {
    const consoleLog= console.log;
    const consoleWarn= console.warn;
    const consoleError= console.error;

    function replaceArgs(args :any[]) { return args.map(arg => convertDatesToStrings(arg)); }
    console.log= (...args :any[])=>{ consoleLog(...replaceArgs(args)); }
    console.warn= (...args :any[])=>{ consoleWarn(...replaceArgs(args)); }
    console.error= (...args :any[])=>{ consoleError(...replaceArgs(args)); }
}
// replaceConsoleCommands();

//console.log(TF.all);
//Intl.DateTimeFormat.prototype.format= function(this, date) { return date ? timeToString_yyyymmdd_hhmmss_offset(new Date(date)) : ""; }





//console.log(TF.get("H6"));

// Преобразование длительности времени в стринг

export function durationToStr(duration_ms :number) : string {
	//if (duration_ms==null) return null;
	let units : [number,string][] = [[D1_MS, "д"], [H1_MS, "ч"], [M1_MS, "м"], [1000, "c"], [1, "мс"]];
	let lastUnit= null; //let passedDuration=0;
	let str="";
	for(let unit of units) {
		let unitCountFloat = duration_ms / unit[0];
		if (unitCountFloat<1.1 && lastUnit==null) continue;
		let unitCount;
		if (lastUnit || unitCountFloat > 10)
		{ unitCount = Math.round(unitCountFloat);  lastUnit=unit; }
		else unitCount = Math.floor(unitCountFloat);
		str += unitCount + unit[1] + " ";  //passedDuration += unitCount * unit[0];
		if (lastUnit) break;
		duration_ms %= unit[0];
		lastUnit = unit;
	}
	return str;
	//let unit= period > Time.D1_MS*2 ?  Time.TIME_UNIT.Day :  period > Time.H1_MS*2 ?  Time.TIME_UNIT.Hour :  period>Time.M1_MS*2 ? Time.TIME_UNIT.Minute :
}

export function durationToStrNullable(duration_ms :number|null|undefined) : string|null { return duration_ms==null ? null : durationToStr(duration_ms); }


export function durationToStr_h_mm_ss(duration_ms :number) { let time= new Date(duration_ms);
	return Math.trunc(duration_ms/H1_MS) + ":"+str2(time.getUTCMinutes())+":"+str2(time.getUTCSeconds());
}

export function durationToStr_h_mm_ss_ms(duration_ms :number) { return durationToStr_h_mm_ss(duration_ms)+"."+str3(Math.trunc(duration_ms%1000)); }



async function sleepAsync(msec :number) {
	return new Promise((resolve, reject) => { setTimeout(resolve, msec); });
}


// Задерживатель времени
export class CDelayer
{
	protected remainPause= 0;

	async sleepAsync(pause_ms_getter :()=>number|null) { //pause_ms : number, reject :()=>any) {
		let passed_ms = 0;
		let startRemainPause= this.remainPause;
		while(true)
		{
			let pause= pause_ms_getter();
			if (pause==null || pause<0) return;
			this.remainPause = Math.max(startRemainPause + pause - passed_ms, 0);

			pause = Math.min(this.remainPause, 100);
			//break;
			if (pause>15) {
				let oldTime = Date.now();
				await sleepAsync(pause);
				let duration= Date.now() - oldTime;
				passed_ms += duration;
				this.remainPause -= duration;
			}
			else break;
		}
	}
}



type NullableTime = const_Date | undefined | null;

export function MinTime<T1 extends NullableTime, T2 extends NullableTime>(time1: T1, time2: T2) {
    return time1 && time2 && time1.valueOf() <= time2.valueOf() ? time1 : time2 ?? time1;
} //(!b || a < b  ? a  : b}
export function MaxTime<T1 extends NullableTime, T2 extends NullableTime>(time1: T1, time2: T2) {
    return time1 && time2 && time1.valueOf() >= time2.valueOf() ? time1 : time2 ?? time1;
} //(!b || a < b  ? a  : b}



// let p= new Period(TF.W1);
// console.log(p.span(new Date()).startTime);
// console.log(Period.StartTime(TF.W1, new Date()));
//
// let a= { a: 10, b : { c: 20 }}
//
// Object.freeze(a);
// a.b.c= 5;
// console.log(a.b.c);
