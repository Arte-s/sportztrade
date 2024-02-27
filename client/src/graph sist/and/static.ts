
import {TF} from "../Nav/Time";
import {
    CRBaseMapAll2,
    tInfoInit,
    tInfoInit2, tInfoInit3
} from "./history/historyBase";
import {CSessionAll, ISessionAll} from "./Session";
import {CSystemBoxArray} from "./sytemBox";
import {CJournal2} from "./СJournal";
import {SymbolsLoading} from "../history/history demo";
//ds

// let statusInit=false;
// const myEvents:(()=>void)[]=[];
//
//
// export function HistoryEventByInit(event:()=>void) {
//     if (statusInit) event();
//     else myEvents.push(event);
// }
//
// export function GetHistoryEventByInit() {
//     statusInit=true;
//     return myEvents;
// }
//
// SymbolsLoading.ready().then(()=>{
//     const a=GetHistoryEventByInit();
//     for (let aElement of a) {
//         aElement();
//     }
//     a.length=0;
// })

//export var BHistory=new CRBaseMapAll2();
export var BHistory = new CRBaseMapAll2("new");

export var TFDefault = TF.M15;
export var SymbolDefault:tInfoInit = {
    tf:TF.M15,
    symbol:"BTCUSDT",
    address:["Binance Spot","BTCUSDT"],
    /*
    symbol:"sym0",
    address:["test","sym0"],
    */
    history:undefined,
    link:undefined,
    //ссылка на архив истории, в том числе и эмулированной
    baseHistory: BHistory
}

// SymbolsLoading.Init(BHistory);

//export var BoxArray = new CSystemBoxArray()
export var Sessions: ISessionAll = new CSessionAll("sessions");
export var Journal2 = new CJournal2();

