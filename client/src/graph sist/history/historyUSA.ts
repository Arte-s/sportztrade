// const fetch = (...args: any[]) => import('node-fetch').then(({default: fetch}) => fetch(...args));
type  tFetch = ((input: RequestInfo | URL, init?: RequestInit | undefined) => Promise<Response>)|any
// обертка функции для работы на nodejs
type tBinanceSymbolsAllObjs = {
    fetch?: tFetch,
    quoteAsset?: string
}

const keyId = 'PKPS9FVSGX098DCVMUJX'
const secretKey = 'KhUn5qlchuAhCEyN9bfs4ByKzvj2SNr21czzldZe'
export namespace LoadHistoryDataUSA {
    const timeframes = {
        M1: '1Min',
        M5: '5Min',
        M15: '15Min',
        M30: '30Min',
        H1: '1Hour',
        H4: '4Hour'
    }

    async function funcAsyncTry<T,E>(func: T, errorFunc?:(error:E) => void ) {
        try {return func} catch (e: E|any) {
            errorFunc? errorFunc(e) : console.error(e)
        }
    }

    async function getBars2(){
        return funcAsyncTry(getBars)
    }
    /// start toISOString
    export type tGetBars = {fetch: tFetch, symbol: string, start: string, end: string, limit: number, tf: string}
    export async function getBars({end,limit,start,tf,fetch,symbol} : tGetBars) {
        const url = `https://data.alpaca.markets/v2/stocks/${symbol}/bars?start=${start}&end=${end}&limit=${limit}&timeframe=${tf}`
        const res = await (await fetch(url, {
            method: 'get',
            headers: {"Content-Type": "application/json",
                "Accept-Encoding": "gzip",
                "APCA-API-KEY-ID": keyId,
                "APCA-API-SECRET-KEY": secretKey}
        }))?.json();
        return res.bars
        // [{
        //     t: '2020-12-09T16:15:00Z',
        //     o: 125.08,
        //     h: 125.27,
        //     l: 124.87,
        //     c: 125.23,
        //     v: 2172211,
        //     n: 16541,
        //     vw: 125.053157
        //   }]
    }

    // getBars('AAPL',new Date('2020-12-09T16:09:53-00:00'),10, timeframes.M15).then(()=>{})


    export async function getSymbols(fetch: tFetch) {
        const url = 'https://paper-api.alpaca.markets/v2/assets?status=active&asset_class=us_equity'
        const res = await fetch(url, {
            method: 'get',
            headers: {
                "Content-Type": "application/json",
                "Accept-Encoding": "gzip",
                "APCA-API-KEY-ID": keyId,
                "APCA-API-SECRET-KEY": secretKey
            }
        });
        const data = await res.json();
        //  [{
        //     id: 'd8d066a8-7e76-44e9-a293-6485e91a4e09',
        //     class: 'us_equity',
        //     exchange: 'NASDAQ',
        //     symbol: 'EPHY',
        //     name: 'Epiphany Technology Acquisition Corp. Class A Common Stock',
        //     status: 'active',
        //     tradable: true,
        //     marginable: true,
        //     maintenance_margin_requirement: 30,
        //     shortable: true,
        //     easy_to_borrow: true,
        //     fractionable: false
        // //   }]
        // const filtered = data.filter((item:any)=>item.tradable && item.marginable && item.shortable)
        // const syms = new Set<object>()
        // for(const x of filtered) syms.add(x)  // x.symbol
        return  data?.filter((item:any)=>item.tradable && item.marginable && item.shortable) ?? []
    }

}
