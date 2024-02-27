import {tAlert, tListEvent} from "./interface/mini";
import {CObjectEvents, ColorString} from "./const";

export type tFullAlert= {time:Date} & tAlert

export class CJournal   {
    data: tFullAlert[] = [];
    constructor() {
       // this.add({status:"start"});
    }
    protected funk:(()=>void)|undefined

    setEventForAdd(funk: () => void) {
        this.funk = funk;
    }

    add(data: tAlert) {
        this.data.push({time: new Date(), ...data});
        if (this.funk) this.funk()
    }
}
export const Journal = new CJournal();


export type tAlert2 = {type?: string, symbol?: string, link?: ()=>void, linkText?: string, text: string, color?: ColorString, key?:string}
export type tFullAlert2= {time: Date} & tAlert2
export type tFullAlert2Id= tFullAlert2 & {readonly id: number}

export interface ICJournal2 {
    readonly data: readonly tFullAlert2[];
    readonly events: CObjectEvents;
    readonly id: number;

    addEvent(data: tListEvent): void;
    add(data: tAlert2): void;
}

export class CJournal2 implements ICJournal2 {
    readonly data: tFullAlert2Id[] = [];
    readonly events = new CObjectEvents();
    private _id = 0;
    get id() { return this._id; }

    addEvent(data: tListEvent) {
        this.events.AddEnd(data)
    }

    add(data: tAlert2) {
        this.data.unshift({time: new Date(), id: this._id++, ...data});
        this.events.OnEvent(data)
    }
}

