import {tInfoForLoadHistory, tSetHistoryData} from "../and/interface/IHistoryBase";
import {TF} from "../Nav/Time";
import qs from "querystring";
import https from "https";
import http from "http";

const dbName = "history"



//Пример подключения к АПИ Binance реализация через промисы
export async function HistoryLoadDB(InfoForLoad: tInfoForLoadHistory): Promise<{bars: tSetHistoryData[], tf: TF}|undefined> {
    const DateToSec = (date:Date):number=> {return Math.floor(date.valueOf()/1000)}


    //перечисляем доступные методы закачки
    const aTFArr: { time: TF, name: string }[] = [
        {time:TF.M1, name: 'M1'}
        ,{time:TF.M5, name: 'M5'}
        ,{time:TF.M15, name: 'M15'}
        ,{time:TF.H1, name: 'H1'}
        ,{time:TF.D1, name: 'D1'}
    ];

    let a = aTFArr.length - 1;
    //ищем подходящее время для скачивания
    while (InfoForLoad.tf && a > 0 && aTFArr[a].time.sec > InfoForLoad.tf.sec) {
        a--;
    }
    const infoTF = aTFArr[a];

    const {time1,time2,name} = InfoForLoad;
    //формируем строку

    const data2="http://canvas.mstrade.org:8123"

    const data=`http://canvas.mstrade.org:8123/?add_http_cors_header=1&user=default&password=&query=SELECT * FROM history.Binance${name+infoTF.name} WHERE time>=${DateToSec(time1)} AND time<=${DateToSec(time2)} FORMAT JSONCompact`;

    try {
        const parseData= (await (await fetch(data)).json());

        console.log("parseData ",parseData);
        return {
            bars: parseData?.data.map((m: any) => {
                return {
                    time:new Date(m[0]),
                    open:m[1],
                    high:m[2],
                    low:m[3],
                    close:m[4],
                    volume:m[5]
                }
            }),
            tf: infoTF.time
        }
    } catch (e) {
        console.error(e);
        // return {
        //     bars: undefined
        //     , tf: infoTF.time
        // }
    }
}


function httpRequest (reqParams:any, reqData:any, cb:any) {
    // if (reqParams.query) {
    //     reqParams.path = (reqParams.pathname || reqParams.path) + '?' + qs.stringify (reqParams.query);
    // }
    //
    // var stream = new RecordStream ({
    //     format: reqData.format
    // });
    // var requestInstance = reqParams.protocol === 'https:' ? https : http;
    // var req = requestInstance.request (reqParams, httpResponseHandler.bind (
    //     this, stream, reqParams, reqData, cb
    // ));
    //
    // req.on ('error', function (e) {
    //     // user should define callback or add event listener for the error event
    //     if (!cb || (cb && stream.listeners ('error').length))
    //         stream.emit ('error', e);
    //     return cb && cb (e);
    // });
    //
    // req.on('timeout', function (e) {
    //     req.abort();
    // })
    //
    // stream.req = req;
    //
    // if (reqData.query)
    //     req.write (reqData.query);
    //
    // if (reqData.finalized) {
    //     req.end();
    // }
    //
    // return stream;
}