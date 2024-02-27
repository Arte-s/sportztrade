import {PriceReceiver, tOnTicksRec, tPriceRrCallback} from "./priceReceiver";
import {tInfo, tOnTicks, tOrderBook} from "./Execution";
import {CObjectEventsArr, tListEvent} from "../../commons/commons";
// import {CMapAsyncInside, dMapAsync} from "../../../../server/src/shared/CMapServer";  // запуск на редисе
import {CMapAsyncInside, dMapAsync} from "./CMapAsync";


export const BDNames = {
    CBDRealLimit: "CBDRealLimit",
    CBDRealMarket: "CBDRealMarket",
    CBDHistory: "CBDHistory",
    CBDRevers: "CBDRevers"
}

const BDRevers = dMapAsync.BDRevers() // очищается при переходе в историю
const BDRealLimit = dMapAsync.BDRealLimit()
const BDRealMarket = dMapAsync.BDRealMarket()
const BDHistory = dMapAsync.BDHistory()


interface iPositionBase {
    type: "Limit"|"Market"
    userId: number,
    // orderId: number | undefined
    price?: number | undefined,
    volume: number,
    stopLoss?: number,
    takeProfit?: number
    symbol: string,
    // status?: "closed"|"void"|"error"|"limit"|"market"
}

interface iPositionBaseGet {
    orderId: number
    status: "closed"|"void"|"error"|"limit"|"market"|"delete"
    timeLimit?: Date | undefined,
    timeOpen?: Date | undefined,
    timeClosed?: Date | undefined,
    profit?: number|undefined
}


interface iPositionLimit extends  iPositionBase {
    type: "Limit"
    price: number,
}
export interface iPositionLimitSet extends  iPositionLimit {}
export interface iPositionLimitGet extends  iPositionLimit, iPositionBaseGet {
    orderId: number
    timeLimit: Date,
    profit?: undefined
    timeOpen?:  undefined,
    timeClosed?:  undefined,

}
interface iPositionMarket extends  iPositionBase {
    type: "Market"
    positionId?: number, //
}

export interface iPositionMarketSet extends  iPositionMarket {
    price: undefined,
}
export interface iPositionMarketGet extends  iPositionMarket, iPositionBaseGet {
    orderId: number
    timeLimit?: undefined,
    timeOpen: Date,
    timeClosed?:  undefined,
    profit: number
}

export interface iPositionMarketGetHistory extends iPositionMarket, iPositionBaseGet{
    status: "closed"
    timeOpen: Date,
    timeClosed: Date,
    priceClose: number,
    profit: number
    orderId: number
    timeLimit?: undefined,
}

interface tOrderVoid extends iPositionBaseGet{
    userId: number,
    orderId: number,
    type: "void"|"error",
    status: "void"|"error",
    timeLimit?: undefined,
    timeOpen?: undefined,
    timeClosed?: undefined,
    profit?: undefined
} // если нет, или уже нет такой сделки

export type tGetOrders = {ordersId: number[], userId: number}  // если массив пустой, то информация по все сделкам

export type tGetOrdersResult = (iPositionLimitGet | iPositionMarketGet | tOrderVoid)
type tGetOrdersResults = tGetOrdersResult[]
export type tClosedOrdersResult = (iPositionMarketGetHistory | tOrderVoid)[]


export type tModifyOrder = {
    userId: number,
    orderId: number,
    stopLoss?: number,
    takeProfit?: number
}

export type tModifyOrderResult = {
    status: "complete"|"error"
    orderId: number,
    stopLoss?: number,
    takeProfit?: number
}

export type tCloseOrderUserId = { userId: number}
export type tCloseOrder = {ordersId: number[], userId: number}



export interface iPosition {
    setLimit(order: iPositionLimitSet): Promise<iPositionLimitGet | undefined>
    setMarket(order: iPositionMarketSet): Promise<iPositionMarketGet | undefined>
    getOrdersById(data: tGetOrders): Promise<tGetOrdersResult[]>
    closeOrders(data: tCloseOrder): Promise<tClosedOrdersResult>
    modify(data: tModifyOrder): Promise<tModifyOrderResult>
    getOrdersAll(data: tCloseOrderUserId): Promise<(iPositionLimitGet | iPositionMarketGet)[]>
    getOrdersHistory(data: tCloseOrderUserId): Promise<(iPositionMarketGetHistory)[]>
    getOrdersAllId(data: tCloseOrderUserId): Promise<number[]>
    getOrdersHistoryId(data: tCloseOrderUserId): Promise<number[]>
}

export interface iApiExchange extends iPosition{
    ordersBookBySymbol(symbols: string): tOrderBook[] | undefined
    getBBO(symbols: string): Promise<tOnTicks| undefined>
    getSymbols():  Promise<string[]>
    // добавить события по тику
    setEventTicks(data: tListEvent<any,tSpecTicks>): void  // waring
    // добавить события по исполнению позиции у определенного пользователя
    setEventMatching(data: {callback: tListEvent, userId: tUserId}): void
    //TODO а как получать значение last, последняя испоенная сделка, надо добавить такой функционал
}


export type tSpecTicks = {
    onTicks(data: tOnTicksRec): void
}
export type tSpecMatching = {
    matching(data: tPriceRrCallback): void
}

export type tUserId = number
export type tOrderId = number

export class Position implements iPosition, iApiExchange{
    // базовый список валют по которым происходит работа
    base: PriceReceiver

    protected eventTicks = new CObjectEventsArr();
    protected eventMatching = new Map<tUserId, CObjectEventsArr>();

    setEventTicks(data: tListEvent<any,tSpecTicks>){
        this.eventTicks.Add(data)
        // setTimeout(()=>data.del?.(), 1000*60*60*24)
    }
    setEventMatching(data: {callback: tListEvent, userId: tUserId}){
        const {eventMatching: ev} = this
        const userCallbackMatching = ev.get(data.userId) ?? (ev.set(data.userId, new CObjectEventsArr())).get(data.userId)!
        userCallbackMatching.Add(data.callback)
        // setTimeout(()=>data.del?.(), 1000*60*60*24)
    }


    // потом сделаем асинхронно
    ordersBookBySymbol(symbols: string){
         return this.base.ordersBookBySymbol(symbols)
    }
    getBBO(symbols: string): Promise<tOnTicks| undefined> {
        return (async ()=>this.base.getBBO(symbols))()
    }


    constructor(data: {symbols: tInfo[]}) {
        this.base = new PriceReceiver({
            onTicksR:(data)=>this.newTicks(data),
            func:(data)=>this.matching(data)
        })
        this.base.setSymbols(data.symbols)
    }

    addSymbols(data: {symbols: tInfo[]}){
        this.base.setSymbols(data.symbols)
    }

    async getSymbols(){
        return this.base.getSymbols()
    }

    protected async matching(data: tPriceRrCallback){
        const user = await BDRevers.get(data.idOrder)
        if (user) {
            const ordersLimitMap = await BDRealLimit.get(user)
            const ordersMarketMap = await BDRealMarket.add(user, new CMapAsyncInside<tOrderId, (iPositionMarketGet)>(BDNames.CBDRealMarket,user))
            if (ordersLimitMap?.size && ordersMarketMap) {
                const order = await ordersLimitMap.get(data.idOrder)
                if (order) {
                    if (order.type=="Limit") {

                        //data.volume = data.volume*-1
                        // ошибка
                        const result: iPositionMarketGet= {profit: 0, timeOpen: new Date(), ...order, timeLimit: undefined, ...data, type:"Market", status: "market",  positionId: order.orderId}

                        const old = await ordersMarketMap.get(data.idOrder)

                        await ordersMarketMap.set(order.orderId, {...result, timeOpen: old?.timeOpen ?? result.timeOpen, volume: -data.volume + (old?.volume??0)})

                        const compares = order.volume + data.volume
                        if (compares==0) {
                            await ordersLimitMap.delete(data.idOrder)
                        }
                        else {
                            order.volume+=data.volume
                            await ordersLimitMap.set(order.orderId,order)
                        }

                        return result;

                    }
                    else {

                    }
                }
            }
            this.eventMatching.get(user)?.OnSpecEvent<tSpecMatching>(e=>e?.matching(data))
        }


    }
    protected newTicks(data: tOnTicksRec){
        this.eventTicks.OnSpecEvent<tSpecTicks>(e=>e?.onTicks(data))
    }


    async getOrdersHistory(data: tCloseOrderUserId): Promise<(iPositionMarketGetHistory)[]> {
        const history = (await BDHistory.get(data.userId))?.getValues()
        const t2 = history && await history
        return [...(t2??[])]
    }

    async getOrdersHistoryId(data: tCloseOrderUserId)  {
        const history = (await BDHistory.get(data.userId))?.getValues()
        const t2 = history && await history
        return [...(t2??[])].map(e=>e.orderId)
    }

    async getOrdersAll(data: tCloseOrderUserId){
        const realMarket = (await BDRealMarket.get(data.userId))?.getValues()
        const realLimit = (await  BDRealLimit.get(data.userId))?.getValues()
        const t1 = realMarket && await realMarket
        const t2 = realLimit && await realLimit
        return [...(t1??[]), ...(t2??[])]
    }

    async getOrdersAllId(data: tCloseOrderUserId){
        const realMarket = (await BDRealMarket.get(data.userId))?.getValues()
        const realLimit = (await  BDRealLimit.get(data.userId))?.getValues()
        const t1 = realMarket && await realMarket
        const t2 = realLimit && await realLimit
        return [...(t1??[]), ...(t2??[])].map(e=>e.orderId)
    }

    async getOrdersById(data: tGetOrders): Promise<tGetOrdersResult[]> {
        const realMarket = await BDRealMarket.get(data.userId)
        const realLimit = await  BDRealLimit.get(data.userId)
        if (realMarket || realLimit) {
            const all = data.ordersId.map(async (e)=>{
                const order = (await (async ()=> realMarket?.get(e))()) ?? (await (async ()=> realLimit?.get(e))())
                if (order) {
                    if (order.type=="Limit") {
                        return {...order} as iPositionLimitGet
                    }
                    else {
                        return {
                            ...order,
                            // profit: 0
                        } as iPositionMarketGet
                    }
                }
                else {
                    return {
                        type: "void",
                        status: "void",
                        orderId: e,
                        userId: data.userId,
                    } as tOrderVoid
                }}
            )
            const result: tGetOrdersResult[] = await Promise.all(all)
            return result
        }
        // доработать, взять информацию с истории сделок если не нашли в реале


        return []
    }

    async modify(data: tModifyOrder): Promise<tModifyOrderResult> {
        let real:iPositionLimitGet | iPositionMarketGet | undefined
        let limitOrders:CMapAsyncInside<number,iPositionLimitGet> | undefined
        let marketOrders: CMapAsyncInside<number,iPositionMarketGet> | undefined
        marketOrders = await BDRealMarket.get(data.userId)
        if(marketOrders) real = await marketOrders.get(data.orderId)
        if(!real){
            limitOrders = await BDRealLimit.get(data.userId)
            if(limitOrders) real = await limitOrders.get(data.orderId)
        }

        if (real) {
            real.stopLoss = data.stopLoss
            real.takeProfit = data.takeProfit
            // сохраняем в базу данных
            if(marketOrders) await marketOrders.set(data.orderId,real as iPositionMarketGet)
            else await limitOrders?.set(data.orderId,real as iPositionLimitGet)
            return {
                status: "complete",
                stopLoss: real.stopLoss,
                orderId: real.orderId,
                takeProfit: real.takeProfit
            }
        }
        return {
            status: "error",
            stopLoss: data.stopLoss,
            orderId: data.orderId,
            takeProfit: data.takeProfit
        }
    }


    async setLimit(order: iPositionLimitSet): Promise<iPositionLimitGet | undefined> {
        if(!order.price || isNaN(order.price) || isNaN(order.volume)) return undefined

        const real = (await BDRealLimit.get(order.userId)) ?? (await (await BDRealLimit.set(order.userId, new CMapAsyncInside<tOrderId, (iPositionLimitGet)>(BDNames.CBDRealLimit,order.userId))).get(order.userId))

        const data =await this.base.setLimit({...order})

        if(!data.orderId){
           return undefined
        }
        const result: iPositionLimitGet= {status: "limit", timeLimit: new Date(), ...order, ...data}

        if(real) await real.set(result.orderId, result)

        await BDRevers.add(data.orderId, data.userId, "limit")
        return result;
    }

    async setMarket(order: iPositionMarketSet): Promise<iPositionMarketGet | undefined> {
        if(isNaN(order.volume)) return undefined
        const real = await BDRealMarket.get(order.userId) ?? (await (await BDRealMarket.set(order.userId,new CMapAsyncInside<tOrderId,(iPositionMarketGet)>(BDNames.CBDRealMarket,order.userId))).get(order.userId))!

        const data = await this.base.setMarket({...order})

        if(!data.orderId){
            return undefined
        }
        const result: iPositionMarketGet= {profit: 0, status: "market", timeOpen: new Date(), ...order, ...data, positionId: data.orderId}

        if(real) await real.set(result.orderId, result)

        await BDRevers.add(data.orderId, data.userId, "market")
        return result;
    }

    async closeOrders(data: tCloseOrder): Promise<tClosedOrdersResult> {
        // что-то делаем с бд
        const realMarket = await BDRealMarket.get(data.userId)
        const realLimit = await BDRealLimit.get(data.userId)

        const res: tClosedOrdersResult = []

        if (realMarket || realLimit) {
            const history = await BDHistory.get(data.userId) ?? (await (await BDHistory.set(data.userId,new CMapAsyncInside<tOrderId,(iPositionMarketGetHistory)>(BDNames.CBDHistory,data.userId))).get(data.userId))!
            for (const orderId of data.ordersId) {
                const orderMarket = realMarket? await realMarket.get(orderId) : undefined
                const orderLimit = realLimit ? await realLimit.get(orderId) : undefined

                if (orderLimit && orderLimit.type == "Limit") {
                    const r = await this.base.deleteLimitOrder(orderLimit)
                    await realLimit!.delete(orderLimit.orderId)
                    await BDRevers.delete(orderLimit.orderId)

                    const x: tOrderVoid = {
                        orderId: orderLimit.orderId,
                        userId: orderLimit.userId,
                        status: r ? "void": "error",
                        type: r ? "void": "error"
                    }
                    res.push(x)

                }
                if (orderMarket && orderMarket.type == "Market") {
                    await realMarket!.delete(orderMarket.orderId)
                    await BDRevers.delete(orderMarket.orderId)

                    const close =await this.base.setMarket({symbol: orderMarket.symbol, userId: data.userId, volume: -1*orderMarket.volume})

                    const orderClosed: iPositionMarketGetHistory = {
                        symbol: close.symbol,
                        userId: data.userId,
                        volume: -1*close.volume,
                        type: "Market",
                        status: "closed",
                        takeProfit: orderMarket.takeProfit,
                        stopLoss: orderMarket.stopLoss,
                        orderId: orderMarket.orderId,
                        timeClosed: new Date(),
                        price: orderMarket.price,
                        priceClose: close.price,
                        profit: (close.price-orderMarket.price!)*-close.volume,
                        timeOpen: orderMarket.timeOpen,
                    }

                    res.push(orderClosed)
                    if(!close.volume) continue
                    await history.set(close.orderId,orderClosed)
                }
            }
        }

        return res;
    }

}


