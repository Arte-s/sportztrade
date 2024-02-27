type tMesGet = {key: string, value: object, status: boolean}
type tMesSet = {status: boolean}
// http://77.40.53.96:3000/

 const SERVER = "http://localhost:3003"
// const SERVER = "http://77.40.53.96:3003"

export interface IServerSaveBase<K,V> {
	set(key: K, value: V): Promise<boolean> | boolean
	pushToArray(key: K, value: V): Promise<boolean> | boolean
	deleteElementInArray(key: K, value: V): Promise<boolean> | boolean
	get<T extends (V)>(key: K): Promise<T | null> | T | null
	delete(key: K): Promise<boolean> | boolean
	deleteAll(): Promise<boolean> | boolean
}
export interface IServerSave extends IServerSaveBase<string,object> {
	set(key: string, value: object): Promise<boolean>
	pushToArray(key: string, value: object): Promise<boolean>
	deleteElementInArray(key: string, value: object): Promise<boolean>
	get<T extends (object)>(key: string): Promise<T | null>;
	delete(key: string): Promise<boolean>;
	deleteAll(): Promise<boolean>;
}

export class CServerSave implements IServerSave {
	private data:string = SERVER + "/api/key/"
	private obj = {method: 'POST', headers: {'Content-Type': 'application/json;charset=utf-8'}}
	async parseData<T>(data:{key: string, value?: object}, pr: string){
		return (await (await fetch(this.data + pr, {...this.obj, body: JSON.stringify({...data})})).json()) as T
	}
	constructor(address: string = SERVER + "/api/key/") {
		this.data = address
	}

	async set(key: string, value: object): Promise<boolean>  //,  div : HTMLElement
	{
		try {
			return (await this.parseData<tMesSet>({key, value},"set")).status
		} catch (e) {
			console.error(e);
			return false
		}
	}
	async pushToArray(key: string, value: object): Promise<boolean>  //,  div : HTMLElement
	{
		try {
			return (await this.parseData<tMesSet>({key, value},"pushToArray")).status
		} catch (e) {
			console.error(e);
			return false
		}
	}

	async deleteElementInArray(key: string, value: object): Promise<boolean>  //,  div : HTMLElement
	{
		try {
			return (await this.parseData<tMesSet>({key, value},"deleteElementInArray")).status
		} catch (e) {
			console.error(e);
			return false
		}
	}

	async get<T extends object>(key: string): Promise<T | null> {
		try {
			return (await this.parseData<tMesGet>({key},"get")).value as T
		} catch (e) {
			console.error(e);
			return null
		}
	}

	async delete(key: string): Promise<boolean>{
		try {
			return (await this.parseData<tMesGet>({key},"delete")).status
		} catch (e) {
			console.error(e);
			return false
		}
	}
	async deleteAll(): Promise<boolean>{
		try {
			const body = JSON.stringify({})
			const parseData = (await (await fetch(this.data + "deleteAll", {...this.obj, body})).json()) as tMesSet;
			return parseData.status
		} catch (e) {
			console.error(e);
			return false
		}
	}

}

type tData= {key:string, value:object}
type tBody=  {body:tData}
type tMes= {key:string, value:object, status: boolean}
const msToSave = 60000


interface ISaveMap<K,V> {
	set(key: K, value: V) : void;
	get<Z>(key: K) : Z | V | undefined;
	has(key: K) : boolean;
	delete(key: K) : boolean | undefined;
	deleteAll() : this;
	sync?() : void;
	pushToArray(key: string, value: V): void
	deleteElementInArray(key: string, value: V): void
	save?: (data?: any) => any
}

interface ISaveMapP<K,V> extends ISaveMap<K,V>{
}


export interface IServerSaveBasePromise {
	set(key: string, value: object): Promise<boolean>
	get<T extends (object)>(key: string): Promise<T | null>;
	delete(key: string): Promise<boolean>;
}


interface IServerSave2 extends IServerSaveBasePromise{
	pushToArray(key: string, value: object): Promise<boolean>
	deleteElementInArray(key: string, value: object): Promise<boolean>
	// deleteAll(): Promise<boolean>;
}

/**
 * Класс расширяет стандартный функционал Map или любого производного с key value
 * Преминем для работы с сервером или с кэшом браузера также с Map
 */
export class CSaveToMap  {
	constructor(map : any, save?: ()=>void|Promise<void>) {
		this.map = map
		this.save = save//
	}
	map: any
	// deleteAll(): this {
	// 	this.map.deleteAll()
	// 	this.save?.()
	// 	return true
	// }
	async delete(key: string): Promise<boolean|null> {
		const buf = await this.map.delete(key)
		this.save?.()
		return buf
	}
	async get<T>(key: string):  Promise<T|null> {
		return await this.map.get(key)
	}
	async has(key: string): Promise<boolean|null> {
		return await this.map.has(key)
	}
	async set(key: string, value: any): Promise<boolean|null> {
		const buf =  await this.map.set(key,value)
		this.save?.()
		return buf
	}
	sync() {
		return this.map.sync?.()
	}
	async pushToArray(key: string, value: any) {
		let data : any[] = (await this.map.get(key)) as any[] ?? []
		// data = await data
		// console.log("pushToArray ",{key,value,data})
		if (!Array.isArray(data)) data = [];
		data.push(value)
		// console.log("pushToArray ",{data})
		await this.map.set(key, data)
		this.save?.()
	}


	async updateElementInArray(key: string, value: any, newValue: any) {

		// @ts-ignore
		const data : any[] = (await this.map.get<any[]>(key)) as any[] ?? []
		if (!Array.isArray(data)) {
			console.warn("!Array.isArray(data)")
		}
		const a = JSON.stringify({a: value})
		const index = data.findIndex(e=>JSON.stringify({a:e})==a)
		console.log({newValue})
		if (index!=-1) data.splice(index,1, newValue)
		else {
			data.push(newValue)
		}
		// let i = 0
		// // в общем stringify
		// for (; i < data.length; i++) if (JSON.stringify({a:data[i]}) == a) break;
		// if (i<data.length) data.splice(i,1)
		await this.map.set(key, data)
		this.save?.()
	}

	async deleteElementInArray(key: string, value: any) {

		// @ts-ignore
		const data : any[] = (await this.map.get<any[]>(key)) as any[] ?? []
		if (!Array.isArray(data)) {
			console.warn("!Array.isArray(data)")
		}
		const a = JSON.stringify({a: value})
		const index = data.findIndex(e=>JSON.stringify({a:e})==a)
		if (index!=-1) data.splice(index,1)
		// let i = 0
		// // в общем stringify
		// for (; i < data.length; i++) if (JSON.stringify({a:data[i]}) == a) break;
		// if (i<data.length) data.splice(i,1)
		await this.map.set(key, data)
		this.save?.()
	}
	save?: (data?:any)=>any
}

type tCWorkToMap<Key,Element> = {
	map: CSaveToMap,
	//keySaveElement: string,
	loadElement: (element: Element, key: Key) =>void
	nameAddressElement: (key: Key)=>string
	nameList: string
	//prefix?: string
}


export class CWorkToMap<List,Element> {
	props: Readonly<tCWorkToMap<List, Element>>
	constructor(props : tCWorkToMap<List, Element>) {
		this.props = props// {...props, prefix: props.prefix ?? ""}
	}
	arrList: List[] = []
	update() {
		return this.loadList().then(
			(e)=> {
				return this.arrList = e
			}
		)
	}

	async loadList() {
		return await this.props.map.get<List[]>(this.props.nameList) || []
	}

	async save(key: List, value: object, findDuplicate?:(e: List)=>boolean) {
		const {nameList, nameAddressElement} = this.props
		//const prefix = this.props.prefix ?? ""
		const e = findDuplicate ? this.arrList.find(findDuplicate) : undefined
		if (e) {
			await this.props.map.updateElementInArray(nameList, e, key)
			await this.props.map.delete(nameAddressElement(e))
			await this.props.map.set(nameAddressElement(key), value ?? {})
			await this.update()
			return
		}
		// await Promise.allSettled([
		// this.props.map.pushToArray(nameList, key),
		// this.props.map.set(nameAddressElement(key), value ?? {})
		// ])
		await this.props.map.pushToArray(nameList, key)
	    await this.props.map.set(nameAddressElement(key), value ?? {})
		await this.update()
		return
	}

	async delete(key : List) {
		const {nameList, nameAddressElement} = this.props
		await this.props.map.deleteElementInArray(nameList, key)
		await this.props.map.delete(nameAddressElement(key))
		// await Promise.allSettled([
		// 	this.props.map.deleteElementInArray(nameList, key),
		// 	this.props.map.delete(nameAddressElement(key))
		// ])
		await this.update()
		return
	}
	async select(key : List) {
		const {loadElement, nameAddressElement} = this.props
		const importData = await this.props.map.get<Element>(nameAddressElement(key))
		if (importData) loadElement?.(importData, key)
		return
	}
}

export const ServerMini :IServerSave = new CServerSave(SERVER + "/api/key/")
