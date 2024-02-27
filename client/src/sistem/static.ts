import {Position} from "./base/Position";
import {tInfo} from "./base/Execution";


const demo: tInfo[] = [
    {lotStep: 0.1, maxLot: 500, minLot: 0.1, minStep:0.01, name:"sova"},
    {lotStep: 0.1, maxLot: 500, minLot: 0.1, minStep:0.01, name:"sova2"},
]

export const exchange = new Position({symbols: [...demo]})

//генерим историю
export function FSymbolsInit() {

}
