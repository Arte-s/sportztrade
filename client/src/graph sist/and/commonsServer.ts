

// export const  screenerServer = new ScreenerRun()

import { sleepAsync } from "../Nav/Common"
import {keys} from "ag-grid-community/dist/lib/utils/map";

// export type tKeyScreener = keyof IScreenerRun
export type tRequestScreenerT<T> = {
    key: keyof T,
    request: any
}
// export type tRequestScreener = {
//     key: tKeyScreener,
//     request: any
// }

/**
 *  для серверной части, во входящих параметров надо отправить ссылки не WebSocket и object который будем наблюдать
 *  можно подключить последовательно к разным классам по факту если по Map объекта не находится данный ключ то он и не включиться
 *  Есть риск одноименных методов в разных объектах
 *  пока не думал как решить =)
 * */
export function funcPromiseServer<T extends object>(data: screenerSoc<tSocketData <tRequestScreenerT<T>>>, obj: T){
    data.api({
        onMessage: async (datum)=>{
            const {key,request} = datum.data
            const buf = obj[key]
            if (!buf) return //throw "такого метода нет"
            if (typeof buf == "function") {
                const a = await (async ()=>buf(...request))()
                data.sendMessage({mapId: datum.mapId, data: a??undefined})
            }
           else throw "это не функция"
        }
    })
}

/**
 *  для серверной части, во входящих параметров надо отправить ссылки на Post/Get и object который будем наблюдать
 *  можно подключить последовательно к разным классам по факту если по Map объекта не находится данный ключ то он и не включиться
 *  Есть риск одноименных методов в разных объектах
 *  пока не думал как решить =)
 * */
export function funcPromiseServerPost<T extends object>(data: screenerPost<tRequestScreenerT<T>>, obj: T){
    // data: screenerPost<tSocketData <tRequestScreenerT<T>>>, obj: T
    data.api({
        onMessage: async (datum)=>{
            console.log(datum);
            if (!datum) return ;
            const {key,request} = datum//.data
            if (!key) return ;
            const buf = obj[key]
            if (!buf) return //throw "такого метода нет"
            if (typeof buf == "function") {
                const a = await (async ()=>buf(...request))()
                return  {data: a??undefined} //{mapId: datum.mapId, data: a??undefined}
            }
            else throw "это не функция"
        }
    })
}


type tSocketData<T> = {mapId: number, data: T}
type screenerSoc<T> = {
    sendMessage: (data: T)=>void,
    api: (data: {onMessage: (data: T) => void|Promise<void> })=>void
}
type screenerPost<T> = {
    api: (data: {onMessage: (data: T) => any|Promise<any> })=>void
}
/**
 * для обертки над WebSocket чтобы получать callback по id
 * */
export function funcForWebSocket<T>(data: screenerSoc<tSocketData <tRequestScreenerT<T>>>): screenerSoc2<T> {
    // const sendMessage = (datum: tSocketData <tRequestScreenerT<T>>) => data.sendMessage(JSON.stringify(datum))
    const sendMessage = (datum: tSocketData <tRequestScreenerT<T>>) => data.sendMessage(datum)
    let d = 0
    const map = new Map<number, (data: tRequestScreenerT<T>)=> void >()
    data.api({
        onMessage: (data)=>{
            if (map.has(data.mapId)) {
                map.get(data.mapId)?.(data.data)
                map.delete(data.mapId)
            }

        }
    })
    return {
        send:(data, wait?: boolean) => new Promise((resolve, reject) => {
            const send: tSocketData <tRequestScreenerT<T>> = {mapId: ++d, data}
            if (wait!==false) map.set(send.mapId, (data)=> data ? resolve(data) : reject())
            sendMessage(send);
            //resolve(true)
        })
    }
}

/**
 * Отправка сообщений для клиента, через авто создание апи, по методу пост запроса, с настраиваемым header
 * */
export class CSendForPost {
    header: HeadersInit | undefined = {
        'content-type': 'application/json'
    }
    readonly funcForPost = <T>(address: string): screenerSoc2<T> =>  ({
            send: async (data, wait?: boolean) =>  (
                    await (await fetch(address, {
                        method: "POST",
                        headers: this.header,
                        // data: JSON.stringify(data),
                        body: JSON.stringify(data)
                    })).json()
                )
        })
}

export function funcForPost<T>(address: string): screenerSoc2<T> {
    return (new CSendForPost()).funcForPost(address)
}

export function FFuncMyF<T extends  object>(object: T) {
    return {
        send: async (data: tRequestScreenerT<T>)=> {
            const buf = object[data.key]
            if (!buf) throw "такого метода нет"
            if (typeof buf == "function") return buf(...data.request)
            else throw "это не функция"
        }
    }
}

export type screenerSoc2<T> = {send: (data: tRequestScreenerT<T>)=>Promise<any>}
export type tMethodToPromise2<T extends object> = {[P in keyof T] : T[P] extends ((...args: infer Z)=> infer X)? (...args: Z)=>(X extends Promise<any>? X : Promise<X>) : Promise<T[P]>}
/**
 * обертка для класса - переводит класс в Promise<method> класс, также перехватывает все функции и желает свою обработку типа WebSocket или другое
 * */
export function funcScreenerClient2<T extends object>(data: screenerSoc2<T>) {
    return new Proxy({} as unknown as tMethodToPromise2<T> , {
        get(target: tMethodToPromise2<T>, p: string | symbol, receiver: any): any {
            const key = String(p) as keyof T
            return async (...argArray:any)=> data.send({key, request: argArray})
        }
    })
}


// метод void отменяет callback, т.е. фактически мгновенно исполняет Promise resolve
type tAndB<T> = {data: T, void: ()=>void}

export type screenerSoc3<T> = {send: (data: tRequestScreenerT<T>)=>tAndB<Promise<any>>}
export type tMethodToPromise3<T extends object> = {[P in keyof T] : T[P] extends ((...args: infer Z)=> infer X)? (...args: Z)=>(X extends Promise<any>? tAndB<X> : tAndB<Promise<X>>) : tAndB<Promise<T[P]>>}
/**
 *
 * обертка для класса - переводит класс в Promise<method> класс
 * завернутый в определенный класс, чтобы можно было отделить методы с возвращением void и не создавать на них callback,
 * также перехватывает все функции и желает свою обработку типа WebSocket или другое
 * */
export function funcScreenerClient3<T extends object>(data: screenerSoc3<T>) {
    return new Proxy({} as unknown as tMethodToPromise3<T> , {
        get(target: tMethodToPromise3<T>, p: string | symbol, receiver: any): any {
            const key = String(p) as keyof T
            return (...argArray:any)=> data.send({key, request: argArray})
        }
    })
}
/*
*      const data = base + info.name + '&interval=' + infoTF.name + '&startTime=' + String(new Date('2000').valueOf())  + '&limit='+1
            await waitLimit()
            const parseData = (await (await fetch(data)).json());
* */

type tMethodToPromise<T extends object> =
    {[P in keyof T] : PromiseAllZL<T[P]>}

type PromiseAllZL<T extends any> =
    T extends ((...args: infer Z)=> infer X)? (...args: Z)=>(X extends Promise<any>? X:Promise<X>) : Promise<T>

export function fMiniTest() {

}

export class CTestWeb {
    func(a:number, b: number) {
        return a + b
    }
    async func2(a:number, b: number) {
        await sleepAsync(1000);
        return a * b
    }
    fun3(a:number, b: number) {
        return a ** b
    }

    test() {
        return "status ok"
    }
}
