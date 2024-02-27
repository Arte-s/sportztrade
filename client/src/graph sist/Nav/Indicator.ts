import {CBar} from "./Bars"

export interface IIndicator
{
	readonly name : string;
	value() : number|null;
}

export abstract class CIndicator<T=number> implements IIndicator
{
	abstract get name() : string;
	abstract value() : number|null;
	abstract push(value :T) :void;
}

export class CMA extends CIndicator
{
	private _array : number[]= [];
	private _sumWeight : number;
	private _weighing : boolean;
	private _sum? =0;

	readonly period : number;
	readonly name : string;

	constructor(period :number, weighing :boolean =false) {
		super();  this.period= period;
		console.assert(period>0, "wrong MA period: "+period);
		this.name= "MA ("+period+")";
		if (weighing) { this._sumWeight= (1+period)*period/2;  this.name= "W"+this.name; }
		else this._sumWeight= period;
		this._weighing= weighing;
	}

	push(value :number) {
		this._array.push(value);
		let [period, length]= [this.period, this._array.length];
		if (! this._weighing) {
			if (! this._sum) this._sum= 0;
			this._sum += value;
			if (length > period) this._sum -= this._array[length - period - 1];
		}
		else this._sum= undefined;
		if (length==period+1000) this._array.splice(0, 1000);
	}
	private _getSum() {
		if (this._sum != null) return this._sum;
		let sum = 0;
		for (let n=1, i = this._array.length - this.period;  n<=this.period;  n++, i++) {
			sum += this._array[i] * n; // this._array.reduce((prev,curr,index)=>prev+index*curr, 0)}
			//console.log("n="+n,"i="+i,"value=",this._array[i],"sum="+sum)
		}
		//console.log("Sum/SumWeight=",sum/this._sumWeight);
		//console.assert(false);
		return this._sum= sum;
	}
	value() : number|null { return this._array.length >= this.period ? this._getSum()/this._sumWeight : null;}
}



export class CATR extends CIndicator<CBar>
{
	protected ma : CMA;
	protected lastClose? : number;
	readonly name : string;
	readonly isRelative :boolean;
	// isRelative - вычисление относительного ATR, иначе абсолютного
	constructor(period :number, isRelative= false) {
		super();
		this.ma= new CMA(period);
		this.name= "ATR ("+period+")";
		this.isRelative= isRelative;
	}
	push(bar : CBar) {
		let lastClose= this.lastClose ?? bar.open;
		let delta= Math.max(bar.high, lastClose) - Math.min(bar.low, lastClose);
		if (this.isRelative) { console.assert(lastClose!=0);  delta= delta/lastClose; }
		this.ma.push(delta);
		this.lastClose= bar.close;
	}
	value() : number { return this.ma.value() ?? 0; }
}
