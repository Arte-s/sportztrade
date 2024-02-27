/// <reference no-default-lib="true"/>

// interface Iterable<T> {
//     [Symbol.iterator](): Iterator<T>;
// }

// @@@ts-ignore
//type MyReadonly<T> = { readonly [P in keyof T] : T[P] } & (T extends Iterable<infer TT> ? Iterable<TT> : {})

//interface Readonly<T extends Iterable<any>> { [Symbol.iterator](): T extends Iterable<infer TT> ? TT : never }
//
type Immutable<T> =  ReadonlyFull<T> & { readonly Mutable : false; } //{ [key in keyof T] : T[key] }


type ReadonlyFull<T> =
    T extends ((...args:any)=>any) ? T :
        T extends number|string|boolean|symbol ? T :
            T extends const_Date ? const_Date :
                { readonly [P in keyof T] : ReadonlyFull<T[P]> };


//type MutableFull<T> = T extends Function ? T : { -readonly [P in keyof T] : MutableFull<T[P]> } //T[P] extends object ? ReadonlyFull<T[P]> : T[P] }

type MutableFull<T> =
    T extends ((...args:any)=>any) ? T :
        T extends number|string|boolean|symbol ? T :
            T extends const_Date ? const_Date :
                { -readonly [P in keyof T] : MutableFull<T[P]> };

/**
 * Removes "readonly" from all properties
 */
type Mutable<T> = {
    -readonly [P in keyof T]: T[P];
};

//type ReadonlyFull<T> = T extends ((...args:any)=>any) ? T : T extends object ? { readonly [P in keyof T] : ReadonlyFull<T[P]> } : T;


type const_Date = Omit<Date, "setTime"|"setFullYear"|"setMonth"|"setDate"|"setHours"|"setMinutes"|"setSeconds"|"setMilliseconds"|"setUTCFullYear"|"setUTCMonth"|"setUTCDate"|"setUTCHours"|"setUTCMinutes"|"setUTCSeconds"|"setUTCMilliseconds">;
//type const_Date = Readonly<Omit<Date, "setTime"|"setFullYear"|"setMonth"|"setDate"|"setHours"|"setMinutes"|"setSeconds"|"setMilliseconds"|"setUTCFullYear"|"setUTCMonth"|"setUTCDate"|"setUTCHours"|"setUTCMinutes"|"setUTCSeconds"|"setUTCMilliseconds">>;


interface DateConstructor {
    new (value: number | string | Date | const_Date): Date;
}

declare var Date : DateConstructor;

interface ArrayConstructor {
    isArray<T>(a :unknown) : a is readonly unknown[];
    isArray<T>(a :readonly T[]) : a is readonly T[];
    isArray<T>(a :T[]) : a is T[];
}


// заменить тип поля в структуре
type ReplaceKeyType<Struct extends object, Key extends keyof Struct, NewType> = {[key in keyof Struct] : key extends Key ? NewType : Struct[key]}; //Omit<TObj,Key> & (TObj extends {-readonly [key in Key] :any} ? { [key in Key]: TVal } : { readonly [key in Key]: TVal });



// получить только ключи (поля) заданного типа (без проверки их наличия)
type KeysByTypeUnchecked<T, PickT> = {
    [key in keyof T]: T[key] extends PickT ? key : never;
}[keyof T];

// получить только ключи (поля) заданного типа (с проверкой их наличия)
type KeysByType<T, PickT extends T[keyof T]> = {
    [key in keyof T]: T[key] extends PickT ? key : never;
}[keyof T];

// получить только ключи (поля) типов, отличных от заданного
type KeysWithoutType<T, ExcludeT> = {
    [key in keyof T]: T[key] extends ExcludeT ? never : key
}[keyof T];

// исключить из структуры поля с заданными типами
type OmitTypes<T, ExcludeT> = Pick<T, KeysWithoutType<T, ExcludeT>>

// включить в структуру только поля с заданными типами (с проверкой их наличия)
type PickTypes<T, PickT extends T[keyof T]> = Pick<T, KeysByType<T, PickT>>

// включить в структуру только поля с заданными типами (без проверки их наличия)
type PickTypesUnchecked<T, PickT> = Pick<T, KeysByTypeUnchecked<T, PickT>>

// сделать все поля Required кроме полей E
type RequiredExcept<T, E extends keyof T> = Required<Omit<T,E>> & Pick<T,E>;

//type III = Iterable<number>;

//export function fff(a : Readonly<III>) { for(let t of a) { } }

//declare interface Readonly<T> { }

