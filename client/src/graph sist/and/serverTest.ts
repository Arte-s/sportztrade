import {CTestWeb, funcForPost, funcForWebSocket, funcScreenerClient2, screenerSoc2} from "./commonsServer";
import {IScreenerRun, ScreenerRun} from "./screener/screenerRun";



// funcForWebSocket
// Пример для WebSocket сокета для клиента
export async function fTestR() {

    async function f() {
        test2.func(2,4).then(e=>console.log(e))
        test2.func2(2,4).then(e=>console.log(e))
        test2.fun3(2,4).then(e=>console.log(e))
    }
    const url = 'ws://127.0.0.1:3005/';
//стандартные методы ВебСокета
    const socket =new WebSocket(url);
    let apiTT : {onMessage: (data: any) => void | Promise<void> }
    const ttt = funcForWebSocket<any>({
        sendMessage:(data: object) => socket.send(JSON.stringify(data)),
        api:(api) => apiTT=api
    })
    socket.onmessage= (e)=>{
        if (!e) return
        console.log(e);
        const data = JSON.parse(e.data)
        apiTT.onMessage(data)
    }
    socket.onopen = ()=>{
        f();
    }
    const test2 = funcScreenerClient2<CTestWeb>(ttt)
}


export async function fTestR2() {
    async function f() {
        test2.test().then(e=>console.log(e))
        test2.func(2,4).then(e=>console.log(e))
        test2.func2(2,4).then(e=>console.log(e))
        test2.fun3(2,4).then(e=>console.log(e))
    }
    const host = "http://localhost:"
    const port = "3013"
    const address = "/api/"

    const ttt = funcForPost<CTestWeb>(host + port + address)

    const test2 = funcScreenerClient2<CTestWeb>(ttt)

    f()



}



function funcServerPost() {
   return async (req: any, res: any)=>{
        const result = {}
        res.status(200).json(result)
   }
}

    //
    // app.post('/api/', async (req, res)=>{
    //     console.log(req.body)
    //     res.status(200).json(await signalAPI.onHTTPMessage(
    //         req.body,
    //         async (symbol, minTF, fromTime) => ({
    //             symbol: symbol,
    //             history: history.get("Binance")!.get(symbol.name)!.history,
    //             time: new Date()  //какое именно время надо отправить?
    //         })
    //     ))
    // })



// function funcServerInit() {
//     wssTest.on('connection', (ws) => {
//         console.log("start")
//         const send = (data: object) => {
//             try {
//                 ws.send(JSON.stringify(data))
//             }
//             catch (e) {
//                 console.log("22",e);
//             }
//         }
//         const t = new CTestWeb()
//
//         let api: {onMessage: (data: any) => void|Promise<void> }
//         funcPromiseServer({sendMessage:send, api:(_api) => {
//                 api=_api
//             }},t)
//
//         ws.on('message', (message) => {
//             try{
//                 const mes = message.toString('utf8')
//                 const data = JSON.parse(mes)
//                 api.onMessage(data)
//             }
//             catch (e) {
//                 console.log(e);
//             }
//
//         });
//     });
// }
//
// funcServerInit()
//
