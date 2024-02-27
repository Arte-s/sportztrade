import * as api from "../API";
import {const_Date, TesterTick, TesterTrade, TF} from "../API";

export type tOrderHistoryType = "Buy" | "Sell" | "BuyClose" | "SellClose" | "close"
export  type tOrderHistory = {
    symbol: string,
    type: tOrderHistoryType,
    time: const_Date | Date,
    volume: number,
    price: number,
    loss?: number,
    profit?: number
}


export type tOrderBase = {
    price: number,
    time: const_Date | Date
}

export type tOrderBaseV = tOrderBase &{
    volume: number
}

export type tOrdersMap = {
    symbol: string,
    event: {
        loss?: tOrderBase[],
        profit?: tOrderBase[],
        volume: tOrderBaseV[],
    }
    type: tOrderHistoryType,
    time: const_Date | Date,
    profit?: number,
    loss?: number,
    volume: number,
    price: number,
}

//time,trades,equityBar,price,name
export type tTestOrdersAND = {name: string, equityBar: api.CTradeBar | undefined, tf:TF, price?:number,  time: const_Date , trades: readonly TesterTrade[], equity:number}
export type tTestOrdersAND2 = {data: api.CTradeBar[], symbol: string, tf:TF}
export type TesterTradeAND = TesterTrade & {equity:number}

export class CTestOrdersAND {
    equityByTF: {arr:api.CTradeBar[], tf:TF} | undefined
    trades: TesterTradeAND[] = []
   // ordersMap = new Map<number, tOrdersMap>()
   // orders: tOrderHistory[] = []
   // lastVolume:tOrderHistory | undefined;
    //sumVolume:number=0;
    EquityBarToArrStream({name, equityBar, tf, price, trades, time, equity}:tTestOrdersAND) {
        const result = trades.map((el)=>{return {...el,equity }})
        this.trades.push(...result)

        this.equityByTF??= {arr:[], tf}
        const {arr} = this.equityByTF
        if (equityBar) {
            if (arr.length==0) arr.push(equityBar)
            if (equityBar.time == arr[arr.length-1].time) {
                arr[arr.length-1] = equityBar
            }
            else {
                arr.push(equityBar)
            }
        }

    }

    EquityBarToArr({symbol,data:arr,tf}:tTestOrdersAND2) {
      //  if (arr) for (let data of arr) this.EquityBarToArrStream({data,symbol,tf})
    }

    Clean() {
        this.trades.length=0
        this.equityByTF = undefined

        // this.lastVolume= undefined;
        // this.orders = []
    }
}
