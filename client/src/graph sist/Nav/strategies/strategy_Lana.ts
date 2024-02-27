import {CBar, TF} from "../Bars";
import {IIndicator} from "../Indicator";
import {Param, paramType_Period, paramType_Bool} from "../ParamOld";
import {IStrategy, IStrategySignaller} from "../Strategy";
import {NormalizeDouble} from "../Common";
import {CATR} from "../Indicator"

type tInputLana3={
	start: number,
	autoLot: number,
	coefficient: number,
	minTime: number,
	cTime: number,
	minStep_percent: number
	minOrder: number,
	prevPercent: number,
	onlyUp: number,
}

type tRatioLana3={
	ratio:number
	calcVolumeTrade: number;
	volumeTrade: number;
	lvl: {prev: number, next: number},
	time: {old: number, delta: number},
	kDelta: number,
	lastKDelta: number,
	minStep: number,
	price: number,
	//виртальный расчетный баланс
	balance: number,
}

class CStrategySignaller_Lana3 implements IStrategySignaller {
	input:tInputLana3=
		{
			autoLot: 0,
			start: 0,
			coefficient: 0,
			minStep_percent: 10,
			minTime: 0,
			//коэфициент вывода обьмов в нормальнео состояние по времени
			cTime: 0,
			minOrder: 10,
			prevPercent: 0,
			onlyUp: 0,
		}

	buffer:tRatioLana3={
		ratio: 0,
		calcVolumeTrade: 0,
		volumeTrade: 0,
		lvl: {next: 0,prev: 0},
		time: {old: 100000, delta:100},
		kDelta: 0,
		lastKDelta:0,
		minStep: 0.00001,
		price: 0,
		balance: 0,
	}

	constructor(data:tInputLana3) {
		this.input=data
	}

	onNewBars (bars: readonly CBar[]): void {
		if (!bars.length) return;

		const lastB		= bars[bars.length - 1]
		const price		= lastB.close;
		const timeSec	= lastB.time.valueOf()/1000

		const {input, buffer}												= this
		const {cTime,coefficient,minStep_percent,onlyUp,
			start,autoLot,minTime,minOrder,prevPercent}:tInputLana3			= input
		const {time, calcVolumeTrade, lvl}									= buffer
		const {next, prev}													= lvl

		const step=()=>{
			time.delta 				= timeSec - time.old;
			let k					= Math.log2(time.delta/(10**minTime))/Math.log2(coefficient);
			buffer.kDelta = k 		= buffer.minStep/ (k> 1? k: 1);

			buffer.minStep 			= 1 + ( minStep_percent * k ) / 100
			buffer.lvl 				= {next: price * buffer.minStep, prev: (price / (buffer.minStep*(prevPercent)/100))}
		}

		if ((timeSec - time.old)*cTime>time.delta) step();

		if (price > next || price < prev) {
			buffer.balance			+= calcVolumeTrade * ( price - buffer.price ) * ( autoLot / 100 );
			const oldPrice			= buffer.price;
			const oldVolume			= calcVolumeTrade;
			buffer.price 			= price;
			step();
			time.old				= timeSec;
			const {kDelta,balance}	= buffer
			buffer.calcVolumeTrade 	= ( kDelta > minOrder / 100 ? (start+balance) * kDelta : 0 ) /price
			if (onlyUp==2) buffer.volumeTrade = ( oldPrice > price && buffer.calcVolumeTrade > oldVolume ) ? buffer.calcVolumeTrade : 0
			if (onlyUp==1) buffer.volumeTrade = ( oldPrice < price && buffer.calcVolumeTrade > oldVolume ) ? buffer.calcVolumeTrade : 0
			if (onlyUp==0) buffer.volumeTrade = buffer.calcVolumeTrade
		}
	}

	getSignal() {
		const {volumeTrade} = this.buffer
		return volumeTrade
	}

	readonly indicators = [];

	get minRequiredDepthBars() {
		return 1;
	}
}

class CStrategy_Lana3 implements IStrategy {
	readonly paramInfo = [
		Param("start balance", {min: 1, step: 1, progressive: true }, 100, {start: 100, end: 1000000, static: true}),
		Param("автолот прогрессия %", {min:0, max:100, step: 10}, 100),
		Param("степень гладкости разброса обьмов", {min:1, max:3, step: 0.1}, 2.4),
		Param("базовый минимальный шаг, %", {min:0, max:50, step: 0.1, progressive: true }, 14),
		Param("коэфициент времени нормализации обьмов", {min:0, max:3, step: 0.1}, 0.8),
		Param("степень врмени шага 10**X", {min:1, max:5, step: 0.1 }, 3),
		Param("не ставить если ордер меньше %", {min:1, max:100, step: 1}, 3),
		Param("коэфициент к нижнему уровню %", {min:10, max:300, step: 10}, 100),
		Param("торовгля при падении и взлете", {min:0, max:2, step: 1}, 0),
	];
	readonly name = "Lana3";

	getSignaller(param: readonly number[], tf :TF) {
		//let [ma1, ma2]= [this.MA1.value(), this.MA2.value()];  return Math.sign(ma1-ma2);
		return new CStrategySignaller_Lana3(
			{
				start: Number(param[0]), //"start balance", {min: 1, step: 1, progressive: true }, 100, {start: 100, end: 1000000, static: true}),
				autoLot: Number(param[1]), //"автолот прогрессия %", {min:0, max:100, step: 10}, 30),
				coefficient: Number(param[2]), //"степень гладкости разброса обьмов", {min:1, max:3, step: 0.1}, 2.5),
				minStep_percent: Number(param[3]), //"базовый минимальный шаг, %", {min:0, max:50, step: 0.1, progressive: true }, 10),
				cTime: Number(param[4]), //коэфициент времени нормализации обьмов", {min:0, max:3, step: 0.1}, 0.5),
				minTime: Number(param[5]), //"степень врмени шага 10**X", {min:1, max:5, step: 0.1 }, 3),
				minOrder: Number(param[6]), //"не ставить если ордер меньше %", {min:1, max:100, step: 1}, 3),
				prevPercent: Number(param[7]), //"коэфициент к нижнему уровню %", {min:10, max:300, step: 10}  100)
				onlyUp: Number(param[8]), //"коэфициент к нижнему уровню %", {min:10, max:300, step: 10}  100)
			}
		);
	}

	static readonly instance = new CStrategy_Lana3();
}

export const Strategy_Lana3 = CStrategy_Lana3.instance;





class CStrategySignaller_Lana implements IStrategySignaller {
	minStep_percent :number;
	nextPrice! :number;
	prevPrice! :number;
	kUnR :number;
	maxD :number =300;

	//отсношение соклько может быть потрачено средства startBalance/maxD
	kDelta :number;
	profit :number=0;

	constructor(startBalance: number, /*slumpDelta: number,*/ minStep_percent :number =0, kunregres:number = 0.5, kVirt: number =1, newLana:number = 1.1, maxD:number=300) {
		this.buf.volume = startBalance;
		//this.lotDigits= lotDigits;
		this.minStep_percent= minStep_percent;
		this.kUnR=kunregres;
		this.newLana=newLana;
		this.maxD=maxD;
		this.demoDep=kVirt;
		this.kDelta=this.buf.volume/this.maxD;
		//коэфициент не остатка
		//this.minStep_percentATR= minStep_percentATR;
		//	this.buf.delta	= slumpDelta;
	}

	buf: { time: const_Date, volume: number, delta: number, price: number } = {
		// @ts-ignore
		time: null,
		// @ts-ignore
		volume: null,
		delta: 100,
		price: 0
	}

	//данные расчета текущего шага - обьем
	volumeTrade: number = 0;
	startLot = 0;
	//замедлеенное движение
	// @ts-ignore
	slow:number;//
	//данные расчета прошлого шага - исходнные данные
	// @ts-ignore
	lastVolumeBuf:number;

	// @ts-ignore
	private _lastBar :CBar;

	price=0;
	newLana=0;
	flag:boolean=true;
	lastP:{sell:number,buy:number}|null=null;
	lastPrice:number|undefined;

	onNewBars(bars: readonly CBar[]): void {
		if (bars.length==0) return;
		let price= bars[bars.length - 1].close;
		this.price=price;

		if (this.lastPrice==undefined) this.lastPrice=price;
		this.buf.volume=this.kDelta*(this.maxD+this.profit)
	 //	console.log(this.kDelta,this.maxD,this.profit)
	 // if (price>this.lastPrice)
		this.profit+=(price-this.lastPrice)*this.volumeTrade;
	 // if (price<this.lastPrice) this.profit-=(this.lastPrice/price)*this.volumeTrade;
		this.lastPrice=price;

		if (!this.startLot) this.startLot = this.volumeTrade;
		if (this.newLana==0) {
			if (!this.minStep_percent || !this.nextPrice || price > this.nextPrice || price<this.prevPrice) {
				this.buf.price = price;
				this.volumeTrade = this.buf.volume / price;
				if (this.minStep_percent) {
					if (this.kUnR!=1.0 && this.kUnR!=0.0) {
						if (!this.slow) this.slow = this.volumeTrade;
						if (!this.lastVolumeBuf) this.lastVolumeBuf = this.volumeTrade;
						const p = this.slow>this.volumeTrade? -1:1;
						const delta = this.volumeTrade-this.lastVolumeBuf; //растоение которое прошла цена за шаг
						if (Math.abs(this.slow-this.lastVolumeBuf)>(this.volumeTrade-this.lastVolumeBuf)) {
							this.slow=this.slow+ p*Math.abs(delta)*this.kUnR;
						}
						else {
							this.slow=this.volumeTrade;
						}
						//this.slow=this.slow+ p*Math.abs(delta)*this.kUnR;
						this.lastVolumeBuf=this.volumeTrade;
						this.volumeTrade=this.slow ;
					}

					//		console.log(this.lastVolume,this.volumeTrade,this.volumeTrade-this.lastVolume,this.volumeTrade-lastBuf);

					let progresX= 1+this.minStep_percent/100;
					let levPrice= progresX ** Math.round(Math.log(price) / Math.log(progresX));
					this.prevPrice= levPrice / progresX;
					this.nextPrice= levPrice * progresX;//+price*this.martin*(this.minStep_percent/100);

					//console.log(bars[bars.length - 1].time, price," -> ",this.prevPrice,"-",this.nextPrice);
				}
			}
		}
		if (this.newLana==1) {
			if (!this.lastP) this.lastP={buy:price,sell:price};
			const last=this.lastP;

			if (last.buy>price || (price<last.sell*(1-this.minStep_percent*0.01)) && !this.flag) {
			//	console.log(this.minStep_percent,price<last.sell*(1-this.minStep_percent*0.01));
			//	last.sell=last.sell*(1-this.minStep_percent*0.01);
				last.buy=price;
				this.flag=true;
				this.volumeTrade = this.buf.volume / (price*(1-this.minStep_percent*0.0045));
			}
			if (last.sell<price || (price>last.buy*(1+this.minStep_percent*0.01)) && this.flag) {
			//	console.log(this.minStep_percent,price>last.buy*(1+this.minStep_percent*0.01));
				last.sell=price;
				this.flag=false;
			//	last.buy=last.buy*(1+this.minStep_percent*0.01);
				this.volumeTrade = this.buf.volume / (price*(1+this.minStep_percent*0.0045));
			}
		}

	}
	lastV = 0;
	//прошлый обьем
	lDep : number|undefined = undefined;
	//коэфициент не остатка вирутального депо
	demoDep : number;

	//последний расчетный обьем
	lastValueR: number = 0;

	koefLowSell = 0.0
	koefLowBuy = 0.0

	getSignal() {
		let volumeR= this.volumeTrade - (100 - this.buf.delta) * 0.01 * this.startLot;
		if (this.lDep==null) this.lDep=volumeR*this.demoDep
		if (this.price) {
			if (this.lastValueR==0) this.lastValueR=volumeR;
		//	let buf=volumeR;
	  	//  if (this.lDep > volumeR * this.demoDep) this.lDep = volumeR * this.demoDep

			// выключен коэфициент виртуального депозита

	//		if (this.demoDep<1)
			{
				//при движении графика на верх
				if (this.lastValueR>volumeR) {
					//		console.log(this.demoDep,this.lastValueR<volumeR,volumeR,this.lastValueR,volumeR/this.lastValueR);
					this.demoDep=this.demoDep + ((volumeR/this.lastValueR) -1)* this.koefLowSell
					if (this.demoDep>1) this.demoDep=1;
					if (this.demoDep<0) this.demoDep=0;
				}
				//при движении графика вниз
			}

			if (this.lastValueR<volumeR) {
				//		console.log(this.demoDep,this.lastValueR<volumeR,volumeR,this.lastValueR,volumeR/this.lastValueR);
				this.demoDep=this.demoDep + ((volumeR/this.lastValueR) -1)* this.koefLowBuy
				if (this.demoDep>1) this.demoDep=1;
			}

		}
		//  if (this.lotDigits>=0) volume= NormalizeDouble(volume, this.lotDigits);
		this.lastValueR=volumeR;
	//	console.log("this.demoDep",this.demoDep);
		return volumeR*this.demoDep//-this.startLot;
	}

	readonly indicators = [];

	get minRequiredDepthBars() {
		return 1;
	}
}


class CStrategy_Lana implements IStrategy {
	readonly paramInfo = [
		Param("start balance", {min: 1, step: 1, progressive: true }, 100, {start: 100, end: 1000000, static: true}),
		//Param("no work", paramType_Period, 100, {start: 1, end: 100, step: 1}),
		Param("минимальный шаг, %", {min:0, max:50, step: 0.1, progressive: true }, 10),
		//Param("минимальный шаг, % ATR D2", {min:0, max:1000, step: 0.01}, 0),
		//Param("точность лота", {min:-1, max:20, step: 1}, 8),
		Param("коэфициент замедления прогресии",{min:0.2, max:1, step: 0.01}, 0.5),
		Param("виртуальнй дипозит", {min:0, max:1, step: 0.01}, 1),
		Param("новая лана", {min:0, max:1, step: 1}, 0),
		Param("максимальный дипозит", {min:0, max:10000000, step: 10, progressive: true }, 300),

		//Param("Weighted", paramType_Bool, 0)
		//{ name: "Period 1", type: paramType_Period, {min: 1, step: 1, progressive: true}),
		//{ name: "Period 2", {min: 1, step: 1, progressive: true}),
	];
	readonly name = "Lana";

	constructor() {
	}

	getSignaller(param: readonly number[], tf :TF) {
		//let [ma1, ma2]= [this.MA1.value(), this.MA2.value()];  return Math.sign(ma1-ma2);
		return new CStrategySignaller_Lana(param[0], param[1], param[2], param[3], param[4], param[5]);
	}

	static readonly instance = new CStrategy_Lana();
}

export const Strategy_Lana = CStrategy_Lana.instance;






export class CStrategy_Lana2 implements IStrategy {
	readonly paramInfo = [
		Param("start balance", {min: 1, step: 1, progressive: true }, 100, {start: 100, end: 1000000, static: true}),
		Param("минимальный шаг, %", {min:0, max:90, step: 0.5, progressive: true }, 10),
		//Param("минимальный шаг, % ATR D2", {min:0, max:1000, step: 0.01}, 0),
		//Param("степень",{min:0.5, max:2, step: 0.5}, 1),
		//Param("ATR_bars",{min:0, step: 1, progressive: true}, 0, {start: 0, end: 100} ),
		//Param("точность лота", {min:-1, max:20, step: 1}, 8),
		Param("коэф.мартингейла", {min:0.5, progressive: true}, 1, {start: 1, end: 3, step: 0.5})
	];
	readonly name = "LanaNav";


	getSignaller([startBalance, minStep_percent, martinCoef=1]: readonly number[]) {
		return this._getSignaller([startBalance, minStep_percent, 1, 0, martinCoef]);
	}

	private _getSignaller([startBalance, minStep_percent, pow=1, atrBars=0, martinCoef=1]: readonly number[]) {
		// let startBalance= param[0]; let minStep_percent= param[1]; let pow= param[2]; //let atrPeriod= param[3];
		let _nextPrice :number;
		let _prevPrice :number;
		let _volume= 0;
		let _atr = atrBars ? new CATR(atrBars) : null;
		let _lastPrice= 0;
		let _loss= 0;
		let _minStep_percent= minStep_percent;
		//let _price0 :number =0;
		//let _relativeAtr = atrPeriod ? new CATR(atrPeriod, true) : null;
		return {
			onNewBars(bars: readonly CBar[]) {
				if (bars.length==0) return;
				if (_atr) for(let bar of bars) _atr.push(bar);
				let price= bars[bars.length - 1].close;
				//if (!_price0) _price0= price;
				//if (_relativeAtr) for(let bar of bars) _relativeAtr.push(bar);
				if (!minStep_percent || !_nextPrice || price > _nextPrice || price<_prevPrice) {
					let lastPrice= price > _nextPrice ? _prevPrice : _nextPrice;

					if (martinCoef!=1 && lastPrice!=null)
						if (price < lastPrice) { _volume *= (lastPrice/price) * martinCoef;  /*minStep_percent *= martinCoef*/ _loss=1; }
						else { minStep_percent = _minStep_percent; _loss=0; }
					// let delta= (_price0 * minStep_percent/100);
					// _prevPrice= Math.round(price / delta) * delta - delta;
					// _nextPrice= _prevPrice + delta * 2;
					if (1)
					if (minStep_percent) {
						let progresX= 1+minStep_percent/100;
						//let progresX= 1+(minStep_percent + (_atr?.value()??0)/price*100)/100;
						let levPrice= progresX ** Math.round(Math.log(price) / Math.log(progresX));
						_prevPrice= levPrice / progresX;
						_nextPrice= levPrice * progresX;
					}
					if (_loss) return;
					let atr= _atr ? _atr.value() : 0;
					//if (_volume) { _volume *= (lastPrice / price)**martinCoef;  return; }
					//let k= _relativeAtr ? _relativeAtr.value()  : 0;
					//_volume= (startBalance / price / (1 + k)) ** pow;
					_volume= (startBalance/(price + atr)) ** pow;
				}
			},

			getSignal() {
				return _volume;
			},

			minRequiredDepthBars: 1
		}
	}

	static readonly instance = new CStrategy_Lana2();
}

export const Strategy_LanaNav = CStrategy_Lana2.instance;

