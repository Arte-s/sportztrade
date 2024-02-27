import {IHLine} from "./Signal_2Bars";
import {CBar} from "../Nav/Bars"
import {CList, ListNode} from "../Nav/List"
import {CParams, GetSimpleParams, SimpleParams} from "../and/CParams";


export class CSignalBlockParams extends CParams {
    //enterType = { name: "Тип входа", value: ENTER_TYPE.BARCLOSE, range: [ENTER_TYPE.BARCLOSE, ENTER_TYPE.LIMIT] };
    //prevTouchCount = { name: "Число касаний до активации", value: 1, range: { min: 0, max: 20, step: 1 }};
    touchCount = { name: "Число касаний для входа", value: 2, range: { min: 1, defaultMax: 10, step: 1 }};
    enterCount = { name: "Число входов", value: 1, range: { min: 1, defaultMax: 20, step: 1 } };
    //minBarsBetweenReaction = { name: "Мин.число баров между реакциями", value: 1, range: { min: 1, max: 30, step: 1 } };
    maxBarsBetweenReaction = { name: "Макс.число баров между реакциями", value: 3, range: { min: 1, defaultMax: 99, step: 1 } };
    deltaHL_ATRPerc = { name: "Дельта HL, %ATR", value: 10, range: { min: 0, defaultMin: 1, defaultMax: 100, defaultStep: 1 } };
    //deltaOC_ATRPerc = { name: "Дельта OC, %ATR", value: 0, range: { min: 1, max: 100, step: 1 } };
    //deltaBefore_ATRPerc = { name: "Дельта недохода, %ATR", value: 0, range: { min: 0, max: 100, step: 1 } };
    //levelCount = { name: "Мин. число связей", value: 2, range: { min: 1, max: 20, step: 1 } };
    //levelSumWeight = { name: "Мин. суммарный вес связей", value: 0.1, range: { min: 0.1, max: 20, step: 0.1 } };
}

// class CSignalBlockParamsExt extends CSignalBlockParams {
//     minBarsForFirstTouch= 1;
//     maxTouches :number|undefined
// }

export type SignalBlockParamsExt= SimpleParams<CSignalBlockParams> & Readonly<{minBarsForFirstTouch :number}>; //, maxTouches :number|undefined}>;



export type TouchLine = {price :number, isHighLevel :boolean, sigbars: number[]};


export function createSignalBlock<TLine extends TouchLine> (params : SignalBlockParamsExt) {

    type TLineExt = TLine & {firstAllowedTouchBar :number};
    //let _firstAllowTouchBarMap = new Map<IHLine, >
    let _linesList = new CList<TLine>(); //Iterable<IHLine> = [];
    let _linesMap= new Map<TLine, ListNode<TLine>>();
    let _limitHigh = Number.MAX_VALUE;
    let _limitLow = Number.MIN_VALUE;
    const maxTouches= params.touchCount + params.enterCount - 1;

    return {
        get limitHigh() { return _limitHigh; },
        get limitLow() { return _limitLow; },

        add(line :TLine, iBar :number) {
            if (line.isHighLevel) _limitHigh= Math.min(_limitHigh, line.price);
            else                  _limitLow= Math.max(_limitLow, line.price);
            let lineExt : TLineExt = Object.assign(line, {firstAllowedTouchBar :iBar + params.minBarsForFirstTouch});
            let node = _linesList.add(lineExt);
            _linesMap.set(lineExt, node);
        },
        delete(line :TLine) {
            let node= _linesMap.get(line);
            if (! node) return;
            _linesMap.delete(line);
            _linesList.delete(node);
            if (line.isHighLevel && line.price==_limitHigh) {
                _limitHigh = Number.MAX_VALUE;
                for(let line of _linesList.values()) _limitHigh= Math.min(_limitHigh, line.price);
            }
            if (!line.isHighLevel && line.price==_limitLow) {
                _limitLow = Number.MIN_VALUE;
                for(let line of _linesList.values()) _limitLow= Math.max(_limitLow, line.price);
            }
        },
        onBar(bar :CBar) { //}, barClosed :boolean) {
            if (bar.high <_limitHigh && bar.low > _limitLow)
                return;
            let highB= Math.max(bar.open, bar.close); //верх тела свечи
            let lowB= Math.min(bar.open, bar.close); //низ тела свечи

            for(let line of _linesList.values()) {
                let deleting= false;
                // Внутри тела бара - удаляем линию
                //if (barClosed)
                    if (line.price <= highB && line.price >= lowB)
                        deleting = true;
            }
        },
        onBarLine(bar :CBar, iBar :number, line :TLine, atr :number) : "delete" | "touch" | void {
            if (line.sigbars.length>=maxTouches)
                return "delete";
            let highB= Math.max(bar.open, bar.close); //верх тела свечи
            let lowB= Math.min(bar.open, bar.close); //низ тела свечи
            let deleting= false;
            // Внутри тела бара - удаляем линию
            //if (barClosed)
            //if (line.price <= highB && line.price >= lowB)
            if (line.isHighLevel ? highB >= line.price : lowB <=line.price)
                deleting = true;
            if (deleting) return "delete";

            //let data= _linesMap.get(line);  if (!data) throw "Wrong line object";
            let lineExt= line as TLineExt;
            let n= iBar;
            if (line.sigbars.length>0) {
                let barsDelta= n - (line.sigbars.at(-1) ?? 0);
                //if (barsDelta < params.minBarsBetweenReaction) return;
                if (barsDelta > params.maxBarsBetweenReaction) return "delete";
            }
            // Внутри теней бара - добавляем сигнальный бар
            let maxDelta= atr * params.deltaHL_ATRPerc /100;
            //if (data.zzSectionValid.length >0)
            //if (barClosed)
            let delta= line.isHighLevel ? bar.high-line.price : line.price-bar.low;
            if (delta >= 0)
                if (delta <= maxDelta) {
                    if (n >= lineExt.firstAllowedTouchBar) {
                        // if (line.sigbars.length>0) {
                        //     let barsDelta= n - (line.sigbars.at(-1) ?? 0);
                        //     if (barsDelta < params.minBarsBetweenReaction) return;
                        //     if (barsDelta > params.maxBarsBetweenReaction) return "delete";
                        // }
                        line.sigbars.push(n);
                        if (line.sigbars.length < params.touchCount-1) return;
                        //if (line.firstValidTouchBar==-1 && line.zzIndex!=-1) line.firstValidTouchBar= n;
                        return "touch";
                    }
                }
                else return "delete";
                //if (line.zzIndex>=0) callbacks?.onSignal(line);
        }

    } as const;
}