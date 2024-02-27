import {Execution, tInfo, tLimitE, tMarketE, tOnTicks, tOrderEventE} from "./Execution";


type tSymbolStruct = {symbol: string}
type tMarket = {symbol:string, userId: number, volume: number}
type tLimit = {price: number} & tMarket
// type tNewEvent = {symbol: string, orderId: number | undefined, userId: number, price: number}
export type tPriceRrCallback = tOrderEventE & tSymbolStruct
export type PriceReceiverProps = {
    func : (data: tPriceRrCallback) => void
    onTicksR : (data: tOnTicksRec) => void
}
type tSetLimit = {orderId: number} & tLimit

export type tOnTicksRec = tOnTicks & tSymbolStruct
type tInfoOrder = {}

type tSymbol = string
type tOrderId = number

export class PriceReceiver {
    lastId: number = 0 //TODO при старте сервера взять последний айди из редиса !!!!!!!!!!!!!
    mapSymbols= new Map<tSymbol,Execution>()
    mapOrderId = new Map<tOrderId, tSymbol>() //TODO при старте сервера надо заполнить эту мапу из редиса !!!!!!!!!!!!!
    event : (data: tPriceRrCallback) => void
    callbackTicksR: (data: tOnTicksRec)=> void

    constructor(data : PriceReceiverProps) {
        this.event = data.func
        this.callbackTicksR = data.onTicksR
    }

    getOrderInfo(orderId:number) {
        const sym = this.mapOrderId.get(orderId)
        if (sym) {
            return  this.mapSymbols.get(sym)?.getInfoByOrderId(orderId)
        }
        else return undefined
    }

    setSymbols(symbols: tInfo[]){
        for (const symbol of symbols) {
            this.mapSymbols.set(symbol.name, new Execution({
                info: symbol,
                func:(data)=>this.event({...data, symbol: symbol.name}),
                onTicks: (data)=>this.callbackTicksR({...data, symbol: symbol.name}),
            }))
        }

    }

    getSymbols(){
        return [...this.mapSymbols.keys()]
    }

    // потом сделаем асинхронно
    ordersBookBySymbol(symbols: string){
        return this.mapSymbols.get(symbols)?.orderBook()
    }

    getBBO(symbols: string): tOnTicks| undefined {
        return this.mapSymbols.get(symbols)?.getBBO()
    }

    private genNewtId(data: tLimit|tMarket){
        return ++this.lastId
    }


    async setLimit( data: tLimit): Promise<tSetLimit> {
        const {price, volume, symbol, userId} = data
        const datum: tLimitE = {
            price, volume, idOrder: this.genNewtId(data)
        }
        const result = await (async () => this.mapSymbols.get(symbol)?.setLimitOrder(datum))()
        if(result){
            this.mapOrderId.set(datum.idOrder,symbol)
        }
        const tt = {symbol, orderId: result ? datum.idOrder : undefined, userId, price}
      //  if (!tt.orderId) throw "error =("
        // this.eventNew(tt)
        return tt as tSetLimit
    }

    async deleteLimitOrder(data: {orderId:number}) {
        const sym = this.mapOrderId.get(data.orderId)
        if (sym) {
            return  this.mapSymbols.get(sym)?.deleteLimit({idOrder: data.orderId})
        }
        else return false
    }

    async setMarket( data: tMarket): Promise<tSetLimit> {
        const {volume,symbol, userId}= data
        const datum : tMarketE = {
            volume, idOrder: this.genNewtId(data)
        }
        const result = await (async () => this.mapSymbols.get(symbol)?.setMarketOrder(datum))()

        const tt = {symbol, orderId: result ? datum.idOrder : undefined, userId, price: result?.price??0, volume:result?.volume??0}
        if (!tt.orderId) throw "error =("


        return tt as tSetLimit
    }

}


