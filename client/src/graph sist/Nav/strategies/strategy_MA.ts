import {Param, paramType_Period, paramType_Bool} from "../ParamOld";
import {CMA, IIndicator} from "../Indicator";
import {CBar} from "../Bars";
import {IStrategy, IStrategySignaller} from "../Strategy";
import { Strategy_LanaNav } from "./strategy_Lana"

//let lanaSignaller= Strategy_LanaNav.getSignaller([]);

type MA_Params = {
	period1: number, period2: number, onlyBuy? :boolean, volumeWeigh_stepPerc? :number, startBalance? :number
}


class CStrategySignaller_MA implements IStrategySignaller {
	protected MA1: CMA;
	protected MA2: CMA;
	//protected volumeWeigh: boolean;
	protected lana? : IStrategySignaller<number>; //IStrategySignaller;
	protected onlyBuy :boolean;

	constructor({period1, period2, onlyBuy=false, volumeWeigh_stepPerc= -1, startBalance=1000} : MA_Params) {
		let maWeight= false;
		this.MA1 = new CMA(period1, maWeight);
		this.MA2 = new CMA(period2, maWeight);
		this.indicators = [this.MA1, this.MA2];
		//this.volumeWeigh = volumeWeigh;
		if (volumeWeigh_stepPerc>=0) this.lana= Strategy_LanaNav.getSignaller([startBalance, volumeWeigh_stepPerc])!;
		this.onlyBuy= onlyBuy;
	}

	onNewBars(bars: readonly CBar[]): void {
		for (let bar of bars) {
			this.MA1.push(bar.close);
			this.MA2.push(bar.close);
		}
		this.lana?.onNewBars(bars);
	}

	getSignal() {
		let [ma1, ma2] = [this.MA1.value(), this.MA2.value()];
		let signal= ma1!=null && ma2!=null ? Math.sign(ma1 - ma2) : 0;
		if (this.onlyBuy && signal<0) signal=0;
		if (signal && this.lana)
			//if (signal>0)
				signal *= (this.lana.getSignal() ?? 0);
			//else signal = this.lana.getSignal() ? signal / this.lana.getSignal()! : 0;
		return signal;
	}

	readonly indicators: readonly IIndicator[];

	get minRequiredDepthBars() {
		return Math.max(this.MA1.period, this.MA2.period);
	}
}

class CStrategy_MA implements IStrategy {
	readonly paramInfo = [
		Param("Period 1", paramType_Period, 7, {start: 1, end: 50}),
		Param("Period 2", paramType_Period, 21, {start: 2, end: 100, step: 2}),
		Param("только покупки", paramType_Bool, false),
		//Param("Weighted", paramType_Bool, 0)
		Param("шаг взвешивания объёма, %", {min:-1, max:90, step: 1, progressive: true }, -1),
		Param("баланс для взвешивания", {min:1, step: 1, progressive: true }, 1000, { static: true}),
		//Param("баланс для прогресии", {min:1, step: 1, progressive: true }, 3000, { static: true}),
		//{ name: "Period 1", type: paramType_Period, {min: 1, step: 1, progressive: true}),
		//{ name: "Period 2", {min: 1, step: 1, progressive: true}),
	];
	readonly name = "2 MA";

	getSignaller(params: readonly number[]) {
		return params.length==2 || (params.length>=3 && (params[2]==0 || params[2]==1))
			? new CStrategySignaller_MA({
				period1: params[0],
				period2 : params[1],
				onlyBuy: params[2] > 0,
				volumeWeigh_stepPerc: params[3],
				startBalance: params[4]
			})
			: null;
	}

	private constructor() {
	}

	static readonly instance = new CStrategy_MA();
}

export const Strategy_MA = CStrategy_MA.instance;
