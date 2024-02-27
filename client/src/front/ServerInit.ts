import {tInfo} from "../sistem/base/Execution";
import {tExchangeApi} from "./CApiClient";
import {Position} from "../sistem/base/Position";
import {CRobotLimits, CRobotMarket} from "../sistem/robot/CRobot";
import {FHistoryServerInit} from "./HistoryService";
import {sleepAsync} from "../graph sist/Nav/Common";

// инициализация массива символов
const allSymbolsCreat : tInfo[]= []
export function SymbolInit() {
    for (let i=0; i<5; i++) {
        allSymbolsCreat.push({name: 'sym'+i, lotStep: 1, maxLot:1000, minLot: 1, minStep: 0.01 })
    }
}
SymbolInit();


export const ExchangeApi: tExchangeApi = new Position({symbols: [...allSymbolsCreat]})
export const HistoryApi = FHistoryServerInit(ExchangeApi)

export async function RobotInit(ExchangeApi: tExchangeApi) {
    const symbols = await ExchangeApi.getSymbols();
    if (symbols) {
        symbols.forEach((e,i)=>{
            const robot1 = new CRobotLimits({api: ExchangeApi, apiHistory: HistoryApi, symbol:e, userId: 200+i, paramsStrategy:{}})
            robot1.start()
        })
        await sleepAsync(500);
        symbols.forEach((e,i)=>{
            const robotMarket1 = new CRobotMarket({api: ExchangeApi, apiHistory: HistoryApi,symbol:e, userId: 2200+i, paramsStrategy:{}})
            robotMarket1.start()
        })
    }
}

