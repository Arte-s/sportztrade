import {CBar} from "../Nav/Bars";

type SignalBase = Readonly<{
    price? :number|undefined,
    type? :"limit"|"stop"|undefined,
    volume :number, // объём ордера (если со знаком плюс, то покупка,  если минус, то продажа)
    name? :string,  // название сигнала
    //userData? :unknown
}>;
// отложенный сигнал
export interface PendingSignal extends SignalBase {
    readonly price :number,
    readonly type :"limit"|"stop"
}
// рыночный сигнал
export interface MarketSignal extends SignalBase {
    readonly price? :undefined,
    readonly type? :undefined,
}

export type UserSignal = MarketSignal | PendingSignal;



export type Signal = PendingSignal; //Readonly<{ price :number, volume :number, type :"limit"|"stop", name? :string }>;

export type SignalID = number & { readonly [Symbol.species] : "SignalID" };

export type SignalExt = Signal & { readonly id :SignalID };


export type SignalAPI = Readonly<{
    // добавить отложенный сигнал
    add(signal : PendingSignal, onActivate? :(signal :SignalExt, time :const_Date)=>void) : SignalID;
    // добавить рыночный сигнал
    add(signal : MarketSignal) : void;

    set(signal : readonly MarketSignal[]) : void;
    set(signals :readonly PendingSignal[], onActivate? :(signal :SignalExt, time :const_Date)=>void) : readonly SignalID[];
    //set(signals :readonly UserSignal[]) : readonly (SignalExt|undefined)[];

    delete(signalID :SignalID) : void;
}>;

export function createEmptySignalAPI() : SignalAPI {
    //let signals= new CMySignals();
    let _id=0;
    function newID() { return _id++ as SignalID; }
    return {
        set(data) { return data.map(()=>newID()); },//signals.set(data, {onActivate}); }
        add(data) { return newID(); },
        delete() { }
    };
}


interface MySignalAPI<TSignal extends Signal= Signal> {
    set<T extends TSignal>(data : readonly T[], params?: Readonly<{ onEnter? :(signal :T, time :const_Date)=>void, filter? :(signal :T)=>boolean}>) : void;
}


class MyMap<K extends number, V> {
    protected data : Map<K,V>= new Map();// | V[] = [];
    private _id = 0;
    private newID() { return (this._id++) as K; }
    //set(data : readonly V[]) { this.data= [...data];  this._id=0; }
    set(data : readonly V[]) { return data.map(val => this.add(val)); }
    add(val :V) : K {
        //if (this.data instanceof Array) this.data= new Map(this.data.map(val=>[this.newID(), val]));
        let id= this.newID();
        this.data.set(id, val);
        return id;
    }
    delete(key :K) {
        return this.data.delete(key);
        // if (this.data instanceof Map) return this.data.delete(key);
        // if (key<0 || key>=this.data.length) return false;
        // return key>=0 &&  ? this.data.splice(key, 1)}
    }
    //[Symbol.iterator] = this.data[Symbol.iterator];
    [Symbol.iterator]() { return this.data[Symbol.iterator](); }
    entries() { return this.data.entries(); }
    keys() { return this.data.keys(); }
    values() { return this.data.values(); }
}


type SignalExtT<TSignal extends Signal> = TSignal & Pick<SignalExt,"id">;


type SignalData<TSignal extends Signal= Signal> = {signal: TSignal, onEnter? :(signal :SignalExtT<TSignal>, time :const_Date)=>void, filter? : (signal :TSignal)=>boolean};


export class CMySignals<TSignal extends Signal= Signal> {//} implements MySignalAPI<TSignal> {
    private signals = new MyMap<SignalID, SignalData<TSignal>>();
    // private onEnter? : (signal :TSignal, time :const_Date)=>void;
    // private filter? : (signal :TSignal)=>boolean;
    private range? : {high: number, low: number};
    //protected _lastPrice? :number;
    _print= false;

    constructor(signals : readonly TSignal[] = []) { this.set(signals); }

    set<T extends TSignal>(data : readonly T[], params?: Readonly<{ onActivate? :(signal :SignalExtT<T>, time :const_Date)=>void, filter? :(signal :T)=>boolean}>) {
        //this.signals.set(data);
        //let thisT= this as unknown as CMySignalsBase<T>;
        let ids : readonly SignalID[] = this.signals.set(data.map(signal => ({signal :{...signal}, onEnter: params?.onActivate, filter: params?.filter} as SignalData<TSignal>)));
        // this.onEnter= params?.onEnter as (signal :TSignal)=>void;
        // this.filter= params?.filter as (signal :TSignal)=>boolean;
        this.range= undefined;
        return ids;
    }
    add(signal :TSignal, params?: Readonly<{ onActivate? :(signal :SignalExtT<TSignal>, time :const_Date)=>void }>) : SignalID {
        //if (signal.price==undefined) signal= {...signal}
        this.range= undefined;
        return this.signals.add({signal: {...signal}, onEnter: params?.onActivate});
    }
    delete(id :SignalID) { let ok= this.signals.delete(id);  if (ok) this.range= undefined; else console.warn("Попытка удаления несуществующего сигнала: id="+id); }

    private checkSignals(time :const_Date, barHigh: number, barLow: number, onEnter? :(signal :TSignal, time :const_Date)=>void, filter? :(signal :TSignal)=>boolean, replaceSignalPrice=false) {
        const eps= 1e-16;
        if (this.range && barHigh < this.range.high + eps  && barLow > this.range.low - eps)
            return;
        let high= Number.MAX_VALUE;
        let low= -Number.MAX_VALUE;
        let activations : {id :SignalID, signalData:SignalData<TSignal>, delta:number}[] = [];
        //for(let [i,signal] of this.signals.entries()) {
        for(let [id,signalData] of this.signals) {
            let {signal}= signalData;
            const [price,k]= (signal.volume>0)==(signal.type=="stop") ? [barHigh,1] : [barLow,-1];
            //if (this._print) console.log("sig #"+i,signal);
            //const k= (signal.volume>0)==(signal.type=="limit") ? -1 : 1;

            let delta = (price - signal.price)*k;
            if (delta >= -eps) {
                if (signalData.filter?.(signal)==false) continue;
                if (filter?.(signal)==false) continue;
                if (replaceSignalPrice) { signal= {...signal, price};  signalData={...signalData, signal}}
                activations.push({id, signalData, delta});
                //if (this._print) console.log("sig #"+i,"ok");
                this.signals.delete(id);
                continue;
            }
            high= Math.min(signal.price, high);
            low= Math.max(signal.price, low);
        }
        activations.sort((a,b)=> a.delta - b.delta);
        for(let {id, signalData} of activations) {
            signalData.onEnter?.({...signalData.signal, id}, time);
            onEnter?.(signalData.signal, time);
            //this.onEnter?.(item.signal, time);
        }
        this.range= {high, low};
    }

    onTick(time :const_Date, price :number, onEnter? :(signal :TSignal, time :const_Date)=>void, filter? :(signal :TSignal)=>boolean, replaceSignalPrice=false) {
        return this.checkSignals(time, price, price, onEnter, filter, replaceSignalPrice);
    }

    onBarClose(time :const_Date, price :number, onEnter? :(signal :TSignal, time :const_Date)=>void) {
        return this.onTick(time, price, onEnter, undefined, true);
    }

    onBar(bar :CBar, onEnter? :(signal :TSignal, time :const_Date)=>void) {
        return this.checkSignals(bar.time, bar.high, bar.low, onEnter);
    }
}


// export class CMySignals<TSignal extends Signal= Signal>  implements MySignalAPI<TSignal> {
//     private signals : TSignal[] = [];
//     private onEnter? : (signal :TSignal, time :const_Date)=>void;
//     private filter? : (signal :TSignal)=>boolean;
//     private range? : {high: number, low: number};
//     _print= false;
//
//     constructor(signals : readonly TSignal[] = []) { this.set(signals); }
//
//     set<T extends TSignal>(data : readonly T[], params?: Readonly<{ onEnter? :(signal :T, time :const_Date)=>void, filter? :(signal :T)=>boolean}>) {
//         this.signals= [...data];
//         this.onEnter= params?.onEnter as (signal :TSignal)=>void;
//         this.filter= params?.filter as (signal :TSignal)=>boolean;
//         this.range= undefined;
//     }
//
//     private checkSignals(time :const_Date, barHigh: number, barLow: number, onEnter? :(signal :TSignal, time :const_Date)=>void, filter? :(signal :TSignal)=>boolean, replaceSignalPrice=false) {
//         const eps= 1e-16;
//         if (this.range && barHigh < this.range.high + eps  && barLow > this.range.low - eps)
//             return;
//         let high= Number.MAX_VALUE;
//         let low= -Number.MAX_VALUE;
//         let activations : {signal:TSignal,delta:number}[] = [];
//         //for(let [i,signal] of this.signals.entries()) {
//         for(let i=0; i<this.signals.length; i++) {
//             let signal= this.signals[i];
//             const [price,k]= (signal.volume>0)==(signal.type=="stop") ? [barHigh,1] : [barLow,-1];
//             //if (this._print) console.log("sig #"+i,signal);
//             //const k= (signal.volume>0)==(signal.type=="limit") ? -1 : 1;
//
//             let delta = (price - signal.price)*k;
//             if (delta >= -eps) {
//                 if (filter?.(signal)==false) continue;
//                 if (replaceSignalPrice) signal= {...signal, price};
//                 activations.push({signal, delta});
//                 //if (this._print) console.log("sig #"+i,"ok");
//                 this.signals.splice(i,1);
//                 i--; continue;
//             }
//             high= Math.min(signal.price, high);
//             low= Math.max(signal.price, low);
//         }
//         activations.sort((a,b)=> a.delta - b.delta);
//         for(let item of activations) {
//             onEnter?.(item.signal, time);
//             this.onEnter?.(item.signal, time);
//         }
//         this.range= {high, low};
//     }
//
//     private onTick(time :const_Date, price :number, onEnter? :(signal :TSignal, time :const_Date)=>void, filter? :(signal :TSignal)=>boolean, replaceSignalPrice=false) {
//         return this.checkSignals(time, price, price, onEnter, filter, replaceSignalPrice);
//     }
//
//     onBarClose(time :const_Date, price :number, onEnter? :(signal :TSignal, time :const_Date)=>void) {
//         return this.onTick(time, price, onEnter, this.filter, true);
//     }
//
//     onBar(bar :CBar, onEnter? :(signal :TSignal, time :const_Date)=>void) {
//         return this.checkSignals(bar.time, bar.high, bar.low, onEnter);
//     }
// }