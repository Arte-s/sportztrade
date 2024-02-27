
import {IStrategy, Strategy} from "./Strategy"

import {Strategy_MA} from "./strategies/strategy_MA";
import {Strategy_Pan} from "./strategies/strategy_Pan";
import {Strategy_Lana, Strategy_Lana3, Strategy_LanaNav} from "./strategies/strategy_Lana";
import {Strategy_SigmaChannel} from "./strategies/strategy_SigmaChannel";
import {Strategy_LanaV} from "./strategies/strategy_LanaV";
//import {VirtualItems} from "./Common";

export {Strategy_MA, Strategy_Lana, Strategy_LanaNav, Strategy_Pan, Strategy_SigmaChannel};

export * from "./Strategy";
//export {CStrategy_Lana, CStrategySignaller_Lana} from "./Strategy_Lana";

class CAllStrategies extends Array<IStrategy> {
	[key : string] : any;  //Array<IStrategy>[key];
	constructor(...items : readonly IStrategy[]) {
		super(...items);
		return new Proxy(this, {
			get: (array :CAllStrategies, prop: string)=> {
				return (typeof prop=="string" ? array.find((item)=>item.name==prop) : undefined) ?? array[prop];
			}
		});
	}
}


const strategies= [ Strategy_MA, Strategy_Pan, Strategy_SigmaChannel, Strategy_Lana, Strategy_LanaNav , Strategy_Lana3, Strategy_LanaV] as const;


export const AllStrategies : readonly IStrategy[] & { readonly [key :string] : IStrategy|undefined; } = new CAllStrategies(...strategies);

// export const  AllStrategiesNew : readonly Strategy[]= [Strategy_2Bars, Strategy_MA2, Strategy_Fibo] as const; //, Strategy_MA2] as const

//export {CStrategySignaller_MA} from "./Strategy_MA";
