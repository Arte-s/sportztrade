import React from 'react';
import {CreateDom} from "../graph sist/CCreateDom";
import {divCreatEasy} from './common/creatDiv';
import {createRoot} from "react-dom/client";
import {GeneralReact} from "./generalReact";
import {CRobotLimits, CRobotMarket} from "../sistem/robot/CRobot";
import {iApiExchange, iPosition, Position, tSpecTicks} from "../sistem/base/Position"
import {tInfo} from "../sistem/base/Execution";
import * as api from "../graph sist/API";
import {canvasStyle2D} from "./styleCanvas/styleCanvas";
import {ControlDisplayCanvas2D, IControlDisplayCanvas2D} from "./Elements/controlDisplayCanvas2D";
import {CApiClient, tExchangeApi} from "./CApiClient";
import {ExchangeApi, HistoryApi, RobotInit} from "./ServerInit";
import {BHistory} from "../graph sist/and/static";
import {
    CRBaseMapAll2,
    LoadQuoteBase,
    SymbolsLoading, tCallbackSocketAll, TF,
    tGetAllData,
    tInfoForLoadHistory, tLoad, tLoadHistory,
    tSetHistoryData, tSocketInput, tSymbolLoadInfo
} from "../graph sist/API";
import {tOnTicksRec} from "../sistem/base/priceReceiver";
import { tListEvent } from '../commons/commons';

CreateDom.document = document


const forRefresh : {refresh:(()=>void)|undefined}  = {refresh:()=>{}}
export const mouse=api.CreatMouseApi();
export const canvasAPI= api.CreatCanvasAPI({forRefresh, style:canvasStyle2D});
export const canvasAPI3D= api.CreatCanvasAPI({forRefresh});
export const canvasV2 = new ControlDisplayCanvas2D({canvasApi:canvasAPI, session: api.GetSessionClass()}) as IControlDisplayCanvas2D


export const ApiClient: CApiClient = new CApiClient({api: ExchangeApi, userId: 100, historyApi: HistoryApi})

api.SymbolsLoading.RunInit = async (boxH: CRBaseMapAll2) => {
    console.log("!!!!2")
    const tt =boxH.add("test")
        .setSetting({
            async allInit() {
                const symbols = (await ApiClient.getSymbols())
                const result: tGetAllData = {
                    symbols: symbols.map((e)=>({
                        name: e,
                        volume24: undefined,
                        quoteAsset: "t",
                        baseAsset: e,
                        tickSize: undefined,
                        stepSize: undefined
                    }))}// as tGetAllData
                return result
            },
            loadHistory : ((data?: { fetch?: any }) =>  LoadQuoteBase({
                base: 'none',//'https://api.mexc.com/api/v3/klines?', // 'https://fapi.binance.com/fapi/v1/klines?symbol='
                maxLoadBars2: 1000,
                countConnect: 100,
                maxLoadBars: 1000,
                time: 60000,
                funcLoad: async ({symbol,interval,startTime,endTime,limit,baseURL,fetch}): Promise<tSetHistoryData[]> => {
                    console.log("запрос истории", {symbol,interval,startTime,endTime,limit,baseURL,fetch})
                    const bars = await ApiClient.getHistory({tf: TF.get(interval)!, limit, end:endTime, start: startTime, symbol}, )
                    console.log("111",{bars});
                    const result: tSetHistoryData[] = [...bars.bars]
                    return result
                    // const _interval =   `&interval=${interval}`
                    // const _startTime =  `&startTime=${startTime.valueOf()}`
                    // const _endTime =    endTime?`&endTime=${endTime.valueOf()}`:``
                    // const _limit =      endTime?`&limit=${limit}`:``
                    // const url =         baseURL +`symbol=${symbol}` + _interval + _startTime + _endTime + _limit
                    // const data = (await (await fetch(url)).json());
                    // return data?.map((m: any):tSetHistoryData => ({
                    //     time: new Date(+m[0]),
                    //     open:   +m[1],
                    //     high:   +m[2],
                    //     low:    +m[3],
                    //     close:  +m[4],
                    //     volume: +m[5],
                    //     tickVolume: +m[8]
                    // }))
                },
                funcFistTime: async (e) => new Date('2022')
                ,
                intervalToName:  [
                    {time: TF.M1, name: TF.M1.name}
                    , {time: TF.M3,     name: TF.M3.name}
                    , {time: TF.M5,     name: TF.M5.name}
                    , {time: TF.M15,    name: TF.M15.name}
                    , {time: TF.M30,    name: TF.M30.name}
                    , {time: TF.H1,     name: TF.H1.name}
                    , {time: TF.H2,     name: TF.H2.name}
                    , {time: TF.H4,     name: TF.H4.name}
                    , {time: TF.H6,     name: TF.H6.name}
                    , {time: TF.H8,     name: TF.H8.name}
                    , {time: TF.H12,    name: TF.H12.name}
                    , {time: TF.D1,     name: TF.D1.name}
                    , {time: TF.W1,     name: TF.W1.name}
                ]
            }, data) )(),
            socketAll (callback: tCallbackSocketAll, disable: () => boolean, statusOff: () => void)  {
                // const socket :WebSocket = data.WebSocket? new data.WebSocket(url): new WebSocket(url);
                // socket.onerror= (e)=>console.error('WebSocket Error: ' , e,' ');
                // socket.onopen = (e)=>{ }
                // socket.onclose= (e)=>{onclose();};
                const cc: tListEvent<any, tSpecTicks> ={
                    func:()=>({
                        onTicks:(data: tOnTicksRec) => {
                            callback([{
                                name: data.symbol,
                                data: {
                                    ticks: [{time: data.time, volume:0 ,price: data.bid}]
                                }
                            }])
                        }
                    })
                }
                ApiClient.setEventTicks(cc)
            }
        })
    tt.RunSocketAll()
    const start = (await tt.allInit())?.getFistSymbol().getSymbolDate();

    if (start) {
        console.log({start});
        api.SymbolsLoading.myInfoInit = start
        api.SymbolsLoading.myEvents.forEach(e => e?.(start))
        api.SymbolsLoading.myEvents.length = 0
    }
    else throw "не удалось получилось установить символ по умолчанию"
}



// BHistory = туц  api.CRBaseMapAll2

export async function StartCanvasProject() {
    const divCanvas = divCreatEasy(document.body,'div','container');
    console.log("1")
    await api.SymbolsLoading.RunInit(BHistory);
    await api.SymbolsLoading.ready()
    console.log("2")
    GeneralInit(divCanvas)
    console.log("3")
    HistoryApi.getSymbols().then(e=>{
        RobotInit(ExchangeApi)
    })
}

function GeneralInit(pare:HTMLElement){
    const root = createRoot(pare!); // createRoot(container!) if you use TypeScript
    root.render(<GeneralReact key={-1}/>)
}


function IntervalLogs() {
    if (1)
     setTimeout(() => {
         // mouse.logsEvent()
         console.log({box:api?.GetSessionClass()?.boxArray?.box, mouseBox:mouse.active?.GetSystemBox()});
         // mouse.active.
         IntervalLogs()
    }, 5000 )
    if (0)
        setTimeout(() => {
            IntervalLogs()
        }, 5000 )
}


IntervalLogs();
