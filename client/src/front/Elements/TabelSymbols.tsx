import React from "react";
import {MiniTable} from "./tableSearch";
import {StyleCSSHeadGrid} from "../common/styleGrid";
import {AgGridColumn, AgGridReact} from "ag-grid-react";
import {tListEvent} from "../../commons/commons";
import {ApiClient, mouse} from "../reactI";
import {iPositionLimitGet, iPositionMarketGet, tSpecTicks} from "../../sistem/base/Position";
import {tOnTicksRec} from "../../sistem/base/priceReceiver";
import {CellClassParams, CellClickedEvent, RowDataUpdatedEvent} from "ag-grid-community";
import {mouseG} from "../../graph sist/and/cmouse";

type tOrdersType = "buy"|"sell"|"buyLimit"|"sellLimit"
type tRowData = {}
type tRow = {symbol: string, price: number, id: number}
type tRowKey = keyof tRow

export type tCallFuncAgGrid<T> = (params: CellClassParams & { data: T }) => {}
const OrdersNow: tRow[] = []
const currencyType = {'_up': false, '_down': false};
const SymbolsAll = new Map<string, tRow>()//: tRow[] = []


export class TableSymbols extends MiniTable<tRow,{}>{

    componentDidMount() {
        this.Init()
    }

    componentWillUnmount() {
        this.callback.del?.();
    }

    callback: tListEvent<any,tSpecTicks> = {
        func:() =>({
            onTicks:(data: tOnTicksRec)=>this.update(data)
        })
    }

    async update(data: tOnTicksRec){

        const buf = SymbolsAll.get(data.symbol) //?.price &&= data.bid
        if (buf) buf.price = data.bid
        this.gridApi?.applyTransactionAsync({update: [buf]})

    }

    async Init(){
        const symbols = await ApiClient.getSymbols()
        symbols.forEach((e,i)=>{
            if (!SymbolsAll.has(e)){
                SymbolsAll.set(e,{symbol:e, price:0, id: i})
            }
        })

        ApiClient.setEventTicks(this.callback)
        console.log(this.gridApi);
        this.gridApi?.setRowData([...SymbolsAll.values()])
        // ApiClient.getOrdersAll({}).then(e=>this.gridApi?.setRowData(this.toRow(e)))

        // this.gridApi?.applyTransactionAsync()
    }


    searchDiv({table, search}: {table: JSX.Element, search?: string }) {
        return <div className={"currency"}>
            {table}
        </div>
    }

    styleTablePriceFunc = (func:(data: any)=>boolean):  tCallFuncAgGrid<tRow> =>{
        return  (params ) => {
            currencyType._up = (func(params.data));
            currencyType._down = !(func(params.data));

            return  { ...this.style,
                'textAlign': 'right'
            }
        }
    }
    styleTablePriceFieldMS = (field: string)=> {
        return this.styleTablePriceFunc((e)=>{
            if (!e[field+"_old"]) e[field+"_old"] = e[field]
            const buf = (e[field+"_old"] as number) < (e[field] as number )
            e[field+"_old"] = e[field];
            return buf
        })
    }

    styleTablePriceField0 = (field: string)=> {
        return this.styleTablePriceFunc((e)=>{
            return e[field] as number >=0
        })
    }

    table(){
        StyleCSSHeadGrid();
        this.gridOptions.rowClassRules = {
            '_up': (e) => {
                return currencyType._up;
            },
            '_down': (e) => {
                return !currencyType._up;
            }
        }
        return <AgGridReact
            onGridReady={(e)=> {
                this.gridApi = e.api
                this.gridApi?.setRowData([...SymbolsAll.values()])
            }}
            className= "ag-theme-alpine"
            onGridSizeChanged={()=>{
                this.gridApi?.sizeColumnsToFit();
            }}
            rowData = {[...SymbolsAll.values()]}
            headerHeight = {40}
            rowHeight = {28}
            rowSelection ={this.props.getSelectedRows?'multiple':'single'}
            // ApiClient.selectSymbol
            onRowClicked={({data}:{data: tRow})=>{
                ApiClient.selectSymbol = data.symbol
            }}
            gridOptions = {this.props.gridOptions ?? this.gridOptions}
            getRowId = {  ({data}: {data: tRow}) => data.id.toString()}
        >
            <AgGridColumn
                field={"symbol" as tRowKey}
                headerName= {"Ticker"}
                headerClass= {"gridTable-header"}
                sortable= {true}
                filter= {true}
                onCellClicked={(e:CellClickedEvent & {data:tRow})=>{
                    const b = mouse.active?.symbolData
                    if (b) b.symbol = e.data.symbol
                    console.log({b, symbol: e.data.symbol})
                }}
                // resizable={true}
                // width={'50%'}
                cellStyle= {this.styleTable}
            />

            <AgGridColumn
                field={"price" as tRowKey}
                headerName= {"Dividend"}
                headerClass= {"gridTable-header"}
                sortable= {true}
                filter= {true}
                resizable={true}
                cellStyle= {this.styleTablePriceFieldMS("price")}
                cell= {this.styleTablePriceFieldMS("price")}
            />

        </AgGridReact>
    }

}
