import {createComparerMap, createComparerSet} from "ts-hashmap"
import {EqualityComparer, deepEqualityComparer} from "ts-equality-comparer";
//import {hashSequence} from "ts-gethashcode/hashSequence";
import {getHashCode as global_getHashCode} from "ts-gethashcode";


export function createDeepComparerMap<Key,Value>(capacity? :number) { return createComparerMap<Key,Value>(capacity ?? 0, deepEqualityComparer); }


type SimpleType= number|string|boolean|null|undefined|symbol;

export class SimpleArrayEqualityComparer<T extends readonly SimpleType[]> implements EqualityComparer<T> {
    private length :number;
    constructor(length :number) { this.length= length; }
    readonly equals = (a :T, b :T)=>{ for(let i=0; i<this.length; i++) if (a[i]!==b[i]) return false;  return true; }
    readonly getHashCode = (a :T)=>{
        if (!this) return 0;
        let visited= new Set<number>();
        //let itemsIterator = function*() { for(let i=0; i<len; i++) yield a[i]; }();
        //return hashSequence(itemsIterator, s, hash);
        let result = 1;
        for(let i=0; i<this.length; i++) result= Math.imul(result, 31) + global_getHashCode(a[i], visited);
        //console.log(a,":",result);
        return result;
    }
}

export class SimpleArrayEqualityComparer2<T extends readonly SimpleType[]> implements EqualityComparer<T> {
    readonly equals = (a :T, b :T)=>{
        if (a.length!=b.length) return false;
        for(let i=0; i<a.length; i++) if (a[i]!==b[i]) return false;
        return true;
    }
    readonly getHashCode = (a :T)=>{
        if (!this) return 0;
        let visited= new Set<number>();
        let result = 1;
        for(let i=0; i<a.length; i++) result= Math.imul(result, 31) + global_getHashCode(a[i], visited);
        //console.log(a,":",result);
        return result;
    }
}

type Tuple = readonly [unknown,...unknown[]];

type IsTuple<T> = T extends [unknown?] ? true : false;

//let aaa : IsTuple<[]> = true;

export interface ArrayKeyMap<K extends readonly any[],V> extends Map<Readonly<K>,V> {
    [Symbol.species] : ArrayKeyMap<K,V>;
}

export interface ArrayKeySet<K extends readonly any[]> extends Set<Readonly<K>> {
    [Symbol.species] : ArrayKeySet<K>; // ? TupleKeySet<K> : ;
}

export interface TupleKeyMap<K extends Tuple, V> extends Map<Readonly<K>,V> {
    [Symbol.species] : TupleKeyMap<K,V>;
}

export interface TupleKeySet<K extends Tuple> extends Set<Readonly<K>> {
    [Symbol.species] : TupleKeySet<K>; //K extends readonly K[0][] ? ArrayKeySet<K> : TupleKeySet<K>;
}

// declare let ttt : TupleKeySet<[number,number,number]>;
// let aaa : ArrayKeySet<number[]> = ttt;
//
// let sss : Set<number[]> = ttt;
//
// let xxx : Set<number[]> = {} as Set<[number]>;


// class CTupleKeyMap<K extends readonly[unknown?],V> extends Map<K,V> {
//     [Symbol.species] : TupleKeyMap<K,V>;
//     override set(key: K, value: V) { return super.set(Object.isFrozen(key) ? key : [...key] as unknown as K, value); }
// }

function __arrayComparer<TKey extends readonly SimpleType[]>(keyLength :number|undefined) {
    return keyLength!=null ? new SimpleArrayEqualityComparer<TKey>(keyLength) : new SimpleArrayEqualityComparer2<TKey>();
}

function __createArrayKeyMap<TKey extends readonly [SimpleType], TVal> (keyLength :number|undefined, capacity :number) : TupleKeyMap<TKey,TVal>;
function __createArrayKeyMap<TKey extends readonly SimpleType[], TVal> (keyLength :number|undefined, capacity :number) : ArrayKeyMap<TKey,TVal>;

function __createArrayKeyMap<TKey extends readonly SimpleType[], TVal> (keyLength :number|undefined, capacity :number)  { // : TupleKeyMap<TKey,TVal> {
    const map= createComparerMap<TKey,TVal>(capacity, __arrayComparer<TKey>(keyLength)); //new SimpleArrayEqualityComparer<TKey>(keyLength));
    const oldSet= map.set.bind(map);
    map.set = (key: TKey, value: TVal)=>{ return oldSet(Object.isFrozen(key) ? key : [...key] as unknown as TKey, value); }
    return map as TKey extends Tuple ? TupleKeyMap<TKey,TVal> : ArrayKeyMap<TKey, TVal>;
    // return Object.assign(map, {
    //     //[Symbol.species] : TupleKeyMap<TKey,TVal>,
    //     set: (this, key: TKey, value: TVal)=>{ return map.set(Object.isFrozen(key) ? key : [...key] as unknown as TKey, value); }
    // }) as TupleKeyMap<TKey,TVal>;
}

function __createArrayKeySet<TKey extends readonly [SimpleType]> (keyLength :number|undefined, capacity :number) : TupleKeySet<TKey>;
function __createArrayKeySet<TKey extends readonly SimpleType[]> (keyLength :number|undefined, capacity :number) : ArrayKeySet<TKey>;

function __createArrayKeySet<TKey extends readonly SimpleType[]> (keyLength :number|undefined, capacity :number) { //: TupleKeySet<TKey> {
    let set= createComparerSet<TKey>(capacity, __arrayComparer<TKey>(keyLength));
    let oldAdd= set.add.bind(set);
    set.add = (key: TKey)=>{ return oldAdd(Object.isFrozen(key) ? key : [...key] as unknown as TKey); }
    return set as TKey extends Tuple ? TupleKeySet<TKey> : ArrayKeySet<TKey>
    // return Object.assign(set, new class {
    //     [Symbol.species] : TupleKeySet<TKey>;
    //     add(key: TKey) { return set.add(Object.isFrozen(key) ? key : [...key] as unknown as TKey); }
    // });// as TupleKeyMap<TKey,TVal>;
}



export function createArrayKeyMap<TKey extends readonly SimpleType[], TVal> (data? : {keyLength? :number, capacity? :number}) : ArrayKeyMap<TKey, TVal> {
    return __createArrayKeyMap<TKey,TVal>(data?.keyLength, data?.capacity ?? 0);
}

export function createTupleKeyMap1<TKey extends readonly[SimpleType], TValue> (capacity=0) {
    return __createArrayKeyMap<TKey,TValue>(1, capacity);
}
export function createTupleKeyMap2<TKey extends readonly[SimpleType,SimpleType], TValue> (capacity=0) {
    return __createArrayKeyMap<TKey,TValue>(2, capacity);
}
export function createTupleKeyMap3<TKey extends readonly[SimpleType,SimpleType,SimpleType], TValue> (capacity=0) {
    return __createArrayKeyMap<TKey,TValue>(3, capacity);
}
export function createTupleKeyMap4<TKey extends readonly[SimpleType,SimpleType,SimpleType,SimpleType], TValue> (capacity=0) {
    return __createArrayKeyMap<TKey,TValue>(4, capacity);
}
export function createTupleKeyMap5<TKey extends readonly[SimpleType,SimpleType,SimpleType,SimpleType,SimpleType], TValue> (capacity=0) {
    return __createArrayKeyMap<TKey,TValue>(5, capacity);
}
export function createTupleKeyMap6<TKey extends readonly[SimpleType,SimpleType,SimpleType,SimpleType,SimpleType,SimpleType], TValue> (capacity=0) {
    return __createArrayKeyMap<TKey,TValue>(6, capacity);
}
export function createTupleKeyMap7<TKey extends readonly[SimpleType,SimpleType,SimpleType,SimpleType,SimpleType,SimpleType,SimpleType], TValue> (capacity=0) {
    return __createArrayKeyMap<TKey,TValue>(7, capacity);
}
export function createTupleKeyMap8<TKey extends readonly[SimpleType,SimpleType,SimpleType,SimpleType,SimpleType,SimpleType,SimpleType,SimpleType], TValue> (capacity=0) {
    return __createArrayKeyMap<TKey,TValue>(8, capacity);
}


export function createArrayKeySet<TKey extends readonly SimpleType[]> (data? : {keyLength? :number, capacity :number}) {
    return __createArrayKeySet<TKey>(data?.keyLength, data?.capacity ?? 0);
}

export function createTupleKeySet1<TKey extends readonly[SimpleType]> (capacity=0) {
    return __createArrayKeySet<TKey>(1, capacity);
}
export function createTupleKeySet2<TKey extends readonly[SimpleType,SimpleType]> (capacity=0) {
    return __createArrayKeySet<TKey>(2, capacity);
}
export function createTupleKeySet3<TKey extends readonly[SimpleType,SimpleType,SimpleType]> (capacity=0) {
    return __createArrayKeySet<TKey>(3, capacity);
}
export function createTupleKeySet4<TKey extends readonly[SimpleType,SimpleType,SimpleType,SimpleType]> (capacity=0) {
    return __createArrayKeySet<TKey>(4, capacity);
}
export function createTupleKeySet5<TKey extends readonly[SimpleType,SimpleType,SimpleType,SimpleType,SimpleType]> (capacity=0) {
    return __createArrayKeySet<TKey>(5, capacity);
}
export function createTupleKeySet6<TKey extends readonly[SimpleType,SimpleType,SimpleType,SimpleType,SimpleType,SimpleType]> (capacity=0) {
    return __createArrayKeySet<TKey>(6, capacity);
}
export function createTupleKeySet7<TKey extends readonly[SimpleType,SimpleType,SimpleType,SimpleType,SimpleType,SimpleType,SimpleType]> (capacity=0) {
    return __createArrayKeySet<TKey>(7, capacity);
}
export function createTupleKeySet8<TKey extends readonly[SimpleType,SimpleType,SimpleType,SimpleType,SimpleType,SimpleType,SimpleType,SimpleType]> (capacity=0) {
    return __createArrayKeySet<TKey>(8, capacity);
}


// function createTupleMap<TKey extends [...number[]],TVal>() { }
//
// createTupleMap<number[],string>()

//let map= ts.createComparerMap<TKey, number>({equals: (a,b) => a[0]==b[0] && a[1]==b[1] && a[2]==b[2], getHashCode : (a)=>a[0]+a[1]+a[2]});

function test() {

    type TKey = [number,number,number];

    //function fff() { console.log("!"); }
    //let map= createComparerMap<TKey, number>(new SimpleArrayEqualityComparer(3));
    let map= createTupleKeyMap3<TKey, number>();
    //let map= ts.createComparerMap<TKey, number>(deepEqualityComparer);
    
    //let map= new Map<TKey,number>();
    
    map.set([1,10,5], 1);

    let key : [number,number,number];
    map.set(key= [5,10,1], 2);
    key[2]=20;
    
    map.set([10,1,5], 3);
    
    console.log(map.get([5,10,1]));  // 2
    
    console.log(map.get([1,2,3]));  // undefined
}

//test();