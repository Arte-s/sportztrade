

// function InstallBinanceSecretKey(){
//     // @ts-ignore
/*
*
* */



//     let enc = new TextEncoder("utf-8");
//
//     window.crypto.subtle.importKey(
//         "raw", // raw format of the key - should be Uint8Array
//         enc.encode("mysecretkey"),
//         { // algorithm details
//             name: "HMAC",
//             hash: {name: "SHA-512"}
//         },
//         false, // export = false
//         ["sign", "verify"] // what this key can do
//     ).then( key => {
//         window.crypto.subtle.sign(
//             "HMAC",
//             key,
//             enc.encode("myawesomedata")
//         ).then(signature => {
//             let b = new Uint8Array(signature);
//             let str = Array.prototype.map.call(b, x => ('00'+x.toString(16)).slice(-2)).join("")
//         });
//     });
// }



//получаем список символов с бинанса напрямую
// {
//   "timezone": "UTC",
//   "serverTime": 1565246363776,
//   "rateLimits": [
//     {
//       //These are defined in the `ENUM definitions` section under `Rate Limiters (rateLimitType)`.
//       //All limits are optional
//     }
//   ],
//   "exchangeFilters": [
//     //These are the defined filters in the `Filters` section.
//     //All filters are optional.
//   ],
//   "symbols": [
//     {
//       "symbol": "ETHBTC",
//       "status": "TRADING",
//       "baseAsset": "ETH",
//       "baseAssetPrecision": 8,
//       "quoteAsset": "BTC",
//       "quotePrecision": 8,
//       "quoteAssetPrecision": 8,
//       "orderTypes": [
//         "LIMIT",
//         "LIMIT_MAKER",
//         "MARKET",
//         "STOP_LOSS",
//         "STOP_LOSS_LIMIT",
//         "TAKE_PROFIT",
//         "TAKE_PROFIT_LIMIT"
//       ],
//       "icebergAllowed": true,
//       "ocoAllowed": true,
//       "isSpotTradingAllowed": true,
//       "isMarginTradingAllowed": true,
//       "filters": [
//         //These are defined in the Filters section.
//         //All filters are optional
//       ],
//       "permissions": [
//          "SPOT",
//          "MARGIN"
//       ]
//     }
//   ]
// }
// /
//список инструментов

// export async function BinanceSymbolsAllEasyFutures():Promise<{names: string[]}|undefined> {
//     const post='https://fapi.binance.com/fapi/v1/exchangeInfo';
//     try{
//         const data:[]=(await (await fetch(post))?.json())?.symbols;
//         return {
//             names: data.map((m:any)=>m.symbol)
//         }
//     } catch (e){console.error(post,e); }
// }
//
//
//
// //список инструментов
// export async function BinanceSymbolsAllFuturesObj():Promise<{symbols: {name:string}[]}|undefined> {
//     const post='https://fapi.binance.com/fapi/v1/exchangeInfo';
//     try{
//         const data:[]=(await (await fetch(post))?.json())?.symbols;
//
//         return {    //baseAssetPrecision
//             symbols: data.map((m:any)=>{return {name:m.symbol}})
//         }
//     } catch (e){console.error(post,e); }
// }
//
//
// //список инструментов
// export async function BinanceSymbolsAllEasySpot():Promise<{names: string[]}|undefined> {
//     const post='https://api1.binance.com/api/v3/exchangeInfo';
//     try{
//         const data:[]=(await (await fetch(post))?.json())?.symbols;
//
//         return {    //baseAssetPrecision
//             names: data.filter((m:any)=> (m.status=="TRADING" || 1 ) && (m.quoteAsset=="USDT" )).map((m:any)=>m.symbol)
//
//         }
//     } catch (e){console.error(post,e); }
// }


//
// export async function BinanceSymbolsAllObjUSDT():Promise<{symbols: {name:string}[]}|undefined> {
//     const quoteAsset= "USDT"
//     const post='https://api1.binance.com/api/v3/exchangeInfo';
//     try{
//         const data:[]=(await (await fetch(post))?.json())?.symbols;
//
//         return {    //baseAssetPrecision
//             symbols: data.filter((m:any)=> (m.status=="TRADING") && (quoteAsset? m.quoteAsset==quoteAsset: true )).map((m:any)=>{
//                 let filterType = m.filters as [];
//                 return {
//                     name:m.symbol,
//                     tickSize:m.filters?.[0]?.tickSize,
//                     minPrice:m.filters?.[1]?.tickSize,
//                     minStepLot:m.filters?.[0]?.tickSize, //minQty stepSize
//                     minQty:m.filters?.[2]?.minQty,
//                     stepSize:m.stepSize?.[2]?.minQty,
//             }})
//         }
//     } catch (e){console.error(post,e); }
// }
//список инструментов
//
// export async function BinanceSymbolsAllObj():Promise<{symbols: {name:string}[]}|undefined> {
//     const post='https://api1.binance.com/api/v3/exchangeInfo';
//     try{
//         const data:[]=(await (await fetch(post))?.json())?.symbols;
//
//         return {    //baseAssetPrecision
//             symbols: data.filter((m:any)=> (m.status=="TRADING") ).map((m:any)=>{
//                 let filterType = m.filters as [];
//                 return {
//                     name:m.symbol,
//                     tickSize:m.filters?.[0]?.tickSize,
//                     minPrice:m.filters?.[1]?.tickSize,
//                     minStepLot:m.filters?.[0]?.tickSize, //minQty stepSize
//                     minQty:m.filters?.[2]?.minQty,
//                     stepSize:m.stepSize?.[2]?.minQty,
//                 }})
//         }
//     } catch (e){console.error(post,e); }
// }




// export async function BinanceSymbolsAllSpot(callback:(names:string[])=>void) {
//     try{
//         const req = await fetch('https://api1.binance.com/api/v3/exchangeInfo');
//         const data= await req.json();
//
//         callback(data.symbols.filter((m:any)=> m.status=="TRADING" && m.quoteAsset=="USDT").map((m:any)=>m.symbol))
//     } catch (e){console.error(e); callback([])}
// }
//
// export function HuobiSymbols2(callback:(names:string[])=>void){
//     const data='https://api.hbdm.com/linear-swap-api/v1/swap_contract_info/';
//     //стндартные методы XMLHttpRequest для отправки
//     const req=new XMLHttpRequest;
//     req.setRequestHeader("1","1")
//    // req.setRequestHeader("Access-Control-Allow-Origin:", "*");
//    // req.setRequestHeader('Content-Type', 'application/xml');
//     req.open('GET',data);
//     //сохдаем масив элементов типа data[].symbol из полученных данных  и отправляе полученный масив в колбэк в виде string[]
//     req.onload=(data:ProgressEvent<XMLHttpRequest>)=>{console.log(data)}// callback(JSON.parse(data.target.response).map((m:any)=> m.symbol ));
//     req.onerror=(ev)=> {
//
//         console.error("ошибка при получении списка символов по запросу ",ev);
//         //отправляем то что ничего не проишло в callback - это важно
//         callback(undefined);
//     };
//     req.send();
// }

//
// async function HuobiSymbols() {
//
//     const post='https://api.hbdm.com/linear-swap-api/v1/swap_contract_info';
//
//  //   try{
//
//
//         let data=(await (await fetch(post, {
//             method: "GET",
//             mode: 'no-cors', // no-cors, *cors, same-origin, cors navigate
//         //    cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
//             credentials: 'include', // include, *same-origin, omit
//             headers: {
//         //        'Content-Type': 'application/json',
//                 'Access-Control-Allow-Origin':"*"
//                 // 'Content-Type': 'application/x-www-form-urlencoded',
//             },
//          //   redirect: 'follow', // manual, *follow, error
//          //   referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
//          //   body: "{}" //JSON.stringify(data) // body data type must match "Content-Type" header
//         })))//?on());
//
//         // app.use((req, res, next) => {
//         //     res.header("Access-Control-Allow-Origin": "*")
//         // })
//
//     //     data=JSON.parse(data)
//     //
//     //     return {
//     //         names: data.map((m:any)=>m.contract_code)
//     //     }
//
//  //   } catch (e){console.error(post,e); return undefined}
//
// }
//


//Прмиер подключения к АПИ МСтрейду /fapi/v1/klines


/*   "e": "24hrMiniTicker",  // Event type
    "E": 123456789,         // Event time
    "s": "BNBBTC",          // Symbol
    "c": "0.0025",          // Close price
    "o": "0.0010",          // Open price
    "h": "0.0025",          // High price
    "l": "0.0010",          // Low price
    "v": "10000",           // Total traded base asset volume
    "q": "18"               // Total traded quote asset volume
    */

//
// function handle(data) {
//     let symbol = data.ch.split('.')[1].replace('-','');
//     let channel = data.ch.split('.')[2];
//     switch (channel) {
//         case 'bbo':
//             // {
//             //     mrid: 17097068162,
//             //     id: 1622418573,
//             //     bid: [ 0.31165, 170 ],
//             //     ask: [ 0.31233, 350 ],
//             //     ts: 1622418573093,
//             //     version: 17097068162,
//             //     ch: 'market.CVC-USDT.bbo'
//             // }
//             break;
//         case 'kline':
//             // console.log('kline', data.tick);
//             break;
//     }
// }
//
// function subscribeBBO(ws) {
//     for (let symbol of huobiSymbols) {
//         ws.send(JSON.stringify({
//             "sub": `market.${symbol}.bbo`,
//             "id": `${symbol}`
//         }));
//     }
// }
//
//
// async function runHuobi() {
//     huobiSymbols = []
//     await getSymbols()
//     const ws = new WebSocket('wss://api.hbdm.com/linear-swap-ws');
//     ws.on('open', () => {
//         console.log('open');
//         subscribeBBO(ws)
//     });
//     ws.on('close', () => {
//         console.log('socket closed.');
//         runHuobi()
//     });
//     ws.on('error', err => {
//         console.log('error: ', err);
//         runHuobi();
//     });
//
//     ws.on('message', (data) => {
//         let text = pako.inflate(data, {
//             to: 'string'
//         });
//         let msg = JSON.parse(text);
//         if (msg.ping) {
//             ws.send(JSON.stringify({
//                 pong: msg.ping
//             }));
//         } else if (msg.tick) {
//             handle(msg);
//         } else {
//             console.log('text');
//             console.log(text);
//         }
//     });
// }

    /*


        const DateToSec = (date:Date):number=> {return Math.floor(date.valueOf()/1000)}
        //настраиваем конверсию времени
        const _callback=callback;
        let a=0; let aTFArr:{time:TF, name:string}[]=[];
        //перечисляем доступные методы закачки
        aTFArr[a++]={time:TF.M1, name: '1m'};//1m
        aTFArr[a++]={time:TF.M3, name: '3m'};//5m
        aTFArr[a++]={time:TF.M5, name: '5m'};//1h
        aTFArr[a++]={time:TF.M15, name: '15m'};//1d
        aTFArr[a++]={time:TF.M30, name: '30m'};//1d
        aTFArr[a++]={time:TF.H1, name: '1h'};//1d
        aTFArr[a++]={time:TF.H2, name: '2h'};//1d
        aTFArr[a++]={time:TF.H4, name: '4h'};//1d
        aTFArr[a++]={time:TF.H6, name: '6h'};//1d
        aTFArr[a++]={time:TF.H8, name: '8h'};//1d
        aTFArr[a++]={time:TF.H12, name: '12h'};//1d
        aTFArr[a++]={time:TF.D1, name: '1d'};//1d
        aTFArr[a++]={time:TF.W1, name: '1w'};//1d

        a=aTFArr.length-1;

        //ищем подходящее время для скачивания
        while (a>0 && aTFArr[a].time.sec>info.tf.sec) {a--;}
        let TFName:string=aTFArr[a].name;

        const account = "demo.demo";
        //формируем строку
        const data='https://api1.binance.com/api/v3/klines?symbol='+info.name+'&interval='+TFName+'&startTime='+String(info.time1.valueOf())+'&endTime='+String(info.time2.valueOf())+'&limit=1000'
        //стндартные методы XMLHttpRequest для отправки

        try{
            const parseData= (await (await fetch(data)).json());

            callback(
                parseData.map((m:any)=>{return {time:new Date(Number(m[0])),open:Number(m[1]),high:Number(m[2]),low:Number(m[3]),close:Number(m[4]),volume:Number(m[5])}}),  //массив данных
                aTFArr[a].time //какой именно таймфрейм пришел
            );
        } catch (e){console.error(e); callback(undefined, aTFArr[a].time);}*/

//
// //Прмиер подключения к АПИ Binance реализация через промисы
// export async function BinanceLoadEasyFutures(InfoForLoad: tInfoForLoadHistory): Promise<{bars: tSetHistoryData[], tf: TF}|undefined> {
//     //сколько баров можем закачать максимум
//     const maxLoadBars=980;
//
//     //перечисляем доступные методы закачки
//     const aTFArr: { time: TF, name: string }[] = [
//         {time: TF.M1, name: '1m'}
//         , {time: TF.M1, name: '1m'}
//         , {time: TF.M3, name: '3m'}
//         , {time: TF.M5, name: '5m'}
//         , {time: TF.M15, name: '15m'}
//         , {time: TF.M30, name: '30m'}
//         , {time: TF.H1, name: '1h'}
//         , {time: TF.H2, name: '2h'}
//         , {time: TF.H4, name: '4h'}
//         , {time: TF.H6, name: '6h'}
//         , {time: TF.H8, name: '8h'}
//         , {time: TF.H12, name: '12h'}
//         , {time: TF.D1, name: '1d'}
//         , {time: TF.W1, name: '1w'}
//     ];
//
//     let a = aTFArr.length - 1;
//     //ищем подходящее время для скачивания
//     while (a > 0 && aTFArr[a].time.sec > InfoForLoad.tf!.sec) {
//         a--;
//     }
//     const infoTF = aTFArr[a];
//
//     //редактируем показатель времени относительно запроса
//
//     if (InfoForLoad.right) {
//         if ((InfoForLoad.time1.valueOf()-InfoForLoad.time2.valueOf())/infoTF.time.valueOf()>maxLoadBars)
//             InfoForLoad.time2=new Date(InfoForLoad.time2.valueOf()+infoTF.time.valueOf()*maxLoadBars)
//     }
//     else
//         if ((InfoForLoad.time2.valueOf()-InfoForLoad.time1.valueOf())/infoTF.time.valueOf()>maxLoadBars)
//             InfoForLoad.time1=new Date(InfoForLoad.time2.valueOf()-infoTF.time.valueOf()*maxLoadBars)
//
//     //формируем строку
//     const data = 'https://fapi.binance.com/fapi/v1/klines?symbol=' + InfoForLoad.name + '&interval=' + infoTF.name + '&startTime=' + String(InfoForLoad.time1.valueOf()) + '&endTime=' + String(InfoForLoad.time2.valueOf()) + '&limit=1000'
//     //стндартные методы XMLHttpRequest для отправки
//
//     try {
//         const parseData= (await (await fetch(data)).json());
//         return {
//             bars: parseData?.map((m: any) => {
//                 return {
//                     time: new Date(+m[0]),
//                     open: +m[1],
//                     high: +m[2],
//                     low: +m[3],
//                     close: +m[4],
//                     volume: +m[5]
//                 }
//             }),
//             tf: infoTF.time
//         }
//     } catch (e) {
//         console.error(e);
//         // return {
//         //     bars: []
//         //     , tf: infoTF.time
//         // }
//     }
// }

//
//
// //Прмиер подключения к АПИ Binance реализация через промисы
// export async function MYLoadEasySpot(info: tInfoForLoadHistory): Promise<{bars: tSetHistoryData[], tf: TF}|undefined> {
//     //сколько баров можем закачать максимум
//     const maxLoadBars=980;
//
//     const saveTF = [TF.M1,TF.M5,TF.M15,TF.H1,TF.H4,TF.D1];
//
//     let tfName="";
//     for (let i = 0; i < saveTF.length; i++) {
//         if (!saveTF[i+1]) {tfName=saveTF[i].name; break;}
//         if (info.tf!.valueOf()<saveTF[i].valueOf()) {
//             tfName=saveTF[i].name; break;
//         }
//
//     }
//
//
//     //редактируем показатель времени относительно запроса
//     if ((info.time2.valueOf()-info.time1.valueOf())/infoTF.time.valueOf()>maxLoadBars)
//         info.time1=new Date(info.time2.valueOf()-infoTF.time.valueOf()*maxLoadBars)
//     //формируем строку
//     const data = 'http://api1.binance.com/api/v3/klines?symbol=' + info.name + '&interval=' + infoTF.name + '&startTime=' + String(info.time1.valueOf()) + '&endTime=' + String(info.time2.valueOf()) + '&limit=1000'
//     //стндартные методы XMLHttpRequest для отправки
//
//     try {
//         const parseData= (await (await fetch(data)).json());
//         return {
//             bars: parseData?.map((m: any) => {
//                 return {
//                     time: new Date(Number(m[0])),
//                     open: Number(m[1]),
//                     high: Number(m[2]),
//                     low: Number(m[3]),
//                     close: Number(m[4]),
//                     volume: Number(m[5])
//                 }
//             }),
//             tf: infoTF.time
//         }
//     } catch (e) {
//         console.error(e);
//         //     return {
//         //         bars: undefined
//         //         , tf: infoTF.time
//         //     }
//     }
// }

// /fapi/v1/continuousKlines

// console.log(info)
// //формируем строку
// const data = 'https://api1.binance.com/api/v3/klines?symbol=' + info.name + '&interval=' + infoTF.name + '&startTime=' + String(info.time1.valueOf()) + '&endTime=' + String(info.time2.valueOf()) + '&limit='+maxLoadBars
// //стандартные методы XMLHttpRequest для отправки
//
// try {
//     const parseData= (await (await fetch(data)).json());
//     const bars = parseData?.map((m: any):tSetHistoryData => {
//         return {
//             time: new Date(Number(m[0])),
//             open: Number(m[1]),
//             high: Number(m[2]),
//             low: Number(m[3]),
//             close: Number(m[4]),
//             volume: Number(m[5]),
//             tickVolume: Number(m[8])
//         }})
//     return {
//         bars,
//         tf: infoTF.time
//     }
// } catch (e) {
//     console.error(e);
// }


// пример кода
// [{
//     account: "demo.demo"
//     ask_price: 1.12793
//     bid_price: 1.12016
//     created: "2021-03-24T13:30:29.017916Z"
//     delta: -8.72
//     expiration: null
//     face_price: 0.0112244
//     pair: (2) ["ADA", "USDT"]
//     price: 1.12244
//     price24: 1.22972
//     reversed: false
//     schema: "margin1"
//     symbol: "ADAUSDT"
//     symbol_schema: "margin1"
//     system_symbol: "adausd"
//     tick: 0.00001
//     time: "2021-04-23T19:39:45Z"
//     timestamp: 1619206785000
//     volume24: 20389
//     volume_tick: 1},....]

    // const account = "demo.demo";
    // const data='https://api-sb.mstrade.org/api/v1/symbol/?account='+account+'&symbol_schema=margin1';
    // //стндартные методы XMLHttpRequest для отправки
    // const req=new XMLHttpRequest;
    // req.open('GET',data);
    // //сохдаем масив элементов типа data[].symbol из полученных данных  и отправляе полученный масив в колбэк в виде string[]
    // req.onload=(data:ProgressEvent<XMLHttpRequest>)=> callback(JSON.parse(data.target.response).map((m:any)=> m.symbol ));
    // req.onerror=(ev)=> {
    //     console.error("ошибка при получении списка символов по запросу ",data);
    //     //отправляем то что ничего не проишло в callback - это важно
    //     callback(undefined);
    // };
    // req.send();

//Прмиер подключения к АПИ МСтрейду
//
// export function MSLoadBPost(info: tInfoForLoadHistory,callback:(history: tSetHistoryData[], tf:TF)=> void):void {
//     const DateToSec = (date:Date):number=> {return Math.floor(date.valueOf()/1000)}
//     //настраиваем конверсию времени
//     let a=0; let aTFArr:{time:TF, name:string}[]=[];
//     //перечисляем доступные методы закачки
//     aTFArr[a++]={time:TF.M1, name: '1m'};//1m
//     aTFArr[a++]={time:TF.M5, name: '5m'};//5m
//     aTFArr[a++]={time:TF.H1, name: '1h'};//1h
//     aTFArr[a++]={time:TF.D1, name: '1d'};//1d
//
//     a=aTFArr.length-1;
//     //
//     // let httpMessage: HttpMessageRequest = {
//     //     // Authorizaton: "86e570bcf5e673719f47eb6027d1414cbd36a532",
//     //     // account: "demo.demo",
//     //     // schema: "Schema",
//     //     // symbols: ["BTCUSDT"],                    // список символов. Если не задано, то все доступные символы
//     //     // strategy: StrategySignal2Bars.name,     // стратегия
//     //     // strategyParams: params,                 // параметры стратегии. Если не задано, то используются параметры по умолчанию
//     //     // timeframes: ["H1"],                     // список таймфреймов.  Если не задано, то все доступные таймфреймы
//     //     // side: undefined,                        // направление сигналов (0 - покупки, 1 - продажи).  Если на задано, то любые сигналы
//     // }
//     // const data = await (await post(httpMessage)).json();
//     //ищем потходящее время для скачивания
//     // while (a>0 && aTFArr[a].time.sec>info.tf!.sec) {a--;}
//     let TFName:string=aTFArr[a].name;
//     //"&Authorizaton=86e570bcf5e673719f47eb6027d1414cbd36a532"
//     const account = "demo.demo";
//     //формируем строку
//     const data='https://api-sb.mstrade.org/api/v1/quote/'+info.name+'/?account='+account+'&binsize='+TFName+'&from='+String(DateToSec(info.time1))+'&to='+String(DateToSec(info.time2))+'&schema=margin1';
//     //стндартные методы XMLHttpRequest для отправки
//     const req=new XMLHttpRequest;
//     req.open('GET',data);
//     // @ts-ignore
//     req.onload=(data:ProgressEvent<XMLHttpRequest>)=>{
//         const parseData=JSON.parse(data!.target!.response);
//         if (!(parseData instanceof Array)) return;
//         callback(
//             parseData?.map((m:any)=>{return {time:new Date(m.time),open:m.open,high:m.high,low:m.low,close:m.close,volume:m.volume}}),  //массив данных
//             aTFArr[a].time //какой именно таймфрейм пришел
//         );
//     };
//     req.onerror=(error)=> {
//         console.error("ошибка при получении котировок по запросу ",data,error);
//         //отправляем то что ничего не проишло в callback - это важно
//         callback([], aTFArr[a].time);
//     };
//     req.send();
//
// }

//
//
