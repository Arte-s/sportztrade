import {CBar} from "../Nav/Bars";

export type Signal = { price :number, volume :number }

export type SignalTouchLine = Readonly<{ price: number, touches: number, finishBar: number, isHigh? :boolean }>;


export class SignalBlock {
    private readonly params : { minTouches: number, maxTouches :number};
    constructor(params : { minTouches: number; maxTouches? :number}) {
        this.params= {maxTouches: Number.MAX_VALUE, ...params};
    }
    private lines :Iterable<SignalTouchLine> = [];
    private lastPrice? : number;
    private max :number= Number.MIN_VALUE;
    private min :number= Number.MAX_VALUE;

    setLines(lines :Iterable<SignalTouchLine>, limits? :{min :number, max :number}) {
        this.lines= lines;  [this.min, this.max] = limits ? [limits.min, limits.max] : [Number.MAX_VALUE, Number.MIN_VALUE];
    }
    *onBar(bar :CBar, index :number) : Generator<Signal> {
        if (bar.high<this.max && bar.low>this.min) return;
        let minTouches= this.params.minTouches;
        let lastPrice= this.lastPrice ?? bar.open;
        for(let line of this.lines) {
            if (line.touches < minTouches-1) continue;  // Если количество прошлых касаний линии не достаточно
            //if (line.touches>= minTouches && !this.params.signalRepeat) continue;
            if (line.touches>= this.params.maxTouches) continue;
            //if (line.sigbar[line.sigbar.length-1] != i) continue;
            //if (line.start==line.finish) continue;
            if (index > line.finishBar) continue;
            // let lineActive= this.twoBarsSignalLinesMap.get(line);
            // if (! lineActive) {
            //     if (lineActive==null)
            //         this.twoBarsSignalLinesMap.set(line, true);
            //     continue;
            // }
            let signal= 0;
            const isLineHigh= line.isHigh ?? (lastPrice < line.price ? true : lastPrice > line.price ? false : undefined);
            if (isLineHigh==undefined) continue;
            if (isLineHigh) {
                if (bar.high >= line.price)
                    signal= -1;
            }
            if (! isLineHigh)
                if (bar.low <= line.price)
                    signal= 1;

            if (!signal) continue;
            yield { price: line.price, volume: signal };
        }
        this.lastPrice= bar.close;
    }
}