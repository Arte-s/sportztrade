import {CBuffPriceHistogram, CIndiBase, CIndicatorGraphObject, ColorString, tOnInitIndicator, tOnBarIndicator} from "../and/const";
import {CParams, ReadonlyFull, SimpleParams} from "../and/CParams";
import {CTestOrdersAND, tOrderHistory, tOrderHistoryType} from "../and/CHystoryOrdersAnd";
import {CSymbol, CSymbols} from "../Nav/Symbol";
import {CSymbolData} from "../and/Symbol";
import {CArrowDown, CArrowUp, CGraphLabel} from "../and/labels";
import {TesterTrade} from "../Nav/Tester";


class CParamsOrders extends CParams {
    // p1 = {name: "Volume", value: true };
    // p2 = {name: "VolumeTick", value: true };
    // p3 = {name: "VolumeTick/Volume", value: true };
    // p4 = {name: "Volume/VolumeTick", value: false };
}


export class CIndicatorOrders extends CIndiBase<typeof CIndicatorOrders> {
    static readonly paramInfo = new CParamsOrders
    static readonly Name = "Orders";
    static readonly Version = "1.00";

    private buf1 = new CBuffPriceHistogram();
    private buf2 = new CBuffPriceHistogram();

    private orders? : CTestOrdersAND;

    GetData(data:any){
        console.log(data);
    }

    params : SimpleParams<CParamsOrders>
    constructor(params: SimpleParams<CParamsOrders> & { readonly ordersRef?: CTestOrdersAND }) {
        super();
        this.params = {...params};
        this.orders= params.ordersRef;
  //      this.windows.push(new CIndicatorGraphObject(this.buf1))

    //    this.windows.push(new CIndicatorObject(this.buf2))
    }
    lastOrdersNum : number  = 0;


    lastIndexOrder : number=0;
    last:tOrderHistory|null = null;
    //список эвентов этим id
    toId = new Map<number,number[]>()
    // InitTrade (trades: TesterTrade[]) {
    //     trades.forEach((trade, i)=>{this.toId.set(trade.id,i)})
    // }

    OrdersToLine(){
        const {lastIndexOrder,toId} = this;
        const trades = this.orders?.trades;
        if (trades) {
            for (let i = lastIndexOrder; i < trades.length; i++) {
                this.lastIndexOrder = i+1;
                const trade = trades[i];
                const {id} = trade
                if (!toId.has(id)) toId.set(id,[i])
                else toId.get(id)?.push(i)

                const arr = toId.get(id)
                if (arr?.length) {
                    let text=""
                    let color:ColorString;
                    let point = {x:trade.time.valueOf(), y: trade.price}

                    //console.log({trades});
                    // console.log({trade});
                    //ордер только открыли
                    if (arr.length==1) {
                        if (trade.volume>0) {

                            text = "buy"
                            color =  "#20a205" as  ColorString

                            this._fixedLabels.push(new CArrowUp(point, color))
                            this.lines2.add({
                                                   color: [{color:color!}],
                                                   type: "text",
                                                   textSizeAuto: 5,
                                                   text: text +" "+ trade.id,
                                                   static: false, point: [point],
                                               })
                        }
                        else {
                            text = "sell"
                            color =  "#bd2f2f" as  ColorString

                            this._fixedLabels.push(new CArrowDown(point, color))
                            this.lines2.add({
                                color: [{color:color!}],
                                type: "text",
                                textSizeAuto: 5,
                                text: text +" "+ trade.id,
                                static: false, point: [point],
                            })
                        }
                    }
                    //это либо докупка либо частичное закрытие
                    else {
                        //итого сколько у нас в ордере сейчас
                        let nowOrderVolume = 0;
                        arr.forEach((a)=>{nowOrderVolume+=trades[a].volume})
                        if (trade.volume>0) {
                            color = nowOrderVolume==0? "rgb(213,162,29)" as  ColorString : "rgb(239,212,146)" as  ColorString
                            this._fixedLabels.push(new CArrowUp(point, color))
                        }
                        else {
                            color = nowOrderVolume==0? "rgb(213,162,29)" as  ColorString : "rgb(239,212,146)" as  ColorString
                            this._fixedLabels.push(new CArrowDown(point, color))
                        }

                       const lastData = trades[arr[0]]
                       const lastPoint = {x:lastData.time.valueOf(), y: lastData.price}
                       this.lines2.add({
                           color: [{color: "rgb(213,162,29)"}],
                           type: "line",
                           width: 1,
                           style: "dashdot",
                           static: false, point: [
                               lastPoint,
                               point,
                           ],
                       })
                        this.lines2.add({
                            color: [{color:"rgb(213,162,29)"!}],
                            type: "text",
                            textSizeAuto: 5,
                            text: "close "+ trade.id,
                            static: false, point: [point],
                        })
                    }

                }

                //console.log(trade);
            }
        }

        //
     //
     // //   if (this.lines2.length) this.lines2.deleteAll();
     //    let r=0;
     //    if (trades) {
     //        for (let i = lastIndexOrder; i < trades.length; i++) {
     //
     //            const {last} = this;
     //            this.lastIndexOrder=i;
     //            const trade=trades[i];
     //
     //            if (order) {
     //                let col :ColorString;
     //                if (order.type=="Buy") col = "#20a205" as  ColorString
     //                if (order.type=="BuyClose") col = "#d5a21d" as  ColorString
     //                if (order.type=="Sell") col = "#bd2f2f" as  ColorString
     //                if (order.type=="SellClose") col = "#d5a21d" as  ColorString
     //                if (order.type=="close") col = "#d5a21d" as  ColorString
     //
     //                let text ="";
     //                if (order.type=="Buy") text = `Buy \nvolume ${order.volume}`
     //                if (order.type=="close") text = `close \nvolume ${last?.volume}\nprofit ${order?.profit}`
     //                if (order.type=="BuyClose") text = "BuyClose"
     //                if (order.type=="Sell") text = "Sell"
     //                if (order.type=="SellClose") text = "SellClose"
     //
     //
     //                if (order.type=="Buy") {
     //                   this.labelsAnd.push(new CArrowUp(
     //                       {x:order.time.valueOf(), y: order.price}
     //                   ))
     //                }
     //
     //                if (order.type=="BuyClose") {}
     //                if (order.type=="Sell") {
     //                    this.labelsAnd.push(new CArrowDown(
     //                        {x:order.time.valueOf(), y: order.price}
     //                    ))
     //
     //                }
     //                if (order.type=="SellClose") {}
     //                if (order.type=="close" && last) {
     //
     //                    if (last.type=="Buy") {
     //                        this.labelsAnd.push(new CArrowDown(
     //                            {x:order.time.valueOf(), y: order.price}, "rgba(255,198,53,0.59)" as  ColorString
     //                        ))
     //                    }
     //
     //                    if (last.type=="Sell") {
     //                        this.labelsAnd.push(new CArrowUp(
     //                            {x:order.time.valueOf(), y: order.price}, "rgba(255,198,53,0.59)" as  ColorString
     //                        ))
     //
     //                    }
     //
     //                }
     //
     //
     //                this.lines2.add({
     //                    color: [{color:col!}],
     //                    type: "text",
     //                    textSizeAuto: 5,
     //                    text: text,
     //                    static: false, point: [
     //                        {x:order.time.valueOf(), y: order.price},
     //                    ],
     //                })
     //
     //
     //            }
     //
     //            if (last) {
     //                if (last.type=="close") {
     //                    this.last=order;
     //                    continue;
     //                }
     //                let col :ColorString;
     //                if (last.type=="Buy") col = "#23b404" as  ColorString
     //              //  if (last.type=="close") col = "#d5a21d" as  ColorString
     //                if (last.type=="BuyClose") col = "#d5a21d" as  ColorString
     //                if (last.type=="Sell") col = "#cb1c1c" as  ColorString
     //                if (last.type=="SellClose") col = "#d5a21d" as  ColorString
     //
     //                this.lines2.add({
     //                    color: [{color:col!}],
     //                    type: "line",
     //                    width: 1,
     //                    style: "dashdot",
     //                    static: false, point: [
     //                        {x:last.time.valueOf(), y: last.price},
     //                        {x:order.time.valueOf(), y: order.price},
     //                    ],
     //                })
     //            }
     //            this.last=order;
     //        }
     //    }
     //
     //    this._labels=[...this.labelsAnd]

    }



    override OnBar({bar:{volume,tickVolume,time,close},index:i,allBars} :tOnBarIndicator) {

        //надо подправить фильтрацию по ТФ
        const {orders,buf1,buf2} = this;
        // console.log({orders})
        if (orders) {
            const arr = orders.equityByTF?.arr
            if (arr) {
                const last = arr[i]?.close;
                // console.log({last})
               // console.log(arr[i].time,time)
                buf1.values[i]= arr[i]?.close;
                if (i>0) {
                    if (buf1.values[i]==buf1.values[i-1]) {
                        buf1.color[i]= "rgba(255,255,0,0.24)";
                    }
                    else {
                        buf1.color[i]= "rgb(255,255,0)";
                    }
                }

            }
        }
        // buf2.values[i]= close;
        // buf2.color[i]= "rgb(255,255,0)";

        // this.lines2.add({
        //     color: [{color:"#d5a21d" as  ColorString}],
        //     type: "line",
        //   //  text:"****",
        //     static: false, point: [
        //         {x:time.valueOf(), y: close},
        //         {x:time.valueOf()+1000*60*60*0.3, y: close+100},
        //     ],
        // })
        // console.log(this.lines2.length);
          this.OrdersToLine()
        // console.log({i})

    }
}