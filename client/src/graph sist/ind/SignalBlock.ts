// import {CBar, TF} from "../Nav/Bars";
// import {BSearch, deepClone, MapExt} from "../Nav/Common";
// import {CParams, GetSimpleParams, SimpleParams} from "../and/CParams";
// import {ILine} from "../Nav/CGraphObject";
// import {Signal} from "./Signal";
//
//
// export enum ENTER_TYPE { BARCLOSE= "Закрытый бар", LIMIT="Лимит", BARBREAK="Пробой бара" }
//
// export class CSignalBlockParams extends CParams {
//     enterType = { name: "Тип входа", value: ENTER_TYPE.BARCLOSE, range: [ENTER_TYPE.LIMIT, ENTER_TYPE.BARCLOSE, ENTER_TYPE.BARBREAK] };
//     //prevTouchCount = { name: "Число предварительных касаний", value: 1, range: { min: 0, max: 20, step: 1 }};
//     touchCount = { name: "Число касаний для входа", value: 1, range: { min: 1, defaultMax: 20, step: 1 }};
//     enterCount = { name: "Число входов", value: 1, range: { min: 1, defaultMax:99, step: 1 } };
//     deltaHL_ATRPerc = { name: "Дельта HL, %ATR", value: 10, range: { min: 0, defaultMin: 1, defaultMax: 100, defaultStep: 1 } };
//     deltaOC_ATRPerc = { name: "Дельта OC, %ATR", value: 0, range: { min: 0, defaultMax: 100, defaultStep: 1 } };
//     deltaBefore_ATRPerc = { name: "Дельта недохода, %ATR", value: 10, range: { min: 0, defaultMax: 100, defaultStep: 1 } };
//     deltaBarsAfter = { name: "Дельта пробития по времени, бары", value: 1, range: { min: 0, defaultMax: 100, step: 1 } };
//     deltaBarsBefore = { name: "Дельта недохода по времени, бары", value: 1, range: { min: 0, defaultMax: 100, step: 1 } };
//     useTimeLevels = { name: "Временные уровни", value: true };//, hidden: true };
//     levelCount = { name: "Мин. число связей", value: 2, range: { min: 1, defaultMax: 20, step: 1 } };
//     levelSumWeight = { name: "Мин. суммарный вес связей", value: 0.1, range: { min: 0, defaultMin: 0.1, defaultMax: 20, defaultStep: 0.1 } };
// }
//
// export class CSignalBlockParamsShort extends CSignalBlockParams {
//     override useTimeLevels = {...new CSignalBlockParams().useTimeLevels, value: true, hidden: true };
//     override levelSumWeight = {...new CSignalBlockParams().levelSumWeight, value: 0, hidden :true };
//     override levelCount= {...new CSignalBlockParams().levelCount, value: 1, hidden: true };
// }
//
//
// declare type Nominal<T, Name extends string> = T & { [Symbol.species]: Name; }
//
// export type SignalID= Nominal<number, "SignalID">
//
// export type LineID= Nominal<number, "LineID">
//
// export type ILineSimple = Pick<ILine, Extract<keyof ILine, "begin"|"end">>;
//
// type OwnerID = string;
//
// export type ILineExt<T extends ILineSimple= ILineSimple>= T & { readonly id :LineID, ownerID? :OwnerID };
//
// type LineDataBase = { line :ILineExt, weight :number, ownerID? :OwnerID}
//
// type LineData= LineDataBase & { price :number, touches :number, lastTouchTimeVal? :number, maxDeltaAfter :number, maxDeltaBefore? :number };//, lastCalcTimeVal? :number };//checkingId :number };//, signal? : Signal }
//
// type TimeLineData= LineDataBase & { time :number, touched?: boolean, maxDeltaAfter? :number, maxDeltaBefore? :number, activateTime: number, expirateTime: number };//, signal? : Signal }
//
//
// export type BlockSignal = Signal & { readonly groupPriceLines :readonly ILineExt[], readonly groupTimeLines :readonly ILineExt[] };
//
// class CSignalExt { readonly ownerID? : OwnerID;  constructor(ownerID? : OwnerID) { this.ownerID= ownerID; } }
// function newSignal(signal :BlockSignal, ownerID? :OwnerID) { return Object.freeze(Object.assign(new CSignalExt(ownerID), signal)); }
// function getSignalOwnerID(signal :BlockSignal)             { return signal instanceof CSignalExt ? signal.ownerID : undefined; }
//
//
// export type ExtraLineParams = Readonly<{maxDeltaAfter?: number, maxDeltaBefore? :number, ownerID? :OwnerID, startTimeVal? :number}>;
//
//
//
// class CLineDatas {
//     datas : LineData[] & {sorted?:boolean} = [];
//     //datasSortedByDeltaBefore : LineData[] = [];
//     activatedDatas = new Set<LineData>();
//     movingDatas = new Set<LineData>();
//     customPriceDeltasCount = 0;
//     //customPriceDeltaCountMap= new MapExt<number,number>();
//     timeDatas : TimeLineData[] & {sorted?:boolean} = [];
//     activatedTimeDatas = new Set<TimeLineData>();
//     //signal? : SignalExt;
//     signals : BlockSignal[] = [];
// }
//
//
//
//
// export type SignalBlockData<TLine extends ILineSimple= ILineSimple> = Pick<CSignalBlock<TLine>, "params"|"addLine"|"deleteLine"|"setValidator"|"_lowData"|"_highData">;
//
//
// export class CSignalBlock<TLine extends ILineSimple= ILineSimple> {
//
//     private static _id = 0;
//     //lines :ILine[] = []
//     private lines = new Map<LineID, LineData|TimeLineData>();
//
//     private lastTime? :const_Date;
//     //lineDatas : LineData[] = [];
//
//     //private
//     private highData= new CLineDatas();
//     private lowData= new CLineDatas();
//
//     get _highData() { return this.highData; }
//     get _lowData() { return this.lowData; }
//
//     private groupValidators = new Map<OwnerID, (lines :readonly ILineExt<TLine>[])=>boolean>();
//
//     private ownerIDs= new Set<OwnerID|undefined>();
//
//     // отфильтровать сигнальные линии по ID их владельца
//     static filterSignalLinesByOwnerID(signal :BlockSignal, ownerID :OwnerID) {
//         let signalOwnerID= getSignalOwnerID(signal);
//         return signalOwnerID==ownerID ? signal : newSignal({
//             ...signal,
//             groupPriceLines: signal.groupPriceLines.filter(s => s.ownerID==ownerID),
//             groupTimeLines: signal.groupTimeLines.filter(s => s.ownerID==ownerID),
//         });
//     }
//
//     //movingDatas = new Set<LineData>();
//
//     //private highDatas : LineData[] & { sorted?:boolean} =[];
//     //private lowDatas : LineData[] & { sorted?:boolean} =[];
//
//     //highActivatedDatas = new Set<LineData>();
//     //lowActivatedDatas = new Set<LineData>();
//
//     //private highSignal? : Signal; //LineData;
//     //private lowSignal? : Signal; //LineData;
//
//     readonly params : SimpleParams<CSignalBlockParams>; //= GetSimpleParams(new CSignalBlockParams());
//     private tf : TF;
//     private tf_msec :number;
//
//     private _lastBar? : CBar;
//     private _lastATR? :number;
//
//     constructor(params :SimpleParams<CSignalBlockParams>, tf :TF) {
//         this.params= deepClone(params);
//         this.tf= tf;
//         this.tf_msec= tf.msec;
//     }
//
//     addLine(line :TLine, up :boolean, weight :number, extraParams?: ExtraLineParams) : LineID {
//         const id= CSignalBlock._id++ as LineID;
//         const ownerID= extraParams?.ownerID;
//         const myLine : ILineExt = {...line, ...(line.begin.x > line.end.x ? {begin: line.end, end: line.begin} : {}), id, ownerID};
//         const sideData= up ? this.highData : this.lowData;
//         if (line.begin.x!=line.end.x) { // ценовой уровень
//             const[maxDeltaBefore, maxDeltaAfter] = [extraParams?.maxDeltaBefore, extraParams?.maxDeltaAfter ?? Number.MAX_VALUE];
//             let lines= sideData.datas;
//             let lineData : LineData= {
//                 line: myLine,
//                 price: line.end.y,
//                 touches: 0,
//                 weight, maxDeltaBefore, maxDeltaAfter, ownerID,
//                 lastTouchTimeVal: extraParams?.startTimeVal
//             };//, checkingId :0};
//             lines.push(lineData);
//             lines.sorted= false;
//             if (line.begin.y != line.end.y) {
//                 sideData.movingDatas.add(lineData);
//                 this.lastTime= undefined;  // для того, чтобы было пересчитаны moving уровни
//             }
//             this.lines.set(id, lineData);
//             if (maxDeltaBefore!=null) sideData.customPriceDeltasCount++;
//         }
//         else { // временной уровень
//             //if (this.counter++<10) console.log("Add time line:",line);
//             const[maxDeltaBefore, maxDeltaAfter] = [extraParams?.maxDeltaBefore, extraParams?.maxDeltaAfter];
//             let lines= sideData.timeDatas;
//             const tf_msec= this.tf.msec;
//             const tfDelta= tf_msec/4;
//             const activateTime= line.end.x - Math.min((this.params.deltaBarsBefore+0.5) * tf_msec,  maxDeltaBefore ?? Number.MAX_VALUE) + tfDelta;
//             const expirateTime = line.end.x + Math.min((this.params.deltaBarsAfter+0.5) * tf_msec, maxDeltaAfter ?? Number.MAX_VALUE) - tfDelta;
//             let lineData : TimeLineData= {line: myLine, time: line.end.x, weight, maxDeltaAfter, maxDeltaBefore, activateTime, expirateTime, ownerID};
//             if (activateTime < expirateTime) {
//                 lines.push(lineData);
//                 lines.sorted= false;
//             }
//             this.lines.set(id, lineData);
//         }
//         this.ownerIDs.add(ownerID);
//         //lines.sort((a,b)=>a.)
//         return id; //0 as LineID;
//     }
//
//     deleteLine(id :LineID) {
//         let data= this.lines.get(id);
//         this.lines.delete(id);
//         if (data)
//             data.line= {...data.line, end: { x:0, y:0}};
//     }
//
//     // задать валидатор для группы уровней
//     setValidator(id :OwnerID, validator :(lines :readonly ILineExt<TLine>[])=>boolean) {
//         this.groupValidators.set(id, validator);
//         this.ownerIDs.add(id);
//     }
//
//
//     #signals : readonly BlockSignal[] = [];
//
//
//     // проверяем временные уровни
//     private checkTimeLevels(sideData :CLineDatas, time :number, onDeleteLine? :(id :LineID, line :TLine)=>void) : "modified"|undefined {
//         const params= this.params;
//         if (! params.useTimeLevels) return undefined;
//         const tf_msec= this.tf_msec ?? 0;
//         const deltaAfter = tf_msec * params.deltaBarsAfter;
//         const deltaBefore = tf_msec * params.deltaBarsBefore;
//         //let activatedDatas : LineData[] = [];
//         let activatedDatas= sideData.activatedTimeDatas;
//         //let activatedModify= false;
//         let datas= sideData.timeDatas;
//         if (! datas.sorted) {
//             datas.sort((a,b)=> a.activateTime - b.activateTime);
//             datas.sorted= true;
//             //activatedModify= true;
//         }
//         let removeIndexes : number[] = [];
//         //let signal= sideData.signal;
//         const deltaBeforeShift= params.enterType==ENTER_TYPE.LIMIT ? tf_msec : 0;
//         const tfDelta= tf_msec/4;
//         let   modified= false;
//
//         for(let [i,data] of datas.entries()) {
//             const lineTime= data.time;
//             //const delta= time - lineTime;
//             let   deleting= false;
//             //let endTime= lineTime + Math.min(deltaAfter, data.maxDeltaAfter ?? Number.MAX_VALUE) - tfDelta;
//             if (data.line.end.x==0)
//                 deleting=true;
//             else
//             if (time>=data.expirateTime) {
//             //if (delta+tfDelta > Math.min(deltaAfter, data.maxDeltaAfter ?? Number.MAX_VALUE)) {
//                 //console.log("! ",{barExtrem, linePrice});
//                 deleting= true;
//                 //if (this.counter2++ <10) console.log("delete", data);
//             }
//             else {
//                 //let touched = delta-tfDelta >= -Math.min(deltaBefore, data.maxDeltaBefore ?? Number.MAX_VALUE) - deltaBeforeShift;  // -Math.min(deltaBefore, data.maxDeltaBefore)); // активация уровня
//                 let touched = time >= data.activateTime - deltaBeforeShift;
//                 //time >= lineTime - Math.min(deltaBefore, data.maxDeltaBefore ?? Number.MAX_VALUE) - deltaBeforeShift * (endTime - time >= deltaBeforeShift)
//                 if (!touched) break; // прекращаем дальнейший перебор уровней
//                 //if (touched)
//                 if (!data.touched) {
//                     activatedDatas.add(data);
//                     modified= true;
//                     data.touched= true;
//                     //if (this.counter++ <10) console.log("activate", data);
//                 }
//                 else if (time+deltaBeforeShift>=data.expirateTime) modified= true;
//             }
//             if (deleting) {
//                 //this.deleteLineData(data);
//                 if (data.touched) {
//                     activatedDatas.delete(data);
//                     modified= true;
//                 }
//                 removeIndexes.push(i);
//                 onDeleteLine?.(data.line.id, data.line as TLine);
//             }
//         }
//         for(let i=removeIndexes.length-1; i>=0; i--)
//             datas.splice(removeIndexes[i],1);
//         return modified ? "modified" : undefined;
//     }
//
//
//     _timeStamp= Date.now();
//     _ncount= [0, 0] as [number,number];
//     _ntotal= [0, 0] as [number,number]
//     _nbarscount= [0, 0] as [number,number];
//
//     private checkPriceLevels(sideData : CLineDatas, bar :CBar, k :1|-1,
//                      info: {deltaOC :number, deltaHL :number, deltaBefore :number},
//                      onDeleteLine? :(id :LineID, line :TLine)=>void
//     //) {
//     //     return this.checkPriceLevels2(sideData, bar.time, k==1 ? bar.high : bar.low, k, info, onDeleteLine);
//     // }
//     // private checkPriceLevels2(sideData : CLineDatas, time: const_Date, price: number, k :1|-1, isClosePrice :boolean,
//     //               info: {deltaOC :number, deltaHL :number, deltaBefore :number},
//     //               onDeleteLine? :(id :LineID, line :TLine)=>void
//     ) : "modified" | undefined {
//         const {deltaOC, deltaHL, deltaBefore} = info;
//         const params= this.params;
//         let minTouchCount = params.touchCount;
//         if (params.enterType==ENTER_TYPE.LIMIT) minTouchCount--;
//         const maxTouchCount= params.touchCount + params.enterCount - 1;
//
//         //const k= sideData==this.highData ? 1 : -1;
//         const barExtrem= k==1 ? bar.high : bar.low;
//         const timeVal= bar.time.valueOf();
//
//         //let activatedDatas : LineData[] = [];
//         let activatedDatas= sideData.activatedDatas;
//         let activatedModify= false;
//         let datas= sideData.datas;
//         let isSorted = true;
//         if (sideData.customPriceDeltasCount>0 || minTouchCount==0) {
//             isSorted= false;
//             // function getPriceBefore(line :LineData) { return line.price - Math.min(line.maxDeltaBefore ?? Number.MAX_VALUE, deltaBefore) * k; }
//             // datas.sort((a,b)=> (getPriceBefore(a)-getPriceBefore(b))*k);
//             datas.sorted= false;
//         }
//         else
//         if (! datas.sorted) {
//             datas.sort((a,b)=> (a.price-b.price)*k);
//             datas.sorted= true;
//             //sideData.datasSortedByDeltaBefore.sort((a,b)=> (a.price-b.price)*k)
//             //activatedModify= true;
//         }
//         let removeIndexes : number[] = [];
//         //const needPrint= (bar.time.valueOf()==Date.parse("2022-05-25 07:45") && k==-1);
//         //let signal= sideData.signal;
//         // let needPrint_= bar.time.valueOf()==Date.parse("2022-04-05 02:00") && k==1;
//         // if (needPrint_)
//         //     console.warn(deepClone([...datas]), deepClone([...activatedDatas]));
//         let n=0;
//         for(let [i,data] of datas.entries()) {
//             n++;
//             const linePrice= data.price;
//             let  deleting= false;
//             let  needPrint = false; //needPrint_ && (data.line as any).percent==-45;
//             //needPrint = (bar.time.valueOf()==Date.parse("2022-08-08 00:30") && k==-1 && i==0);
//             //needPrint= data.line.begin.x==1544886000000 && (data.line as any).percent==-39 && data.price==9752.6414;
//             //needPrint= timeVal==Date.parse("2022-02-23 14:00") && k==1;//"2022-02-22 17:00");
//             if (needPrint && i==0) console.log("start datas iteration", deepClone(datas));
//             if (timeVal < data.line.begin.x) continue;
//             if (timeVal > data.line.end.x) {
//                 deleting= true;
//                 if (needPrint) console.log("*** 1", data);
//             }
//             else
//             if ((bar.close - linePrice) * k >deltaOC) {  // пересечение ценой закрытия
//                 deleting= true;
//                 if (needPrint) console.log("*** 2", data);
//             }
//             else {
//                 const extremPrice= data.lastTouchTimeVal==timeVal ? bar.close : barExtrem;
//                 const delta= (extremPrice - linePrice) * k;
//                 if (delta > Math.min(deltaHL, data.maxDeltaAfter ?? Number.MAX_VALUE)) {  // слишком большое пересечение тенью
//                     //console.log("! ",{barExtrem, linePrice});
//                     deleting= true;
//                     if (needPrint) console.log("*** 3", data, {barExtrem, delta, deltaHL, maxDeltaAfter: data.maxDeltaAfter});
//                 }
//                 else if (data.touches>=maxTouchCount && data.touches>0) {
//                     deleting= true;
//                     if (needPrint) console.log("*** 4", data);
//                 }
//                 else
//                 {
//                     let touched= (delta >= -Math.min(deltaBefore, data.maxDeltaBefore ?? Number.MAX_VALUE)); // касание тенью
//                     if (1) ///if (data.lastCalcTimeVal != timeVal)
//                     {
//                         //if (needPrint) console.log({perc: (data.line as any).percent, linePrice, barExtrem, k, touched, delta, deltaBefore, maxDeltaBefore: data.maxDeltaBefore});
//                         if (touched) {
//                             if (timeVal != data.lastTouchTimeVal) { data.touches++;  data.lastTouchTimeVal= timeVal; }
//                             //data.lastCalcTimeVal= timeVal;
//                         }
//                         //     deleting= true;
//                         // else
//                         if (params.enterType==ENTER_TYPE.LIMIT && data.touches==maxTouchCount) {
//                             deleting= true;
//                             if (needPrint) console.log("*** 5", data);
//                         }
//                         else
//                         if (data.touches>=minTouchCount) {
//                             if (needPrint) console.log("Activate data:",data," at",bar.time);
//                             activatedDatas.add(data);
//                             activatedModify= true;
//                             // removeIndexes.push(i);
//                             // this.movingDatas.delete(data);
//                         }
//                     }
//                     if (isSorted)
//                         if (!touched && extremPrice==barExtrem && minTouchCount>0) break; // прекращаем дальнейший перебор уровней
//                 }
//             }
//             if (deleting) {
//                 //if (data.line.begin.x==1544886000000 && (data.line as any).percent==-39 && data.price==9752.6414)
//                 if (needPrint)
//                     console.log("delete",data.price,"at",bar.time.toString());
//
//                 //if (needPrint) console.log("delete");
//                 //this.deleteLineData(data);
//                 if (data.touches>=minTouchCount) {
//                     if (activatedDatas.delete(data))
//                         activatedModify= true;
//                 }
//                 removeIndexes.push(i);
//                 sideData.movingDatas.delete(data);
//                 onDeleteLine?.(data.line.id, data.line as TLine);
//                 if (data.maxDeltaBefore!=null) sideData.customPriceDeltasCount--;
//             }
//         }
//
//         // if (timeVal==Date.parse("2022-07-13"))
//         //     console.warn({k, n, datas: deepClone(datas)});
//
//         this._ntotal[k==-1 ? 0 : 1]+=datas.length;
//         let nCount= (this._ncount[k==-1 ? 0 : 1]+=n);
//         let nbarsTotal= (++this._nbarscount[k==-1 ? 0 : 1]);
//
//
//         // if (bar.time.valueOf()==Date.parse("2022-02-23 16:00"))
//         //     console.warn("!!", {k, activatedDatas: deepClone(activatedDatas)});
//         for(let i=removeIndexes.length-1; i>=0; i--)
//             sideData.datas.splice(removeIndexes[i],1);
//         return activatedModify ? "modified" : undefined;
//     }
//
//
//     onBar(bar :CBar, atr :number, callbacks? :{
//         onDeleteLine?(id :LineID, line :TLine) :void,
//         //onEnter?(signal :Signal) : void
//         // onSignal(price :number, volume :number) :SignalID,
//         // onDeleteSignal(id :SignalID) :void,
//         // onModifySignal(id :SignalID, price :number, volume :number) :void
//     }) : readonly BlockSignal[] {
//         if (0)
//         if (Date.now()-this._timeStamp > 2000) {
//             this._timeStamp= Date.now();
//             for(let i=0; i<2; i++)
//                 console.log({mode: i==0 ? "Low" : "High", total: this._ntotal[i], count: this._ncount[i], average: (this._ncount[i]/this._nbarscount[i]).toFixed(1)});
//         }
//         return this.onBarSide(bar, atr, undefined, callbacks);
//     }
//
//     refreshLastBarClose(callbacks? :{ onDeleteLine?(id :LineID, line :TLine) :void }) {
//         const bar= this._lastBar;
//         if (bar) //return this.onBar({...bar, open: bar.close, high: bar.close, low: bar.close}, this._lastATR!, callbacks);
//             return this.onBar(bar, this._lastATR!, callbacks);
//     }
//
//
//     onBarSide(bar :CBar, atr :number, side :"high"|"low"|undefined, callbacks? :{
//         onDeleteLine?(id :LineID, line :TLine) :void,
//         //onEnter?(signal :Signal) : void
//         // onSignal(price :number, volume :number) :SignalID,
//         // onDeleteSignal(id :SignalID) :void,
//         // onModifySignal(id :SignalID, price :number, volume :number) :void
//     }) : readonly BlockSignal[] {
//
//         //this.checkSignals(bar, callbacks?.onEnter);
//         this._lastBar= bar;
//         this._lastATR= atr;
//
//         if (bar.time != this.lastTime)
//             if (this.lastTime && bar.time < this.lastTime) throw "bar.time < lastTime";
//             else //if (!this.lastTime || bar.time > this.lastTime)
//                 for(let fullData of [this.highData, this.lowData])
//                     if (fullData.movingDatas.size>0) {
//                         for(let data of fullData.movingDatas) {
//                             let line= data.line;
//                             data.price= line.begin.y + (line.end.y - line.begin.y) / (line.end.x - line.begin.x) * (bar.time.valueOf() - line.begin.x);
//                         }
//                         fullData.datas.sorted= false;
//                     }
//         // if (this.lastTime && bar.time > this.lastTime)
//         //     this.tf_msec= Math.min(this.tf_msec ?? Number.MAX_VALUE, bar.time.valueOf()-this.lastTime.valueOf());
//
//         this.lastTime= bar.time;
//
//         // for(let [datas,k] of [[this.highData.datas, 1], [this.lowData.datas, -1]] as const)
//         //     if (! datas.sorted) { datas.sort((a,b)=> (a.price-b.price)*k);  datas.sorted= true; }
//
//         const params= this.params;
//
//         //let signals : Signal[] = []
//
//         const deltaOC = params.deltaOC_ATRPerc/100 * atr; //params.enterType==ENTER_TYPE.BARCLOSE ? params.deltaOC_ATRPerc/100 * atr : 0;
//         const deltaHL = params.deltaHL_ATRPerc/100 * atr;
//         const deltaBefore = params.deltaBefore_ATRPerc/100 * atr;
//         //const oldHighSignal= this.highData.signal;
//         //const oldLowSignal= this.lowData.signal;
//
//         // const oldLowDatas= [...this.lowData.datas];
//         // const oldLowActDatas= [...this.lowData.activatedDatas];
//
//
//         for(let sideData of [this.highData, this.lowData]) {
//
//             const k= sideData==this.highData ? 1 : -1;
//             if ((k==1 && side=="high") || (k==-1 && side=="low")) continue;
//             const barExtrem= k==1 ? bar.high : bar.low;
//
//             // проверяем ценовые уровни
//
//             const priceLevelsResult= this.checkPriceLevels(sideData, bar, k, {deltaOC, deltaHL, deltaBefore}, callbacks?.onDeleteLine);
//             const isPriceLevelsModified= priceLevelsResult=="modified";
//
//             // проверяем временные уровни
//
//             const timeLevelsResult = this.checkTimeLevels(sideData, bar.time.valueOf(), callbacks?.onDeleteLine);
//             const isTimeLevelsModified= timeLevelsResult=="modified";
//
//             if (! isTimeLevelsModified && ! isPriceLevelsModified && deltaBefore==0) continue; //console.log(2);
//
//             // if (bar.time.valueOf()==Date.parse("2022-02-23 16:00"))
//             //     console.warn(side, k, deepClone(sideData));
//
//             //if (k==1) console.log(activatedModify, activatedDatas.size,":",activatedDatas);
//             //console.log(1);
//             //if (activatedDatas.length==0) continue;
//             const timeGroupFull= [...sideData.activatedTimeDatas.values()];
//             const timeGroupFull_weight= timeGroupFull.reduce((sum, data)=>sum+data.weight, 0);
//             //const timeLevelCount= timeGroup.length;
//             let _a : TimeLineData[], _b :number;
//             const timeGroupLimit = ()=> _a ??= timeGroupFull.filter(item => item.expirateTime - bar.time.valueOf() >=this.tf_msec);
//             const timeGroupLimit_weight = ()=> _b ??= timeGroupLimit().reduce((sum, data)=>sum+data.weight, 0);
//             //const timeLevelCount2= timeGroup2.length;
//
//
//             // if (bar.time.valueOf()==Date.parse("2022-04-05 02:00") && k==1)
//             //     console.warn("!!! ",[...activatedDatas], [...sideData.activatedTimeDatas]);
//
//             //if (! activatedModify && deltaBefore==0) continue; //console.log(2);
//             // const setSignalData= (data :LineData|undefined)=>{
//             //     if (datas==this.highDatas) this.highSignalData= data; else this.lowSignalData= data;
//             // }
//             //sideData.signal = undefined;
//             sideData.signals = [];
//
//             //const priceActivatedDatas= sideData.activatedDatas;
//
//             //if (priceActivatedDatas.size==0) continue;  //console.log(3);
//
//             //const activatedDatasSorted= [...activatedDatas.values()].sort((a,b)=>(a.price - b.price)*k);
//             const activatedDatasSortedPairs= [...sideData.activatedDatas.values()].map(
//                 data=>[data.price - Math.min(deltaBefore, data.maxDeltaBefore ?? Number.MAX_VALUE)*k, data] as const
//             ).sort((a,b) => (a[0] - b[0]) * k);
//             //const delta= deltaBefore + deltaHL;
//             // if (params.enterType!=ENTER_TYPE.LIMIT) {
//             //     activatedDatasSortedPairs.splice(BSearch(activatedDatasSortedPairs, (el)=>(el[0] - barExtrem)*k)+1);
//             //let print= bar.time.valueOf()==Date.parse("2022-07-15 02:00") && k==-1;
//             //if (print) console.log(deepClone(activatedDatasSortedPairs));
//             let valCount=0;
//             const debugFlag= bar.time.valueOf()==Date.parse("2022-08-08 00:30");
//
//             const validate = (data : {priceGroup :readonly LineData[], timeGroup :readonly TimeLineData[], priceWeight :number, timeWeight :number})=>{
//                 //let p= print && (valCount++)<5;
//                 //if (p) console.log({valCount, priceGroup: data.priceGroup})
//                 const {priceGroup, timeGroup, priceWeight, timeWeight} = data;
//                 if (priceGroup.length + timeGroup.length < params.levelCount) return false;
//                 if (priceWeight + timeWeight < params.levelSumWeight) return false;
//                 if (debugFlag) console.warn(1, data);
//                 //if (this.groupValidators.size >0) {
//                 if (1) {
//                     let groupsMap= new MapExt<OwnerID, ILineExt<TLine>[]>();
//                     let hasEmptyGroup= false;
//                     for(let level of [...priceGroup??[], ...timeGroup]) //priceLines.concat(timeLines))
//                         if (level.ownerID!=null) groupsMap.getOrSet(level.ownerID, []).push(level.line as ILineExt<TLine>);
//                         else hasEmptyGroup= true;
//                     for(let [ownerID, lines] of groupsMap) {
//                         // if (bar.time.valueOf()==Date.parse("2022-07-15"))
//                         //     console.log("Validate:",{priceGroup, timeGroup, lines, result: this.groupValidators.get(ownerID)!(lines)} );
//                         const validator= this.groupValidators.get(ownerID);
//                         if (validator)
//                             if (! validator(lines))
//                                 return false;
//                     }
//                     let groupCount= groupsMap.size + (hasEmptyGroup ? 1 :0);
//                     if (debugFlag) console.warn(2, {groupCount, owners: this.ownerIDs});
//                     if (groupCount < this.ownerIDs.size) return false;
//                     // if (bar.time.valueOf()==Date.parse("2021-05-06 23:00"))
//                     //     console.log(bar.time.toString(), {groupsMap, hasEmptyGroup, idsSize: this.ownerIDs.size});
//                 }
//                 if (debugFlag) console.warn("ok");
//                 return true;
//             }
//
//             const validateForPrice = (priceGroup :readonly LineData[], activatePrice :number, priceWeight :number)=>{
//                 let timeGroup= timeGroupFull;
//                 let timeWeight= timeGroupFull_weight;
//                 if (params.enterType==ENTER_TYPE.LIMIT) {
//                     let isLimit= priceGroup.length>0 && (activatePrice - bar.close)*k >0;
//                     if (isLimit) {
//                         timeGroup = timeGroupLimit();
//                         timeWeight= timeGroupLimit_weight();
//                     }
//                 }
//                 return validate({priceGroup, timeGroup, priceWeight, timeWeight}) ? {timeGroup :timeGroup} : undefined;
//             }
//
//             function* getGroupDatas() {
//                 //let firstLevelDeltaHL = 0;
//                 let iFirstLevel=0;
//                 //let firstLevel= activatedDatasSortedPairs[0][0]; //[1].price;
//                 //let sumLevels= 0;
//                 let sumWeight= 0;
//                 let group : LineData[] = [];
//                 let endGroupPrice= k==1 ? Number.MAX_VALUE : Number.MIN_VALUE;
//                 //for(let data of activatedDatasSorted) {
//                 if (activatedDatasSortedPairs.length>0)
//                     for(let i=0; i<=activatedDatasSortedPairs.length; i++) {
//                         //const lineDelta= firstLevelDeltaHL + Math.min(data.maxDeltaBefore, deltaBefore);
//                         const activatePrice= activatedDatasSortedPairs[i]?.[0] ?? (k==1 ? Number.MAX_VALUE : Number.MIN_VALUE);
//
//                         if (i>0 && activatePrice != activatedDatasSortedPairs[i-1][0]) {
//                             let finish= false;
//                             let groupFinish= params.enterType==ENTER_TYPE.LIMIT || i==activatedDatasSortedPairs.length;
//                             if (!groupFinish && (activatePrice - barExtrem) *k >0) {  // params.enterType != ENTER_TYPE.LIMIT
//                                 groupFinish= true;
//                                 finish= true; //i= activatedDatasSortedPairs.length;
//                             }
//                             if (groupFinish) {
//                                 let lastActivatePrice= activatedDatasSortedPairs[i-1][0];
//                                 const res= validateForPrice(group, lastActivatePrice, sumWeight);
//                                 if (res) {
//                                     yield [group, lastActivatePrice, res.timeGroup] as const; //[activatedDatasSorted[i-1], i];
//                                     endGroupPrice= lastActivatePrice;
//                                 }
//                             }
//                             if (finish) break;
//                         }//
//                         if (i==activatedDatasSortedPairs.length) break;
//
//                         //activatedDatas.add(data);
//                         if ((activatePrice - endGroupPrice) * k > 0) //firstLevelDeltaHL) {
//                         {
//                             sumWeight= 0;
//                             //sumLevels= 0;
//                             iFirstLevel++;
//                             //data= activatedDatasSortedPairs[iFirstLevel][1];
//                             //firstLevel= data.price;
//                             //firstLevelDeltaHL= Math.min(data.maxDeltaHL, deltaHL);
//                             i= iFirstLevel;
//                             group = [];
//                             endGroupPrice= k==1 ? Number.MAX_VALUE : Number.MIN_VALUE;
//                             if (i==activatedDatasSortedPairs.length) break;
//                         }
//                         let data= activatedDatasSortedPairs[i][1];
//                         //sumLevels++;
//                         sumWeight += data.weight;
//                         const levelEndPrice = data.price + Math.min(deltaHL, data.maxDeltaAfter) * k;
//                         if (params.enterType != ENTER_TYPE.LIMIT && (levelEndPrice - barExtrem) * k<0) continue;
//                         if ((levelEndPrice - endGroupPrice) * k < 0)
//                             endGroupPrice= levelEndPrice;
//                         group.push(data);
//                         // if (bar.time.valueOf()==Date.parse("2022-02-23 13:00") && k==1)
//                         //     console.log("#"+i, {activatePrice, levelEndPrice, endGroupPrice, data});
//
//                         // if (i<activatedDatasSortedPairs.length-1 && activatedDatasSortedPairs[i+1][0]==activatePrice)
//                         //     continue;
//                         //
//                         // let groupFinish= params.enterType==ENTER_TYPE.LIMIT || i==activatedDatasSortedPairs.length-1;
//                         // if (!groupFinish && (activatedDatasSortedPairs[i+1][0] - barExtrem) *k >0) {  // params.enterType != ENTER_TYPE.LIMIT
//                         //     groupFinish= true;
//                         //     i= activatedDatasSortedPairs.length;
//                         // }
//                         // if (groupFinish) {
//                         //     const res= validateForPrice(group, activatePrice, sumWeight);
//                         //     if (res)
//                         //         return [group, activatePrice, res.timeGroup] as const; //[activatedDatasSorted[i-1], i];
//                         // }
//                     }
//                 yield [undefined, undefined] as const;  // последний элемент для проверки только временных уровней
//             }
//
//             //if (bar.time.valueOf()==Date.parse("2022-07-15")) console.log("!!!",[...getGroupDatas()]);
//
//             let hasMarketOrder= false;
//
//             for(let [priceGroup, activatePrice, timeGroup= timeGroupFull] of getGroupDatas()) {
//                 //console.log(resultLevelData!=null);
//
//                 // if (bar.time.valueOf()==Date.parse("2022-07-10 13:00") && k==1)
//                 //     console.log("priceGroup:",structuredClone(priceGroup), "timeGroup:",structuredClone(timeGroup));
//
//                 // если нет пробития ценовых уровней и достаточно временных уровней, то открываем сделку по текущей цене
//                 if (! priceGroup || activatePrice==undefined) {
//                     if (hasMarketOrder) continue;
//                     if (params.enterType==ENTER_TYPE.LIMIT) continue;
//                     priceGroup= [];
//                     activatePrice= bar.close;  hasMarketOrder=true;
//                     if (! validate({priceGroup, timeGroup:timeGroupFull, priceWeight: 0, timeWeight: timeGroupFull_weight}))
//                         continue;
//                 }
//                 if (params.enterType==ENTER_TYPE.BARCLOSE || params.enterType==ENTER_TYPE.BARBREAK)
//                     if ((barExtrem - activatePrice)*k >= 0) {
//                         activatePrice= bar.close;
//                         hasMarketOrder= true;
//                     }
//                     else continue;
//
//                 const priceLines= priceGroup.map(data=>data.line);
//                 const timeLines= timeGroup.map(data=>data.line);
//
//                 const signalType= params.enterType==ENTER_TYPE.BARBREAK ? "stop" : "limit";
//                 //if (timeLines.length >0 && this.counter++<20) console.log("timeLines:",timeLines);
//                 //const groupLines= priceLines.concat(timeLines);
//                 const newSignal : BlockSignal = {price: activatePrice, volume: -k, type: signalType, groupPriceLines: priceLines, groupTimeLines: timeLines};
//                 //const newSignal : SignalExt = {price: activatePrice, volume: -k, groupLines)};
//                 //signals.push(newSignal);
//                 //sideData.signal= newSignal;
//                 sideData.signals.push(newSignal);
//                 // if (resultLevel==bar.close) callbacks?.onEnter?.(newSignal);
//                 // else sideData.signal= newSignal; //setSignal(newSignal);
//                 //else
//                 //callbacks.onSignal(resultLevel, -k);
//             }
//         }
//         //let signals= this.#signals;
//         //let signals= [this.highData.signal, this.lowData.signal].filter(signal=>signal!=null) as readonly SignalExt[];
//         let signals= [...this.highData.signals, ...this.lowData.signals] as const;
//         let ownerID= this.ownerIDs.size==1 ? [...this.ownerIDs.keys()][0] : undefined;
//         signals= signals.map(signal => newSignal( signal?.type!="stop" ? signal : {...signal, price: signal.volume>0 ? bar.high+(1e-10) : bar.low-(1e-10)}, ownerID ));
//         /*
//         let [highSignal, lowSignal] = [this.highData.signal, this.lowData.signal];
//         if (highSignal?.price != oldHighSignal?.price || lowSignal?.price != oldLowSignal?.price
//             || ! shallowEqual(highSignal?.groupLines, oldHighSignal?.groupLines) || ! shallowEqual(lowSignal?.groupLines, oldLowSignal?.groupLines)
//         )*/
//         signals = this.#signals = Object.freeze(signals);
//
//         // if (bar.time.valueOf()==Date.parse("2022-02-23 16:00"))
//         //     console.warn(side, signals);
//
//         // if (bar.time.valueOf()>=Date.parse("2022-05-25 07:45") && bar.time.valueOf()<=Date.parse("2022-05-25 08:45"))
//         //     console.log(bar.time, "signals:", this.lowData.signal,
//         //         "oldDatas:",oldLowDatas, "lowDatas:",[...this.lowData.datas],
//         //         "oldActdatas",oldLowActDatas, "actDatas:",[...this.lowData.activatedDatas.values()]
//         //     );
//         return signals;
//     }
//
//     private counter= 0;
//     private counter2= 0;
// }
//
//
//
// function test() {
//
//     let block= new CSignalBlock<ILineSimple>({
//         ...GetSimpleParams(new CSignalBlockParams()),
//         //enterType: ENTER_TYPE.LIMIT,
//         enterType: ENTER_TYPE.BARCLOSE,
//         enterCount: 2,
//         prevTouchCount: 1,
//         levelCount: 2
//     }, TF.M1);
//
//     let id1= block.addLine({begin: {x: 10, y: 20}, end: {x: 100, y: 20}}, true, 1);
//     let id2= block.addLine({begin: {x: 10, y: 21}, end: {x: 100, y: 21}}, true, 1);
//
//     let bars : CBar[]= [
//         new CBar(new Date(15), 5, 6, 4, 5.5),
//         new CBar(new Date(16), 5, 20.5, 4, 5.5),
//         new CBar(new Date(17), 5, 20.3, 4, 6),
//
//         new CBar(new Date(18), 5, 20.5, 4, 6),
//     ];
//
//     for(let bar of bars) {
//         let signals = block.onBar(bar, 6, {
//             onDeleteLine :(id, line)=>console.log("delete",id),
//             //onEnter :(signal)=>console.log("bar ",bar,"-> enter:",signal)
//         });
//         console.log("signals:",signals);
//     }
// }
//
// //test();
//
// // let arr= [1,2,3,4,5];
// // for(let [i,item] of arr.entries()) {
// //     if (item==5) arr.splice(i,2);
// //     console.log(item);
// // }
//
//
//
// // class CMultiTouchLine {
// //     line :ILine;
// //     price :number;
// //     lastBarClose? :number;
// //     onBar(bar :CBar, callbacks : { onShadowCross() :void, onOpenCross?() :void, onCloseCross?() :void} ) {
// //         let highB= Math.max(bar.open, bar.close); //верх тела свечи
// //         let lowB= Math.min(bar.open, bar.close); //низ тела свечи
// //         if (this.lastBarClose!=null) {
// //             highB= Math.max(highB, this.lastBarClose);
// //             lowB= Math.min(highB, this.lastBarClose);
// //         }
// //         this.lastBarClose= bar.close;
// //         //if (n<=line.startBar+1) continue;
// //         let linePrice= this.price;
// //
// //         // Внутри теней бара
// //         if (linePrice <= bar.high && linePrice >= bar.low) {
// //             callbacks.onShadowCross();
// //         }
// //
// //         // Внутри тела бара - удаляем линию
// //         if (linePrice <= highB && linePrice >= lowB) {
// //             //callbacks.onBodyCross?.();
// //             if (callbacks.onCloseCross)
// //                 if (Math.sign(linePrice - bar.close) != Math.sign(linePrice - (this.lastBarClose ?? bar.open)))
// //                     callbacks.onCloseCross();
// //         }
// //     }
// // }
//
// // function getLineStatus(linePrice :number, bar :CBar) {
// //     let price0=
// // }
//
