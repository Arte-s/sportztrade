import {CBar, CQuotesHistory, IBars, Period, TF} from "../Nav/MarketData";

import {Order, COrders, IOrders, OrderExecutionInfo, OrderExt, OrderID, OrderModify, OrderExecutionInfoExt} from "./OrdersBase";
import {newOrdersManager} from "./OrdersBase";
export * from "./OrdersBase";


export type TraderCallbacks = Readonly<{
    onAdd: (order: OrderExt) => void;
    onActivate?: (order: OrderExt, time: const_Date) => void;
    onRemove?: (order: OrderExt, time: const_Date, price: number) => void;
    onModify?: (order: OrderExt, data: OrderModify, time: const_Date) => void;
    onPrice?: (price: number) => void
}>


export type TraderCallbacks2 = Readonly<{
    onAdd: (order: OrderExt) => void;
    onActivate?: (order: OrderID, time: const_Date) => void;
    onActivate2?: (order: OrderExt, time: const_Date) => void;
    onRemove?: (order: OrderID, time: const_Date, price: number) => void;
    onRemove2?: (order: OrderExt, time: const_Date, price: number) => void;
    onModify?: (order: OrderID, data: OrderModify, time: const_Date) => void;
    onModify2?: (order: OrderExt, data: OrderModify, time: const_Date) => void;
    onPrice?: (price: number) => void
}>


export function convertTraderCallbacks2To1(callbacks :TraderCallbacks2) : TraderCallbacks {
    return {
        onAdd: callbacks.onAdd,
        onActivate(order, ...args) { callbacks.onActivate?.(order.id, ...args);  callbacks.onActivate2?.(order, ...args); },
        onRemove(order, ...args) { callbacks.onRemove?.(order.id, ...args);  callbacks.onRemove2?.(order, ...args); },
        onModify(order, ...args) { callbacks.onModify?.(order.id, ...args);  callbacks.onModify2?.(order, ...args); },
        onPrice :callbacks.onPrice
    }
}




export function OrdersController() {

    let _manager= newOrdersManager();

    let _lastPrice: number | undefined;
    let _lastTime: const_Date | undefined;

    let _needRefresh = false;

    // function checkMultiControlPoints(points :{price :number, timeGetter :()=>const_Date}[], lastPrice? :number, callbacks? :TraderCallbacks) {
    //     let executions= checkOrdersControlPoint(price, timeGetter, lastPrice, callbacks);
    // }
    //

    function _onTick(time: const_Date|(()=>const_Date), price: number, callbacks?: TraderCallbacks) : OrderExecutionInfo[] {
        let executions = _manager.onTick(time, price);
        for(let exec of executions)
            if (exec.mode=="open")
                callbacks?.onActivate?.(exec.order, exec.execTime);
            else
                callbacks?.onRemove?.(exec.order, exec.execTime, exec.execPrice);
        return executions;
    }

    function _checkSLTP(order :Order, sl: number|undefined, tp :number|undefined) {
        let k= order.volume;
        if (sl!=null && (sl-order.price)*k>0) console.warn("wrong stoploss",sl,"for order",order);
        if (tp!=null && (tp-order.price)*k<0) console.warn("wrong takeprofit",tp,"for order",order);
    }

    return {

        orders: _manager.orders, //_orders as IOrders,

        refreshLastTick(callbacks? :TraderCallbacks, flag = false) {
            let executions: OrderExecutionInfo[] = [];
            if (_needRefresh && _lastPrice != undefined && _lastTime != undefined) {
                executions = _onTick(_lastTime, _lastPrice, callbacks);
            }
            _needRefresh= false;
            return executions;
        },

        onTick(time :const_Date, price :number, callbacks? :TraderCallbacks) : OrderExecutionInfo[] {
            let executions0 = this.refreshLastTick(callbacks);
            let executions = _onTick(time, price, callbacks);
            _lastPrice = price;
            return executions0.concat(executions);
        },

        onBar(bar :CBar, tf :TF, history? :CQuotesHistory|null, callbacks? :TraderCallbacks) : OrderExecutionInfo[] {

            let flag = false; //bar.time.valueOf()==Date.parse("2022-03-07 08:00");
            if (flag) console.log({barHigh: bar.high, highLevel: _manager.highLevel, barLow: bar.low, lowLevel: _manager.lowLevel});

            let executionsAll = this.refreshLastTick(callbacks, flag);

            let minTfBars: IBars | null | undefined;

            //let barUp= bar.close > bar.open; //(_lastClose ?? bar.open);

            function getMinTfBars() {
                if (minTfBars === undefined) { //history) {  // ищем бар с младшего таймфрейма из доступных для текщего времени
                    minTfBars = history?.minTfBarsForTime(bar.time) ?? null;
                    if (minTfBars && minTfBars.Tf >= tf) minTfBars = null;
                }
                return minTfBars
            }

            if (bar.high >= _manager.highLevel || bar.low <= _manager.lowLevel || (_manager.orders.actives().length > 0 && callbacks?.onPrice)) // для активных ордеров нужно событие onPrice
            {
                let jnrBars = getMinTfBars();
                let [bars, barsTf] = jnrBars ? [jnrBars.data, jnrBars.Tf] : [[bar], tf];
                let lastPrice = _lastPrice;// ?? bars[0]?.open ?? 0;

                mainLoop:
                    for (let b of bars) {
                        //iBar++;
                        let shadows = b.close > b.open ? [b.low, b.high] : [b.high, b.low];
                        for (let [price, timeGetter] of [
                            [bar.open, () => b.time],
                            [shadows[0], () => new Date(b.time.valueOf() + barsTf.valueOf() * 1 / 3)],
                            [shadows[1], () => new Date(b.time.valueOf() + barsTf.valueOf() * 2 / 3)],
                            [bar.close, () => new Date(b.time.valueOf() + barsTf.valueOf() - 1)]
                        ] as [number, () => const_Date][]) {
                            //let up= price > lastPrice;
                            let executions = _onTick(timeGetter, price, callbacks);
                            //if (nUpdated>0) console.log("Updated!!!");
                            lastPrice = price;
                            if (executions.length > 0) {
                                executionsAll.push(...executions);
                                if (_manager.orders.length==0) //_highOrders.length==0 && _lowOrders.length==0 && _orders.actives().length==0)
                                    break mainLoop;
                                //else if (orders==_highOrders) _levelUp= orders[0].execPrice; else _levelDown= orders[0].execPrice;
                                if (bar.high < _manager.highLevel && bar.low > _manager.lowLevel && _manager.orders.actives().length==0)
                                    break mainLoop;
                            }

                            if (_manager.orders.actives().length > 0)
                                callbacks?.onPrice?.(price);
                        }
                    }
            }
            _lastPrice = bar.close;
            _lastTime = Period.EndTime(tf, bar.time);

            return executionsAll;
        },


        add(order :Order, callbacks? :TraderCallbacks) {
            _needRefresh= true;
            if (_lastPrice!=null) {
                if (order.type==null && order.price!=_lastPrice) {
                    if ((order.price - _lastPrice)*order.volume >0)
                        order= {...order, price: _lastPrice};
                    else throw("Wrong order price "+JSON.stringify(order)+ "Current price:"+_lastPrice);
                }
                let k= ((order.volume>0)==(order.type=="limit")) ? 1 : -1;
                if ((order.price-_lastPrice)*k>0) order= {...order, price: _lastPrice};
            }
            _checkSLTP(order, order.stopLoss, order.takeProfit);
            let newOrder= _manager.add(order);
            callbacks?.onAdd(newOrder);
            return newOrder;
        },

        remove(id: OrderID, time: const_Date, callbacks?: TraderCallbacks) {
            let order= _manager.remove(id);
            let price = _lastPrice ?? (() => {throw "wrong price";})();
            if (order) callbacks?.onRemove?.(order, time, price);
            return;
        },

        modify(id: OrderID, params: OrderModify, time: const_Date, callbacks?: TraderCallbacks) {
            let order = _manager.orders.get(id);
            if (order) {
                if (order.type==null) {
                    if (params.stopLoss != null && (_lastPrice! - params.stopLoss) * order.volume <= 1e-10) {
                        console.warn("#" + id + " sl:", params.stopLoss, "->", _lastPrice);
                        params = {...params, stopLoss: _lastPrice};
                    }
                    if (params.takeProfit != null && (_lastPrice! - params.takeProfit) * order.volume >= -1e-10) {
                        console.warn("#" + id + " tp:", params.takeProfit, "->", _lastPrice);
                        params = {...params, takeProfit: _lastPrice};
                        //this.remove(id, time, callbacks);
                    }
                }
                else _checkSLTP(order, params.stopLoss, params.takeProfit);
            }
            let {newOrder} = _manager.modify(id, params);
            //callbacks?.onModify?.(id, params, time);
            if (order) callbacks?.onModify?.(order, params, time);
            _needRefresh= true;
            return newOrder;
        }

    } as const;
}