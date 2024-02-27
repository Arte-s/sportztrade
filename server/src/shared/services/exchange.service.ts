import { tInfo } from "../../../../client/src/sistem/base/Execution";
import {Position} from "../../../../client/src/sistem/base/Position";

export const ExchangeApi: Position = new Position({symbols: []})

export function loadSymbols() {
    // загружаем из БД символы при старте сервера

    ExchangeApi.addSymbols({symbols: [{name: 'sym1', lotStep: 1, maxLot:1000, minLot: 1, minStep: 1}]})
}

export function AddSymbols(info:tInfo[]) {
    ExchangeApi.addSymbols({symbols:info})
}


