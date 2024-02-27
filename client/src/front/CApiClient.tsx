import {tOnTicksRec} from "../sistem/base/priceReceiver";
import {
    iApiExchange,
    iPosition,
    iPositionLimitSet,
    iPositionMarketSet,
    tCloseOrder,
    tCloseOrderUserId,
    tGetOrders,
    tModifyOrder, tSpecTicks
} from "../sistem/base/Position";
import {CObjectEventsArr, tListEvent} from "../commons/commons";
import {tApiHistoryServer, tGetHistory} from "./HistoryService";
import {CBar, TF} from "../graph sist/Nav/Bars";

type tUI = "userId"
export type tExchangeApi = iPosition & iApiExchange

export type tClientApi = iPosition & iApiExchange & tApiHistoryServer

export class CApiClient implements tExchangeApi, tApiHistoryServer {
    protected baseApi: tExchangeApi
    protected historyApi: tApiHistoryServer
    protected userId: number
    selectSymbol: string = 'sym1' // надо написать значение по умолчанию
    selectTf: any | undefined

    constructor(data: { userId: number, api: tExchangeApi, historyApi: tApiHistoryServer }) {
        this.historyApi = data.historyApi
        this.baseApi = data.api
        this.userId = data.userId

        this.baseApi.setEventTicks({
            func: () => ({
                onTicks: (data: tOnTicksRec) => {
                    this.onTicks(data)
                    // this.eventTicks.OnSpecEvent<{onTicks:(data: tOnTicksRec)=>void}>((e) => e.onTicks?.(data))
                }
            })
        })

    }
    getHistory(data: tGetHistory): Promise<{readonly bars: readonly CBar[], tf: TF}> {
        return this.historyApi.getHistory(data)
    }

    getSymbolsHistoryServer() {
        return this.historyApi.getSymbols();
    }

    getBBO(symbols: string) {
        return this.baseApi.getBBO(symbols);
    }

    getOrdersById(data: Omit<tGetOrders, tUI>) {
        return this.baseApi.getOrdersById({...data, userId: this.userId});
    }

    getSymbols() {
        return this.baseApi.getSymbols();
    }

    modify(data: Omit<tModifyOrder, tUI>) {
        return this.baseApi.modify({...data, userId: this.userId});
    }

    ordersBookBySymbol(symbols: string) {
        return this.baseApi.ordersBookBySymbol(symbols);
    }

    getOrdersAll(data: Omit<tCloseOrderUserId, tUI>) {
        return this.baseApi.getOrdersAll({...data, userId: this.userId})
    }

    getOrdersHistory(data: Omit<tCloseOrderUserId, tUI>) {
        return this.baseApi.getOrdersHistory({...data, userId: this.userId})
    }

    async closeOrders(data: Omit<tCloseOrder, tUI>) {
        const buf = await this.baseApi.closeOrders({...data, userId: this.userId});
        this.eventClose.OnEvent(buf);
        return buf
    }

    async setLimit(order: Omit<iPositionLimitSet, tUI>) {
        const buf = await this.baseApi.setLimit({...order, userId: this.userId});
        console.log(buf, this.eventLimit);
        this.eventLimit.OnEvent(buf);
        return buf
    }

    async setMarket(order: Omit<iPositionMarketSet, tUI>) {
        const buf = await this.baseApi.setMarket({...order, userId: this.userId});
        this.eventMarket.OnEvent(buf);
        return buf
    }


    onTicks(data: tOnTicksRec) {
        this.eventTicks.OnSpecEvent<tSpecTicks>((e) => e.onTicks?.(data))
        this.mapTicks.get(data.symbol)?.OnSpecEvent<tSpecTicks>((e) => e.onTicks?.(data))
    }

    protected eventLimit = new CObjectEventsArr();
    protected eventMarket = new CObjectEventsArr();
    protected eventClose = new CObjectEventsArr();
    protected eventTicks = new CObjectEventsArr();

    setEventLimit(data: { callback: tListEvent }): void {
        this.eventLimit.Add(data.callback)
    }

    setEventMarket(data: { callback: tListEvent }): void {
        this.eventMarket.Add(data.callback)
        console.log(this.eventMarket.length);
    }

    setEventClose(data: { callback: tListEvent }): void {
        this.eventClose.Add(data.callback)
        console.log(this.eventMarket.length);
    }

    setEventMatching(data: { callback: tListEvent }): void {
        this.baseApi.setEventMatching({...data, userId: this.userId})
    }

    setEventTicks(data: tListEvent<any,tSpecTicks>): void {
        this.eventTicks.Add(data)
    }

    mapTicks = new Map<string, CObjectEventsArr>()

    setEventTicksBySymbol(data: { callback: tListEvent, symbol: string }): void {
        if (!this.mapTicks.has(data.symbol)) this.mapTicks.set(data.symbol, new CObjectEventsArr())
        this.mapTicks.get(data.symbol)?.Add(data.callback)
    }

    getOrdersAllId(data: tCloseOrderUserId): Promise<number[]> {
        return this.baseApi.getOrdersAllId({...data, userId: this.userId})
    }

    getOrdersHistoryId(data: tCloseOrderUserId): Promise<number[]> {
        return this.baseApi.getOrdersHistoryId({...data, userId: this.userId})
    }
}
