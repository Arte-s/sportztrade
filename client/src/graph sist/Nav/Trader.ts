import {sleepAsync} from "./Common";
import {CBar, CBarsMutableExt, CQuotesHistory, IBars, IBarsExt, Period, TF} from "./MarketData";

import {GetSimpleParams, IParams, SimpleParams} from "../and/CParams";
import {IndicatorData} from "../and/interface/IIndicator";
import {IIndicator} from "./Indicator";
import {Strategy} from "./Strategy";
import {
    Order,
    OrderExecutionInfo,
    OrderID,
    OrderModify,
    OrderNew,
    OrdersAPI,
    OrdersController,
    TraderCallbacks2,
    convertTraderCallbacks2To1,
    IOrders,TraderCallbacks
} from "./Orders";

import {CGraphSLTP} from "../ind/CTrader";
import {ILine} from "./CGraphObject";

//type OrderPartial = Readonly< { volume: number; stopLoss? :number, takeProfit? :number } & ({ price? :number, type: undefined } | { price: number; type: "limit"|"stop" } ) >

//type Order= OrderPartial & { price :number; time :number; }//  id :OrderId }


// let isObj : OrderId extends object ? true : false = true;
// let a : OrderId = 10;
// //new WeakMap<OrderId, number>();



export type TraderBase = Readonly<{
    minRequiredDepthBars? :number;
    indicatorValues? : readonly IIndicator[];
}>


export interface Trader extends TraderBase, Readonly<{
    // Событие прихода бара, где:  closed - закрыт ли бар;  ordersAPI - торговое АПИ;  activatedOrders - активированные ордера с момента предыдущего вызова
    onBar(bar :CBar, closed: boolean, allBars: IBarsExt, ordersAPI :OrdersAPI, activatedOrders :readonly OrderExecutionInfo[], allOrders: IOrders) : void;
    indicators? : readonly IndicatorData[];
}> { }




type TraderConstructor<T extends IParams> = Strategy<T>["getTrader"]; //    (info :SimpleParams<T>, tf :TF)=>Trader;

//type Signal= Readonly< { volume: number; stopLoss? :number, takeProfit? :number} & ({ price? :number } | { price: number; type: "limit"|"stop" } ) >




function getBarPriceTime(bar :CBar, tf :TF, price :number, k: 1|-1, barUp? :boolean) {
    barUp ??= bar.close > bar.open;
    let shadowPrice= k==1 ? bar.high : bar.low;
    if ((shadowPrice-price)*k < 0) return undefined;
    if ((bar.open-price)*k >= 0) return bar.time;
    //return new Date(bar.time.valueOf() + tf.msec* (barUp==(k==1) ? 2/3.0 : 1/3.0));
    return new Date(bar.time.valueOf() + tf.msec* (barUp==(k==1) ? 2/3.0 : 1/3.0));
}




export function CreateTraderWrapper<T extends IParams> (name :string, constructor :TraderConstructor<T>, params :SimpleParams<T>, tf :TF)
{
    let _trader= constructor(params, tf);
    let _data = OrdersController();
    let _oldExecutions : OrderExecutionInfo[] = [];
    const _bars = new CBarsMutableExt(tf);
    //let _lastTime : const_Date|undefined;
    let _lastBar : CBar|undefined;
    //_bars.lastBarClosed = true;
    const _sltpGraph = new CGraphSLTP(tf, name);

    function drawSLTP(orderData :Partial<Order>, time :const_Date) {
        if (orderData.type) return;
        if (orderData.stopLoss!=null) _sltpGraph.addSL(time, orderData.stopLoss);
        if (orderData.takeProfit!=null) _sltpGraph.addTP(time, orderData.takeProfit);
    }

    return { //new class { //implements Trader {

        orders : _data.orders,

        get indicators() : typeof _trader.indicators { return (_trader.indicators ?? []).concat(_sltpGraph); },

        get indicatorValues() : typeof _trader.indicatorValues { return _trader.indicatorValues; },

        *onBarsGenerator (bars :readonly CBar[], lastClosed :boolean= true, lastTime? :const_Date|null, history? :CQuotesHistory|null) {
            for(let [i,bar] of bars.entries()) {
                this.onBar(bar, i<bars.length-1 ? true : lastClosed, i<bars.length-1 ? null : lastTime??null, history);
                yield true;
            }
        },

        async onBars(bars :readonly CBar[], lastClosed :boolean= true, lastTime? :const_Date|null, history? :CQuotesHistory|null) {
            let t= Date.now();
            for(let a of this.onBarsGenerator(bars, lastClosed, lastTime, history)) {
                if (Date.now()-t > 20) { await sleepAsync(0);  t=Date.now(); }
            }
        },

        onBar(bar :CBar, closed :boolean, currTime :const_Date|null, history? :CQuotesHistory|null, callbacks_? :TraderCallbacks2) {

            const callbacks0 = callbacks_ ? convertTraderCallbacks2To1(callbacks_) : undefined;
            // добавляем рисование SL/TP
            const callbacks : typeof callbacks0 = {
                ...callbacks0,
                onAdd(order) { drawSLTP(order, order.time);  callbacks0?.onAdd(order); },
                onActivate(order, time) { drawSLTP({...order, type: undefined}, time);  callbacks0?.onActivate?.(order, time); },
                onModify(order, data, time) { drawSLTP(data, time);  callbacks0?.onModify?.(order, data, time); },
            };

            let barEndTime= Period.EndTime(tf, bar.time);
            let time= currTime ?? barEndTime;

            const debug = false; //bar.time.valueOf()==Date.parse("2022-10-14 19:00") || bar.time.valueOf()==Date.parse("2022-10-14 20:00");

            if (debug)
                console.log("Bar:",bar);

            //if (!_lastTime || bar.time > _lastTime) _bars.push(bar);
            if (bar==_lastBar) return;
            if (bar.time.valueOf()==_bars.lastTime?.valueOf())
                if (_bars.lastBarClosed) throw "Текущий бар уже был закрыт "+bar.time.toString();
            _bars.updateLast(bar);
            // else _bars.data[_bars.length-1]= bar;
            _bars.lastBarClosed= closed;
            _lastBar= bar;
            let executions = _data.onBar(bar, tf, history, callbacks);

            if (debug)
                console.log({_oldExecutions, executions});
            if (_oldExecutions.length>0) executions= _oldExecutions.concat(executions);
            //if (executions.length >0) console.log("Executions: ",executions);


            function getType(order :OrderNew) {
                let type= order.type;
                let price= order.price;
                if (!type) {
                    if (price!=null) type= (price-bar.close)*order.volume > 0 ? "stop" : "limit";
                }
                else {
                    if (!price) throw "order price is undefined";
                    let k= (type=="stop" ? 1 : -1) * order.volume;
                    if ((bar.close - price)*k >-1e-10) type= undefined;
                }
                return type;
            }


            let api : OrdersAPI =
            {
                add(order_ :OrderNew) :OrderID {
                    let order : Order = {...order_, price: order_.price ?? bar.close, time: time!, type: getType(order_) };
                    //console.log("add:",order_, "price!:",bar.close, history?.name ? "symbol: "+history?.name : "");
                    //console.log("result add:",order);
                    let orderExt= _data.add(order, callbacks);
                    console.log("add end");
                    //callbacks?.onAdd(orderExt); //{...order, id});
                    return orderExt.id;
                },
                remove(id :OrderID|null|undefined) {
                    if (id!=null) {
                        return _data.remove(id, time, callbacks);
                    }
                },
                modify(id :OrderID, params :OrderModify) {
                    return _data.modify(id, params, barEndTime, callbacks);
                    // callbacks?.onModify?.(id, params);
                    // if (order) callbacks?.onModify2?.(order, params);
                },
                clear() { for(let order of _data.orders) _data.remove(order.id, time, callbacks); }
            }

            _trader.onBar(bar, closed, _bars, api, executions, _data.orders);

            if (debug) console.log("onBarEnd");

            _oldExecutions= _data.refreshLastTick(callbacks);
        }
    } as const;
}



export type TraderWrapper = ReturnType<typeof CreateTraderWrapper>;




// function CreateFullTraderExt(constructor :TraderConstructor, info :SimpleParams, tf :TF) {
//
//
// }








//
// function onSubscribe(info : { symbol: string}) {
//     let trader= Trader(info);
//     let bars : IBars; //
// }



export function traderCallbacksDefault(bar :CBar) {
    let callbacks : TraderCallbacks2 = {
        onAdd(order) {
            if (1) console.log(order.time,": Add #"+order.id, order, "barClosePrice:", bar.close);
        },
        onActivate2(order, time) {
            if (1) console.log(time,": Activate #"+order.id, order);
        },
        onRemove2(order, time, price) {
            let isMarket= order.type==null;
            if (1) console.log(time, ": "+(isMarket ? "Close" : "Delete")+" #"+order.id, order, isMarket ? "price="+price : "");
        },
        onModify2(order, data, time :const_Date) {
            if (1) console.log(time,": Modify #"+order.id, data);
        }
    };
    return callbacks;
}



export function testStrategyDefault(strategy: Strategy, bars: IBars) {
//export function testTraderDefault(trader :Trader, params :SimpleParams, bars: IBars) {
    let parameters = GetSimpleParams(strategy.paramInfo);
    console.log("!!! TestStrategy:", strategy.name);
    console.log("parameters:\n", parameters)
    //let trader= strategy.getTrader(GetSimpleParams(strategy.paramInfo), bars.Tf);
    //return;
    let traderExt = CreateTraderWrapper(strategy.name, strategy.getTrader, parameters, bars.Tf); //CreateTraderExt(Trader_Signal2Bars, GetSimpleParams(new CParamInfo_Signal2BarsFull()), bars.Tf);
    for (let bar of bars) {
        traderExt.onBar(bar, true, null, null, traderCallbacksDefault(bar));
    }

    console.log("order table: ", [...traderExt.orders])
}