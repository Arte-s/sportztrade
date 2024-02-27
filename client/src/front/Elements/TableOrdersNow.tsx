import React from "react";
import {MiniTable} from "./tableSearch";
import {StyleCSSHeadGrid} from "../common/styleGrid";
import {AgGridColumn, AgGridReact} from "ag-grid-react";
import {tListEvent} from "../../commons/commons";
import {ApiClient} from "../reactI";
import {iPositionLimitGet, iPositionMarketGet} from "../../sistem/base/Position";
import moment from "moment";
import {tOnTicksRec} from "../../sistem/base/priceReceiver";
import {Navigation} from "./Navigation";
type tOrdersType = "buy"|"sell"|"buyLimit"|"sellLimit"
type tRowData = {}
type tRow = {orderId: number, openTime?: Date|undefined, price?: number, type: tOrdersType, volume: number, symbol:string, num: number, profit: number|undefined}
type tRowKey = keyof tRow

const OrdersNow: tRow[] = []

export class TableOrdersNow extends MiniTable<tRow,{}>{

    componentDidMount() {
        this.Init()
        this.profitUpdate()
    }

    componentWillUnmount() {
        this.callback.del?.();
        this.arrTicksSymbols.forEach(e=>e?.del?.())
        this.arrTicksSymbols.splice(0)
        this.gridApi = null
    }

    callback:  tListEvent = {
        func:(data:  any ) =>{
            this.update(data)
        }
    }

    callbackClose:  tListEvent = {
        func:(data:  iPositionLimitGet ) =>{
            this.update(data)
        }
    }

    profitUpdate(){
        console.log("!!!!!")
        this.arrTicksSymbols.forEach(e=>e?.del?.())
        this.arrTicksSymbols.splice(0)
        OrdersNow.forEach((e,i)=>{
            if (e.type=="buy" || e.type=="sell" ) {
                const pos = OrdersNow[i]
                const buf = {
                        func: () => ({
                            onTicks:(datum: tOnTicksRec)=>{
                                // console.log(datum, e.symbol)
                                pos.profit = ((pos.type == "buy" ? datum.bid : datum.ask) - (pos.price ?? 0)) * pos.volume// data
                                // this.gridApi?.de
                                this.gridApi?.applyTransactionAsync({update: [OrdersNow[i]]})
                            }
                        })
                    }
                this.arrTicksSymbols.push(buf)
                ApiClient.setEventTicksBySymbol({callback: buf, symbol: e.symbol})

            }
        })
        this.arrTicksSymbols.forEach((e)=>{
        })
    }

    async update(data: any){
        const result =  await ApiClient.getOrdersAll({})
        OrdersNow.splice(0)
        OrdersNow.push(...this.toRow(result))

        this.profitUpdate()


        this.gridApi?.setRowData(OrdersNow)
    }
    arrTicksSymbols: tListEvent[] = []
    toRow(data: (iPositionMarketGet | iPositionLimitGet)[]): tRow[]{

        return data.map((e,i)=>{
            return {
                symbol: e.symbol,
                price: e.price??0,
                openTime: e.timeLimit ? e.timeLimit : e.timeOpen,
                volume: e.volume,
                type: e.type=="Limit"? e.volume>0? "buyLimit" : "sellLimit" : e.volume>0? "buy" : "sell",
                orderId: e.orderId,
                num: i,
                profit: 0, // надо будет дописать когда будет история
            }
        })
    }

    Init(){
        ApiClient.setEventMarket({callback: this.callback})
        ApiClient.setEventLimit({callback: this.callback})
        ApiClient.setEventLimit({callback: this.callback})
        ApiClient.setEventClose({callback: this.callback})
        // ApiClient.setEventLimit({callback: this.callbackLimit})
        // ApiClient.setEventLimit({callback: this.callbackM})
        // ApiClient.setEventLimit({callback: this.callbackM})
        ApiClient.getOrdersAll({}).then(e=>this.gridApi?.setRowData(this.toRow(e)))

        // this.gridApi?.applyTransactionAsync()
    }


    searchDiv({table, search}: {table: JSX.Element, search?: string }) {
        return <div style={{ width: "100%", height:"100%"}}>
                {table}
        </div>
    }

    table(){
        StyleCSSHeadGrid();
        return <><AgGridReact
            onGridReady={(e) => {
                this.gridApi = e.api
            }}
            className="ag-theme-alpine"
            onGridSizeChanged={() => {
                this.gridApi?.sizeColumnsToFit();
            }}
            rowData={OrdersNow}
            headerHeight={44}
            rowHeight={28}
            rowSelection={this.props.getSelectedRows ? 'multiple' : 'single'}

            gridOptions={this.props.gridOptions ?? this.gridOptions}
            getRowId={({data}) => this.props.getRiwId?.(data) ?? data.num}

        >
            {/*<AgGridColumn*/}
            {/*    field={"num" as tRowKey}*/}
            {/*    headerName= {"n/n"}*/}
            {/*    headerClass= {"gridTable-header"}*/}
            {/*    sortable= {true}*/}
            {/*    filter= {true}*/}
            {/*    // resizable={true}*/}
            {/*    width={70}*/}
            {/*    cellStyle= {this.styleTable}*/}
            {/*/>*/}

            <AgGridColumn
                field={"orderId" as tRowKey}
                headerName={"Order ID"}
                headerClass={"gridTable-header"}
                sortable={true}
                filter={true}
                resizable={true}
                cellStyle={this.styleOrdersTable}
            />

            <AgGridColumn
                field={"type" as tRowKey}
                headerName={"Type"}
                headerClass={"gridTable-header"}
                sortable={true}
                filter={true}
                resizable={true}
                cellStyle={this.styleOrdersTable}
                cellClass={(params: any) => {
                    return params.value
                }}
            />
            <AgGridColumn
                field={"symbol" as tRowKey}
                headerName={"Symbol"}
                headerClass={"gridTable-header"}
                sortable={true}
                filter={true}
                resizable={true}
                cellStyle={this.styleOrdersTable}
                cellClass={"symbol"}
            />
            <AgGridColumn
                field={"volume" as tRowKey}
                headerName={"Size"}
                headerClass={"gridTable-header"}
                sortable={true}
                filter={true}
                resizable={true}
                cellStyle={this.styleOrdersTable}
            />
            <AgGridColumn
                field={"price" as tRowKey}
                headerName={"Price"}
                headerClass={"gridTable-header"}
                sortable={true}
                filter={true}
                resizable={true}
                cellStyle={this.styleOrdersTable}
            />
            <AgGridColumn
                field={"openTime" as tRowKey}
                headerName={"Open Time"}
                headerClass={"gridTable-header"}
                sortable={true}
                filter={true}
                resizable={true}
                cellStyle={this.styleOrdersTable}
                valueFormatter={(data: any) => {
                    return moment(data.value).format('DD-MM-YYYY HH:mm:ss');
                }}

            />

            <AgGridColumn
                field={"profit" as tRowKey}
                headerName={"profit"}
                headerClass={"gridTable-header"}
                sortable={true}
                filter={true}
                resizable={true}
                cellStyle={this.styleOrdersTable}
            />

            <AgGridColumn
                field={"num" as tRowKey}
                headerName={"delete"}
                headerClass={"gridTable-header"}
                sortable={true}
                filter={true}
                cellClass={"delete"}
                valueGetter={() => "✕"}
                // resizable={true}
                onCellClicked={({data}: { data: tRow }) => {
                    ApiClient.closeOrders({ordersId: [data.orderId]}).then(() => this.update({}))
                }}
                cellStyle={this.styleOrdersTable}
            />

        </AgGridReact>
        <Navigation />
        </>
    }

}
