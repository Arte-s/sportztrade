
// type tOrder = "buyLimit"|"sellLimit"|"buy"|"sell"

import {CListNode} from "../../commons/listNode";


export type tMethodToPromise2<T extends object> = {[P in keyof T] : T[P] extends ((...args: infer Z)=> infer X)? (...args: Z)=>(X extends Promise<any>? X : Promise<X>) : Promise<T[P]>}
export type tMethodToPromise3<T extends object> =
    {
        [P in keyof T] : T[P] extends ((...args: infer Z)=> infer X)? (...args: Z)=>(X extends Promise<any>? X : Promise<X>) : T[P]}


export type tOrderEventE = {
    price: number
    idOrder: number,
    idOrder2?: number,
    volume: number,
}

export type tOnTicks = {
    ask: number,
    askV: number,
    askC: number,
    bid: number,
    bidV: number,
    bidC: number,
    time: Date
}


export type tMarketE = {idOrder: number, volume: number}
export type tLimitE = {price: number} & tMarketE
export type tOrderBook = {price: number, volume: number,count:number}

type IExecutionBase = {

    getBBO(): tOnTicks

    orderBook(): tOrderBook[]
}

type IExecutionBaseOther = {
    //установить новый лимитник
    setLimitOrder(data: tLimitE): Promise<boolean>

    //уменьшить обьем действующего лимитника
    editLimit(data: tLimitE): Promise<boolean>

    //удаление лимитки
    deleteLimit(data: {idOrder: number}): Promise<boolean>
    //установить новый лимитник
    setMarketOrder(data: tMarketE): Promise<{price: number, volume: number}>

}

export type IExecution = tMethodToPromise3<IExecutionBase>

type tList = { idOrder: number, volume: number, price: number }
type tArray = CListNode<tList>
export type tInfo = {
    minStep: number // 0.0025
    minLot: number,
    lotStep: number,
    maxLot: number,
    name: string
}
type ExecutionProps = {
    func: (data:tOrderEventE) => void,
    onTicks: (data:tOnTicks) => void,
    info: tInfo
}
class ExecutionBase implements IExecutionBase{
    get last(): Required<tOrderEventE> | undefined {
        return this._last;
    }

    set last(value: Required<tOrderEventE> | undefined) {
        this._last = value;
    }

    get ask(): number {
        return this._ask;
    }

    set ask(value: number) {
        if (this.volumeByPrice(value) >= 0) {
            console.warn("!!!!")
        }
        this._ask = value;
        this.callbackTicks(this.getBBO())
    }

    get bid(): number {
        return this._bid;
    }

    set bid(value: number) {
        if (this.volumeByPrice(value) <= 0) {
            console.warn("!!!!")
        }
        this._bid = value;

        this.callbackTicks(this.getBBO())
    }

    countByPrice(price: number){
        return this.array[this.priceToIndex(price)]?.count ?? 0
    }

    volumeByPrice(price: number){
        return this.arrayVolume[this.priceToIndex(price)]??=0
    }

    orderBook(): tOrderBook[] {
        return this.array.map((e,i)=>{
            const price = this.indexToPrice(i)
            return {price, volume: this.volumeByPrice(price), count: this.countByPrice(price)}
        })
    }

    protected callback: (data:tOrderEventE) => Promise<void>
    protected callbackTicks: (data:tOnTicks) => Promise<void>
    protected info: tInfo
    constructor(data: ExecutionProps) {
        this.callback = (async (datum: tOrderEventE)=> data.func(datum))
        this.callbackTicks = (async (datum: tOnTicks)=> data.onTicks(datum))
        this.info = {...data.info}
    }
    map = new Map<number,tArray>()

    getBBO(): tOnTicks {
        return {
            bid:    this.bid,
            bidV:   this.volumeByPrice(this.bid),
            bidC:   this.countByPrice(this.bid),
            askV:   this.volumeByPrice(this.ask),
            ask:    this.ask,
            askC:   this.countByPrice(this.ask),
            time:   new Date()}
    }

    private _last: Required<tOrderEventE> | undefined
    private _ask: number = Number.MAX_VALUE
    private _bid: number = 0
    array : tArray[]= [] //
    arrayVolume : number[]= [] //



    searchMiddle(){
        // this.last?.price
    }

    protected async deleteLimitBase({idOrder}: { idOrder: number }) {
        const buf = this.map.get(idOrder)
        if (buf) {
            this.map.delete(idOrder)
            buf.DeleteLink()

            const {price,volume} = buf.data!
            let index = this.priceToIndex(price)
            const row = this.array[index]
            this.arrayVolume[index]-=volume

            if (row.count == 0 && (price == this.bid || price == this.ask)) {
                const step = volume > 0 ? -1 : 1
                while (1) {
                    const row = this.array[index]
                    if (row && row.count>0) {
                        const price = row.dataNext!.price
                        if (volume>0) this.bid = price
                        else this.ask = price
                        break
                    }
                    if(index > this.array.length-1 || index < 0) break
                    index+=step
                }
            }
            return true
        }
        return false
    }

    getInfoByOrderId(idOrder: number){
        return this.map.get(idOrder)
    }

    private minPrice: number = 0

    priceToIndex(price:number) {
        return Math.round((price - this.minPrice)/this.info.minStep )
    }

    indexToPrice(index:number) {
        return index*this.info.minStep + this.minPrice
    }


    protected async editLimitBase(data: tLimitE) {
        return false;
    }

    protected async setLimitOrderBase(data: tLimitE) {
        const {ask, bid} = this
        const {idOrder,volume,price} = data

        if (!volume) {return false}
        // нормализация цены и обьема

        //нормализация индекса
        const index = this.priceToIndex(price)

        if (volume<0 && price<=bid) {return false}
        if (volume>0 && price>=ask) {return false}

        const row = this.array[index]??=new CListNode<tList>()
        this.arrayVolume[index]??=0
        const link = row.AddPrev({idOrder, price, volume})
        this.arrayVolume[index]+=volume
        this.map.set(idOrder,link)


        if (volume<0 && price<ask) {
            if (this.volumeByPrice(price) >= 0) {
                console.warn("!!!!")
            }
            this.ask = price
        }
        if (volume>0 && price>bid) {
            if (this.volumeByPrice(price) <= 0) {
                console.warn("!!!!")
            }
            this.bid = price
        }

        return true;
    }


    async ExecuteOrder(market: { idOrder: number; volume: number}, limit: CListNode<tList>){
        const limitData = limit.data!
        const type = limitData.volume <0 ? 1: -1

        if((market.volume > 0 && limitData.volume > 0) || (market.volume < 0 && limitData.volume < 0)){
            console.log(this.getBBO())
            console.log(this)
            console.trace(this.orderBook())
            throw 'WTF!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!'
        }

        const result = (market.volume + limitData.volume) * type

        // console.log('market.volume: ' + market.volume)
        // console.log('limitData.volume: ' + limitData.volume)
        // console.log('result: ' + result)


        // limit закрылась, market остался
        if (result>0) {
            this.callback({
                idOrder: limitData.idOrder,
                idOrder2: market.idOrder,
                price: limitData.price,
                volume: -limitData.volume
            })
            // limitData.volume = 0  нельзя обнулять - объем нужен в deleteLimit
            await this.deleteLimitBase({idOrder: limitData.idOrder})
        }
        // limit закрылась, market закрылся
        if (result==0) {
            this.callback({
                idOrder: limitData.idOrder,
                idOrder2: market.idOrder,
                price: limitData.price,
                volume: -limitData.volume
            })
            // limitData.volume = 0   нельзя обнулять - объем нужен в deleteLimit
            await this.deleteLimitBase({idOrder: limitData.idOrder})

            // this.callback({
            //     idOrder: market.idOrder,
            //     idOrder2: limitData.idOrder,
            //     price: limitData.price,
            //     volume: market.volume
            // })  //?

        }

        // limit остался, market закрылся
        if (result<0) {
            limitData.volume +=market.volume
            this.arrayVolume[this.priceToIndex(limitData.price)] +=market.volume
            this.callback({
                idOrder: limitData.idOrder,
                idOrder2: market.idOrder,
                price: limitData.price,
                volume: market.volume
            })

            // this.callback({
            //     idOrder: market.idOrder,
            //     idOrder2: limitData.idOrder,
            //     price: limitData.price,
            //     volume: market.volume
            // })  //?
        }
        return {volumeNew: result, volumeExec: result <= 0 ? market.volume : limitData.volume*-1, price: limitData.price}
    }

    async setMarketOrderBase(data: tMarketE) {
        const {volume,idOrder} = data
        let v1 = volume
        const byf = {
            price: 0,
            volume: 0
        }
        if(!volume){
            return byf
        }
        if (volume> 0) {
            let index = this.priceToIndex(this.ask)
            while (v1>0) {
                if (index<0 || index>=this.array.length) {
                    //....

                    break
                }
                const row = this.array[index]
                if (row?.count) {
                    const link = row.First()
                    if (link) {
                        if((v1 > 0 && link.data!.volume > 0) || (v1 < 0 && link.data!.volume < 0)){
                            console.log("bad")
                        }
                        const tt = await this.ExecuteOrder({idOrder: data.idOrder, volume: v1}, link )
                        v1= tt.volumeNew
                        byf.volume += tt.volumeExec
                        byf.price += tt.volumeExec * tt.price
                    }
                }
                else index++
            }

        }
        else {
            let index = this.priceToIndex(this.bid)
            while (v1<0) {
                if (index<0 || index>=this.array.length) {
                    //....

                    break
                }
                const row = this.array[index]
                if (row?.count) {
                    const link = row.First()
                    if (link) {
                        if((v1 > 0 && link.data!.volume > 0) || (v1 < 0 && link.data!.volume < 0)){
                            console.log("bad")
                        }
                        const tt = await this.ExecuteOrder({idOrder: data.idOrder, volume: v1}, link )
                        v1= tt.volumeNew*-1
                        byf.volume += tt.volumeExec
                        byf.price += Math.abs(tt.volumeExec) * tt.price
                    }
                }
                else index--
            }
        }
        byf.price = byf.price/Math.abs(volume)
        return byf;
    }
}

export class Execution extends ExecutionBase implements IExecutionBaseOther, IExecutionBase{
    queue = Promise.resolve()
    queueCount = 0
    queueCheck(){
        // if (this.queueCount>20) console.warn("у нас проблемы очередь более 20")
    }
    status = 0
    async deleteLimit(data: { idOrder: number }): Promise<boolean> {
        this.queueCount++
        return new Promise(resolve => {
            this.queue = this.queue.then(async e=>{
                if (this.status== 1) {
                    console.trace("!!!!")}
                this.status = 1
                const result =await super.deleteLimitBase(data)
                this.queueCount--
                this.queueCheck()
                this.status = 0
                resolve(result)
            })

        })
    }

    async editLimit(data: tLimitE): Promise<boolean> {
        this.queueCount++
        return new Promise(resolve => {
            this.queue = this.queue.then(async e=>{
                if (this.status== 1) {
                    console.trace("!!!!")}
                this.status = 1
                const result =await super.editLimitBase(data)
                this.queueCount--
                this.queueCheck()
                this.status = 0
                resolve(result)
            })

        })
    }

    async setLimitOrder(data: tLimitE): Promise<boolean> {
        this.queueCount++
        return new Promise(resolve => {
            this.queue = this.queue.then(async e=>{
                if (this.status== 1) {
                    console.trace("!!!!")}
                this.status = 1
                const result = await super.setLimitOrderBase(data)
                this.queueCount--
                this.queueCheck()
                this.status = 0
                resolve(result)
            })

        })
    }

    async setMarketOrder(data: tMarketE): Promise<{price: number, volume: number}> {
        this.queueCount++
        return new Promise(resolve => {
            this.queue = this.queue.then(async e=>{
                if (this.status== 1) {
                    console.trace("!!!!")}
                this.status = 1
                const result = await super.setMarketOrderBase(data)
                this.queueCount--
                this.queueCheck()
                this.status = 0
                resolve(result)
            })
        })
    }
}






