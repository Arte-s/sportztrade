import {CBar, CBars, CQuotesHistoryMutable, CreateRandomBars, IBarsImmutable, TF} from "../graph sist/Nav/MarketData";
import {iApiExchange} from "../sistem/base/Position";


export type tGetHistory = {symbol: string, tf?: TF, start?: Date, end?: Date, limit?: number}
type tSaveSymbols = {symbol: string, bars: CBars|IBarsImmutable}
type tLoadFromDB = {
    getSymbols():                           Promise<string[]>,
    saveSymbols(data: tSaveSymbols):        Promise<void>,
    getHistory(data: tGetHistory):          Promise<CBars>,
    saveHistory(data: tSaveSymbols):         Promise<void>
}
function ApiBD():tLoadFromDB {
    // const newBars = CreateRandomBars(TF.M1, new Date(2022, 1, 1), new Date())
    return {
        // загрузка символов с база
        async getSymbols() {
            return []
        },
        async saveSymbols(data: tSaveSymbols) {

        },
        // загрузка истории с базы
        async getHistory(data: tGetHistory) {
            const bars: CBar[] = []
            const tf: TF = TF.M1
            // загружаем

            return new CBars(tf, bars)
        },
        async saveHistory(data: tGetHistory) {

        }
    }
}

export type tApiHistoryServer = {
    getHistory(data: tGetHistory): Promise<{readonly bars: readonly CBar[], tf: TF}>,
    getSymbols(): Promise<string[]>,
}
// Инициализация сервера истории
async function FHistoryServerInitAsync(eApi: iApiExchange ): Promise<tApiHistoryServer> {
    // берем наше АПИ
    const api = eApi
    const apiBD = ApiBD()
    // получаем список символов
    const symbols = await api.getSymbols()
    // если нет, то ???? берем ли с базы

    // создаем все файлы истории
    const sHistory = new Map(symbols.map(e=> [e, new CQuotesHistoryMutable(e)]))
    // подключаемся по всем символам к котировкам
    api.setEventTicks({
        func: () => ({
            onTicks({symbol, bid, bidV, time}) {
                sHistory.get(symbol)?.AddNewTick({price: bid, volume: bidV, time: time})
            }
        })
    })

    // загружаем историю из БД если нет, то Создаем и сохраняем
    const arr: Promise<any>[] = [...sHistory.entries()].map(([symbol,h])=>(
        async ()=> {
            const bars = await apiBD.getHistory({symbol})
            if (bars.data.length) h.AddEndBars(bars)
            else {
                const newBars = CreateRandomBars(TF.M1, new Date(2023, 11, 1), new Date(), 1000,undefined,1)
                console.log("созданы котировки с по ",newBars.data.at(1)?.time , newBars.data.at(-1)?.time);
                h.AddEndBars(newBars)
                apiBD.saveHistory({symbol, bars: h.Bars(TF.M1)!})
            }
        }
    )());

    await Promise.allSettled(arr)

    const getHistory = async (data: tGetHistory) =>{
        const history = sHistory.get(data.symbol)
        if (!history)               throw "нет данного символа" + data.symbol
        if (!history.minTf)         throw "у символа " +data.symbol +" нету TF"
        const bars = history.Bars(data.tf ?? history.minTf)
        if (!bars)                  throw "нет истории по символу" + data.symbol
        // обрезка по времени
        const startTime = data.start ?? bars.time(0)
        const endTime = data.end ?? bars.lastTime
        // const endTime = data.end ?? (data.start && data.limit && data.tf && new Date(data.start.valueOf() - data.limit*data.tf.valueOf()))
        const sliceBars = bars.sliceByTime(startTime, endTime)
        return sliceBars
    }

    // на этом всё
    return {
        async getHistory(data: tGetHistory) {
            try {
                const t = await getHistory(data)
                return {bars: t.data, tf: t.Tf}
            } catch (e) {
                // будем ли перехватывать и обрабатывать ошибку?
                throw e
            }
        },
        async getSymbols(): Promise<string[]> {
            return [...sHistory.keys()]
        }
    }

}

export function FHistoryServerInit(eApi: iApiExchange ): tApiHistoryServer {
    const result = FHistoryServerInitAsync(eApi)
    return {
        async getHistory(data: tGetHistory) {
            return (await result).getHistory(data)
        },
        async getSymbols(): Promise<string[]> {
            return result.then(e=>e.getSymbols())
        }
    }
}

