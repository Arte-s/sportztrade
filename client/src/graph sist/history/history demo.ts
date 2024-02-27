

import {
    tInfoForLoadHistory,
    tSetBars, tSetHistory,
    tSetHistoryD,
    tSetHistoryData,
    tSetTicks,
    tSocketInput, tSymbolInfo, tSymbolLoadInfo, tUpDateAllKline
} from "../and/interface/IHistoryBase";
import {TF} from "../Nav/Time";
import {tTick} from "../and/interface/mini";
import {CRBaseMapAll2, tInfoInit} from "../and/history/historyBase";
//import {CheckTableCH} from "../../../serverHistory/src/shared/services/base";
import {HistoryLoadDB} from "./historyDB";
import {sleepAsync} from "../Nav/Common";
// import { loadUSA } from "./historyUSA";
// export type tExchange  = "Binance" | "MSTrade F" | "MSTrade Coin-M" | "MSTrade" | "Binance ++"
//График, который открывается в новом окне по умолчанию.... также различные действия
async function _defaultInitFGraph(BoxHistory:CRBaseMapAll2|CRBaseMapAll2): Promise<tInfoInit|undefined>{
    try {
        return (await BoxHistory.add("Binance Spot"  ).allInit())?.getFistSymbol().getSymbolDate();
    }
    catch (e) {
        try {return (await BoxHistory.add("MSTrade" ).allInit())?.getFistSymbol().getSymbolDate();}
        catch (e) {
            console.error("не удалось подключиться ни к Binance ни к MSTrade ",e);
        }
    }
}



export class SymbolsLoading {
    static readonly myEvents:((a:tInfoInit)=>void)[]=[];
    static myInfoInit : tInfoInit|undefined = undefined;
    //вернет ключ адрес для символа по умолчанию
    static async ready(){
        if (SymbolsLoading.myInfoInit) {return SymbolsLoading.myInfoInit}
        return new Promise<tInfoInit>((resolve, reject)=>{
            SymbolsLoading.myEvents.push((a:tInfoInit)=>{resolve(a)})
        })

    }
    static async RunInit(boxH: CRBaseMapAll2){
        await LoadHistorySettingA(boxH)
        // возвращает внутренний адрес символа по умолчанию (не загружая бары)
        const address = await _defaultInitFGraph(boxH)
        if (address) {
            SymbolsLoading.myInfoInit = address
            SymbolsLoading.myEvents.forEach(e => e?.(address))
            SymbolsLoading.myEvents.length = 0
        }
        else throw "не удалось получилось установить символ по умолчанию"
    }
}


// Возможна гибкая настройка, т.е. можно установить инициализацию типо рынков сперва, потом по каждому установить свою функцию получения символов.... ил их видов, и только потом сиволов
export async function LoadHistorySettingA(BoxHistory:CRBaseMapAll2){
    const run: Promise<any>[] =[]





    // const sMSTradeA=BoxHistory.add("MSTrade")
    //     .setSetting({loadHistory:MSLoadBEasy, socket:MSSocket, allInit:MSSymbolsAllEasyObj});
    // run.push(sMSTradeA.allInit());
    //
    // const sOld=BoxHistory.add("Old Sym")
    //     .setSetting({loadHistory:MSLoadBEasy, socket:MSSocket, allInit: async ()=>({symbols: ["BTCUSD","ETHUSD","ltcusd","xrpusd"].map( a => ({name: a}))})
    //     });
    // run.push(sOld.allInit());

    const sBinance=BoxHistory.add("Binance Spot")
        .setSetting({
            loadHistory: BinanceLoadEasySpot(),
            // socket:BinanceSocketSpot ,
            upDateAllKline: BinanceSocketKlineSpotAll(),
            socketAll: BinanceSocketSpotAll(), //включает подкачку всех символов
            allInit: BinanceSymbolsAllObjNew()});  //BinanceSymbolsAllObj

    run.push(sBinance.allInit().then(
        ()=>{
            sBinance.RunSocketAll()
            sBinance.RunUpdateKlineAll()
        }
    ));


    const sBinanceF=BoxHistory.add("Binance Futures")
        .setSetting({
            loadHistory: BinanceLoadEasyFutures(),
            // socket: BinanceSocketFutures,
            upDateAllKline: BinanceSocketKlineFAll(),
            socketAll: BinanceSocketFuturesAll(),
            allInit: BinanceSymbolsAllFuturesObj2()});

    run.push(sBinanceF.allInit().then(
        ()=>{
            sBinanceF.RunSocketAll()
            sBinanceF.RunUpdateKlineAll()
        }
    ));

    const sBinanceCoinM=BoxHistory.add("Binance Coin-M")
        .setSetting({
            loadHistory: BinanceLoadEasyFuturesM(),
            upDateAllKline: BinanceSocketKlineDAll(),
            // socket: BinanceSocketFutures,
            socketAll: BinanceSocketDCoinMAll(),
            allInit: BinanceSymbolsAllFuturesCoinM()});

    run.push(sBinanceCoinM.allInit().then(
        ()=>{
            sBinanceCoinM.RunSocketAll()
            sBinanceCoinM.RunUpdateKlineAll()
        }
    ));

    const sBinanceFast=BoxHistory.add("Binance ++")
        .setSetting({
            loadHistory: BinanceLoadEasySpot(),
            // @ts-ignore
            upDateAllKline: BinanceSocketKlineSpotAll(),
            // socket:BinanceSocketRealTimeSpot(),
            socketAll: BinanceSocketSpotAllTurbo(), //включает подкачку всех символов
            allInit: BinanceSymbolsAllObjUSDT()});
     run.push(sBinanceFast.allInit());

    const sBinanceMargin=BoxHistory.add("Binance Margin")
        .setSetting({
            loadHistory: BinanceLoadEasySpot(),
            // socket:BinanceSocketSpot ,
            upDateAllKline: BinanceSocketKlineSpotAll(),
            socketAll: BinanceSocketSpotAll(), //включает подкачку всех символов
            allInit: BinanceSymbolsAllObjNewMargin()});  //BinanceSymbolsAllObj
    run.push(sBinanceMargin.allInit().then(
        ()=>{
            sBinanceMargin.RunSocketAll()
            sBinanceMargin.RunUpdateKlineAll()
        }
    ));
    const sBinanceMarginPlus=BoxHistory.add("Binance Margin Plus")
        .setSetting({
            loadHistory: BinanceLoadEasySpot(),
            // socket:BinanceSocketSpot ,
            upDateAllKline: BinanceSocketKlineSpotAll(),
            socketAll: BinanceSocketSpotAll(), //включает подкачку всех символов
            allInit: BinanceSymbolsAllObjNewMarginPlus({quoteAsset:"USDT"})});  //BinanceSymbolsAllObj
    run.push(sBinanceMarginPlus.allInit().then(
        ()=>{
            sBinanceMarginPlus.RunSocketAll()
            sBinanceMarginPlus.RunUpdateKlineAll()
        }
    ));
    const sBinanceMarginPlus2=BoxHistory.add("Binance Margin Isolated")
        .setSetting({
            loadHistory: BinanceLoadEasySpot(),
            // socket:BinanceSocketSpot ,
            upDateAllKline: BinanceSocketKlineSpotAll(),
            socketAll: BinanceSocketSpotAll(), //включает подкачку всех символов
            allInit: BinanceSymbolsAllObjNewMarginIsolated({quoteAsset:"USDT"})});  //BinanceSymbolsAllObj
    run.push(sBinanceMarginPlus2.allInit().then(
        ()=>{
            sBinanceMarginPlus2.RunSocketAll()
            sBinanceMarginPlus2.RunUpdateKlineAll()
        }
    ));

    const sGateMargin=BoxHistory.add("Gate.io Margin")
        .setSetting({
            loadHistory: GateIoLoadEasySpot(),
            // socket:BinanceSocketSpot ,
            // upDateAllKline: BinanceSocketKlineSpotAll(),
            // socketAll: BinanceSocketSpotAll(), //включает подкачку всех символов
            allInit: GateIoSymbolsAllObjNewMarginIsolated({quoteAsset:"USDT"})});  //BinanceSymbolsAllObj
    run.push(sGateMargin.allInit().then(
        ()=>{
            sGateMargin.RunSocketAll()
            sGateMargin.RunUpdateKlineAll()
        }
    ));


    const sMexcMargin=BoxHistory.add("Mexc Margin")
        .setSetting({
            loadHistory: MexcLoadEasyFuturesM(),
            // socket:BinanceSocketSpot , MexcLoadEasyFuturesM
            // upDateAllKline: BinanceSocketKlineSpotAll(),
            // socketAll: BinanceSocketSpotAll(), //включает подкачку всех символов
            allInit: MexcSymbolsAllObjNewMarginIsolated({quoteAsset:"USDT"})});  //BinanceSymbolsAllObj
    run.push(sMexcMargin.allInit().then(
        ()=>{
            sMexcMargin.RunSocketAll()
            sMexcMargin.RunUpdateKlineAll()
        }
    ));

    const sMUSA=BoxHistory.add("USA")
        .setSetting({
            loadHistory: USALoadEasyFuturesM(),
            //    socket:BinanceSocketSpot , MexcLoadEasyFuturesM
            // upDateAllKline: BinanceSocketKlineSpotAll(),
            // socketAll: BinanceSocketSpotAll(), //включает подкачку всех символов loadUSA
            allInit: SymbolsdUSASymbolsAllObjNewMarginIsolated({})
            /*
                    return {
                        name:m.symbol,
                        tickSize:m.filters?.[0]?.tickSize,
                        minPrice:m.filters?.[1]?.tickSize,
                        minStepLot:m.filters?.[0]?.tickSize, //minQty stepSize
                        minQty:m.filters?.[2]?.minQty,
                        stepSize:m.stepSize?.[2]?.minQty,
                        quoteAsset: m.quoteAsset,
                        baseAsset: m.baseAsset
                    }})*/
        }
        );  //BinanceSymbolsAllObj
    run.push(sMUSA.allInit().then(
        ()=>{
            // sMUSA.RunSocketAll()
            // sMUSA.RunUpdateKlineAll()
        }
    ));


    //run.push(sBinanceFast.allInit().then(()=>{sBinanceFast.RunSocketAll()}));
    //
    // const DB=BoxHistory.add("DB")
    //     .setSetting({loadHistory:HistoryLoadDB, socket:BinanceSocketRealTimeSpot(), allInit:BinanceSymbolsAllObjUSDT()});
    // run.push(DB.allInit());

    await Promise.allSettled(run)
    // console.log("sMUSA",sMUSA.values());
}





//список инструментов

type  tFetch = ((input: RequestInfo | URL, init?: RequestInit | undefined) => Promise<Response>)|any
// обертка функции для работы на nodejs
type tBinanceSymbolsAllObjs = {
    fetch?: tFetch,
    quoteAsset?: string
}
// const post='https://fapi.binance.com/fapi/v1/exchangeInfo';
export function BinanceSymbolsAllObjNew(data?: tBinanceSymbolsAllObjs) {
    return async function () {
        const post='https://api1.binance.com/api/v3/exchangeInfo';
        try{
            const result = await (await (data?.fetch ?? fetch)(post))?.json()
            const symbols:[]= result.symbols.filter((m:any)=> (m.status=="TRADING") && (data?.quoteAsset ? m.quoteAsset==data.quoteAsset : true ))

            return {
                symbols: symbols.map((m:any)=>{
                    return {
                        name:   m.symbol,
                        tickSize:   m.filters?.[0]?.tickSize,
                        minPrice:   m.filters?.[1]?.tickSize,
                        minStepLot: m.filters?.[0]?.tickSize, //minQty stepSize
                        minQty:     m.filters?.[2]?.minQty,
                        stepSize:   m.stepSize?.[2]?.minQty,
                        quoteAsset: m.quoteAsset,
                        baseAsset:  m.baseAsset
                    }})
            }
        } catch (e){console.error(post,e); }
    }
}


export function BinanceSymbolsAllObjNewMargin(data?: tBinanceSymbolsAllObjs) {
    return async function () {
        const post='https://api1.binance.com/api/v3/exchangeInfo';
        try{
            const result = await (await (data?.fetch ?? fetch)(post))?.json()
            const symbols:[]= result.symbols.filter((m:any)=> (m.status=="TRADING") && (data?.quoteAsset ? m.quoteAsset==data.quoteAsset : true )  && !m.permissions.includes('LEVERAGED') && m.isMarginTradingAllowed && m.permissions.includes('MARGIN'))

            return {
                symbols: symbols.map((m:any)=>{
                    return {
                        name:   m.symbol,
                        tickSize:   m.filters?.[0]?.tickSize,
                        minPrice:   m.filters?.[1]?.tickSize,
                        minStepLot: m.filters?.[0]?.tickSize, //minQty stepSize
                        minQty:     m.filters?.[2]?.minQty,
                        stepSize:   m.stepSize?.[2]?.minQty,
                        quoteAsset: m.quoteAsset,
                        baseAsset:  m.baseAsset
                    }})
            }
        } catch (e){console.error(post,e); }
    }
}


export function BinanceSymbolsAllObjNewMarginPlus(data?: tBinanceSymbolsAllObjs) {
    return async function () {
        const post='https://api1.binance.com/api/v3/exchangeInfo';
        try{
            const result = await (await (data?.fetch ?? fetch)(post))?.json()
            const symbols:[]= result.symbols.filter((m:any)=> (m.status=="TRADING") && (data?.quoteAsset ? m.quoteAsset==data.quoteAsset : true ) )
            const ttt = new Set;
            const arr = [
                "BNBUSDT","BTCUSDT","ETHUSDT","TRXUSDT","XRPUSDT","EOSUSDT","LINKUSDT","ONTUSDT","ADAUSDT","ETCUSDT","LTCUSDT","XLMUSDT","USDCUSDT","XMRUSDT","NEOUSDT","ATOMUSDT","DASHUSDT","ZECUSDT","MATICUSDT","BATUSDT","IOSTUSDT","VETUSDT","QTUMUSDT","IOTAUSDT","XTZUSDT","BCHUSDT","RVNUSDT","BUSDUSDT","ZILUSDT","ONEUSDT","ANKRUSDT","TFUELUSDT","IOTXUSDT","HBARUSDT","FTMUSDT","SXPUSDT","DOTUSDT","ALGOUSDT","THETAUSDT","COMPUSDT","KNCUSDT","OMGUSDT","KAVAUSDT","DOGEUSDT","WAVESUSDT","SNXUSDT","CRVUSDT","SUSHIUSDT","UNIUSDT","MANAUSDT","AVAXUSDT","NEARUSDT","FILUSDT","TRBUSDT","SRMUSDT","AAVEUSDT","SANDUSDT","CHZUSDT","COTIUSDT","FETUSDT","CHRUSDT","GRTUSDT","STPTUSDT","LRCUSDT","KSMUSDT","ROSEUSDT","REEFUSDT","STXUSDT","ENJUSDT","RUNEUSDT","SKLUSDT","OGNUSDT","EGLDUSDT","1INCHUSDT","MDTUSDT","CAKEUSDT","SOLUSDT","LINAUSDT","SUPERUSDT","GTCUSDT","PUNDIXUSDT","AUDIOUSDT","BONDUSDT","SLPUSDT","POLSUSDT","PONDUSDT","TVKUSDT","DENTUSDT","FTTUSDT","ARUSDT","DYDXUSDT","UNFIUSDT","AXSUSDT","SHIBUSDT","WINUSDT","ENSUSDT","ALICEUSDT","TLMUSDT","ICPUSDT","C98USDT","FLOWUSDT","BAKEUSDT","CHESSUSDT","GALAUSDT","HIVEUSDT","DARUSDT","IDEXUSDT","MBOXUSDT","ANTUSDT","CLVUSDT","WAXPUSDT","BNXUSDT","KLAYUSDT","TRIBEUSDT","MINAUSDT","RNDRUSDT","JASMYUSDT","QUICKUSDT","LPTUSDT","AGLDUSDT","BICOUSDT","CTXCUSDT","DUSKUSDT","HOTUSDT","SFPUSDT","YGGUSDT","FLUXUSDT","ICXUSDT","CELOUSDT","VOXELUSDT","BETAUSDT","BLZUSDT","MTLUSDT","PEOPLEUSDT","QNTUSDT","PYRUSDT","SUNUSDT","HNTUSDT","KEYUSDT","PAXGUSDT","RAREUSDT","WANUSDT","TWTUSDT","RADUSDT","CVCUSDT","QIUSDT","GMTUSDT","APEUSDT","KDAUSDT","MBLUSDT","API3USDT","CTKUSDT","NEXOUSDT","MOBUSDT","WOOUSDT","ASTRUSDT","GALUSDT","OPUSDT","ANCUSDT","REIUSDT","LEVERUSDT","LDOUSDT","FIDAUSDT","KMDUSDT","FLMUSDT","BURGERUSDT","AUCTIONUSDT","FIOUSDT","IMXUSDT","SPELLUSDT","STGUSDT","BELUSDT","WINGUSDT","AVAUSDT","LOKAUSDT","DEXEUSDT","LUNCUSDT"
            ]
            arr.forEach(e=>ttt.add(e))
            return {
                symbols: symbols.map((m:any)=>{
                    return {
                        name:   m.symbol,
                        tickSize:   m.filters?.[0]?.tickSize,
                        minPrice:   m.filters?.[1]?.tickSize,
                        minStepLot: m.filters?.[0]?.tickSize, //minQty stepSize
                        minQty:     m.filters?.[2]?.minQty,
                        stepSize:   m.stepSize?.[2]?.minQty,
                        quoteAsset: m.quoteAsset,
                        baseAsset:  m.baseAsset
                    }}).filter(e=>ttt.has(e.name))
            }
        } catch (e){console.error(post,e); }
    }
}


export function BinanceSymbolsAllObjNewMarginIsolated(data?: tBinanceSymbolsAllObjs) {
    return async function () {
        const post='https://api1.binance.com/api/v3/exchangeInfo';
        try{
            const result = await (await (data?.fetch ?? fetch)(post))?.json()
            const symbols:[]= result.symbols.filter((m:any)=> (m.status=="TRADING") && (data?.quoteAsset ? m.quoteAsset==data.quoteAsset : true ) )
            const ttt = new Set;
            const arr = [
                "1INCHUSDT","AAVEUSDT","ACAUSDT","ACHUSDT","ADAUSDT","AGLDUSDT","AIONUSDT","AKROUSDT","ALCXUSDT","ALGOUSDT","ALICEUSDT","ALPACAUSDT","ALPHAUSDT","AMPUSDT","ANCUSDT","ANKRUSDT","ANTUSDT","APEUSDT","API3USDT","ARDRUSDT","ARPAUSDT","ARUSDT","ASTRUSDT","ATAUSDT","ATOMUSDT","AUDIOUSDT","AUTOUSDT","AVAUSDT","AVAXUSDT","AXSUSDT","BADGERUSDT","BAKEUSDT","BALUSDT","BANDUSDT","BATUSDT","BCHUSDT","BEAMUSDT","BELUSDT","BETAUSDT","BICOUSDT","BLZUSDT","BNBUSDT","BNTUSDT","BNXUSDT","BONDUSDT","BSWUSDT","BTCSTUSDT","BTCUSDT","BTGUSDT","BTSUSDT","BTTCUSDT","BURGERUSDT","BUSDUSDT","C98USDT","CAKEUSDT","CELOUSDT","CELRUSDT","CFXUSDT","CHESSUSDT","CHRUSDT","CHZUSDT","CKBUSDT","CLVUSDT","COCOSUSDT","COMPUSDT","COSUSDT","COTIUSDT","CRVUSDT","CTKUSDT","CTSIUSDT","CTXCUSDT","CVCUSDT","CVPUSDT","CVXUSDT","DARUSDT","DASHUSDT","DATAUSDT","DCRUSDT","DEGOUSDT","DENTUSDT","DEXEUSDT","DGBUSDT","DIAUSDT","DNTUSDT","DOCKUSDT","DODOUSDT","DOGEUSDT","DOTUSDT","DREPUSDT","DUSKUSDT","DYDXUSDT","EGLDUSDT","ELFUSDT","ENJUSDT","ENSUSDT","EOSUSDT","EPXUSDT","ERNUSDT","ETCUSDT","ETHUSDT","FARMUSDT","FETUSDT","FIDAUSDT","FILUSDT","FIOUSDT","FIROUSDT","FISUSDT","FLMUSDT","FLOWUSDT","FLUXUSDT","FORTHUSDT","FORUSDT","FTMUSDT","FTTUSDT","FUNUSDT","FXSUSDT","GALAUSDT","GALUSDT","GLMRUSDT","GMTUSDT","GNOUSDT","GRTUSDT","GTCUSDT","GTOUSDT","HARDUSDT","HBARUSDT","HIGHUSDT","HIVEUSDT","HNTUSDT","HOTUSDT","ICPUSDT","ICXUSDT","IDEXUSDT","ILVUSDT","IMXUSDT","INJUSDT","IOSTUSDT","IOTAUSDT","IOTXUSDT","IRISUSDT","JASMYUSDT","JOEUSDT","JSTUSDT","KAVAUSDT","KDAUSDT","KEYUSDT","KLAYUSDT","KMDUSDT","KNCUSDT","KP3RUSDT","KSMUSDT","LDOUSDT","LEVERUSDT","LINAUSDT","LINKUSDT","LITUSDT","LOKAUSDT","LPTUSDT","LRCUSDT","LSKUSDT","LTCUSDT","LTOUSDT","LUNAUSDT","LUNCUSDT","MANAUSDT","MASKUSDT","MATICUSDT","MBLUSDT","MBOXUSDT","MCUSDT","MDTUSDT","MDXUSDT","MFTUSDT","MINAUSDT","MITHUSDT","MKRUSDT","MLNUSDT","MOBUSDT","MOVRUSDT","MTLUSDT","NBSUSDT","NEARUSDT","NEOUSDT","NEXOUSDT","NKNUSDT","NMRUSDT","NULSUSDT","OCEANUSDT","OGNUSDT","OGUSDT","OMGUSDT","OMUSDT","ONEUSDT","ONGUSDT","ONTUSDT","OOKIUSDT","OPUSDT","ORNUSDT","OXTUSDT","PAXGUSDT","PEOPLEUSDT","PERLUSDT","PERPUSDT","PHAUSDT","PLAUSDT","PNTUSDT","POLSUSDT","POLYUSDT","PONDUSDT","POWRUSDT","PUNDIXUSDT","PYRUSDT","QIUSDT","QNTUSDT","QTUMUSDT","QUICKUSDT","RADUSDT","RAREUSDT","RAYUSDT","REEFUSDT","REIUSDT","RENUSDT","REPUSDT","REQUSDT","RLCUSDT","RNDRUSDT","ROSEUSDT","RSRUSDT","RUNEUSDT","RVNUSDT","SANDUSDT","SCRTUSDT","SCUSDT","SFPUSDT","SHIBUSDT","SKLUSDT","SLPUSDT","SNXUSDT","SOLUSDT","SPELLUSDT","SRMUSDT","STGUSDT","STMXUSDT","STORJUSDT","STPTUSDT","STRAXUSDT","STXUSDT","SUNUSDT","SUPERUSDT","SUSHIUSDT","SXPUSDT","SYSUSDT","TCTUSDT","TFUELUSDT","THETAUSDT","TKOUSDT","TLMUSDT","TOMOUSDT","TORNUSDT","TRBUSDT","TRIBEUSDT","TROYUSDT","TRUUSDT","TRXUSDT","TUSDT","TUSDUSDT","TVKUSDT","TWTUSDT","UMAUSDT","UNFIUSDT","UNIUSDT","USDCUSDT","UTKUSDT","VETUSDT","VGXUSDT","VIDTUSDT","VITEUSDT","VOXELUSDT","VTHOUSDT","WANUSDT","WAVESUSDT","WAXPUSDT","WINGUSDT","WINUSDT","WNXMUSDT","WOOUSDT","WRXUSDT","WTCUSDT","XECUSDT","XEMUSDT","XLMUSDT","XMRUSDT","XRPUSDT","XTZUSDT","XVSUSDT","YFIIUSDT","YFIUSDT","YGGUSDT","ZECUSDT","ZENUSDT","ZILUSDT","ZRXUSDT"
            ]
            arr.forEach(e=>ttt.add(e))
            return {
                symbols: symbols.map((m:any)=>{
                    return {
                        name:   m.symbol,
                        tickSize:   m.filters?.[0]?.tickSize,
                        minPrice:   m.filters?.[1]?.tickSize,
                        minStepLot: m.filters?.[0]?.tickSize, //minQty stepSize
                        minQty:     m.filters?.[2]?.minQty,
                        stepSize:   m.stepSize?.[2]?.minQty,
                        quoteAsset: m.quoteAsset,
                        baseAsset:  m.baseAsset
                    }}).filter(e=>ttt.has(e.name))
            }
        } catch (e){console.error(post,e); }
    }
}


export function MexcSymbolsAllObjNewMarginIsolated(data?: tBinanceSymbolsAllObjs) {
    return async function () {
        const post='https://api.mexc.com/api/v3/exchangeInfo';
        try{
            const result = await (await (data?.fetch ?? fetch)(post))?.json()
            const symbols:[]= result.symbols.filter((m:any)=> (m.status=="ENABLED") )
            console.log({symbols});
            return {
                symbols: symbols.map((m:any)=>{
                    return {
                        name:   m.symbol,
                        tickSize:   m.filters?.[0]?.tickSize,
                        minPrice:   m.filters?.[1]?.tickSize,
                        minStepLot: m.filters?.[0]?.tickSize, //minQty stepSize
                        minQty:     m.filters?.[2]?.minQty,
                        stepSize:   m.stepSize?.[2]?.minQty,
                        quoteAsset: m.quoteAsset,
                        baseAsset:  m.baseAsset
                    }})

            }
        } catch (e){console.error(post,e); }
    }
}


export function SymbolsdUSASymbolsAllObjNewMarginIsolated(data?: tBinanceSymbolsAllObjs) {
    return async function () {
        const post='http://localhost:3013/historyUSA/symbols';
        try{
            const result = await (await (data?.fetch ?? fetch)(post))?.json()
            console.log(result);
            const symbols:[]= result.result // .symbols.filter((m:any)=> (m.status=="ENABLED") )
            console.log({symbols});
            return {
                symbols: symbols.map((m:any)=>{
                    return {
                        name:       m.symbol, //+ " " +m.name ,
                        tickSize:   0.01,
                        minPrice:   0.01,
                        minStepLot: 0.01, //minQty stepSize
                        minQty:     0.01,
                        stepSize:   0.01,
                        quoteAsset: "USDT",
                        baseAsset:  m.symbol
                    }})

            }
        } catch (e){console.error(post,e); }
    }
}


export function GateIoSymbolsAllObjNewMarginIsolated(data?: tBinanceSymbolsAllObjs) {
    return async function () {
        const post='https://api.gateio.ws/api/v4/margin/currency_pairs';
        try{
            const result = await (await (data?.fetch ?? fetch)(post))?.json()
            const symbols:[]= result.filter((m:any)=> (m.status==1)  )
            return {
                symbols: symbols.map((m:any)=>{
                    return {
                        name:   m.id,
                        tickSize:   0.0001,
                        minPrice:   0.0001,
                        minStepLot: 0.0001, //minQty stepSize
                        minQty:     0.0001,
                        stepSize:   0.0001,
                        quoteAsset: m.quote,
                        baseAsset:  m.base
                    }})

            }
        } catch (e){console.error(post,e); }
    }
}



export function BinanceSymbolsAllObjUSDT() {return BinanceSymbolsAllObjNew({quoteAsset: "USDT"})}


export function BinanceSymbolsAllFuturesObj2(data?: tBinanceSymbolsAllObjs) {
    return async function () {
        const post='https://fapi.binance.com/fapi/v1/exchangeInfo';
        try{
            const result = await (await (data?.fetch ?? fetch)(post))?.json()
            const symbols:[]= result.symbols.filter((m:any)=> (m.status=="TRADING") && (data?.quoteAsset ? m.quoteAsset==data.quoteAsset : true ))

            return {
                symbols: symbols.map((m:any)=>{
                    return {
                        name:   m.symbol,
                        tickSize:   m.filters?.[0]?.tickSize,
                        minPrice:   m.filters?.[1]?.tickSize,
                        minStepLot: m.filters?.[0]?.tickSize, //minQty stepSize
                        minQty:     m.filters?.[2]?.minQty,
                        stepSize:   m.stepSize?.[2]?.minQty,
                        quoteAsset: m.quoteAsset,
                        baseAsset:  m.baseAsset
                    }})
            }
        } catch (e){console.error(post,e); }
    }
}


export function BinanceSymbolsAllFuturesCoinM(data?: tBinanceSymbolsAllObjs) {
    return async function () {
        const post='https://dapi.binance.com/dapi/v1/exchangeInfo';
        try{
            const result = await (await (data?.fetch ?? fetch)(post))?.json()
           // console.log({result})
            const symbols:[]= result.symbols.filter((m:any)=> (m.contractStatus=="TRADING") && (data?.quoteAsset ? m.quoteAsset==data.quoteAsset : true ))
           // console.log({symbols})
            return {
                symbols: symbols.map((m:any)=>{
                    return {
                        name:   m.symbol,
                        tickSize:   m.filters?.[0]?.tickSize,
                        minPrice:   m.filters?.[1]?.tickSize,
                        minStepLot: m.filters?.[0]?.tickSize, //minQty stepSize
                        minQty:     m.filters?.[2]?.minQty,
                        stepSize:   m.stepSize?.[2]?.minQty,
                        quoteAsset: m.quoteAsset,
                        baseAsset:  m.baseAsset
                    }})
            }
        } catch (e){console.error(post,e); }
    }
}



//Прмиер подключения к АПИ МСтрейду /fapi/v1/klines

export function BinanceSocketRealTimeSpotNew(_WebSocket?: WebSocket|any) {
    return function (info:{name : string}, callback:(data: tSocketInput)=> void , disable:()=>boolean, onclose:()=>void):void {
        // подготовка данных для подключения
        if (!info.name) {onclose(); return;}
        const url='wss://stream.binance.com:9443/ws/'+info.name.toLowerCase()+'@bookTicker';

        //стандартные методы ВебСокета
        let lastPrice: number = 0;
        const websocet = _WebSocket ? new _WebSocket(url) : new WebSocket(url);
        const socket = websocet as WebSocket;
        socket.onerror = (e)=>{console.error('WebSocket Error: ' , e,' ',info.name);}
        socket.onopen = (e)=>{ }
        //при закрытии соединения надо сообщить данный статус
        socket.onclose = (e)=>{onclose();};
        socket.onmessage = (e)=> {
            let data:any = JSON.parse(e.data);
            //проверяем есть ли у нас слушатели с этой стороны, если их нету тозакрваем соединение
            if (lastPrice==data.b) return ;
            lastPrice=data.b;
            if (disable()) { socket.close(); }
            //отправляем полученные данные
            return callback({
                ticks:[{time: new Date(), price: Number(data.b), volume: 1}]
            });
        }
    }
}
export function BinanceSocketRealTimeSpot() {return BinanceSocketRealTimeSpotNew()}

//Прмиер подключения к АПИ МСтрейду потдключение к юарам в 1000мс
export function BinanceSocketFutures(info:{name : string}, callback:(data: tSocketInput)=> void , disable:()=>boolean, onclose:()=>void):void {
    // подготовка данных для подключения
    // console.log("пытаемся подключиться по сокету к бинансу для быстрых котировок")
    if (!info.name) {onclose(); return;}
    const url='wss://fstream.binance.com/ws/'+info.name.toLowerCase()+'@miniTicker';

    //стандартные методы ВебСокета

    const socket =new WebSocket(url);
    socket.onerror = (e)=>{console.error('WebSocket Error: ' , e,' ',info.name);}
    socket.onopen = (e)=>{ }
    //при закрытии соединения надо сообщить данный статус
    socket.onclose = (e)=>{onclose();};
    socket.onmessage = (e)=> {
        let data:any = JSON.parse(e.data);
        // проверяем есть ли у нас слушатели с этой стороны, если их нету тозакрваем соединение
        if (disable()) {socket.close();}
        // отправляем полученные данные
        return callback({
            ticks:[{time: new Date(), price: Number(data.c), volume: 1}]
        });
    }
}



export function BinanceSocketKlineAllBase(setting: {WebSocket?: WebSocket | any, url: string}) {
    return function (callback:(mas: {data: Partial<tUpDateAllKline>, name:string})=> void , disable:()=>boolean, onclose:()=>void, data:{names: string[]}):void {
        const combiner = "/stream?streams=" +(data.names.map(e=>e.toLowerCase()+"@kline_1m")).join("/")
        const url = setting.url + combiner;
        const socket :WebSocket = setting.WebSocket? new setting.WebSocket(url): new WebSocket(url);
        socket.onerror = (e)=>console.error('WebSocket Error: ' , e,' ');
        socket.onopen = (e)=>{ }
        //при закрытии соединения надо сообщить данный статус
        socket.onclose = (e)=>{onclose();};
        socket.onmessage = (e)=> {
            const data: any = JSON.parse(e.data);
            const datum = data.data
            //проверяем есть ли у нас слушатели с этой стороны, если их нету тозакрваем соединение
            // if (disable()) {socket.close();}
            //отправляем полученные данные
            const ar:{data: Partial<tUpDateAllKline>, name:string} =
                { //    const {c,h,o,l,v,t, i:tf} = data

                    data: {
                        s: datum.s,
                        i: TF.M1,
                        n: +datum.k.n,
                        V: +datum.k.V,
                        v: +datum.k.v,
                        t: +datum.k.t,
                        f: +datum.k.f,
                        h: +datum.k.h,
                        l: +datum.k.l,
                        o: +datum.k.o,
                        c: +datum.k.c,
                    },
                    name :datum.s
                }

            return callback(ar);
        }
    }
}

export function BinanceSocketKlineSpotAllNew(_WebSocket?: WebSocket|any) {
    return BinanceSocketKlineAllBase({WebSocket: _WebSocket, url: 'wss://stream.binance.com:9443'})
}
export function BinanceSocketKlineFAll(_WebSocket?: WebSocket|any) {
    return BinanceSocketKlineAllBase({WebSocket: _WebSocket, url: 'wss://fstream.binance.com:9443'})
}
export function BinanceSocketKlineDAll(_WebSocket?: WebSocket|any) {
    return BinanceSocketKlineAllBase({WebSocket: _WebSocket, url: 'wss://dstream.binance.com:9443'})
}
export function BinanceSocketKlineSpotAll(){return BinanceSocketKlineSpotAllNew()}

export function BinanceSocketSpotAllTurboNew(_WebSocket?: WebSocket|any) {
    return function (callback:(mas: {data: tSocketInput, name:string}[])=> void , disable:()=>boolean, onclose:()=>void):void {
        const url='wss://stream.binance.com:9443/ws/!bookTicker';
        /*
         "s":"BNBUSDT",     // symbol
          "b":"25.35190000", // best bid price
          "B":"31.21000000", // best bid qty
          "a":"25.36520000", // best ask price
          "A":"40.66000000"  // best ask qty
  */
        const socket :WebSocket = _WebSocket? new _WebSocket(url): new WebSocket(url);
        socket.onerror= (e)=>console.error('WebSocket Error: ' , e,' ');
        socket.onopen = (e)=>{ }
        socket.onclose=(e)=>{onclose();};
        socket.onmessage=(e)=> {
            let data:any= JSON.parse(e.data);
            //проверяем есть ли у нас слушатели с этой стороны, если их нет, то закрываем соединение
            // if (disable()) {socket.close();}
            //отправляем полученные данные
            const ar:{data: tSocketInput, name:string}[] = [
                 {
                    data: {
                        ticks:[{time: new Date(), price: +data.b, volume:0}]
                    },
                    name :data.s
                }
            ]
            return callback(ar);
        }
    }
}

export function BinanceSocketSpotAllTurbo(){return BinanceSocketSpotAllTurboNew()}


//Прмиер подключения к АПИ Bicnance потдключение к юарам в 1000мс
//обьемы приходя от начала дня сумированные

export function BinanceSocketAllBase(data: {WebSocket?: WebSocket | any , url?: string}) {
    const url= data.url ?? 'wss://stream.binance.com:9443/ws/!ticker@arr';

    return function (callback:(mas: {data: tSocketInput, name:string}[])=> void , disable:()=>boolean, onclose:()=>void):void {
        const socket :WebSocket = data.WebSocket? new data.WebSocket(url): new WebSocket(url);
        socket.onerror= (e)=>console.error('WebSocket Error: ' , e,' ');
        socket.onopen = (e)=>{ }
        socket.onclose= (e)=>{onclose();};
        socket.onmessage=(e)=> {
            let data:any= JSON.parse(e.data);
            //проверяем есть ли у нас слушатели с этой стороны, если их нету тозакрваем соединение
            // if (disable()) {socket.close();}
            //отправляем полученные данные
            const ar:{data: tSocketInput, info: Partial<tSymbolLoadInfo>, name:string}[] =data.map((e:any)=>{
                return {
                    data: {
                        ticks:[{time: new Date(+e.E), price: +e.c, volume:0}]
                    },
                    name :e.s,
                    info: {
                        close24: +e.c,
                        open24: +e.o,
                        volumeBase24: +e.v,
                        volume24: +e.q
                    }
                }
            })
            return callback(ar);
        }
    }
}
// spot
export function BinanceSocketSpotAllNew(WebSocket?: WebSocket | any) {
    return BinanceSocketAllBase({
        WebSocket: WebSocket,
        url: 'wss://stream.binance.com:9443/ws/!ticker@arr'
    })
}
// для фьючерсов USDⓈ-M
export function BinanceSocketFuturesAll(WebSocket?: WebSocket | any) {
    return BinanceSocketAllBase({
        WebSocket: WebSocket,
        url: 'wss://fstream.binance.com/ws/!ticker@arr'
    })
}
// Futures COIN-M
export function BinanceSocketDCoinMAll(WebSocket?: WebSocket | any) {
    return BinanceSocketAllBase({
        WebSocket: WebSocket,
        url: 'wss://dstream.binance.com/ws/!ticker@arr'
    })
}

export function BinanceSocketSpotAll(){return BinanceSocketSpotAllNew()}

async function TestHorizontalVolume() {
    const symbol = "BTCUSDT"
    const startTime = new Date(Date.now() - 2 * 60 * 60 * 1000)
    const endTime = new Date(Date.now() - (2 * 60 * 60 * 1000 ) + (15 * 60 * 1000))
    const data = 'https://api1.binance.com/api/v3/aggTrades?symbol=' + symbol + '&startTime=' + String(startTime.valueOf()) + '&endTime=' + String(endTime.valueOf() ) + '&limit='+ 1000
    try {
        const parseData = (await (await fetch(data)).json());
        console.log("TestHorizontalVolume", {parseData});
    } catch (e) {
        console.error(e);
    }
}


type tBinanceLoadBase = {
    // адрес загрузки // http
    base : string
    // максимум загрузки баров за раз при первом запроса
    maxLoadBars : number;
    // максимум загрузки баров при докачке
    maxLoadBars2? : number;
    // максимальное количество запросов в пределах времени лимитов
    countConnect : number;
    // период сброса лимитов
    time?: number,
    // загрузка и сохранения баров
    funcLoad: (data: tLoadHistory) => Promise<tSetHistoryData[]>,
    // дата начала доступной истории
    funcFistTime: (data: tLoadFistHistory) => Promise<Date>,
    // перевод timeframe в название интервалов
    intervalToName: { time: TF, name: string }[]
}

type tFetch3 = (input: RequestInfo | URL, init?: RequestInit | undefined) => Promise<Response>
export type tLoadHistory = {fetch: tFetch3, baseURL: string, symbol: string, interval: string, startTime: Date, endTime?: Date, limit?: number, maxLoadBars: number}
export type tLoadFistHistory = {fetch: tFetch3, baseURL: string, symbol: string, interval: string}

export function LoadQuoteBase (setting: tBinanceLoadBase, data?: { fetch?: tFetch3 }){
    const {base,maxLoadBars,countConnect,intervalToName} = setting
    const maxLoadBars2 = setting.maxLoadBars2 ?? maxLoadBars
    const date = [Date.now()]
    // тут будем хранить время начало котировок по символам + TF
    const startMap = new Map<string, Date>()
    let count = 0;
    async function waitLimit() {
        ++count;
        while (true) {
            if (Date.now() - date[0] > (setting.time ?? 60000)) {
                date.push(Date.now());
                date.splice(0,1)
                break;
            }
            else
                if (date.length < countConnect - 2) {
                    date.push(Date.now());
                    break;
                }
            await sleepAsync(1000)
        }
        --count;
    }
    //перечисляем доступные методы закачки
    //ищем подходящее время для скачивания
    function searchTF(info: tInfoForLoadHistory){
        let a = intervalToName.length - 1;
        const sec1 = info.tf?.sec ?? 60000
        for(; a>0; a--) {
            if (intervalToName[a].time.sec <= sec1 && (sec1%intervalToName[a].time.sec)==0) break;
        }
        return intervalToName[a]
    }
    const _fetch = data?.fetch??fetch
    return async (info: tInfoForLoadHistory ) : Promise<{bars: tSetHistoryData[], tf: TF}|undefined>  => {   //
        const infoTF = searchTF(info)
        let lastTime: number
        if (!_fetch) throw "_fetch - не определен";

        const nameForMap = info.exchangeName + infoTF.name
        let leftTime = startMap.get(nameForMap)
        if (!leftTime) {
            await waitLimit()
            leftTime = await setting.funcFistTime({symbol: info.name, baseURL: base, interval: infoTF.name, fetch: _fetch})
            startMap.set(nameForMap, leftTime)
        }
        // если запрос превышает первую котировку слева, то сократим, запрос, до котировки

        const [time1, time2] = [Math.max(info.time1.valueOf(), leftTime.valueOf()), info.time2.valueOf()]
        if (time2 <= time1) {return {bars: [], tf: infoTF.time}}

        const arr: number[] = []
        const interval = infoTF.time.valueOf()
        const [step1, step2] = [maxLoadBars * interval, maxLoadBars2 * interval]
        const [t1, t2] = info.right ? [time1, time2] : [time2, time1]

        arr.push(lastTime = t1)
        let bars = (t1 - t2) / interval
        if (bars<=maxLoadBars) arr.push(t2)
        else {
            bars -= maxLoadBars
            arr.push(lastTime = lastTime - step1)
            for (; bars>0; bars-=maxLoadBars2) arr.push(lastTime = lastTime - step2)
            if (bars<0) arr.push(t2)
        }

        const map: Promise <tSetHistoryData | any>[]= []

        for (let i = 1; i < arr.length; i++) {
            if (arr[i].valueOf() >= arr[i-1].valueOf()) continue;
            map.push((async ()=>{
                const data: tLoadHistory = {
                    maxLoadBars:    maxLoadBars,
                    fetch:  _fetch,
                    baseURL:    base,
                    symbol:     info.name,
                    interval:   infoTF.name,
                    startTime:  new Date(arr[i]),
                    endTime:    new Date(arr[i-1]),
                    limit:  maxLoadBars
                }
                await waitLimit()
                return setting.funcLoad(data)
            })())

        }
        // если есть очередь по запросам
        if (count > 0) {

        }
        const resulI = await Promise.allSettled(map)
        const result: tSetHistoryData[] = []
        // for (let i = resulI.length - 1; i >= 0; i--) {
        //     const buf = resulI[i]
        //     if (buf.status == "fulfilled") result.concat(buf.value)
        // }
        resulI.forEach((e,i)=>{
            // console.log("rr", e.value ?? undefined)
            if (e.status == "fulfilled") result.unshift(...e.value)
        })

        return {
            bars: result,
            tf: infoTF.time
        }
    }}

const binanceFuncLoad = async ({symbol,interval,startTime,endTime,limit,baseURL,fetch}: tLoadHistory): Promise<tSetHistoryData[]> => {
    const _interval =   `&interval=${interval}`
    const _startTime =  `&startTime=${startTime.valueOf()}`
    const _endTime =    endTime?`&endTime=${endTime.valueOf()}`:``
    const _limit =      endTime?`&limit=${limit}`:``
    const url =         baseURL +`symbol=${symbol}` + _interval + _startTime + _endTime + _limit

    const data = (await (await fetch(url)).json());
    return data?.map((m: any):tSetHistoryData => ({
        time: new Date(+m[0]),
        open:   +m[1],
        high:   +m[2],
        low:    +m[3],
        close:  +m[4],
        volume:     +m[5],
        tickVolume  : +m[8]
    })) ?? []
}
const binanceFuncFistTime = async ({symbol,interval,baseURL,fetch}: tLoadFistHistory): Promise<Date> => {
    const data =  baseURL +`symbol=${symbol}` + `&interval=${interval}` + `&startTime=${String(new Date('2000').valueOf())}` + `&limit=1`
    const parseData = (await (await fetch(data)).json());
    return new Date(Number(parseData?.[0]?.[0] as number|string))
}

const binanceInterval: { time: TF, name: string }[] = [
    {time: TF.M1, name: '1m'}
    , {time: TF.M3,     name: '3m'}
    , {time: TF.M5,     name: '5m'}
    , {time: TF.M15,    name: '15m'}
    , {time: TF.M30,    name: '30m'}
    , {time: TF.H1,     name: '1h'}
    , {time: TF.H2,     name: '2h'}
    , {time: TF.H4,     name: '4h'}
    , {time: TF.H6,     name: '6h'}
    , {time: TF.H8,     name: '8h'}
    , {time: TF.H12,    name: '12h'}
    , {time: TF.D1,     name: '1d'}
    , {time: TF.W1,     name: '1w'}
]

export const BinanceLoadEasySpot = (data?: { fetch?: tFetch }) => LoadQuoteBase({
    base: 'https://api1.binance.com/api/v3/klines?',
    maxLoadBars2: 1000,
    countConnect: 1150,
    maxLoadBars: 1000,
    time: 60000,
    funcLoad: binanceFuncLoad,
    funcFistTime: binanceFuncFistTime,
    intervalToName: binanceInterval
}, data)

export const BinanceLoadEasyFutures = (data?: { fetch?: tFetch }) => LoadQuoteBase({
    base: 'https://fapi.binance.com/fapi/v1/klines?', // 'https://fapi.binance.com/fapi/v1/klines?symbol='
    maxLoadBars2: 1000,
    countConnect: 450,
    maxLoadBars: 1000,
    time: 60000,
    funcLoad: binanceFuncLoad,
    funcFistTime: binanceFuncFistTime,
    intervalToName: binanceInterval
}, data) // dapi/v1/klines

export const BinanceLoadEasyFuturesM = (data?: { fetch?: tFetch }) =>  LoadQuoteBase({
    base: 'https://dapi.binance.com/dapi/v1/klines?', // 'https://fapi.binance.com/fapi/v1/klines?symbol='
    maxLoadBars2: 1000,
    countConnect: 450,
    maxLoadBars: 1000,
    time: 60000,
    funcLoad: binanceFuncLoad,
    funcFistTime: binanceFuncFistTime,
    intervalToName: binanceInterval
}, data)


export const MexcLoadEasyFuturesM = (data?: { fetch?: tFetch }) =>  LoadQuoteBase({
    base: 'https://api.mexc.com/api/v3/klines?', // 'https://fapi.binance.com/fapi/v1/klines?symbol='
    maxLoadBars2: 1000,
    countConnect: 1150,
    maxLoadBars: 1000,
    time: 60000,
    funcLoad: async ({symbol,interval,startTime,endTime,limit,baseURL,fetch}: tLoadHistory): Promise<tSetHistoryData[]> => {
        const _interval =   `&interval=${interval}`
        const _startTime =  `&startTime=${startTime.valueOf()}`
        const _endTime =    endTime?`&endTime=${endTime.valueOf()}`:``
        const _limit =      endTime?`&limit=${limit}`:``
        const url =         baseURL +`symbol=${symbol}` + _interval + _startTime + _endTime + _limit
        const data = (await (await fetch(url)).json());
        return data?.map((m: any):tSetHistoryData => ({
            time: new Date(+m[0]),
            open:   +m[1],
            high:   +m[2],
            low:    +m[3],
            close:  +m[4],
            volume: +m[5],
            tickVolume: +m[8]
        }))
    },
    funcFistTime: async (e: tLoadFistHistory) => new Date('2022')
    ,
    intervalToName: binanceInterval
}, data)


export const GateIoLoadEasySpot = (data?: { fetch?: tFetch }) => LoadQuoteBase({
    base: 'https://api.gateio.ws/api/v4/spot/candlesticks?',
    maxLoadBars2: 500,
    countConnect: 500000,
    maxLoadBars: 500,
    time: 60000,
    funcLoad: async ({symbol,interval,startTime,endTime,limit,baseURL,fetch}: tLoadHistory): Promise<tSetHistoryData[]> => {
        const _interval =   `&interval=${interval}`
        const _startTime =  `&startTime=${startTime.valueOf()}`
        const _endTime =    endTime?`&endTime=${endTime.valueOf()}`:``
        const _limit =      endTime?`&limit=${limit}`:``
        const url =         baseURL +`symbol=${symbol}` + _interval + _startTime + _endTime + _limit
        const data = (await (await fetch(url)).json());
        return data?.map((m: any):tSetHistoryData => ({
            time: new Date(+m[0]*1000),
            open:   +m[5],
            high:   +m[3],
            low:    +m[4],
            close:  +m[2],
            volume: +m[1],
            tickVolume: 0
        }))
    },
    funcFistTime: async ({symbol,interval,baseURL,fetch}: tLoadFistHistory): Promise<Date> => {
        const url = baseURL + `currency_pair=${symbol}` + '&interval=' + interval + '&from=' + String(Math.round(new Date('2022-01-15').valueOf()/1000))  + '&to=' + String(Math.round((new Date('2022-01-15').valueOf()/1000) + 60))
        const data = (await (await fetch(url)).json());
        const result = data?.[0]?.[0] as number|string
        return new Date(Number(result)*1000)
    },
    intervalToName: binanceInterval
}, data)


export const USALoadEasyFuturesM = (data?: { fetch?: tFetch }) =>  LoadQuoteBase({
    base: 'http://localhost:3013/historyUSA/history?', // 'https://fapi.binance.com/fapi/v1/klines?symbol='
    maxLoadBars2: 10000,
    countConnect: 1,
    maxLoadBars: 10000,
    time: 300,
    funcLoad: async ({symbol,interval,startTime,endTime:__endTime,limit,baseURL,fetch}: tLoadHistory): Promise<tSetHistoryData[]> => {
        // end,limit,start,tf,fetch,symbol
        const maxBarTime = (Date.now() - 60*1000*16)
        const endTime = !__endTime || __endTime.valueOf() > maxBarTime ? new Date(maxBarTime) : __endTime
        const _interval =   `&tf=${interval}`
        const _startTime =  `&start=${startTime.toISOString()}`
        const _endTime =    endTime?`&end=${endTime.toISOString()}`:``
        const _limit =      endTime?`&limit=${limit}`:``
        const url =         baseURL +`symbol=${symbol}` + _interval + _startTime + _endTime + _limit

        const data = (await (await fetch(url)).json())?.data ;
        /*
            t: '2022-10-06T19:30:00Z',
            o: 11.84,
            h: 11.86,
            l: 11.79,
            c: 11.82,
            v: 18972,
            n: 336,
            vw: 11.825596
        * */
        return data?.map(({t,o,h,l,c,v,n,nw}: any):tSetHistoryData => {
            return ({
                time: new Date(t),
                open: +o,
                high: +h,
                low: +l,
                close: +c,
                volume: +v,
                tickVolume: +0
            })
        }) ?? []
    },
    funcFistTime: async ({symbol,interval,baseURL,fetch}: tLoadFistHistory): Promise<Date> => {
        return new Date('2022')
    },
    intervalToName: [
        {time: TF.M1, name: '1Min'}
        , {time: TF.M5,     name: '5Min'}
        , {time: TF.M15,    name: '15Min'}
        , {time: TF.M30,    name: '30Min'}
        , {time: TF.H1,     name: '1Hour'}
        , {time: TF.H4,     name: '4Hour'}
    ]
}, data)


export async function MSSymbolsAllEasy():Promise<{names: string[]}|undefined>{
    const account = "demo.demo";
    const post='https://api-sb.mstrade.org/api/v1/symbol/?account='+account+'&symbol_schema=margin1';
    //стндартные методы XMLHttpRequest для отправки
    try{
        const data = await (await fetch(post))?.json();
        return {
            names : data.map(
                //правила изменения
                ( m : { symbol : string, pair:[string,string] } ) =>  {const {symbol,pair} = m; return symbol[symbol.length-1]=="T" && (!pair || pair[1]=="USDT")?symbol.slice(0,-1):symbol}
            )
        } // https://api-sb.mstrade.org/api/v1/symbol/?account=demo.demo&symbol_schema=margin1
    } catch (e){console.error(post,e); }
}

export async function MSSymbolsAllEasyObj():Promise<{symbols: {name:string}[]}|undefined>{
    const account = "demo.demo";
    const post='https://api-sb.mstrade.org/api/v1/symbol/?account='+account+'&symbol_schema=margin1';
    //стндартные методы XMLHttpRequest для отправки
    try{
        const data = await (await fetch(post))?.json();
        // console.log(data);
        return {
            symbols : data.map(
                //правила изменения
                ( {symbol,pair} : { symbol : string, pair:[string,string] } ) =>  {
                    return {
                        name:symbol[symbol.length-1]=="T" && (!pair || pair[1]=="USDT")?symbol.slice(0,-1):symbol
                    }
                }
            )
        } // https://api-sb.mstrade.org/api/v1/symbol/?account=demo.demo&symbol_schema=margin1
    } catch (e){console.error(post,e); }
}

export function MSSymbolsAll(callback:(names:string[])=>void){
    MSSymbolsAllEasy().then((v)=>{console.log(v); if (v) callback(v.names);});
}


//Прмиер подключения к АПИ МСтрейду
export function MSSocket(info:{name : string}, callback:(data: tSetTicks)=> void , disable:()=>boolean, onclose:()=>void):void {
    // подготовка данных для подключения
    const url='wss://api-sb.mstrade.org:4443/realtime/';
    const account = "demo.demo";
    const send=JSON.stringify(
        {"op": "subscribe",
            "account": account,
            "channels": "trade:"+info.name,
            "schema": "margin1"});
    //стандартные методы ВебСокета
    const socket =new WebSocket(url);
    socket.onerror= (e)=>console.error('WebSocket Error: ' , e,' ',info.name);
    socket.onopen = (e)=>{  socket.send(send);}
    //при закрытии соединения надо сообщить данный статус
    socket.onclose=(e)=>{onclose();};
    socket.onmessage=(e)=> {
        let data:any= JSON.parse(e.data);
        if (!(data.data)) {return callback(
            {ticks: []});}
        data=data.data;
        //парсим и сохраням значения типа массм {time: new Date, price: number, volume: number}[]
        const arr:{ticks:tTick[]}={ticks:[]};
        for (let i of data) arr.ticks.push({time: new Date(i.timestamp), price: Number(i.price), volume: Number(i.volume)});
        //проверяем есть ли у нас слушатели с этой стороны, если их нету тозакрваем соединение
        if (disable()) {socket.close();}
        //отправляем полученные данные
        return callback(arr);
    }
}


//Прмиер подключения к АПИ Binance реализация через промисы
export async function MSLoadBEasy(InfoForLoad: tInfoForLoadHistory): Promise<{bars: tSetHistoryData[], tf: TF}|undefined> {
    const DateToSec = (date:Date):number=> {return Math.floor(date.valueOf()/1000)}
    //перечисляем доступные методы закачки
    const aTFArr: { time: TF, name: string }[] = [
        {time:TF.M1, name: '1m'}
        ,{time:TF.M5, name: '5m'}
        ,{time:TF.H1, name: '1h'}
        ,{time:TF.D1, name: '1d'}
    ];

    let a = aTFArr.length - 1;
    //ищем подходящее время для скачивания
    while (InfoForLoad.tf && a > 0 && aTFArr[a].time.sec > InfoForLoad.tf.sec) {
        a--;
    }
    const infoTF = aTFArr[a];


    const account = "demo.demo";
    //формируем строку
    const data='https://api-sb.mstrade.org/api/v1/quote/'+InfoForLoad.name+'/?account='+account+'&binsize='+infoTF.name+'&from='
        +String(DateToSec(InfoForLoad.time1))+'&to='+String(DateToSec(InfoForLoad.time2))+'&schema=margin1'+'&Authorizaton=86e570bcf5e673719f47eb6027d1414cbd36a532';

    try {
        const parseData= (await (await fetch(data)).json());
        const bars = parseData?.map((m: any):tSetHistoryData => {
            return {
                time:   new Date(m.time),
                open:   m.open_price,
                high:   m.high_price,
                low:    m.low_price,
                close:  m.close_price,
                volume: m.volume,
                tickVolume:     0
            }})
        console.log(bars);
        return {
            bars,
            tf: infoTF.time
        }

        // return {
        //     bars: parseData?.map((m: any) => {
        //         return {
        //             time:new Date(m.time),
        //             open:m.open,
        //             high:m.high,
        //             low:m.low,
        //             close:m.close,
        //             volume:m.volume
        //         }
        //     }),
        //     tf: infoTF.time
        // }
    } catch (e) {
        console.error(e);
        // return {
        //     bars: undefined
        //     , tf: infoTF.time
        // }
    }
}
