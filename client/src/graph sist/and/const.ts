import {AlignH, CObjectsAndr, Color, ILine, ITimeLine, LineStyle, Point, typeNewObjectGraph} from "../Nav/CGraphObject";

import {tListEvent} from "./interface/mini";
import {interfaceService} from "./interface/IIndicator";
import {CRBaseMapAll2} from "./history/historyBase";
import {CListNode} from "./listNode";

import { CIndiBase, CIndicatorGraphObject} from "./Indicator";

export * from "./indicatorAPI";


export const CLICKLEFT=1;
export const CLICKRIGHT=2;
export const CLICKSCRULL=4;

export const CDIVRESIZE_OFF=0;
export const CDIVRESIZE_DEFAULT=1;//00001
export const CDIVRESIZE_ALL=2;//00010


// callback версия 2.0 по LinNode
// пример ссылки которую надо удалить после одного срабатывания
// this.addEvent.Add({func:()=>{}, func2(){this.del?.()}})
// Важно - это штука умеет собирать в коллекцию прошлые "функции удаления"

export class CObjectEvents<T=unknown>{
    constructor(log=true) {
        this._log=log;
    }
    Id =0
    private _log = false
    private data = new CListNode<tListEvent<T>>()
    private set setup(link:CListNode<tListEvent<T>>) {
        const buf = link;
        const data = link.data!
        // редкое читерство, теперь и ты попробуй догадаться для чего это тут
        let fanClub = data.del
        data.del = ()=>{
            fanClub?.()
            fanClub = undefined; // чтобы функция удаления отчищалась при срабатывании
            buf.DeleteLink();
            data.OnDel?.();
        }
        if (this._log && this.count()>20) {
            console.trace("подозрительное большое количество подписок ",this.count());
            this.log();
        }
    }

    log()                       {let er:object[]=[]; this.data.forEach(e=>er.push(e)); console.log(er);}
    AddStart(data:tListEvent)   {this.setup = this.data.AddStart(data)}
    AddEnd(data:tListEvent)     {this.setup = this.data.AddEnd(data)}
    Add(data:tListEvent)        {this.setup = this.data.AddEnd(data)}
    OnEvent(data?:T)            {this.data.forEach(e=>{e.func?.(data); e.func2?.(data);})}
    OnSpecEvent<T>(f:(e?:T)=>void)  {this.data.forEach((e)=>{let l=e.func?.(); if (l) {f(l);}  e.func2?.();})}
    Clean()                     {let r:CListNode<any>|undefined =this.data.First(); while (r) {let buf = r; r=r?.Next(); buf.DeleteLink()}}
    count()                     {return this.data.countRef()}
    get length()                {return this.count()}
}


//callback версия 2.0 по массивам (вдруг окажется производительнее)
export class CObjectEventsArr{
    private data :tListEvent[] = []

    private set setup(link:tListEvent) {
        const data = link
        data.del = ()=>{
            for (let i = 0; i < this.data.length; i++) {
                if (this.data[i]==data) {
                    this.data[i].OnDel?.();
                    this.data.splice(i,1)
                    data.OnDel?.();
                    return;
                }
            }
            console.error("элемент уже был удален")
            console.trace()
            data.OnDel?.();
            console.log(this.count());
        }
    }
    AddStart(data:tListEvent)               {this.setup = this.data[0]}
    AddEnd(data:tListEvent)                 {this.setup = this.data[this.data.push(data)-1]}
    Add(data:tListEvent)                    {this.setup = this.data[this.data.push(data)-1]}
    OnEvent(data?:any)                      {this.data.forEach((e)=>{e.func?.(data); e.func2?.(data);})}

    // OnSpecEvent<T extends object>(f:(e:T)=>void)           {this.data.forEach((e)=>{let l=e.func?.() as T; if (l) {f(l);}  e.func2?.();})}
    OnSpecEvent<T extends object>(f:(e:T)=>void)           {this.data.forEach((e)=>{const l=e.func?.() as T|undefined; l&&f(l); e.func2?.();})} // l&&f(l);  if (l) {f(l);}
    Clean()                                 {
        for (let i = this.data.length - 1; i >= 0; i--) {
            this.data[i].del?.();
            this.data[i].OnDel?.();
        }
        this.data=[];
    }
    count()                                 {return this.data.length}
    get length()                            {return this.count()}
}

//callback версия 2.0 по массивам (вдруг окажется производительнее)
function FObjectEventWeb(client: any, server: any) {
    let websocket = client
    let websocketServer = server

    websocketServer?.listEvent?.()

    let staticId = 0
    class CObjectEventsArrWebSocket{
        private data :tListEvent[] = []
        private set setup(link:tListEvent) {
            websocket.Sistem?.(++staticId)
            // список команд
            // эвенет
            // удалить колбак с клиента
            // удалить колбэк с сервера
            // пишем коннект
            const data = link
            data.del = ()=>{
                //пишем дисконект

                for (let i = 0; i < this.data.length; i++) {
                    if (this.data[i]==data) {
                        this.data[i].OnDel?.();
                        this.data.splice(i,1)
                        data.OnDel?.();
                        return;
                    }
                }
                console.error("элемент уже был удален")
                console.trace()
                data.OnDel?.();
                console.log(this.count());
            }
        }
        AddStart(data:tListEvent)               {this.setup = this.data[0]}
        AddEnd(data:tListEvent)                 {this.setup = this.data[this.data.push(data)-1]}
        Add(data:tListEvent)                    {this.setup = this.data[this.data.push(data)-1]}
        OnEvent(data?:tListEvent)               {this.data.forEach((e)=>{
            /*
            *  websocketServer.send()
            *
            * */
            e.func?.(data); e.func2?.(data);})
        }
        OnSpecEvent<T>(f:(e:T)=>void)           {this.data.forEach((e)=>{const l=e.func?.(); l&&f(l); e.func2?.();})} // l&&f(l);  if (l) {f(l);}
        Clean()                                 {
            for (let i = this.data.length - 1; i >= 0; i--)
                this.data[i].del?.() || this.data[i].OnDel?.();
            this.data=[];
        }
        count()                                 {return this.data.length}
        get length()                            {return this.count()}
    }

    return ()=> new CObjectEventsArrWebSocket
}

// export const getClassEvent = FObjectEventWeb({})
//
// const newClass = getClassEvent()


// newClass.Add({func:()=>{}})


//колбэки версия 1.0
export class CArrayEventByOb<T> {
    data: ( {funk?: ()=>void } & T)[] = [];
    Set(data: ({funk?: ()=>void} & T)) {this.data.push(data)}
    OnEvent(funk=(el:{funk?:()=> void}&T)=>{el.funk?.()}) {
        for (let datum of this.data) funk(datum);
        this.Clean();
    }
    Clean(funk=(el:{funk? :()=> void} & T)=>!!el.funk){
        const {data} = this;
        for (let i = 0; i < data.length; i++) if (!funk(data[i])) data.slice(i--)
    }
    get count() {return this.data.length}
}
//массив для колбэков
export class CArrayEvenEasy extends CArrayEventByOb<{delete?:()=>{}}>{
    Delete(){
        super.OnEvent((el)=>{el.delete?.()})
    }
}





export type IParamOld = {
    set: (a: any) => any;
    get: () => any;
    name? :string;
} & (
    { type :"checkbox"; }
    |
    {
        type: "range";
        min?: number;
        max?: number;
        step?: number;
    }
    )





export type IParamsOld = {
    readonly setup : { [key :string] : IParamOld; }
}



interface GraphObject {
    begin : Point;  // начало
    end? : Point;  // конец
    fill? : boolean;
    color : Color;
    style? : LineStyle;// = "solid";
    width? : number;// = 1;  // толщина линии
    text? : string;
    objectAlign?:AlignH
    textAlign? : AlignH;// = "center";  // выравнивание текста
    tooltip? : string;  // всплывающая подсказка
}



export class CStaticBase extends CIndiBase {
    text: (()=>string) | null = null;
}



export abstract class CServiceBase extends CIndicatorGraphObject implements interfaceService {
    abstract OnInit(history: CRBaseMapAll2): void;
}




