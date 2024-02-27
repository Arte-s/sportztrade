import {IndicatorAny, createIndicatorInstance,tOnInitIndicator,TF,CParams,IParams,SimpleParams} from "../and/indicatorAPI";
import {Strategy} from "../Nav/Strategy";
import {IParamsReadonly} from "../and/CParams";
import {Trader} from "../Nav/Trader";
import {PendingSignal, Signal, SignalExt, SignalID,UserSignal} from "./Signal";
import {Order, OrderID,OrderModify,OrderNew} from "../Nav/Orders";
import {CATR} from "../Nav/Indicator";
//import {tAddressSymbol, tSymbolInfoBase} from "../and/interface/IHistoryBase";


class CTradeParamsInfo extends CParams {
    tradeDuration_bars = {name: "Длительность сделки, бары", value: 5, range: {min: 1, defaultMax: 100, step: 1}, enabled: true};
    tp_atrPerc= {name: "Тэйкпрофит, %atr", value: 100, range: {min: 0, defaultMax: 1000, defaultStep: 10}, enabled: false};
    sl_atrPerc= {name: "Стоплосс, %atr", value: 100, range: {min: 0, defaultMax: 1000, defaultStep: 10}, enabled: false};
    //setNoLoss = { name: "перевод в безубыток", value: false };
    trailingStopByBars = { name: "трэйлинг-стоп по барам", value: false };
    trailingStopDelta_atrPerc = { name: "дельта трэйлинг стопа, %atr", value: 10, range: { min: 0, defaultMin: 5, defaultMax: 200, defaultStep: 5 } };

    atr_bars = { name: "ATR bars", value: 20, range: { min: 2, defaultMax: 50, step: 1} };
}


type IndicatorStrategyParamsInfo<T extends IParamsReadonly> = { indicatorConfig: { name: string, value: T } } & CTradeParamsInfo;

function getIndicatorStrategyParamInfo<TParams extends IParamsReadonly>(indName: string, indParamInfo :TParams) : IndicatorStrategyParamsInfo<TParams> {
    return Object.assign(new CParams(), {
            indicatorConfig: { name: indName, value: indParamInfo }, //
            ...new CTradeParamsInfo()
    });// as IndicatorStrategyParamsInfo<TParams>
}

//class __helper<TParams extends IParamsReadonly> { params= getIndicatorStrategyParamInfo("", {} as TParams); }

//type IndicatorStrategyParamsInfo<T extends IParamsReadonly> = ReturnType<typeof getIndicatorStrategyParamInfo<T>>; // Не компилируется в реакте!!!
//type IndicatorStrategyParamsInfo<T extends IParamsReadonly> = __helper<T>["params"];





export function indicatorToStrategy<TParams extends IParamsReadonly>(indicator :IndicatorAny<TParams>) : Strategy<IndicatorStrategyParamsInfo<TParams>> {
    return {
        name: "auto_"+indicator.Name,
        version: indicator.Version,
        paramInfo: getIndicatorStrategyParamInfo(indicator.Name, indicator.paramInfo as TParams),
        //{
        //     indicatorConfig: { name: "Индикатор", value: indicator.paramInfo as TParams}, //
        //     ...new CTradeParamsInfo()
        // } as IndicatorStrategyParamsInfo<TParams>,

        getTrader(params, tf, onInitData) {
            let _ind= createIndicatorInstance(indicator, params.indicatorConfig as SimpleParams<TParams>, onInitData ?? tf);
            type tOnActivate = (signal :SignalExt, time :const_Date)=>void;
            let _onActivateMap = new Map<SignalID, {type: UserSignal["type"], onActivate: tOnActivate}>(); //(signal : time :const_Date)=>void>();
            let _orderToBarExtremMap = new Map<OrderID, number>();
            let _atrInd= new CATR(params.atr_bars);
            let _lastATR = 0;
            const needATR= (params.trailingStopByBars || params.tp_atrPerc || params.sl_atrPerc);

            let trader : Trader = {
                onBar(bar, closed:boolean, allBars, ordersAPI, activatedOrders, allOrders) {
                    // перебираем активированные ордера
                    for(let act of activatedOrders) {
                        let id= act.order.id as number as SignalID;
                        let data= _onActivateMap.get(id);
                        if (data) { data.onActivate({...act.order, type: data.type ?? "stop", id}, act.order.time);  _onActivateMap.delete(id); }
                    }
                    if (needATR)
                        _atrInd.push(bar);
                    let atr = _atrInd.value();

                    function getOrderSLTP(order :OrderNew) {
                        let signalPrice= order.price ?? bar.close;
                        let k= order.volume>0 ? 1 : -1;
                        let data : OrderModify = {};
                        if (params.tp_atrPerc!=null) data= {takeProfit: signalPrice + params.tp_atrPerc/100 * atr * k};
                        if (params.sl_atrPerc!=null) data= {...data, stopLoss: signalPrice - params.sl_atrPerc/100 * atr * k};
                        return data;
                    }
                    // если СЛ/ТП ещё не устанавливались из-за отсутствия ATR, то устанавливаем их
                    if (atr && !_lastATR && (params.sl_atrPerc || params.tp_atrPerc)) {
                        for(let order of allOrders) {
                            ordersAPI.modify(order.id, getOrderSLTP(order));
                        }
                    }

                    _lastATR= atr;

                    if (params.trailingStopByBars==true && closed) {
                        if (atr)
                            for(let order of allOrders.actives()) {
                                if (bar.time > order.time || (bar.close - bar.open) * order.volume >1e-10) {
                                    let k= Math.sign(order.volume);
                                    let barPrice1= k==1 ? bar.high : bar.low;
                                    let barExtrem= _orderToBarExtremMap.get(order.id);
                                    if (barExtrem==null || (barPrice1-barExtrem)*k >0) {
                                        _orderToBarExtremMap.set(order.id, barExtrem= barPrice1);
                                        let barPrice2= k==1 ? bar.low : bar.high;
                                        let sl= barPrice2 - atr * params.trailingStopDelta_atrPerc/100 * k;
                                        let stopLoss= order.stopLoss;
                                        if ((sl - order.price) * k >= 0)
                                            if (! stopLoss || (sl - stopLoss) * k > 0)
                                                stopLoss= sl;
                                        if (stopLoss!=order.stopLoss)
                                            ordersAPI.modify(order.id, {stopLoss});
                                    }
                                }
                            }
                    }

                    if (params.tradeDuration_bars!=null) {
                        for(let order of allOrders.actives())
                            if (bar.time.valueOf() - order.time.valueOf() >= params.tradeDuration_bars * tf.msec)
                                ordersAPI.remove(order.id);
                    }

                    _ind.onBar2(bar, allBars, {
                         add(signal, onActivate? :tOnActivate) {
                            let order : OrderNew = signal;
                            if (atr && (params.sl_atrPerc || params.tp_atrPerc)) {
                                order= {...order, ...getOrderSLTP(order)};
                            }
                            let id= ordersAPI.add(order) as number as SignalID; //{volume: signal.volume, price: signal.price, })
                            if (onActivate) _onActivateMap.set(id, {type: signal.type, onActivate});
                            return id;
                         },
                         set(signals, onActivate? :tOnActivate) {
                             ordersAPI.clear();
                             let ids= signals.map(signal=>this.add(signal as PendingSignal, onActivate));
                             return ids;// as readonly number[] as readonly SignalID[];
                         },
                         delete(id) { ordersAPI.remove(id as number as OrderID); }
                    });
                },
                indicators: [_ind]
            }
            return trader;
        }
    }
}

