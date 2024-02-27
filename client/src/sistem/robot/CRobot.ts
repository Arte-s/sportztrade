import {iApiExchange, iPosition, iPositionLimitGet} from "../base/Position";
import {tClientApi} from "../../front/CApiClient";
import {tApiHistoryServer} from "../../front/HistoryService";
import {NormalizeDouble} from "../../graph sist/Nav/Common";

type tRobotLimitProps = {
    userId: number,
    symbol: string,
    paramsStrategy: {},
    api: iPosition & iApiExchange,
    apiHistory: tApiHistoryServer
}

type tFRobotLimit = {
    userId: number,
    symbol: string,
    start: ()=>void,
    stop: ()=>void,
    closeAll: ()=>void
}

interface iRobotLimits extends tFRobotLimit{

}

abstract class CRobotBases implements iRobotLimits{
    api: iPosition & iApiExchange
    apiHistory: tApiHistoryServer
    constructor(data: tRobotLimitProps) {
        this.api = data.api
        this.apiHistory = data.apiHistory
        this.symbol = data.symbol
        this.userId = data.userId
    }
    abstract closeAll(): void
    abstract start(): void
    abstract stop(): void
    readonly symbol: string;
    readonly userId: number;
}


// поставить 10000 limit если стало меньше ставит еще до 100


/**
 * Робот устанавливает сделки в стакан.
 */
export class CRobotLimits extends CRobotBases{
    protected arrOrdersId : Set<number> = new Set<number>()
    protected arrOrdersIdMini : Set<number> = new Set<number>()
    protected limits = 0
    protected limitsMini = 2500

    constructor(data: tRobotLimitProps) {
        super(data)
    }
    protected isStopped = true

    random(middle: number, distance= 1){

        const price = NormalizeDouble(Math.random()*middle*2 ,0)
        // добавлено пропорциональное изменение объемов
        const volume = Math.round(Math.random() * 1000 * (Math.abs(middle-price)/middle))  +1
        return {price, volume: price>middle ? -volume : volume}
    }

    randomMini(middle: number, distance= 0.15){
        let buf = middle * distance
        const random = Math.random()**3
        const random2 = Math.random()> 0.5 ? 1:-1
        const price = NormalizeDouble(middle + random2*random*buf  ,0)
        // добавлено пропорциональное изменение объемов
        const volume = Math.round(Math.random() * 1000 * (Math.abs(middle-price)/middle)) +1
        return {price, volume: price>middle ? -volume : volume}
    }

    strategy = async () => {

        const {limits,api} = this
        const setLimits = async (price: number) => {
            return  await api.setLimit({...this.random(price) , userId: this.userId, symbol: this.symbol, type:"Limit"})
        }

        const setLimitsMini = async (price: number) => {
            return  await api.setLimit({...this.randomMini(price) , userId: this.userId, symbol: this.symbol, type:"Limit"})
        }

        const getMiddle = async () => {
            const BBO = await api.getBBO(this.symbol)
            let middle = 0
            if (BBO?.bid) middle = (BBO.bid+BBO.ask)/2
            else {
                const data = await this.apiHistory.getHistory({symbol: this.symbol, limit:1, start: new Date(Date.now()-500), end: new Date()})
                middle = data.bars.at(-1)?.close ?? 100
                console.log({middle})
            }
            return middle
        }

        const middle = await getMiddle()
        // if (this.arrOrdersId.size < this.limits) {
        //     for (let i = this.arrOrdersId.size; i < limits; i++) {
        //         const res = await setLimits(middle)
        //         if(res?.orderId) this.arrOrdersId.add(res.orderId)
        //     }
        // }
        if (this.arrOrdersIdMini.size < this.limitsMini) {
            for (let i = this.arrOrdersIdMini.size; i < this.limitsMini; i++) {
                const res = await setLimitsMini(middle)
                if(res?.orderId) this.arrOrdersIdMini.add(res.orderId)
            }
        }
        // remove 100 orders
        // {
        //     const arrIds: number[] = []
        //     const temp = [...this.arrOrdersId]
        //     const map = new Set<number>()
        //     for (let i = 0; i < 100; i++) {
        //         const num = Math.floor(Math.random() * this.arrOrdersId.size)
        //         const tt = temp[num]
        //         const result = await api.getOrdersById({userId: this.userId, ordersId: [tt]})
        //         const res = result[0]
        //         if (res.status == "market") {
        //             // Удаляем ордер из памяти робота
        //             this.arrOrdersId.delete(tt)
        //         }
        //         else {
        //             map.add(Math.floor(Math.random() * this.arrOrdersId.size))
        //         }
        //     }
        //     map.forEach((e) => arrIds.push(temp[e]))
        //
        //     const res = await this.api.closeOrders({ordersId: arrIds, userId: this.userId})
        //     res.forEach(item => {
        //         if (item.status != "error") this.arrOrdersId.delete(item.orderId)
        //         if (item.type == 'Market' && 0) {
        //             console.log('CLOSED POSITION: ')
        //             console.log(item)
        //         }
        //     })
        // }

        {
            const arrIds: number[] = []
            const temp = [...this.arrOrdersIdMini]
            const map = new Set<number>()
            for (let i = 0; i < 300; i++) {
                const num = Math.floor(Math.random() * this.arrOrdersIdMini.size)
                const tt = temp[num]
                const result = await api.getOrdersById({userId: this.userId, ordersId: [tt]})
                const res = result[0]

                if (res.status == "market" || res.type =="Market") {
                    console.log("ордер уже маркет", tt, num, result)
                    // Удаляем arrOrdersIdMini из памяти робота
                    this.arrOrdersIdMini.delete(tt)
                }
                else {
                    if (res.status == "limit") {
                        if (Math.abs(res.price - middle)/middle > Math.random()) {
                            map.add(Math.floor(Math.random() * this.arrOrdersIdMini.size))
                        }
                    }
                }

                // map.add(Math.floor(Math.random() * this.arrOrdersIdMini.size))
            }
            map.forEach((e) => arrIds.push(temp[e]))
            const res = await this.api.closeOrders({ordersId: arrIds, userId: this.userId})
            res.forEach(item => {
                if (item.status != "error") this.arrOrdersIdMini.delete(item.orderId)
                if (item.type == 'Market' && 0) {
                    console.log('CLOSED POSITION: ')
                    console.log(item)
                }
            })
        }


        const randomMs = Math.floor(Math.random() * (50)) + 115
        if (!this.isStopped) setTimeout(()=>this.strategy(),100+randomMs)
    }

    async closeAll(): Promise<void> {
        const res = await this.api.closeOrders({ordersId: [...this.arrOrdersId], userId: this.userId})
        res.forEach(item => {
            if (item.status !== "error") this.arrOrdersId.delete(item.orderId)
        })
    }

    stop(): void {
        this.isStopped = true;
    }

    start(): void {
        if (!this.isStopped) {throw "уже работает"}
        this.isStopped = false
        this.strategy()
    }

}


export class CRobotLimitsMini extends CRobotBases{
    protected arrOrdersId : Set<number> = new Set<number>()
    protected limits = 10000

    constructor(data: tRobotLimitProps) {
        super(data)
    }
    protected isStopped = true

    random(middle: number){
        const price = Math.round(Math.random()*middle*2)
        const volume = Math.round(Math.random()*100)
        return {price, volume: price>middle ? -volume : volume}
    }


    async strategy(){
        if(this.arrOrdersId.size < this.limits){
            const {limits,api} = this
            const BBO = await api.getBBO(this.symbol)
            const middleDef = 100
            const ask  = BBO?.ask !== Number.MAX_VALUE ? BBO?.ask ?? middleDef: middleDef
            const bid = BBO?.bid ? BBO.bid : middleDef -1
            const middle = (ask+bid)>>1


            for (let z = 0; z < 500000; z++) {

                for (let i = 0; i < 50; i++) {
                    api.setLimit({volume: 2, price: middle -i , userId: this.userId, symbol: this.symbol, type:"Limit"}).then(e=>e?.orderId && this.arrOrdersId.add(e.orderId))
                    // await sleepAsync(0)
                    api.setLimit({volume: -2, price: middle +i , userId: this.userId, symbol: this.symbol, type:"Limit"}).then(e=>e?.orderId && this.arrOrdersId.add(e.orderId))
                    // await sleepAsync(0)
                }
            }
        }
        // setTimeout(()=>this.closeAll(),1000)
        const randomMs = Math.floor(Math.random() * (50)) + 315
       // if(!this.isStopped) setTimeout(()=>this.strategy(),5+randomMs)
    }

    async closeAll(): Promise<void> {
        const res = await this.api.closeOrders({ordersId: [...this.arrOrdersId], userId: this.userId})
        res.forEach(item => {
            if(item.status !== "error") this.arrOrdersId.delete(item.orderId)
        })
    }

    stop(): void {
        this.isStopped = true;
    }

    start(): void {
        if (!this.isStopped) {throw "уже работает"}
        this.isStopped = false
        this.strategy()
    }

}



export class CRobotMarket2 extends CRobotBases{
    protected arrOrdersId : Set<number> = new Set<number>()
    constructor(data: tRobotLimitProps) {
        super(data)
    }
    protected isStopped = true

    strategy = async () => {

        const volume = Math.round((0.5-Math.random())*50)

        this.api.setMarket({userId: this.userId, symbol: this.symbol, type:"Market", volume, price:undefined}).then(e=>e?.orderId && this.arrOrdersId.add(e.orderId))

        const randomMs = Math.floor(Math.random() * (1)) + 15

        if (this.arrOrdersId.size> 100) {
            const arr = [...this.arrOrdersId].slice(0,30)
            this.api.closeOrders({ordersId: arr, userId: this.userId}).then((e)=>{
                e.forEach((e)=>{
                    if (e.status == "error") {
                        console.trace(e)
                    }
                    else {
                        this.arrOrdersId.delete(e.orderId)
                    }
                })
            })
        }

        if(!this.isStopped) setTimeout(()=>this.strategy(),200+randomMs)
    }

    closeAll(): void {
    }

    stop(): void {
        this.isStopped = true;
    }

    start(): void {
        if (!this.isStopped) {throw "уже работает"}
        this.isStopped = false
        this.strategy()
    }

}


export class CRobotMarket extends CRobotBases{
    protected arrOrdersId : Set<number> = new Set<number>()
    constructor(data: tRobotLimitProps) {
        super(data)
    }
    protected isStopped = true

    async strategy(){
        const v = Math.random() ** 1
        const rest = await this.api.getBBO(this.symbol)
        const volume = Math.round(v*(0.5-Math.random())*10*(rest?.bidV?? 10))

        console.log('send order')
        if (this.api?.setMarket && rest) {
            const res = await this.api.setMarket({userId: this.userId, symbol: this.symbol, type:"Market", volume, price:undefined})
            // console.log(res);
            if(res?.orderId) this.arrOrdersId.add(res.orderId)
        }

        const randomMs = Math.floor(Math.random() * (50)) + 315
        if(!this.isStopped) setTimeout(()=>this.strategy(),150+randomMs)
    }

    closeAll(): void {
    }

    stop(): void {
        this.isStopped = true;
    }

    start(): void {
        if (!this.isStopped) {throw "уже работает"}
        this.isStopped = false
        this.strategy()
    }

}
