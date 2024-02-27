import {BSearch,deepClone} from "./Common";



type OrderBase = Readonly<{
    volume: number;
    price?: number | undefined,
    type?: "limit" | "stop" | undefined,
    stopLoss?: number,
    takeProfit?: number
}>

interface OrderNew1 extends OrderBase { price?: undefined, type?: undefined }  // новый рыночный ордер
interface OrderNew2 extends OrderBase { price: number; type?: "limit" | "stop" } // новый отложенный ордер

export type OrderNew = Readonly<OrderNew1 | OrderNew2>;  //Readonly<OrderBase & ({ price?: undefined, type?: undefined } | { price: number; type?: "limit" | "stop" })>

export type OrderModify = Omit<Partial<OrderBase>, "type">  // изменение ордера

export type Order = OrderNew2 & { readonly time: const_Date; } //  id :OrderId }

export type OrderID = number & { readonly [Symbol.species]: OrderID }

export type OrderExt = Order & { readonly id: OrderID };

export type OrdersAPI = Readonly<{
    add(order: OrderNew): OrderID;
    remove(id: OrderID | null | undefined): void;
    modify(id: OrderID, params: OrderModify): void;
    clear() :void;
    //isOpened(id :OrderId) : boolean;
}>


export type OrderExecutionInfo = Readonly<{ order: OrderExt, mode: "open" | "close", execPrice: number, isHigh :boolean }>;

export type OrderExecutionInfoExt = OrderExecutionInfo & { readonly execTime: const_Date; };


export interface IOrders extends Iterable<OrderExt>, Readonly<{
    readonly nettoVolume: number;  // нетто-объём позиции

    get(id: OrderID): OrderExt | undefined;

    length :number;

    entries(): Iterable<[OrderID, OrderExt]>;

    pendings(): readonly OrderExt[];  // отложенные ордеры

    actives(): readonly OrderExt[];  // активные ордеры (позиции)
}> {
}

export class COrders implements IOrders {//implements OrdersAPI {
    private id = 0;
    private data = new Map<OrderID, OrderExt>();
    private _pendings?: OrderExt[] = [];// = [];  // отложенные ордера
    private _actives?: OrderExt[] = [];// = [];  // активные ордера
    private _nettoVolume = 0;

    constructor(data? : {orders :readonly OrderExt[], nextID :number}) {
        if (data) { this.id= data.nextID;  this.data= new Map(data.orders.map(item=>[item.id, Object.freeze(item)])); }
    }

    get length() { return this.data.size; }

    get(id: OrderID) {
        return this.data.get(id);
    }

    add(order: Order): OrderExt {
        let id = (++this.id) as OrderID;
        let orderExt = {...order, id};
        this.set(orderExt)
        return orderExt;
    }

    remove(id: OrderID) {
        let order = this.data.get(id);
        this.data.delete(id);
        if (order)
            if (order.type) this._pendings = undefined; else this._actives = undefined;
    }

    private set(order: OrderExt) {
        this.data.set(order.id, order);
        if (order.type != undefined)
            this._pendings?.push(order);
        else {
            this._actives?.push(order);
            this._nettoVolume += order.volume;
        }
        return order;
        //(order as unknown as {timeDate :const_Date}).timeDate=  new Date(order.time);
        //order.toString = function(this :OrderExt) { let obj= {...this, timeDate: new Date(this.time)};   return JSON.stringify(obj); };
    }

    activate(id: OrderID, time: const_Date) {
        let order = this.data.get(id);
        if (!order) throw "Invalid order ID: " + id + " for activate";
        if (order.type == undefined) throw "Order #" + id + " is already active!";
        this._pendings = undefined;
        return this.set({...order, time, type: undefined});
    }

    modify(id: OrderID, params: Omit<Partial<Order>, "type">) {
        let order = this.data.get(id);
        if (order) {
            let newOrder: OrderExt = {...order, ...params, type: order.type};
            this.data.set(id, newOrder);
            if (order.type) this._pendings = undefined; else this._actives = undefined;
            if (order.type == undefined && params.volume != undefined) this._nettoVolume += params.volume - order.volume;
            return newOrder;
        } else throw "Invalid order ID: " + id + " for modify";
    }

    //get map() { return this.data.values(); }
    entries() {
        return this.data.entries()
    };

    [Symbol.iterator]() {
        return this.data.values()[Symbol.iterator]();
    }

    pendings() {
        return this._pendings ??= [...this.data.values()].filter(order => order.type != undefined);
    } // return  for(order of this._pendings) yield order;  for(let i=this._pendings.length; i<this.data.size; i++) if (order.type) this._pending}
    actives() {
        return this._actives ??= [...this.data.values()].filter(order => order.type == undefined);
    }

    get nettoVolume() {
        return this._nettoVolume;
    }
}




export function newOrdersManager() {
    let _orders = new COrders();
    //let _sortedOrders : {order :OrderExt, mode :"open"|"close", execPrice: number} [] = [];
    let _highOrders: OrderExecutionInfo[] = [];
    let _lowOrders: OrderExecutionInfo[] = [];
    function _levelUp() { return _highOrders[0]?.execPrice ?? Number.MAX_VALUE; }
    function _levelDown() { return _lowOrders[0]?.execPrice ?? -Number.MAX_VALUE; }
    let _lastPrice: number | undefined;
    //let _lastTime: const_Date | undefined;

    function refresh(flag: boolean =false) {
        _highOrders = [];
        _lowOrders = [];
        for (let order of _orders.pendings()) {
            let up = (order.type == "stop") == (order.volume > 0);
            let orders = up ? _highOrders : _lowOrders;
            orders.push({order, mode: "open", execPrice: order.price, isHigh: up});
        }
        for (let order of _orders.actives()) {
            for (let [level, k, type] of [[order.takeProfit, 1, "limit"], [order.stopLoss, -1, "stop"]] as const) {
                if (level == null) continue;
                let up = order.volume * k > 0;
                let orders = up ? _highOrders : _lowOrders;
                //orders.push(_createPending(order, level, type, "close"));
                orders.push({order, mode: "close", execPrice: level, isHigh: up});
                if (flag) console.warn("push exec price ", k == 1 ? "tp" : "sl", level)
            }
        }
        _highOrders.sort((a, b) => a.execPrice - b.execPrice);
        _lowOrders.sort((a, b) => b.execPrice - a.execPrice);
        if (flag) console.warn({levelUp: _levelUp(), levelDown: _levelDown()});
    }

    function _createPending(order: OrderExt, levelPrice: number, type: "stop"|"limit", mode: "open"|"close") : OrderExecutionInfo {
        let up = (type=="stop") == (mode=="open" ? order.volume >0 : order.volume <0);
        if (mode=="close" && (levelPrice - order.price) * (up ? 1 : -1) < 0) levelPrice = order.price;
        return {order, mode, execPrice: levelPrice, isHigh: up};
    }

    function _addPending(orders: OrderExecutionInfo[], order: OrderExecutionInfo)
    : OrderExecutionInfo {
        const up = order.isHigh;
        const levelPrice= order.execPrice;
        //console.log(up ? "up" : "down", levelPrice, (mode=="close" && (levelPrice - order.price) * (up ? 1 : -1) < 0));
        let i = up ? BSearch(orders, item => item.execPrice - levelPrice, 1)
            : BSearch(orders, item => levelPrice - item.execPrice, 1);
        if (i==-1) i = orders.length; //up ? _sortedOrders.length : 0;
        //console.log("i="+i);
        while (i < orders.length && orders[i].execPrice == levelPrice) i++;
        orders.length++;
        orders.copyWithin(i+1, i);
        orders[i] = order;
        return order;
    }

    function _addPending2([ordersHigh, ordersLow]: [OrderExecutionInfo[], OrderExecutionInfo[]], order: OrderExecutionInfo) {
        let orders = order.isHigh ? ordersHigh : ordersLow;
        return _addPending(orders, order);
    }

    function _addPending3([ordersHigh, ordersLow]: [OrderExecutionInfo[], OrderExecutionInfo[]],
            order: OrderExt, levelPrice: number, type: "stop"|"limit", mode: "open"|"close")
        : OrderExecutionInfo {
        return _addPending2([ordersHigh, ordersLow], _createPending(order, levelPrice, type, mode))
    }

    function _onTick(price: number, timeGetter: const_Date|(()=>const_Date), lastPrice?: number, isActivePrice=false, flag = false) : OrderExecutionInfoExt[]
    {
        let _time : const_Date;
        const getTime= ()=> _time ??= typeof timeGetter=="function" ? timeGetter() : timeGetter;
        const debug = false; //getTime().valueOf()==Date.parse("2022-10-14 20:59:59.999");
        if (debug)
            console.log("OnTick:",{_highOrders: deepClone(_highOrders), _lowOrders: deepClone(_lowOrders), price, lastPrice});
        //let [upData, downData] = [[_highOrders, 1, bar.high], [_lowOrders, -1, bar.low]] as [OrderExecutionInfo[], number, number][];
        let [upData, downData] = [[_highOrders, 1], [_lowOrders, -1]] as const;
        let datas = lastPrice == null ? [upData, downData] : [price > lastPrice ? upData : downData];
        let executionsAll: OrderExecutionInfoExt[] = [];
        //let nUpdated=0;
        for (let data of datas) {
            let [orders, k] = data; //up ? [_highOrders, 1, bar.high] : [_lowOrders, -1, bar.low];
            //let nRemoved= checkOrders(orders, k);
            //nUpdated += nRemoved;
            let executions = checkOrders(orders, k);
            executionsAll.push(...executions);

            function checkOrders(pendings: OrderExecutionInfo[], k: number) {
                let oppositeOrders = pendings==_highOrders ? _lowOrders : _highOrders;
                //for(let [orders,k] of [[_highOrders, 1], [_lowOrders, -1]] as [OrderInfo[], number][]) {
                let executions: OrderExecutionInfoExt[] = [];
                let n = 0;
                //for (let pending of pendings) {
                for(let i=0; i<pendings.length; i++) {  // перебираем по индексам, т.к. в цикле возможно добавление элементов
                    let pending= pendings[i];
                    // if (pending.order.id==56 && timeGetter()>=new Date("2022-02-22 09:00") && timeGetter()<=new Date("2022-02-22 10:00"))
                    //     console.warn(timeGetter(), price, k, pending);
                    if (flag) console.log({
                        price,
                        isHighOrders: pendings==_highOrders,
                        pendingPrice: pending.execPrice,
                        mode: pending.mode,
                        break: (price - pending.execPrice) * k > -1e-10
                    });
                    if ((price - pending.execPrice) * k > -1e-10) {
                        if (debug) console.log("EXEC: ",price, pending);
                        const time = getTime();
                        executions.push({...pending, execTime: time});
                        let ord = pending.order;
                        let id = ord.id;
                        if (pending.mode == "open") { // открытие сделки
                            let ord = _orders.activate(id, time);
                            // Выставляем отложенные ордера для sl и tp
                            for (let [level, kSide, type] of [[ord.takeProfit, 1, "limit"], [ord.stopLoss, -1, "stop"]] as const) {//[number | undefined, number, "stop" | "limit"] []) {
                                if (level==null) continue;
                                //let up = (type=="stop") == (mode=="open" ? order.volume > 0 : order.volume < 0);
                                let pend= _createPending(ord, level, type, "close");
                                if (level==pending.execPrice) {  // ордер закрылся по sl|tp
                                    _orders.remove(id);
                                    executions.push({...pend, execTime: time});
                                    break;
                                }
                                else {
                                    let pendings_= pend.isHigh==(k==1) ? pendings : oppositeOrders;
                                    _addPending(pendings_, pend);
                                }
                                // let pend = _addPending([_highOrders, _lowOrders], ord, level, type, "close");
                                // if (kSide==-1 && pend.execPrice==price) {  // проверяем срабатывание стоп-лосса
                                //     executions.push(...checkOrders(oppositeOrders, -k));
                                // }
                            }
                            //console.log("pendings:",pendings);
                        } else { // закрытие сделки по ТП/СЛ
                            //console.log("remove "+id);
                            //if (ord.id==56) console.warn("Remove #"+ord.id);
                            _orders.remove(id);
                            //console.log("removed "+id, pending);
                            // Удаляем противоположный связанный ордер (sl <-> tp)
                            if (ord.stopLoss != null && ord.takeProfit != null) {
                                let iOpposite = oppositeOrders.findIndex((item) => item.order==ord);
                                if (iOpposite >= 0) oppositeOrders.splice(iOpposite, 1);
                            }
                        }
                        //pendings.push(pending);
                        n++;
                    } else break;
                }
                if (n > 0) {
                    pendings.splice(0, n);
                    //console.log("spliced",n," -> ",pendings);
                    //throw("!!!");
                }
                return executions; //n;
            }
        }
        return executionsAll; //nUpdated;
    }

    // function _removeExec(info :OrderExecutionInfo) {
    //
    // }

    //let _needCheckOrders = false;
    let _needRefresh = false;

    function addPending(order: OrderExt, levelPrice: number, type: "stop"|"limit", mode: "open"|"close") {
        //_needCheckOrders = true;
        return _addPending3([_highOrders, _lowOrders], order, levelPrice, type, mode);
    }

    // function checkMultiControlPoints(points :{price :number, timeGetter :()=>const_Date}[], lastPrice? :number, callbacks? :TraderCallbacks) {
    //     let executions= checkOrdersControlPoint(price, timeGetter, lastPrice, callbacks);
    // }
    //

    return {

        orders: _orders as IOrders,

        get highLevel() { return _levelUp(); },
        get lowLevel() { return _levelDown(); },

        onTick(time: const_Date|(()=>const_Date), price: number, isActivePrice= false) : OrderExecutionInfoExt[] {
            if (_needRefresh) {
                refresh();
                //_lastPrice= undefined;
                _needRefresh=false;
            }
            let executions = _onTick(price, time, _lastPrice, isActivePrice);
            _lastPrice = price;
            return executions;
        },

        // *onTicks(ticks :Iterable<Readonly<{time: const_Date, price: number}>>, params? :Readonly<{high: number, low :number, close :number}>) {
        //     let lastPrice = _lastPrice;
        //     _lastPrice= params?.close;
        //     for(let tick of ticks) {
        //         let executions = _onTick(tick.price, tick.time, lastPrice);
        //         for(let exec of executions) yield exec;
        //         lastPrice = tick.price;
        //
        //         if (executions.length>0 && params) {
        //             if (_orders.length==0) // _highOrders.length==0 && _lowOrders.length==0 && _orders.actives().length==0)
        //                 return;
        //             //else if (orders==_highOrders) _levelUp= orders[0].execPrice; else _levelDown= orders[0].execPrice;
        //             if (params.high < _levelUp() && params.low > _levelDown() && _orders.actives().length==0)
        //                 return;
        //         }
        //         // if (_orders.actives().length > 0)
        //         //     callbacks?.onPrice?.(price);
        //     }
        // },

        add(order: Order) {
            //if (order.type==null && order.price!=_lastPrice)
            let orderExt = _orders.add(order);
            if (order.type != null || order.stopLoss != null || order.takeProfit != null) {
                if (order.type != null)  // установка отложенного ордера
                    addPending(orderExt, order.price, order.type, "open");
                else // установка sl/tp для рыночного ордера
                    for (let [level, type] of [[order.takeProfit, "limit"], [order.stopLoss, "stop"]] as const) //as [number, "stop" | "limit"][])
                        if (level!=null) addPending(orderExt, level, type, "close");
                _lastPrice= undefined;
            }
            return orderExt;
        },

        remove(id: OrderID) {
            let order = _orders.get(id);
            if (order) {
                if (order.type != null || order.stopLoss != null || order.takeProfit != null)
                    _needRefresh = true;
                _orders.remove(id);
            }
            //let price = _lastPrice ?? (() => {throw "wrong price";})();
            return order;
        },

        modify(id: OrderID, params: OrderModify) {
            let order = _orders.get(id);
            if (order && params.volume != null && params.volume * order.volume <= 0) throw "Wrong order modify volume";
            if (order) {
                if (order.type != null ? params.price != null : (params.stopLoss != null || params.takeProfit != null)) {
                    _needRefresh = true;
                    _lastPrice= undefined;
                }
                // if (order.type == null && _needRefresh) {
                //     if (params.stopLoss != null && (_lastPrice! - params.stopLoss) * order.volume <= 1e-10) {
                //         console.warn("#" + id + " sl:", params.stopLoss, "->", _lastPrice);
                //         params = {...params, stopLoss: _lastPrice};
                //     }
                //     if (params.takeProfit != null && (_lastPrice! - params.takeProfit) * order.volume >= -1e-10) {
                //         console.warn("#" + id + " tp:", params.takeProfit, "->", _lastPrice);
                //         params = {...params, takeProfit: _lastPrice};
                //         //this.remove(id, time, callbacks);
                //     }
                // }
            }
            //if (id==22) console.log("!!!",{ order, params, _needRefresh} );
            let result = _orders.modify(id, params);
            //callbacks?.onModify?.(id, params, time);
            //if (order) callbacks?.onModify2?.(order, params, time);
            return {oldOrder: order, newOrder: result};
        }

    } as const;
}