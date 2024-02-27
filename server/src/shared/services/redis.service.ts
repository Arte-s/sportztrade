import {createClient, RedisClientType} from 'redis';
import {loadSymbols} from "./exchange.service";
import {runBots} from "./bot.service";

const url = process.env.REDIS_URL || 'redis://localhost:6379';

export const Redis:RedisClientType = createClient({url});

export let isConnectedRedis = false

Redis.on("error", function (error) {
    console.error('redis error: ', error);
    isConnectedRedis = false
});

export async function redisConnect(){
    await Redis.connect();
    isConnectedRedis = true
    loadSymbols()
    runBots()
}

export function scanCount(table:string):Promise<number>{
    return new Promise(resolve => {
        let count=0
        if(!isConnectedRedis) resolve(0)
        const scan = async (pos) => {
            const res = await Redis.scan(pos)
            for (const item of res.keys) {
                if(item.includes(table)) count+=1
            }
            if(res?.cursor > 0) scan(res.cursor)
            else resolve(count)
        }
        scan(0)
    })
}

export function hScanCount(key:string):Promise<number>{
    return new Promise(async resolve => {
        let count=0
        if(!isConnectedRedis) resolve(0)
        if(!await Redis.exists(key)){
            resolve(0)
        }
        else {
            const scan = async (pos) => {
                const res = await Redis.hScan(key,pos)
                count+= res?.tuples?.length ? res.tuples.length : 0
                if(res?.cursor > 0) scan(res.cursor)
                else resolve(count)
            }
            scan(0)
        }
    })
}

export function hScanKeys(key:string):Promise<any[]>{
    return new Promise(async resolve => {
        const result:number[] = []
        if(!isConnectedRedis) resolve([])
        if(!await Redis.exists(key)){
            resolve([])
        }
        else {
            const scan = async (pos) => {
                const res = await Redis.hScan(key,pos)
                for(const item of res.tuples) {
                    if(!isNaN(+item.field)) result.push(+item.field)
                }
                if(res?.cursor > 0) scan(res.cursor)
                else resolve(result)
            }
            scan(0)
        }
    })
}

export function hScanValues(key:string):Promise<any[]>{
    return new Promise(async resolve => {
        const result:any[] = []
        if(!isConnectedRedis) resolve([])
        if(!await Redis.exists(key)){
            resolve([])
        }
        else {
            const scan = async (pos) => {
                const res = await Redis.hScan(key,pos)
                for(const item of res.tuples) {
                    try {
                        const x = JSON.parse(item.value)
                        result.push(x)
                    } catch (e) {}
                }
                if(res?.cursor > 0) scan(res.cursor)
                else resolve(result)
            }
            scan(0)
        }
    })
}
