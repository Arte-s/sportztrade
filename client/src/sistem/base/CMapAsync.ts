import {iPositionLimitGet, iPositionMarketGet, iPositionMarketGetHistory, tOrderId, tUserId} from "./Position"
// import {hScanCount} from "../../../../server/src/shared/services/redis.service";

export class CMapAsync<T1, T2> {
    protected map = new Map<T1, T2>()

    async set(key: T1, value: T2, orderType?: string): Promise<this> {
        this.map.set(key, value)
        return this
    }

    async get(key: T1): Promise<T2 | undefined> {
        return this.map.get(key)
    }

    async add(key: T1, volume: T2, orderType?: string) {
        const t = this.map.get(key)
        if (t) return t
        else return (await this.set(key, volume, orderType)).get(key)
    }

    size() {
        return this.map.size
    }

    async delete(key: T1) {
        this.map.delete(key)
    }
}

export class CMapAsyncInside<T1,T2> extends CMapAsync<T1, T2>{
    constructor(fatherTable:string,userId:tUserId) {
        super()
    }
    async getValues(){
        return [...this.map.values()]
    }
    async getKeys(){
        return [...this.map.keys()]
    }
}

class CBDRevers extends CMapAsync<tOrderId, tUserId> {
    async set(key: tOrderId, value: tUserId, orderType: 'limit' | 'market'): Promise<this> {
        if (orderType == "market" && value < 0) return this
        this.map.set(key, value)
        return this
    }

    override async add(key: tOrderId, volume: tUserId, orderType: string): Promise<tUserId | undefined> {
        return super.add(key, volume, orderType);
    }
}

class CBDRealLimit extends CMapAsync<tUserId, CMapAsyncInside<tOrderId, (iPositionLimitGet)>> {

}

class CBDRealMarket extends CMapAsync<tUserId, CMapAsyncInside<tOrderId, (iPositionMarketGet)>> {
    async set(key: tUserId, value: CMapAsyncInside<tOrderId, (iPositionMarketGet)>): Promise<this> {
        if (key < 0) return this
        this.map.set(key, value)
        return this
    }
}

class CBDHistory extends CMapAsync<tUserId, CMapAsyncInside<tOrderId, (iPositionMarketGetHistory)>> {

}


export const dMapAsyncDefault = {
    BDRevers : ()=> new CBDRevers(), // очищается при переходе в историю,
    BDRealLimit : ()=> new CBDRealLimit(),
    BDRealMarket : ()=> new CBDRealMarket(),
    BDHistory : ()=> new CBDHistory(),
}

export const dMapAsync = dMapAsyncDefault
