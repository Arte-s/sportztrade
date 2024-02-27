
import * as api1 from "../../graph sist/API";
import {CDivNode, CSessionAll, interfaceGraphAPI, tGraphDiv} from "../../graph sist/API";
import {mouse} from "../reactI";

export type tGraphTable = { h: tGraphTable[] } | { v: tGraphTable[] } | { graph: {} } | {}

export interface iGraphTable {
    h?: (iGraphTable)[];
    v?: iGraphTable[],
    graph?: {}
}

export interface IControlDisplayCanvas2D {
    session: CSessionAll;
    canvasApi: api1.interfaceCanvasAPI;
    canvasArr: interfaceGraphAPI[];
    noCreatNewBox: boolean;

    InitByDiv(div: HTMLDivElement): void;
    refresh(): void;
    creatMini(count: number, data?: { location: tGraphDiv, boxN: number, node?: CDivNode }, _box?: api1.CSystemBox): Promise< interfaceGraphAPI | undefined>;
    creatByStruct(table: tGraphTable): Promise< interfaceGraphAPI | undefined>;
    creatMany(lot: number): Promise< interfaceGraphAPI | undefined>;
    addVertical(count: number): Promise< interfaceGraphAPI | undefined>;
    addHorizon(count: number): Promise< interfaceGraphAPI | undefined>;
    Delete(): void;
    deleteGraph(): Promise<void>;
}
export class ControlDisplayCanvas2D implements IControlDisplayCanvas2D {
    session: CSessionAll
    canvasApi: api1.interfaceCanvasAPI
    canvasArr: interfaceGraphAPI[] = [];
    noCreatNewBox: boolean;

    InitByDiv(div: HTMLDivElement) {
        this.canvasApi.Init(div)
    }

    constructor({canvasApi, session, noCreatNewBox}: { canvasApi: api1.interfaceCanvasAPI, session: CSessionAll, noCreatNewBox?:boolean}) {//= api.GetSessionClass()
        this.canvasApi = canvasApi;
        this.session = session;
        this.noCreatNewBox = noCreatNewBox ?? false
    }

    refresh() {
        const node = this.canvasApi.location.node?.base
        if (node) {
        }
    }

    private async getBox(boxN: number) {
        // console.log({boxN,lenght:this.session.boxArray.length, session:this.session})
        return (boxN < this.session.boxArray.length) ?
            this.session.boxArray.box[boxN].OnSymbolDate
            : this.noCreatNewBox ?
                this.session.boxArray.lastBox()?.OnSymbolDate
                : await this.session.boxArray.add().InitSymbolDefault()
    }

    private async _addInLine({
                         location,
                         boxN,
                         node
                     }: { location?: tGraphDiv, boxN?: number, node?: CDivNode }, _box?: api1.CSystemBox) {
        boxN ??= 0
        if (!location) {
            location = {...this.canvasApi.location}
        } else {
            //   location = location.node?.parents.location ?? location
        }
        const graph = this.canvasApi.AddGraph(undefined, location, node)
        const box = _box ?? await this.getBox(boxN)
      //  console.log({boxN, box})
      //   if (box) console.log(box.id)
        if (box) graph?.SetSystemBox(box);
        // mouse.active = graph
        return graph
    }

    private async _addLvl({
                      location,
                      boxN,
                      node
                  }: { location?: tGraphDiv, boxN?: number, node?: CDivNode }, _box?: api1.CSystemBox) {
        boxN ??= 0
        if (!location) {
            location = {...this.canvasApi.location}
        } else {
            //   location = location.node?.parents.location ?? location
        }
        let graph = this.canvasApi.AddGraphLvl(undefined, location, node)
        const box = _box ?? await this.getBox(boxN)
        // if (box) console.log(box.id)
        if (box) graph?.SetSystemBox(box);
        // mouse.active = graph
        return graph
    }


    private async addTolLine(data: { location?: tGraphDiv, boxN: number, node?: CDivNode }, count: number, _box?: api1.CSystemBox | undefined) {
        let t: interfaceGraphAPI | undefined
        for (let i = 0; i < count; i++) {
            t = await this._addInLine(data, _box)
            if (t) this.canvasArr[data.boxN++] = t
        }
        return t;
    }

    private async addToLvl(data: { location?: tGraphDiv, boxN: number }, count: number, _box?: api1.CSystemBox | undefined) {
        let t: interfaceGraphAPI | undefined
        for (let i = 0; i < count; i++) {
            t = await this._addLvl(data, _box)
            if (t) this.canvasArr[data.boxN++] = t
        }
        return t;
    }

    private async creatBuStructBase(table: iGraphTable, p: { node: CDivNode, boxN: number, location?: tGraphDiv }): Promise<interfaceGraphAPI | undefined > {
        let t: interfaceGraphAPI | undefined = undefined
        p.node.AllDel()
        if (!p.location) p.location = {...this.canvasApi.location}
        if (table.v?.length) {
            const {v} = table

            for (let i = 0; i < v.length; i++) {
                t = await this._addLvl({location: p.location, node: p.node, boxN: p.boxN++})
                if (v[i]?.h || v[i]?.v) {
                    p.boxN--;
                    const data = {...p, node: t!._node!}
                    if (!p.location) p.location = {...this.canvasApi.location}
                    t = await this.creatBuStructBase(v[i], data)
                    p.boxN = data.boxN
                }
            }
            return t
        } else if (table.h?.length) {
            const {h} = table
            for (let i = 0; i < h.length; i++) {
                t = await this._addInLine({location: p.location, node: p.node, boxN: p.boxN++})
                if (h[i]?.h || h[i]?.v) {
                    p.boxN--;
                    const data = {...p, node: t!._node!}
                    if (!p.location) p.location = {...this.canvasApi.location}
                    t = await this.creatBuStructBase(h[i], data)
                    p.boxN = data.boxN
                }
            }
            return t
        }
        return t
    }


    async creatMini(count: number = -1, data?: { location: tGraphDiv, boxN: number, node?: CDivNode }, _box?: api1.CSystemBox) {
        data ??= {boxN: 0, location: {...this.canvasApi.location}}
        this.canvasArr = []
        if (count == -1) {
            count = (data.location.node?.base.left?.countRef()) ?? 0
            count++
        }
        data.location.node?.AllDel()
        const buf = await this.addTolLine(data, count, _box)
        this.canvasApi.ReSizeAndDraw();
        return buf
    }

    async creatByStruct(table: tGraphTable) {
        this.canvasApi.location.node?.AllDel()
        const buf = await this.creatBuStructBase(table, {node: this.canvasApi.location.node!, boxN: 0})
        this.canvasApi.ReSizeAndDraw();
        return buf
    }


    async creatMany(lot: number) {
        if (lot==1) return this.creatMini(1)
        const min = Math.floor(Math.log2(lot))
        const obj = {data: lot - (2 ** min)}
        // Функция создания структуры для создания множества окон
        const func = (data: number, count = 2, b: boolean = true) => {
            if (data <= 0 && obj.data == 0) return {}
            const tt = [{}, {}]
            if (data <= 0 && obj.data--) {
                if (b) return {h: tt};
                return {v: tt};
            }
            tt[0] = func(data - 1, 2, !b)
            tt[1] = func(data - 1, 2, !b)
            if (b) return {h: tt};
            return {v: tt};
        }
        return this.creatByStruct(func(min))
    }

    async addVertical(count: number = 2) {
        let t: interfaceGraphAPI | undefined
        let data = {boxN: 0, location: {...this.canvasApi.location}}
        const active = mouse.active;
        if (active) {
            const box = active.GetSystemBox().lastBox!
            let tt = active._node
            tt?.AllDel()
            let tt1 = await this._addLvl({location: data.location, node: tt, boxN: data.boxN++})
            tt1?.SetSystemBox(box)
            for (let i = 1; i < count; i++) t = await this._addLvl({location: data.location, node: tt, boxN: data.boxN++})
        }
        return t
    }

    async addHorizon(count: number = 2) {
        let t: interfaceGraphAPI | undefined
        let data = {boxN: 0, location: {...this.canvasApi.location}}
        const active = mouse.active;
        if (active) {
            const box = active.GetSystemBox().lastBox!
            let tt = active._node
            tt?.AllDel()
            let tt1 = await this._addInLine({location: data.location, node: tt, boxN: data.boxN++})
            tt1?.SetSystemBox(box)
            for (let i = 1; i < count; i++) t = await this._addInLine({
                location: data.location,
                node: tt,
                boxN: data.boxN++
            })
        }
        return t
    }

    Delete() {
        this.canvasApi.location.node?.AllDel()
        this.canvasArr = []
    }

    async deleteGraph() {
        this.canvasApi.location.node?.AllDel()
        this.canvasArr = [];
        const active = mouse.active?._node
        if (active) {
            // if ((active.node?.count??0)==2) {
            //
            // }
            //удаляет все включая себя
            active?.AllDelFullReliz()
            this.canvasApi.RefreshSize()
        }
        return
    }

}
