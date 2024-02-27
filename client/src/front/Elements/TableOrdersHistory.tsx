import React from "react";
import moment from 'moment';
import {MiniTable} from "./tableSearch";
import {StyleCSSHeadGrid} from "../common/styleGrid";
import {AgGridColumn, AgGridReact} from "ag-grid-react";
import {ApiClient} from "../reactI";
import {tListEvent} from "../../commons/commons";
import {iPositionLimitGet, iPositionMarketGet, iPositionMarketGetHistory} from "../../sistem/base/Position";
import {Navigation} from "./Navigation";

type tOrdersType = "buy"|"sell"|"buyLimit"|"sellLimit"
type tRowData = {}
type tRow = {orderId: number, openTime: Date, openPrice: number, closeTime: Date, closePrice: number, type: tOrdersType, volume: number, symbol:string, num: number, profit:number}
type tRowKey = keyof tRow

const OrdersHistory: tRow[] = []

export class TableOrderHistory extends MiniTable<tRow,{}>{
    componentDidMount() {
        this.Init()
    }

    componentWillUnmount() {
        this.callbackClose.del?.();
    }

    callbackClose:  tListEvent = {
        func:(data: any) =>{
            this.update(data)
        }
    }
    async update(data: any){
        const result =  await ApiClient.getOrdersHistory({})
        OrdersHistory.splice(0)
        OrdersHistory.push(...this.toRow(result))
        this.gridApi?.setRowData(OrdersHistory)
    }
    Init(){
        ApiClient.setEventClose({callback: this.callbackClose})


        // this.gridApi?.applyTransactionAsync()
    }

    toRow(data: (iPositionMarketGetHistory )[]): tRow[]{
        return data.map((e,i)=>({
            symbol: e.symbol,
            openTime: e.timeOpen,
            openPrice: e.price??0,
            closePrice: e.priceClose??0,
            closeTime: e.timeClosed??0,
            volume: e.volume,
            type: e.volume>0? "buy" : "sell",
            orderId: e.orderId,
            num: i,
            profit: e.profit
        }))
    }
    searchDiv({table, search}: {table: JSX.Element, search?: string }) {
        return <div style={{ width: "100%", height:"100%"}}>
            {table}
        </div>
    }
    table(){
        StyleCSSHeadGrid();
        return <><AgGridReact
            onGridReady={(e)=> {
                this.gridApi = e.api
                ApiClient.getOrdersHistory({}).then(e=> {this.gridApi?.setRowData(this.toRow(e))})

            }}
            className= "ag-theme-alpine"
            onGridSizeChanged={()=>{
                this.gridApi?.sizeColumnsToFit();
            }}
            rowData = {OrdersHistory}
            headerHeight = {44}
            rowHeight = {28}
            rowSelection ={this.props.getSelectedRows?'multiple':'single'}

            gridOptions = {this.props.gridOptions ?? this.gridOptions}
            getRowId = {  ({data}) =>this.props.getRiwId?.(data) ?? data[this.props.searchBy ?? "symbol"] }

        >
            <AgGridColumn
                field={"orderId" as tRowKey}
                headerName= {"Order ID"}
                headerClass= {"gridTable-header"}
                sortable= {true}
                filter= {true}
                resizable={true}
                cellStyle= {this.styleOrdersTable}
            />

            <AgGridColumn
                field={"type" as tRowKey}
                headerName= {"Type"}
                headerClass= {"gridTable-header"}
                sortable= {true}
                filter= {true}
                resizable={true}
                cellStyle= {this.styleOrdersTable}
                cellClass={(params:any) => {
                    return params.value
                }}
            />
            <AgGridColumn
                field={"symbol" as tRowKey}
                headerName= {"Symbol"}
                headerClass= {"gridTable-header"}
                sortable= {true}
                filter= {true}
                resizable={true}
                cellStyle= {this.styleOrdersTable}
                cellClass={"symbol"}
            />
            <AgGridColumn
                field={"volume" as tRowKey}
                headerName= {"Size"}
                headerClass= {"gridTable-header"}
                sortable= {true}
                filter= {true}
                resizable={true}
                cellStyle= {this.styleOrdersTable}
            />
            <AgGridColumn
                field={"openPrice" as tRowKey}
                headerName= {"Open Price"}
                headerClass= {"gridTable-header"}
                sortable= {true}
                filter= {true}
                resizable={true}
                cellStyle= {this.styleOrdersTable}
            />
            <AgGridColumn
                field={"openTime" as tRowKey}
                headerName= {"Open Time"}
                headerClass= {"gridTable-header"}
                sortable= {true}
                filter= {true}
                resizable={true}
                cellStyle= {this.styleOrdersTable}
                valueFormatter={ (data: any)=>{return moment(data.value).format('DD-MM-YYYY HH:mm:ss');}}
            />

            <AgGridColumn
                field={"closeTime" as tRowKey}
                headerName= {"Close Time"}
                headerClass= {"gridTable-header"}
                sortable= {true}
                filter= {true}
                resizable={true}
                cellStyle= {this.styleOrdersTable}
                valueFormatter={ (data: any)=>{return moment(data.value).format('DD-MM-YYYY HH:mm:ss');}}
            />
            <AgGridColumn
                field={"closePrice" as tRowKey}
                headerName= {"Close price"}
                headerClass= {"gridTable-header"}
                sortable= {true}
                filter= {true}
                resizable={true}
                cellStyle= {this.styleOrdersTable}
            />

            <AgGridColumn
                field={"profit" as tRowKey}
                headerName= {"profit"}
                headerClass= {"gridTable-header"}
                sortable= {true}
                filter= {true}
                resizable={true}
                cellStyle= {this.styleOrdersTable}
            />
        </AgGridReact>
        <Navigation />
        </>
    }

}
