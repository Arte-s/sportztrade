import {const_Date} from "./Bars";

import {Color, ColorString} from "./color"

export * from "./color"


export type AlignH = "left" | "center" | "right";

export type AlignV = "top" | "center" | "bottom";

export type LineStyle = "solid" | "dash" | "dot" | "dashdot";

//enum E_ALIGN { left=-1, center=0, right=1 }

export type Point= { readonly x :number;  readonly y : number; } // constructor(x, y) { this.x=x;  this.y= y; } };



// Класс линии

export class CLine
{
	begin : Point;  // начало
	end : Point;  // конец
	static? : boolean;
	color : Color|null;
	style? : LineStyle;// = "solid";
	width? : number;// = 1;  // толщина линии
	text? : string;
	textAlignH? : AlignH;// = "center";  // выравнивание текста по горизонтали
	textAlignV? : AlignV;// = "center";  // выравнивание текста по вертикали
	textPosH? : "left"|"right"|"center"; // позиция точки привязки текста
	textColor? : ColorString;
	tooltip? : string;  // всплывающая подсказка

	constructor(begin :Point, end :Point, color :Color) { this.begin= begin;  this.end= end;  this.color= color; }
}

export type ILine = Readonly<CLine>

export type ITimeLine = Omit<ILine,"begin"|"end"> & { begin: {x: const_Date, y: number}, end: {x: const_Date, y: number}};


//класс графического обьекта анд


interface IPointBase {
	x: number;		//time
	y: number;		//price
	z?: number;
}

interface IPoint3 extends IPointBase {
	//Delete?:()=>void
}


interface IColor3 {
	color:Color;
}

interface IPoint3e extends IPoint3{

}

class CGraphBaseUpdate {
	protected OnUpdate() {this._OnUpdate(this);}
	protected _OnUpdate:(obj:object)=>void;

	//удалить, одновременно удаляет из вышестоящего массива где находился данный элемент
	//Важно меняет длину массива в котором расположен элемент
	protected Delete() {this._Delete?.(this);
		// console.log(this)
		// console.log(this._Delete)
	}
	protected _Delete:((obj:object)=>void)|undefined;

	constructor(data:{UpDate:(obj:any)=>void, DeleteObj?:(obj:any)=>void}) {
		this._OnUpdate = data.UpDate;
		this._Delete = data.DeleteObj;
	}
}
//
// //сделана без применение прокси т.к. так будет быстрее !!! поскольку параметры мы меняем чаще всего
// class CCObj extends CGraphBaseUpdate implements IPoint3 {
// 	get x(): number {
// 		return this._x;
// 	}
//
// 	set x(value: number) {
// 		this._x = value;
// 		this.OnUpdate();
// 	}
//
// 	get y(): number {
// 		return this._y;
// 	}
//
// 	set y(value: number) {
// 		this._y = value;
// 		this.OnUpdate();
// 	}
//
// 	get z(): number {
// 		return this._z;
// 	}
//
// 	set z(value: number) {
// 		this._z = value;
// 		this.OnUpdate();
// 	}
//
// 	constructor(p:IPoint3, OnUpdate:()=>void) {
// 		super(OnUpdate);
// 		Object.assign(this,p);
// 	}
// 	private _x: number = 0;
// 	private _y: number = 0;
// 	private _z: number = 0;
// }
//
// class CCObjColor extends CGraphBaseUpdate implements IColor3 {
// 	get color(): Color {
// 		return this._color;
// 	}
//
// 	set color(value: Color) {
// 		this._color = value;
// 		this.OnUpdate();
// 	}
// 	private _color! : Color;
//
// 	constructor(p:IColor3, OnUpdate:()=>void) {
// 		super(OnUpdate);
// 		Object.assign(this,p);
// 	}
// }


//IColor3

type tGraphFont = {
	text? : string;
	textAlignH? : AlignH;// = "center";  // выравнивание текста по горизонтали
	textAlignV? : AlignV;// = "center";  // выравнивание текста по вертикали
	textPosH? : "left"|"right"|"center"; // позиция точки привязки текста
	textSize?:number;
	textSizeAuto?:number;
	textColor? : ColorString;
	tooltip? : string;  // всплывающая подсказка
}

function fConvertProxy(a:object, funkForSet:(el?:any)=>void) {
	return new Proxy(a,{
		set(target: object, p: string | symbol, value: any, receiver: any): boolean {
			// @ts-ignore
			target[p] = value;
			// @ts-ignore
			funkForSet(target[p]);
			return true;
		}
	})
}

type tGraphLine = {
	style? : LineStyle;// = "solid";
	width? : number;// = 1;  // толщина линии
}

type tGraphObject = {
	style? : LineStyle;// = "solid";
	width? : number;// = 1;  // толщина линии
}

type tGraphShape = {
	background? :ColorString;
}

interface tObjectT {
	type : "line"|"label"|"text"|"shape"
	static : boolean //являеться ли обьект статичного расопложение относительно экрана или висит на графике
}

export type typeNewObjectGraph = tGraphFont& tGraphLine& tGraphObject& tGraphShape & tObjectT & ICGraphObject //& CGraphObject

interface ICGraphObject {
	point: CGraphPoints | IPoint3[] //| IPoint3
	color:  CGraphColor  | IColor3[] // IColor3 |
}

class CGraphObject extends CGraphBaseUpdate implements ICGraphObject{
	get point(): CGraphPoints {
		return this._point;
	}
	set point(point: CGraphPoints | IPoint3 | IPoint3[] ) {
		//this._point.deleteAll();
		if (point instanceof CGraphPoints) this._point.push(...point.data());
		else if (Array.isArray(point)) this._point.push(...point);
		else this._point.push(point);
	}

	private	_point : CGraphPoints = new CGraphPoints({UpDate: this._OnUpdate})

	get color(): CGraphColor {
		return this._color;
	}

	set color(color: CGraphColor | IColor3 | IColor3[] ) {
		//this._point.deleteAll();
		if (color instanceof CGraphColor) this._color.push(...color.data());
		else if (Array.isArray(color)) this._color.push(...color);
		else this._color.push(color);
	}

	private _color : CGraphColor = new CGraphColor({UpDate: this._OnUpdate})

	constructor(data:{UpDate:(obj:CBaseObjectN)=>void, DeleteObj?:(obj:CBaseObjectN)=>void}) {
		//настрйока выполнения функии обновление элемента
		super(data);
	}
}


//добавляем эелементы только через push
//клас преднозначен для массива вспомогательных данных, к примеру массива точек
class CGraphArrayBase<T> extends CGraphBaseUpdate implements  Iterable<T> { //IterableIterator
	[key : number] : T;
	[Symbol.iterator]() { return this._data[Symbol.iterator]() as Iterator<T>; }//  let x = this.data[Symbol.iterator]();  }  //убираем отсюда, иначе невозможно будет неявное преобразование: IBars -> IBars

	protected _data:T[]=[];

	constructor(data:{data?:T[], UpDate:(obj:any)=>void}) {
		super(data);
		if (data.data) this.push(...data.data);
	}

	data(){return this._data;}
	push(...el:T[]){
		this.OnUpdate();
		el = el.map((e)=> this.convert(e))
		return this._data.push(...el);
	}
	get last(){
		return this._data[this._data.length-1]
	}

	set last(data){
		this[this._data.length-1] = this.convert(data)
		this.OnUpdate();
	}


	add(el:T|T[]){
		return this.push(...Array.isArray(el)?el:[el]);
	}
	//start?: number, end?: number


	splice(start=0,count=this._data.length): T[] {
		this.OnUpdate();
		return this._data.splice(start,count);
	}

	deleteByObj(obj:T|CBaseObjectN) {
		const index = this.findIndexByObj(obj);
		return index? this.deleteByIndex(index): undefined
	}
	deleteByIndex(index:number) 	{return this.splice(index,1)[0]};
	deleteAll() 					{this.splice(); return this;}
	findIndexByObj(obj:T|CBaseObjectN) 			{for (let i = 0; i < this._data.length; i++) if (obj==this._data[i]) return i; return null}

	get length(): number {
		return this._data.length;
	}
	protected convert! : (data:T) => T;// : (data:T, update:()=>void) => T;

	protected getProxy(){
		return new Proxy(this,{
			set:(target: this, p: string | symbol , value: T, receiver: any) =>  {
				if (typeof p == "string") {
					let b = +p;
					if (!isNaN(+b)) {
						this._data[+b] = this.convert(value) ;
						return  true
					}
				}
				return false;
			},

			get:(target: this, p: string | symbol , receiver: any) =>  {
				if (typeof p == "string") {
					let b = +p;
					if (!isNaN(b)) {
						return this._data[b]
					}
					else
					if (p in this) {
						// @ts-ignore
						return this[p]
					}
					return  undefined
				}
			},
		})
	}
}


//класс масива точек, добавляем эелементы только через push
class CGraphPoints extends CGraphArrayBase<IPoint3>{
	constructor(data:{point?:IPoint3[], UpDate:(obj:any)=>void}) {
		super(data);
		this.convert=(a)=> new CCObj2(a,{
			UpDate:(e)=>this._OnUpdate(e)
			,DeleteObj:(obj)=>this.deleteByObj(obj)
		}) as IPoint3

		return this.getProxy();
	}
}

class CGraphColor extends CGraphArrayBase<IColor3>{
	constructor(data:{color?:IColor3[], UpDate:(obj:any)=>void}) {
		super(data);
		this.convert=(a)=> new CCObjColor2(a,  {
			UpDate:(e)=>this._OnUpdate(e)
			,DeleteObj:(obj)=>this.deleteByObj(obj)
		}) as IColor3

		return this.getProxy();
	}
}
//сделана без применение прокси т.к. так будет быстрее !!! поскольку параметры мы меняем чаще всего
class CCObj2 implements IPoint3 {
	x: number=0;
	y: number=0;
	z: number=0;
	//Delete:()=>void
	constructor(p:IPoint3, data:{UpDate:(obj:any)=>void, DeleteObj?:(obj:any)=>void}) {
		Object.assign(this,p);
		//this.Delete=()=>{data.DeleteObj?.(this) }
		return fConvertProxy(this,data.UpDate) as CCObj2
	}
}

class CCObjColor2 implements IColor3 {
	color!: Color;
	constructor(p:IColor3, data:{UpDate:(obj:CBaseObjectN)=>void, DeleteObj?:(obj:CBaseObjectN)=>void}) {
		Object.assign(this,p);
		return fConvertProxy(this,data.UpDate) as CCObjColor2
	}
}

//типовой графический объект типа линии
class CBaseObjectN extends CGraphObject implements typeNewObjectGraph{
	background?: ColorString;
	static: boolean = false;
	style?: LineStyle;
	text?: string;
	textAlignH?: AlignH;
	textAlignV?: AlignV;
	textColor?: ColorString;
	textSize?: number;
	textSizeAuto?: number;
	textPosH?: "left" | "right" | "center";
	tooltip?: string;
	type: "line" | "label" | "text" | "shape" = "line";
	width?: number;


	override Delete() {super.Delete();}

	constructor(data:{UpDate:(obj:CBaseObjectN)=>void, DeleteObj?:(obj:CBaseObjectN)=>void}) {
		super(data);
		return fConvertProxy(this,data.UpDate) as CBaseObjectN
	}
}




type ExcludeMethods<T> = Pick<T, { [K in keyof T]: T[K] extends Function ? never : K }[keyof T]>;

type ReadonlyStruct<T> = ReadonlyFull<ExcludeMethods<T>>


//type IBaseObjectN = ExcludeMethods<ReadonlyFull<CBaseObjectN>


interface _IObjects<T> extends Iterable<T> {
	readonly [key : number] : T;
	readonly updatesCounter: number;
	readonly data: readonly T[];
	readonly length: number;
}

export interface IObjects<T=CBaseObjectN> extends _IObjects<ReadonlyStruct<T>> {
}




export class CObjectsAndr implements _IObjects<CBaseObjectN> { // Iterable Iterator  Iterable
	[key : number] : CBaseObjectN;

	[Symbol.iterator]() {
		return this.data[Symbol.iterator]();
	}//  let x = this.data[Symbol.iterator]();  }  //убираем отсюда, иначе невозможно будет неявное преобразование: IBars -> IBars
	#updatesCounter = 0;
	get updatesCounter() { return this.#updatesCounter; }

	private object: CBaseObjectN[] = [];
	//ветка сохранения колбэков Delete не путать с OnDelete
	readonly preData: { UpDate?: (el: CBaseObjectN) => void, OnDelete?: (...el: CBaseObjectN[]) => void } | undefined

	readonly newLine = new Map<CBaseObjectN, CBaseObjectN>();  //записваем все изменение линий а также все новые линии
	private _UpDate = (el: CBaseObjectN) => {
		this.newLine.set(el, el);
		this.#updatesCounter++;
		if (this.preData?.UpDate) this.preData.UpDate(el);
	};
	private _DeleteLine = (...el: CBaseObjectN[]) => {
		this.#updatesCounter++;
		this.preData?.OnDelete?.(...el);
	};
	deleteLine:boolean=false //удаленные линии

	constructor(data?:{UpDate:()=>void}) {
		if (data) this.preData=data;

		return new Proxy(this,{
			set:(target: CObjectsAndr, p: string | symbol | number, value: any, receiver: any) =>  {
				if (typeof p == "string") {
					let b = +p;
					if (!isNaN(+b)) {
						const el = Object.assign(new CBaseObjectN({
							UpDate:()=>{this._UpDate(el)}
							,DeleteObj:(obj)=>this.deleteByObj(obj)
						}),value) as (CBaseObjectN & CBaseObjectN) ;
						this.object[+b] = el
						this._UpDate(el);
						return  true
					}
				}
				return false;
			},

			get:(target: CObjectsAndr, p: string | symbol , receiver: any) =>  {
				if (typeof p == "string") {
					let b = +p;
					if (!isNaN(b)) return this.object[b]
					else if (p in this) {
						// @ts-ignore
						return this[p]
					}
					return undefined
				}
			},
		})
	}

	push=(...a:typeNewObjectGraph[]) =>{
		this.object.push(
			...a.map(
				(e)=>{
					const b =Object.assign(
						new CBaseObjectN({
							UpDate:(z)=>this._UpDate(z)//this._UpDate(b)
							,DeleteObj:(obj)=>this.deleteByObj(obj)
						}) ,e
					) as (CBaseObjectN & CBaseObjectN)
					return b
				}
			)
		)
	};

	get data() {
		return this.object
	}

	add(el:typeNewObjectGraph){
		this.push(el);
		return this.object[this.object.length-1]
	}
	//start?: number, count?: number
	splice(start=0,count=this.object.length): CBaseObjectN[] {
		//	this.OnUpdate();
		const r = this.object.splice(start,count);
	//	this.deleteLine=true;
		this._DeleteLine(...r);
		return r
	}
	deleteByObj(obj:CBaseObjectN|CBaseObjectN) {
		const index = this.findIndexByObj(obj);
		return index? this.deleteByIndex(index): undefined
	}
	deleteByIndex(index:number) 	{return this.splice(index,1)[0]};
	deleteAll() 					{this.splice(); return this;}
	findIndexByObj(obj:CBaseObjectN|CBaseObjectN) 			{for (let i = 0; i < this.object.length; i++) if (obj==this.object[i]) return i; return null}

	get length(): number {
		return this.object.length;
	}
}

const aaa : IObjects = new CObjectsAndr();  // проверка типов



export class CLabelsAndr<T=CBaseObjectN> implements _IObjects<T>
{ // Iterable Iterator  Iterable
	[key : number] : T;
	[Symbol.iterator]() { return this.data[Symbol.iterator]() as Iterator<T>; }//  let x = this.data[Symbol.iterator]();  }  //убираем отсюда, иначе невозможно будет неявное преобразование: IBars -> IBars
	updatesCounter=0;
	protected object :T[]=[];
	//ветка сохранения колбэков Delete не путать с OnDelete
	private readonly preData:{UpDate?:(el:T)=>void, OnDelete?:(...el:T[])=>void}|undefined

	readonly newLine = new Map<T,T>();  //записваем все изменение линий а также все новые линии
	protected _UpDate=(el:T)=>{
		this.newLine.set(el,el);
		this.updatesCounter++;
		if (this.preData?.UpDate) this.preData.UpDate(el);
	};
	protected _DeleteLine=(...el:T[])=>{
		this.updatesCounter++;
		this.preData?.OnDelete?.(...el);
	};
	deleteLine:boolean=false //удаленные линии

	constructor(data?:{UpDate:()=>void}) {
		if (data) this.preData=data;

		return new Proxy(this,{
			set:(target: CLabelsAndr<T>, p: string | symbol | number, value: any, receiver: any) =>  {
				if (typeof p == "string") {
					let b = +p;
					if (!isNaN(+b)) {
						const el = Object.assign(new CBaseObjectN({
							UpDate:()=>{this._UpDate(el)}
							,DeleteObj:(obj)=>this.deleteByObj(obj)
						}),value) as (CBaseObjectN & T) ;
						this.object[+b] = el
						this._UpDate(el);
						return  true
					}
				}
				return false;
			},

			get:(target: CLabelsAndr<T>, p: string | symbol , receiver: any) =>  {
				if (typeof p == "string") {
					let b = +p;
					if (!isNaN(b)) return this.object[b]
					else if (p in this) {
						// @ts-ignore
						return this[p]
					}
					return undefined
				}
			},
		})
	}

	push=(...a:typeNewObjectGraph[]) =>{
		this.object.push(
			...a.map(
				(e)=>{
					const b =Object.assign(
						new CBaseObjectN({
							UpDate:()=>this._UpDate(b)
							,DeleteObj:(obj)=>this.deleteByObj(obj)
						})
						,e
					) as (CBaseObjectN & T)
					return b
				}
			)
		)
	};

	get data() {return this.object}

	add(el:typeNewObjectGraph){


		this.push(el);
		return this.object[this.object.length-1]
	}
	//start?: number, count?: number
	splice(start=0,count=this.object.length): T[] {
		//	this.OnUpdate();
		const r = this.object.splice(start,count);
		//	this.deleteLine=true;
		this._DeleteLine(...r);
		return r
	}
	deleteByObj(obj:T|CBaseObjectN) {
		const index = this.findIndexByObj(obj);
		return index? this.deleteByIndex(index): undefined
	}
	deleteByIndex(index:number) 	{return this.splice(index,1)[0]};
	deleteAll() 					{this.splice(); return this;}
	findIndexByObj(obj:T|CBaseObjectN) 			{for (let i = 0; i < this.object.length; i++) if (obj==this.object[i]) return i; return null}

	get length(): number {
		return this.object.length;
	}
}


//
//
//
// function UpDate() {
// 	console.log("произошла обнова");
// 	console.trace();
// }
//
// abstract class CDataNA {
// 	get line(): IObject {
// 		return this._line;
// 	}
// 	private _line : IObject = new IObject({UpDate:()=>{UpDate();}});
// }
//
//
// class Class223<T> extends Array<T>   {
// 	constructor() {
// 		super();
// 	}
//
// 	override push(...items:T[]): number {
// 		return 0
// 	}
// }
//
// class CDataN extends CDataNA{
// 	//Iterable
// 	constructor() {
// 		super();
// 		let t:ArrayLike<number>;
//
// 		this.line.push({
// 			color: {color:"#7c7c6e" as  ColorString}, point: [{x:Date.now()-1000, y: 65000},{x:Date.now(), y: 60000}], static: false, type: "line"
// 		})
// 		console.log(this.line);
// 		console.log(this.line.length);
// 		let a = this.line[0];
//
// 		console.log(a);
// 		console.log(this.line[0]);
// 		a.point.add({x:Date.now()-1000, y: 65000})
// 		console.log(this.line[0].point);
//
// 		this.line[0].point[2].x=Date.now()
// 		this.line[0].background="rgb(51,155,56)"
// 		//this.line.data[0].point.data()[0] ;
//
// 		console.log(this.line[0].point);
//
// 		this.line[0].point[2]= {x:Date.now()-1000, y: 65000};
// 		console.log(this.line[0].point);
//
// 		console.log(this.line);
// 	}
// }
//
//

//let zz = new CDataN;







