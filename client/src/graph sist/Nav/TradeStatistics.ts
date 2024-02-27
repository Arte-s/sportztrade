//import {const_Date} from "./Time";
import {CTradeBar, CBar} from "./Tester";

export class TradeStatistics {
	resultProfit: number;
	maxProfit?: number;
	minProfit?: number;
	maxProfitTime?: const_Date;  // время макс.прибыли
	minProfitTime?: const_Date;  // время мин. прибыли
	trades: number; // число сделок
	buys: number;  // число покупок
	sells: number; // число продаэ
	buyVolumes: number;  // объёмы на покупку
	sellVolumes: number; // объёмы на продажу
	// buyBars :number;
	// sellBars :number;

	get totalVolumes() { return this.buyVolumes + this.sellVolumes; }

	comissions: number;
	maxDrawdown: number;   // макс.просадка
	maxDrawdownTime?: const_Date;  // время макс. просадки
	recoveryFactor?: number;       // фактор восстановления
	avrgProfitPerTrade?: number;   // средний профит на сделку
	avrgProfitPerVolume?: number;  // средний профит на лот
	avrgTradeDuration_ms: number;  // средняя длительность сделки
	sharpCoef?: number;            // коэффициент Шарпа

	constructor(equityBars: readonly CTradeBar[]) {  //, comissionOnBars :readonly number[]) { //comissionPerSide :Comission) {
		let length = equityBars.length;
		let maxDrawdown = 0;
		let maxDrawdownTime = undefined;
		let maxValue = Number.MIN_VALUE;
		let minValue = Number.MAX_VALUE;
		let minValueTime = undefined;
		let maxValueTime = undefined;
		let lastVolume = 0;
		let lastValue = 0;
		let lastTime = length > 0 ? equityBars[0].time : undefined;
		let nettoVolume = 0;
		let buyVolumes = 0, sellVolumes = 0;
		let buys = 0, sells = 0;
		//let trades = 0;
		let profitSqrtSum = 0;
		let sumVolumeDuration = 0;
		let comissions = 0;
		let i = -1;
		let startBalance= length>0 ? equityBars[0].open : 0;
		//alert(comissionPerSide.unit=="%");

		for (let bar of equityBars) {
			i++;
			if (bar.high >= maxValue) {
				maxValue = bar.high - startBalance;
				maxValueTime = bar.time;
			}//maxValue= Math.max(bar.high, maxValue);
			if (bar.low <= minValue) {
				minValue = bar.low - startBalance;
				minValueTime = bar.time;
			} //minValue= Math.min(bar.low, minValue);
			let drawdown = maxValue - bar.low;
			if (drawdown >= maxDrawdown) {
				maxDrawdown = drawdown;
				maxDrawdownTime = bar.time;
			}// maxDrawdawn= Math.max(maxValue - bar.low,  maxDrawdawn);
			const volume = bar.volume;
			const [buyVolume, sellVolume] = [bar.buyVolume, (volume - bar.buyVolume)];
			const [buyTrades, sellTrades] = [bar.buyTickVolume, (bar.tickVolume - bar.buyTickVolume)];
			const deltaVolume= buyVolume - sellVolume; // = bar.buyVolume * 2 - volume
			// if (deltaVolume > 0) {
			// 	buyVolumes += volume;
			// 	buys++;
			// } else if (deltaVolume < 0) {
			// 	sellVolumes += sellVolume;
			// 	sells++;
			// }
			buyVolumes += buyVolume;
			buys += buyTrades
			sellVolumes += sellVolume;
			sells +=  sellTrades;
			//if (volume) trades++; //this.tradesCount++;
			let value = bar.close - startBalance;
			profitSqrtSum += (value - lastValue) ** 2;
			lastValue = value;
			sumVolumeDuration += Math.abs(nettoVolume) * (bar.time.valueOf() - lastTime!.valueOf());
			nettoVolume += deltaVolume;
			lastTime = bar.time;
			//if (comissions==0) alert(value+"  "+volume+"  "+comissionPerSide.value * Math.abs(volume) * (comissionPerSide.unit=="%" ? value/100 : 1));
			comissions += equityBars[i].comission;// comissionOnBars[i]; //comissionPerSide.value * Math.abs(volume) * (comissionPerSide.unit=="%" ? value/100 : 1);
		}
		let trades = buys + sells;
		let resultProfit = lastValue; //equityBars[length-1].close;
		this.resultProfit = resultProfit;
		this.maxProfit = maxValue != Number.MIN_VALUE ? maxValue : undefined;
		this.minProfit = minValue != Number.MAX_VALUE ? minValue : undefined;
		this.maxProfitTime = maxValueTime;
		this.minProfitTime = minValueTime;
		this.buyVolumes = buyVolumes;
		this.sellVolumes = sellVolumes;
		this.buys = buys;
		this.sells = sells;
		this.trades = trades;
		this.maxDrawdown = maxDrawdown;
		this.maxDrawdownTime = maxDrawdownTime;
		this.sharpCoef = profitSqrtSum ? resultProfit / Math.sqrt(profitSqrtSum) : undefined;
		this.recoveryFactor = maxDrawdown ? resultProfit / maxDrawdown : undefined;
		this.avrgProfitPerTrade = trades ? resultProfit / trades : undefined;
		this.avrgProfitPerVolume = this.totalVolumes ? resultProfit / this.totalVolumes : undefined;
		let holdedVolumes = this.totalVolumes - Math.abs(nettoVolume);
		this.avrgTradeDuration_ms = holdedVolumes ? sumVolumeDuration / holdedVolumes : 0;
		this.comissions = comissions; //this.totalVolumes * comissionPerSide;
	}


	static getSharpCoef(equityBars: Iterable<CBar>) {  //, comissionOnBars :readonly number[]) { //comissionPerSide :Comission) {
		let lastValue = 0;
		let profitSqrtSum = 0;

		for (let bar of equityBars) {
			let value = bar.close;
			profitSqrtSum += (value - lastValue) ** 2;
			lastValue = value;
		}
		let resultProfit = lastValue; //equityBars[length-1].close;

		return profitSqrtSum ? resultProfit / Math.sqrt(profitSqrtSum) : undefined;
	}


	static getRecoveryFactor(equityBars : Iterable<CBar>) {  //, comissionOnBars :readonly number[]) { //comissionPerSide :Comission) {
		let maxDrawdown = 0;
		let maxValue = Number.MIN_VALUE;
		let lastValue = 0;

		for (let bar of equityBars) {
			if (bar.high >= maxValue) {
				maxValue = bar.high;
			}
			let drawdown = maxValue - bar.low;
			if (drawdown >= maxDrawdown) {
				maxDrawdown = drawdown;
			}
			lastValue = bar.close;
		}
		let resultProfit = lastValue; //equityBars[length-1].close;
		return maxDrawdown ? resultProfit / maxDrawdown : undefined;
	}

}

export type ITradeStatistics = Readonly<TradeStatistics>;



