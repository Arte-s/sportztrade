import {
    BDNames,
    iPositionLimitGet, iPositionMarketGet, iPositionMarketGetHistory,
    tOrderId,
    tUserId
} from "../../../client/src/sistem/base/Position"
import {hScanKeys, hScanValues, Redis, scanCount} from "./services/redis.service";

type CMapAsync<T1, T2> = {
    size_:number
    keyName:string
    set(key: T1, value: T2, orderType?: string): Promise<any>
    get(key: T1): Promise<T2 | undefined>
    add(key: T1, volume: T2, orderType?: string): Promise<T2>
    size():number
    delete(key: T1):Promise<void>
}

export class CMapAsyncInside<T1,T2> implements CMapAsync<T1, T2>{
    size_:number = 1
    keyName:string
    constructor(fatherTable:string,userId:tUserId) {
        this.keyName = `${fatherTable}:${userId}`
        // hScanCount(this.keyName).then(d=>{this.size_=d})
    }
    async set(key:T1,value:T2): Promise<any>{
        if(!key || !value) return this
        // if(!await Redis.hExists(this.keyName,key.toString())) this.size_ += 1
        await Redis.hSet(this.keyName, key.toString(), JSON.stringify(value))
        return this
    }
    async get(key: T1):Promise<T2 | undefined>{
        const x = await Redis.hGet(this.keyName,key.toString())
        return x ? JSON.parse(x) : undefined
    }
    async add(key: T1, value: T2): Promise<T2> {
        await this.set(key, value);
        return value
    }
    size(){return this.size_}
    async delete(key: T1):Promise<void>{
        if(await Redis.hExists(this.keyName,key.toString())){
            await Redis.hDel(this.keyName,key.toString())
            // this.size_ -= 1
        }
    }
    async getKeys():Promise<T1[]>{
        return await hScanKeys(this.keyName)
    }
    async getValues():Promise<T2[]>{
        return await hScanValues(this.keyName)
    }
}

class CBDRevers implements CMapAsync<tOrderId, tUserId> {
    size_:number = 0
    keyName:string
    constructor() {
        this.keyName = BDNames.CBDRevers

    }
    async set(key: tOrderId, value: tUserId, orderType: 'limit' | 'market'): Promise<this> {
        if (this.size_ == 0) this.size_ = await scanCount(this.keyName)
        if (orderType == "market" && value < 0) return this
        if (!await Redis.exists(`${this.keyName}:${key}`)) this.size_ += 1
        await Redis.set(`${this.keyName}:${key}`, value)
        return this
    }
    async get(key: tOrderId):Promise<tUserId | undefined>{
        const x = await Redis.get(`${this.keyName}:${key}`)
        return +x
    }
    async add(key: tOrderId, volume: tUserId, orderType: 'limit' | 'market'): Promise<tUserId | undefined> {
        await this.set(key, volume, orderType);
        return volume
    }
    size(){return this.size_}
    async delete(key: tOrderId):Promise<void>{
        if(await Redis.exists(`${this.keyName}:${key}`)){
            await Redis.del(key.toString())
            this.size_ -= 1
        }
    }
}

class CBDReal<T1> implements CMapAsync<tUserId, CMapAsyncInside<tOrderId, (T1)>> {
    size_:number = 0
    keyName:string

    constructor(name) {
        this.keyName = name
    }

    async set(key: tUserId, value: CMapAsyncInside<tOrderId, (T1)>): Promise<this> {
        if(this.size_ == 0) this.size_ = await scanCount(this.keyName)
        if(!await Redis.exists(`${this.keyName}:${key}`)) this.size_ += 1
        return this
    }
    async get(key: tUserId):Promise<CMapAsyncInside<tOrderId, (T1)> | undefined>{
        return new CMapAsyncInside(this.keyName,key)
    }
    async add(key: tUserId, value: CMapAsyncInside<tOrderId, (T1)>): Promise<CMapAsyncInside<tOrderId, (T1)> | undefined> {
        await this.set(key, value);
        return value
    }
    size(){return this.size_}
    async delete(key: tUserId):Promise<void>{
        if(await Redis.exists(`${this.keyName}:${key}`)){
            await Redis.del(key.toString())
            this.size_ -= 1
        }
    }
}

class CBDRealLimit extends CBDReal<iPositionLimitGet> {
    constructor() {
        super(BDNames.CBDRealLimit)
    }
}

class CBDRealMarket extends CBDReal<iPositionMarketGet> {
    constructor() {
        super(BDNames.CBDRealMarket)
    }
}

class CBDHistory extends CBDReal<iPositionMarketGetHistory> {
    constructor() {
        super(BDNames.CBDHistory)
    }
}


export const dMapAsyncDefault = {
    BDRevers : ()=> new CBDRevers(), // очищается при переходе в историю,
    BDRealLimit : ()=> new CBDRealLimit(),
    BDRealMarket : ()=> new CBDRealMarket(),
    BDHistory : ()=> new CBDHistory(),
}

export const dMapAsync = dMapAsyncDefault
