import React from "react";
import { Router, Route } from "react-router-dom";

import {ResizableReact} from "./common/Resizeble";
import {TableOrderBooks} from "./OrderBooks/tableOrderBooks";
import {GridApi} from "ag-grid-community";
import {ApiClient, canvasAPI, canvasV2, mouse} from "./reactI";
import {TableOrdersNow} from "./Elements/TableOrdersNow";
import {TableOrderHistory} from "./Elements/TableOrdersHistory";
import {TableSymbols} from "./Elements/TabelSymbols";
import {divCreatEl} from "./common/creatDiv";
import {CNameWindows} from "./common/reactCommon";
import {RightClickMenu} from "./menuR";
import {Header} from "./Elements/Header";
type  tStatusWorkSpace = "graph"|"jurnal"
type tGeneralReactState = {
    date: Date
    statusWorkSpace: tStatusWorkSpace,
    showFullTable: boolean,
    showFullOrders: boolean,
    showFullGraph: boolean
}

const canvas2DDiv: HTMLDivElement = divCreatEl("div") as HTMLDivElement
type keyT= number|string;
export function FCanvas (key:keyT) {
    return <div className="maxSize" ref={(el)=>{
        el?.appendChild(canvas2DDiv);
    }} key={key}>
    </div>
}
const sCanvas = FCanvas(12)
export function FCanvasBySymbol() {
    return <div className="maxSize graph__i">
        {sCanvas}
        <COrdersBy/>
    </div>
}


export class GeneralReact extends React.Component <any, tGeneralReactState> {
    state: tGeneralReactState = {
        date: new Date(),
        statusWorkSpace: "graph",
        showFullTable: true,
        showFullOrders: false,
        showFullGraph: false
    }
    gridApiOrderBooks: GridApi|undefined
    UNSAFE_componentWillMount() {
        canvasAPI.Init(canvas2DDiv);
    }

    componentDidMount() {
        // this.gridApiOrderBooks?.ensureIndexVisible({index:100, position: 'middle' })
         canvasV2.creatMany(1)
    }

    button = ({Key, name}: { Key: tStatusWorkSpace, name: string }) => {
        return <CNameWindows work={this.state.statusWorkSpace}
                             callbackClick={(d: tStatusWorkSpace) => this.setState({statusWorkSpace: d})} default={Key}>
            {name}
        </CNameWindows>
    }


    render() {

        const graph = <div className={"graph"}>
            <RightClickMenu>
                <>
                    {FCanvasBySymbol()}
                    <a className="toggle toggle_photo toggle_orders">
                        <span className="toggle__i"></span>
                    </a>
                    <a className={"toggle toggle_orders toggle_graph " + (this.state.showFullGraph ? "toggle_full" : "")}
                       onClick={() => {
                           this.setState({showFullGraph: !this.state.showFullGraph})
                       }}>
                        <span className="toggle__i"></span>
                    </a>
                </>
            </RightClickMenu>
        </div>
    const orderBook =
        <>
            {/*<OrderBooks/>*/}

            <TableOrderBooks
                getApi={(api) => {
                    this.gridApiOrderBooks = api
                }}
            />
        </>
        const panelDown = <div className={"list"}>
            <a className={"toggle toggle_orders " + (this.state.showFullOrders ? "toggle toggle_full" : "")} onClick={() => {
                this.setState({showFullOrders: !this.state.showFullOrders})
            }}>
                <span className="toggle__i"></span>
            </a>
            <COrderTable/>
        </div>
        const panelUp = <div className={"list-header"}>
            {this.button({Key: "graph", name: "Order Book"})}
            {this.button({Key: "jurnal", name: "Market Trades"})}
            <a className="toggle" onClick={() => {
                    this.setState({showFullTable: !this.state.showFullTable})
                }}>
                    <span className="toggle__i"></span>
                    <span className="toggle__note">
                        {this.state.showFullTable ? 'Hide' : 'Show Order Book'}
                    </span>
                </a>
        </div>
        const graphAndOrdersBook = <div className={"maxSize data__i"} style={{display:"flex", flexDirection:"row", flex:"auto 1 1"}}>
            <TableSymbols
                data={[]}
            />
            {graph}
            {/*<ResizableReact keyForSave={"graph"}*/}
            {/*                enableResize={{left: true}}*/}
            {/*                sizeDef={{height:"100%", width:"22.5%"}}*/}
            {/*                update={()=>{*/}
            {/*                    this.gridApiOrderBooks?.sizeColumnsToFit();*/}
            {/*                    // this.forceUpdate()*/}
            {/*                }}*/}
            {/*>*/}
                <div className={"maxSize data-block data-block_right"}>
                    {panelUp}
                    {orderBook}
                </div>
            {/*</ResizableReact>*/}
        </div>
        // setTimeout(e=>{this.setState({date: new Date()})}, 500)
        return <div className={(this.state.showFullTable ? "content" : "content content_hide-table") + (this.state.showFullOrders ? " content_full-orders" : "") + (this.state.showFullGraph ? " content_full-graph" : "")}>
            <Header/>
            <div className={"data"}>
                {graphAndOrdersBook}
            </div>
            <div className={"resizable-block"}>
                <ResizableReact keyForSave={"graphAndOrdersBook23"} enableResize={{top:true}} sizeDef={{height:this.state.showFullTable ? 300 : '100%', width:"100vw"}}
                                update={()=>{
                                }}
                                style={{width:"99.5vw", padding: "0 0 15px"}}
                >
                    {panelDown}
                </ResizableReact>
            </div>

        </div>
    }
}

type tCOrdersBy = {
    ordersBy: "limit"|"market",
    limitPrice: number,
    limitVolume: number,
    marketVolume: number
}
class COrdersBy extends React.Component<any,tCOrdersBy>{
    state: tCOrdersBy = {ordersBy:"limit", limitPrice: 0, limitVolume: 1, marketVolume: 1}
    sellLimit(){
        ApiClient.setLimit({type:"Limit",price:this.state.limitPrice, symbol: ApiClient.selectSymbol, volume: this.state.limitVolume*-1})
    }
    buyLimit(){
        ApiClient.setLimit({type:"Limit",price:this.state.limitPrice, symbol: ApiClient.selectSymbol, volume: this.state.limitVolume})
    }
    buy(){
        ApiClient.setMarket({price: undefined, type:"Market",symbol: ApiClient.selectSymbol, volume: this.state.marketVolume})
    }
    sell(){
        ApiClient.setMarket({price: undefined, type:"Market",symbol: ApiClient.selectSymbol, volume: this.state.marketVolume*-1})
    }

    render() {
        return <div className={"orders-by"} >
            <div className={"orders-by__tabs"}>
                <div className={this.state.ordersBy == "market" ? "orders-by__tab _active" : "orders-by__tab"}
                     onClick={() => {
                         this.setState({ordersBy: "market"})
                     }}
                >market orders
                </div>
                <div className={this.state.ordersBy == "limit" ? "orders-by__tab _active" : "orders-by__tab"}
                     onClick={() => {
                         this.setState({ordersBy: "limit"})
                     }}
                >limit orders
                </div>
            </div>

            {this.state.ordersBy == "limit" && <div>
                <div className="orders-by-line input">
                    <label htmlFor="limitPrice" className="input__label">
                        Price
                    </label>
                    <input id="limitPrice"
                           type="number"
                           className={"input__elem"}
                           placeholder="0"
                        // value={this.state.limitPrice}
                           onInput={(e) => {
                               this.setState({limitPrice: Number(e.currentTarget.value)})
                           }}/>
                </div>
                <div className="orders-by-line">
                    <div className="orders-by-line__item btn btn_red" onClick={() => {
                        this.sellLimit()
                    }}>
                        sell
                    </div>
                    <div className="orders-by-line__item">
                        <div className="input-custom-number">
                            <span className="input-custom-number__arrow"
                                  onClick={(e) => {
                                      let value = this.state.limitVolume;
                                      this.setState({limitVolume: value > 1 ? value - 1 : value});
                                  }}
                            >
                                <img src={require('./images/arrow.png')} alt="Arrow"/>
                            </span>
                            <input placeholder={"volume "}
                                   type="number"
                                   className={"msTradeSearchStyle"}
                                   value={this.state.limitVolume}
                                   min={0}
                                   max={1000}
                                   step={1}
                                   onInput={(e) => {
                                       this.setState({limitVolume: Number(e.currentTarget.value)})
                                   }}/>
                            <span className="input-custom-number__arrow"
                                  onClick={(e) => {
                                      let value = this.state.limitVolume;
                                      this.setState({limitVolume: value + 1});
                                  }}
                            >
                            <img src={require('./images/arrow.png')} alt="Arrow"/>
                        </span>
                        </div>

                    </div>
                    <div className="orders-by-line__item btn btn_green" onClick={() => {
                        this.buyLimit()
                    }}>
                        buy
                    </div>
                </div>
                <div className="orders-by-line orders-price">
                    <input type="text" className="orders-price__input orders-price__input_red"
                           value={this.state.limitPrice}
                    />
                    <input type="text" className="orders-price__input orders-price__input_green"
                           value={this.state.limitPrice}
                    />
                </div>
            </div>}
            {this.state.ordersBy == "market" && <>
                <div className={"orders-by-line"}>
                    <div className={"orders-by-line__item btn btn_red"} onClick={() => {
                        this.sell()
                    }}>
                        sell
                    </div>
                    <div className={"orders-by-line__item"}>
                        <div className="input-custom-number">
                        <span className="input-custom-number__arrow"
                              onClick={(e) => {
                                  let value = this.state.marketVolume;
                                  this.setState({marketVolume: value > 1 ? value - 1 : value});
                              }}
                        >
                            <img src={require('./images/arrow.png')} alt="Arrow"/>
                        </span>
                            <input placeholder={"объем "}
                                   type="number"
                                   className={"msTradeSearchStyle"}
                                   value={this.state.marketVolume}
                                   min={0}
                                   max={1000}
                                   step={1}
                                   onInput={(e) => {
                                       this.setState({marketVolume: Number(e.currentTarget.value)})

                                   }}/>
                            <span className="input-custom-number__arrow"
                                  onClick={(e) => {
                                      let value = this.state.marketVolume;
                                      this.setState({marketVolume: value + 1});
                                  }}
                            >
                            <img src={require('./images/arrow.png')} alt="Arrow"/>
                        </span>
                        </div>
                    </div>
                    <div className={"orders-by-line__item btn btn_green"} onClick={() => {
                        this.buy()
                    }}>
                        buy
                    </div>
                </div>
                <div className="orders-by-line orders-price">
                    <input type="text" className="orders-price__input orders-price__input_red"
                           value={this.state.limitPrice}
                    />
                    <input type="text" className="orders-price__input orders-price__input_green"
                           value={this.state.limitPrice}
                    />
                </div>
            </>
            }
        </div>;
    }
}


type tCOrderTable = {
    ordersBy: "open" | "history"
}

class COrderTable extends React.Component<any, tCOrderTable> {
    state: tCOrderTable = {
        ordersBy: "open"
    }

    render() {
        return <>
            <div className={"list-header"}>
                <div className={this.state.ordersBy == "open" ? "list-header__item _active" : "list-header__item"}
                     onClick={()=> {
                         this.setState({ordersBy: "open"})
                     }}
                >
                    orders
                </div>
                <div className={this.state.ordersBy == "history"? "list-header__item _active" : "list-header__item"}
                     onClick={()=> {
                         this.setState({ordersBy: "history"})
                     }}
                >history</div>
            </div>
            <>
                {this.state.ordersBy == "open" &&
                    <TableOrdersNow
                        data={[]}
                    />}
                {this.state.ordersBy == "history" && <TableOrderHistory
                        data={[]}
                    />}
            </>
        </>;
    }
}  //TableSymbols

