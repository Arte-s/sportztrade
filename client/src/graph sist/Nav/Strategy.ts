import {ITrader} from "./TraderOld";

import {CBar, TF} from "./Bars"

import {ParamInfo} from "./ParamOld";
import {IIndicator} from "./Indicator";
import {IParams,IParamsReadonly,ReadonlyFull, SimpleParams} from "../and/CParams";
import {tOnInitIndicator} from "../and/indicatorAPI";
import {Trader, TraderBase, CreateTraderWrapper} from "./Trader";
import * as TraderNew from "./Trader";

export * from "./ParamOld";


//let a : IParamValues = new CParamStepper(0,0,0);
//a[0]= 1;
//a.count= 10;
//let stepper : CParamStepper = { start: 100, end: 1000, step: 50 };
//let stepper= new CParamStepper(100, 1000, 50);

//for(let item of stepper) console.log(item);
//console.log("ok");


export type IStrategyParams = {
	readonly tf :TF;
	readonly params :readonly number[];  // значения параметров стратегии
}


export type StrategyParamsNew<TParams extends IParams= IParams> = {
	readonly tf :TF;
	readonly params :SimpleParams<TParams>;  // значения параметров стратегии
}

export type StrategyCommonParams = IStrategyParams | StrategyParamsNew;

//export type IStrategyParams = readonly number[]; // & { readonly tf? :TF; }



// class CSignal
// {
// 	trade : number;
// 	sellLimit : number;
// 	buyLimit : number;
// }




export interface IStrategy
{
	readonly name : string;                  // Имя стратегии
	readonly paramInfo : readonly Readonly<ParamInfo>[];  // Инфа о параметрах стратегии

	getTraderOld?(params : IStrategyParams) : ITrader;   // Создание трейдера

	//getSignaller(params : IStrategyParams) : IStrategySignaller|null;  // Создание сигналлера
	getSignaller(params : readonly number[], tf :TF) : IStrategySignaller|null;  // Создание сигналлера
}



export type Strategy<TParams extends IParamsReadonly = IParamsReadonly> = Readonly<{
	name: string;
	version? :string;
    paramInfo: TParams; //IParamsReadonly & ReadonlyFull<TParams>; //TParams;
	getTrader(info: SimpleParams<TParams>, tf: TF, onInitData? :tOnInitIndicator): Trader;
}>



export type IStrategyCommon = IStrategy | Strategy;



export type StrategySignal = { volume :number, stoploss? :number, takeprofit? :number, limitOrders?: readonly Readonly<{ price: number; volume: number }>[] };



type MyTrailingSignal = StrategySignal & { trendExtrem? :number };


export interface IStrategySignaller <T extends number|Readonly<StrategySignal> = number|StrategySignal> extends TraderBase, Readonly<
{
	onNewBars(bars: readonly CBar[]) : void;
	getSignal() : T|null;
	// Используемые индикаторы
	readonly indicatorValues? : readonly IIndicator[];
	// Минимальное требуемое число баров (глубина) для расчёта
	readonly minRequiredDepthBars? :number;
	//OnEmptyBar(time : const_Date) { }
}> { }



export function StrategySignalTrailing(signal :Readonly<MyTrailingSignal>, bar : CBar, sl_Offset :number) : MyTrailingSignal|null
{
	let [trendPrice, contrTrendPrice, k] = signal.volume > 0 ? [bar.high, bar.low, 1] : [bar.low, bar.high, -1];
	if (signal.stoploss != null && (contrTrendPrice - signal.stoploss) * k <= 0)  //if (bar.low <= this.signal.stoploss)
		return null; //signal = null;
	if (signal.stoploss==null || (signal.trendExtrem!=null && (trendPrice - signal.trendExtrem) * k >= 0)) { // if (bar.high >= trendExtrem) {
		let newSignal = {...signal};
		newSignal.stoploss = contrTrendPrice - sl_Offset * k;  // = bar.low;
		newSignal.trendExtrem = trendPrice;  // = bar.high;
		return newSignal
	}
	return signal;
}
//=========================================

export type IStrategyObject<TStrategy extends IStrategy= IStrategy> = {
	readonly strategy :TStrategy;         // Стратегия
	readonly paramsData :IStrategyParams; // Параметры стратегии
}

export function createStrategyObject(strategy: IStrategy, params :readonly number[], tf :TF) : IStrategyObject{
	return { strategy, paramsData: { params, tf} };
}

export type IStrategyObjectNew<TStrategy extends Strategy= Strategy> = {
	readonly strategy :TStrategy;         // Стратегия
	readonly paramsData :StrategyParamsNew; // Параметры стратегии
}

export type IStrategyCommonObject<TStrategy extends IStrategyCommon= IStrategyCommon> = {
	readonly strategy :TStrategy;         // Стратегия
	readonly paramsData :StrategyCommonParams; // Параметры стратегии
}




//export function getSignaller(object :IStrategyObject) { return object.strategy.getSignaller(object.paramsData); }

export function getSignaller<T extends IStrategy>(strategyObj :IStrategyObject<T>) : ReturnType<T["getSignaller"]>; // { return strategyObj.strategy.getSignaller(strategyObj.paramsData.params, strategyObj.paramsData.tf); }

export function getSignaller<T extends IStrategy>(strategy: T, params :readonly number[], tf :TF) : ReturnType<T["getSignaller"]>;

// Реализация
export function getSignaller(strategyObjOrStrategy :IStrategyObject|IStrategy, params? :readonly number[], tf? :TF) {
	let strategyObj= (strategyObjOrStrategy as IStrategy).getSignaller==null ? <IStrategyObject>strategyObjOrStrategy : createStrategyObject(strategyObjOrStrategy as IStrategy, params!, tf!);
	return strategyObj.strategy.getSignaller(strategyObj.paramsData.params, strategyObj.paramsData.tf);
}


export function getTraderOrSignaller<T extends IStrategyCommon>(strategyObj :IStrategyCommonObject<T>) {
	if ((strategyObj.strategy as IStrategy).getSignaller!=null) return getSignaller(strategyObj as IStrategyObject);
	let obj= strategyObj as IStrategyObjectNew;
	return obj.strategy.getTrader(obj.paramsData.params, obj.paramsData.tf);
}


export function getTraderExt(strategyObj :IStrategyObjectNew) {
	return CreateTraderWrapper(strategyObj.strategy.name, strategyObj.strategy.getTrader, strategyObj.paramsData.params, strategyObj.paramsData.tf);
}