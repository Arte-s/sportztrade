import React from "react";
import {ExRND, tExRND} from "../common/RND";
import {GridApi, GridOptions} from "ag-grid-community";
import {CellEvent} from "ag-grid-community/dist/lib/events";
import {StyleCSSHeadGrid, StyleGridDefault, tCallFuncAgGrid} from "../common/styleGrid";
import {AgGridColumn, AgGridReact} from "ag-grid-react";
import {MiniTextReact} from "../Elements/tableSearch";
import {NormalizeDouble} from "../../commons/commons";

import 'ag-grid-community/dist/styles/ag-grid.css';
// import 'ag-grid-community/dist/styles/ag-theme-alpine.css';
// import 'ag-grid-community/dist/styles/ag-theme-alpine-dark.css';
import {ApiClient} from "../reactI";

type tRows = {
    volume: number,
    price: number,
    count: number,
    // свой текущий limitOrder в стакане цен
    limitVolume?: number,
}
type tRowsKey = keyof tRows

type pTableOrderBooks = {
    getApi:(api: GridApi) =>void
    unMount?:(api: GridApi|undefined) =>void
}

export class TableOrderBooks extends React.Component<pTableOrderBooks, any>{
    state ={
        date: new Date()
    }
    gridApi: GridApi|undefined
    stop : boolean = false
    componentWillUnmount() {
        this.props.unMount?.(this.gridApi)
        this.stop = true;
    } //
    componentDidMount() {
        this.gridApi?.sizeColumnsToFit();
        this.stop = false;
        this.refresh()
    }

    refresh = ()=>{
        if (this.stop) return
        const data = ApiClient.ordersBookBySymbol(ApiClient.selectSymbol) ?? []
        this.gridApi?.setRowData(data.reverse())
        setTimeout(this.refresh, 100)
    }

    render() {

        // console.log({data})
        return <>
            <TableOrdersB
            data={[]}
            getApi={(api)=>{
                this.gridApi = api
                this.props.getApi(api)
            }}
            />
        </>
    }
}

// function randomAgr(count: number): tRows[] {
//     const result : tRows[] = []
//     for (let i=0; i<count; i++) {
//         result.push({
//             count:
//             volume: NormalizeDouble((Math.random()*10),2),
//             price: NormalizeDouble(100 + i*0.1,2)
//         })
//     }
//     //result.sort((a, b) => a.price = b.price)
//     return  result
// }

type tTableOrdersB<T> = {
    data: T[],
    onSelect?: (data:T)=>void,
    sizeAbsolute?: tExRND,
    name?: string,
    other?: JSX.Element,
    getApi?: (api: GridApi) =>void,
    unMount?: (api: GridApi|null) =>void,
    gridOptions?: GridOptions,
    keyForSave?:string,
    onCellClicked?: (event: CellEvent &{data:T}) => void,
    searchWith?: string|number,
    searchBy?: (keyof T) & string,
    onUnMoving?: (flag:boolean)=>void,
    getRiwId?: (e:T)=>string
    onTextBySearch?: (text: string)=>void,
    getSelectedRows?: (links:T[])=>void,
    header?: JSX.Element,
    headerName?: string
}

export class TableOrdersB<T extends {[key:string]:(any|string|Readonly<string>|number|Readonly<number>|boolean| Readonly<boolean>|Date)}, T2 extends object|null> extends React.Component<T2
    & tTableOrdersB<T>, any>
{
    _gridApi: GridApi| null = null;
    set gridApi (gridApi: GridApi| null) {
        this._gridApi = gridApi
        if (gridApi) this.props.getApi?.(gridApi)
    }
    get gridApi () {return this._gridApi}
    componentWillUnmount() {
        this.props.unMount?.(this.gridApi)
    }
    componentDidMount() {
        this.gridApi?.sizeColumnsToFit();
    }

    state: {absMove: boolean}= {absMove: false}

    gridOptions :GridOptions = {
        onCellClicked: (event: CellEvent &{data:T}) => {
            this.props.getSelectedRows?.(this._gridApi!.getSelectedRows())
            this.props.onCellClicked?.(event)
        }
    }
    shouldComponentUpdate(nextProps: Readonly<T2 & tTableOrdersB<T>>, nextState: Readonly<any>, nextContext: any): boolean {
        //if (nextProps.data.length == this.props.data.length) return false;
        return true
    }

    style = {...StyleGridDefault}
    constructor(p:any) {
        super(p);
    }
    styleColumColor: tCallFuncAgGrid<T> = (params) => {
        return {...this.style,
            'backgroundColor:': params.data.select.color
        };
    }
    styleSelect: tCallFuncAgGrid<T> = (params) => {
        return {...this.style,
            'color': params.data.select.select? '#ffffff':'#656565'
        };
    }
    styleTable: tCallFuncAgGrid<T> = () => this.style

    styleTablePrice: tCallFuncAgGrid<T> = (params) => {
        return  { ...this.style,
            'fontSize': '12px',
            'color': (params.data.price > params.data.lastPrice) ? '#10B890':'#F44050',
        }
    }


    table(){
        StyleCSSHeadGrid();
        this.gridOptions.rowClassRules = {
            '_green': (event) => {
                return event.data.volume > 0;
            },
            '_red': (event) => {
                return event.data.volume <= 0;
            }
        }
        return <AgGridReact
            onGridReady={(e)=> {
                this.gridApi = e.api
            }}
            className= "ag-theme-alpine"
            onGridSizeChanged={()=>{
                this.gridApi?.sizeColumnsToFit();
            }}
            rowData = {this.props.data}
            headerHeight = {40}
            rowHeight = {28}
            rowSelection ={this.props.getSelectedRows?'multiple':'single'}
            getRowId = {({data}:{data:tRows})=>String(data.price)}
            getRowClass = {({data}:{data:tRows})=>(data.volume > 0 ? '_green' : '_red')}
            gridOptions = {this.props.gridOptions ?? this.gridOptions}
        >
            {/*<AgGridColumn*/}
            {/*    field={"price" as tRowsKey}*/}
            {/*    valueGetter={({data}: {data: tRows})=>""}*/}
            {/*    headerName= {""}*/}
            {/*    headerClass= {"gridTable-header"}*/}
            {/*    sortable= {true}*/}
            {/*    filter= {true}*/}
            {/*    cellStyle= {this.styleTable}*/}
            {/*/>*/}
            <AgGridColumn
                field={"price" as tRowsKey}
                headerName= {"Price"}
                headerClass= {"gridTable-header"}
                sortable= {true}
                filter= {true}
                resizable={true}
                cellStyle= {() => ({...this.style, width: '30%'})}
            />
            <AgGridColumn
                field={"volume" as tRowsKey}
                headerName= {"Quantity"}
                headerClass= {"gridTable-header"}
                sortable= {true}
                filter= {true}
                resizable={true}
                cellStyle= {({data}:{data: tRows})=>({...this.style, color: data.volume>0 ?"#10B890":"#F44050", width: '32%', textAlign: 'right', left: '30%',  justifyContent:'flex-end'})}
            />
            <AgGridColumn
                field={"count" as tRowsKey}
                headerName= {"Total"}
                headerClass= {"gridTable-header"}
                sortable= {true}
                filter= {true}
                resizable={true}
                cellStyle= {() => ({...this.style, width: '38%', textAlign: 'right', justifyContent:'flex-end', left: '62%'})}
            />
            {/*<AgGridColumn*/}
            {/*    field={"limitVolume" as tRowsKey}*/}
            {/*    headerName= {"время"}*/}
            {/*    valueGetter={({data}: {data: tRows})=>data.limitVolume?"*":""}*/}
            {/*    headerClass= {"gridTable-header"}*/}
            {/*    sortable= {true}*/}
            {/*    filter= {true}*/}
            {/*    cellStyle= {this.styleTable}*/}
            {/*/>*/}
        </AgGridReact>
    }

    render() {
        return <>{this.table()}</>
    }
}
