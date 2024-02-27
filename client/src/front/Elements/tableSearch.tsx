import React, {CSSProperties} from "react";
import {AgGridColumn, AgGridReact} from "ag-grid-react";
import { GridApi, GridOptions} from "ag-grid-community";
import {StyleCSSHeadGrid, StyleGridDefault, tCallFuncAgGrid} from "../common/styleGrid";
import {CellEvent} from "ag-grid-community/dist/lib/events";
import {ExRND, tExRND} from "../common/RND";

class TableSearch<T extends {[key:string]:any}> extends React.Component<{data:T[]}, any>{

    table(){

    }
    render() {
        return undefined;
    }

}

export type tMiniTableProp<T> = {
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
/**
 * шаблон таблицы с поиском и RND (возможностью перетаскивания окна и изменения размера)
 * T - объект строки таблицы
 * T2 - добавочный props
 * класс предназначен для создания небольших списков, или как шаблон
 */
export class MiniTable<T extends {[key:string]:(any|string|Readonly<string>|number|Readonly<number>|boolean| Readonly<boolean>|Date)}, T2 extends object|null> extends React.Component<T2
    & tMiniTableProp<T>, any>
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

    state: {absMove: boolean}= {absMove: false}

    gridOptions :GridOptions = {
        // Add event handlers
        onCellClicked: (event: CellEvent &{data:T}) => {
            this.props.getSelectedRows?.(this._gridApi!.getSelectedRows())
            this.props.onCellClicked?.(event)
        }
    }
    shouldComponentUpdate(nextProps: Readonly<T2 & tMiniTableProp<T>>, nextState: Readonly<any>, nextContext: any): boolean {
        if (nextProps.data.length == this.props.data.length) return false;

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
    styleTable: tCallFuncAgGrid<T> = () => {
        return this.style
        // return {...this.style,
        //     'paddingLeft': '0',
        //     'paddingRight': '0',
        //     'textAlign': 'right',
        //     'justifyContent': 'flex-end',
        //     'width': 100/8 + '%',
        //     'lineHeight': '32px',
        //     'textTransform': 'none'
        // };
    }

    styleOrdersTable: tCallFuncAgGrid<T> = () => {
        return {...this.style,
            'paddingLeft': '0',
            'paddingRight': '0',
            'textAlign': 'right',
            'justifyContent': 'flex-end',
            'width': 100/8 + '%',
            'lineHeight': '32px',
            'textTransform': 'none'
        };
    }

    styleTablePrice: tCallFuncAgGrid<T> = (params) => {
        return  { ...this.style,
            'color': (params.data.price > params.data.lastPrice) ?'green':'red',
        }
    }

    columns(): JSX.Element[]|JSX.Element{
        const obj = this.props.data[0] as object
        const columns: JSX.Element[] = []
        for (const objKey in obj) {
            columns.push(
                <AgGridColumn
                    key= {objKey}
                    field= {objKey}
                    headerName= {objKey}
                    headerClass= {"gridTable-header"}
                    sortable= {true}
                    filter= {true}
                    cellStyle= {this.styleTable}
                />
            )
        }
        return columns
    }

    table(){
        StyleCSSHeadGrid();
        return <AgGridReact
            onGridReady={(e)=> {
                this.gridApi = e.api
            }}
            className= "ag-theme-alpine-dark"
            onGridSizeChanged={()=>{
                this.gridApi?.sizeColumnsToFit();
            }}
            rowData = {this.props.data}
            headerHeight = {20}
            rowHeight = {30}
            rowSelection ={this.props.getSelectedRows?'multiple':'single'}

            gridOptions = {this.props.gridOptions ?? this.gridOptions}
            getRowId = {  ({data}) =>this.props.getRiwId?.(data) ?? data[this.props.searchBy ?? "symbol"] }

        >
            {this.columns()}
        </AgGridReact>
    }

    onUnMoving(flag: boolean) {
        this.props.onUnMoving?.(flag)
        this.setState({absMove:flag})

        if (!!this.props.sizeAbsolute) {
            this.forceUpdate()
        }
        //console.log({flag})
    }
    onTextBySearch(text:string) {this.props.onTextBySearch?.(text)}

    miniTextReact(by: string = "symbol"){
        return <MiniTextReact
            style={{width:"100%"}}
            onText={(text) => {
                this.onTextBySearch(text)
                this.gridApi?.setFilterModel({[by]: {type:"contains", filter: text}})
            }}/>
    }
    // поля по которому будет произведен фильтр
    search(by: string = "symbol") {
        return <div
            style={{width: this.props.searchWith??"50%"}}
            onMouseEnter={() => {this.onUnMoving(true)}}
            onMouseLeave={() => {this.onUnMoving(false)}}>
            {this.miniTextReact(by)}
        </div>
    }

    searchDiv({table, search}: {table: JSX.Element, search?: string }) {
        const _search = search ?? this.props.searchBy ?? "symbol"
        return <div style={{ width: "100%", height:"100%", display:"flex", flexDirection:"column",flex:"auto 1 1"}}>
            {this.props.header}
            {this.props.headerName && <div className={"headerSearch"}>{this.props.headerName}</div>}
            <div className={"maxSize"}>
                <div className={"toLine"}
                     style= {{ width: "100%", height: "20px", background: "#3c3f41", flexDirection:"row", flex:"auto 1 1"}}>
                    {this.search(_search)}
                    <div
                        style={{height:"100%", width:"100%" }}
                        onClick={()=>{
                            this.onUnMoving(false)
                        }}
                    >
                        {!!this.props.name && <p>{this.props.name}</p>}
                        {this.props.other}
                    </div>
                </div>
                <div className={"headerSearchDef"}
                     onMouseEnter={() => {
                         this.onUnMoving(true)
                     }}
                     onMouseLeave={() => {
                         this.onUnMoving(false)
                     }}
                >
                    {table}
                </div>
            </div>
        </div>
    }

    SymbolRnd(keyForSave?: string) {
        return <ExRND disableDragging= {() => this.state.absMove}
                      keyForSave= {keyForSave ?? this.props.keyForSave}
                      position= {this.props.sizeAbsolute?.position}
                      size= {this.props.sizeAbsolute?.size}
                      update= {() => {
                          this.gridApi?.sizeColumnsToFit();
                      }}>
            {this.searchDiv({table:this.table()})}
        </ExRND>
    }

    render() {
        const result = (!!this.props.sizeAbsolute) && this.SymbolRnd()
        return result || this.searchDiv({table: this.table()})
    }
}

export type MiniTextReactApi = {setText: (text: string) => void, getText: ()=>string}
type MiniTextReactState = {text: string}
type tMiniTextReactProps =  {onText: (text: string)=>void, text?: string, className?: string, style?: React.CSSProperties, getApi?:(api: MiniTextReactApi)=> void}
export class MiniTextReact extends React.Component <tMiniTextReactProps, MiniTextReactState>{
    componentDidMount() {
        this.props.getApi?.(this.api)
    }

    api: MiniTextReactApi = {
        getText: ()=>this.state.text,
        setText: (text)=>{this.setState({text})}
    }
    state: MiniTextReactState = {text: ""}
    constructor(p:tMiniTextReactProps) {
        super(p);
        if (this.props.text) this.state = {text: this.props.text}
    }
    render() {
        const {onText,text,className,style} = this.props
        return <input type = "text"
                      className = {className}
                      style = {style}
                      value = {this.state.text}
                      onInput = {(e: any)=>{
                          onText?.(e.target.value)
                          // text ??= e.target.value
                          this.setState({text: e.target.value});
                      }}/>
    }
}


/**
 * шаблон с кнопкой сохранить в поиске
 */
class SessionTableMiniSave<T extends {[key:string]:string|number|boolean|Date},D> extends MiniTable<T,{save:(text: string)=>void, selected: T} &D> {
    _key: T|undefined;

    shouldComponentUpdate(nextProps: Readonly<{ save: (text: string) => void; selected: T } & D & tMiniTableProp<T>>, nextState: Readonly<any>, nextContext: any): boolean {
        // const buf = Sessions.getKeySession()
        //
        // if (this._key?.id != buf.id || this._key?.date.valueOf() != buf.date.valueOf()) {
        //
        // }
        // super.shouldComponentUpdate(nextProps, nextState, nextContext);

        return true
    }

    table(){
        StyleCSSHeadGrid();
        return <AgGridReact
            onGridReady={(e)=> {
                this.gridApi = e.api
            }}
            className= "ag-theme-alpine-dark"
            onGridSizeChanged={()=>{
                this.gridApi?.sizeColumnsToFit();
            }}
            rowData = {this.props.data}
            headerHeight = {20}
            rowHeight = {30}
            gridOptions = {this.props.gridOptions ?? this.gridOptions}
        >
            {this.columns()}
        </AgGridReact>
    }


    styleTable: tCallFuncAgGrid<T> = (params) => {
        const data = params.data as T
        const c = (data.ff) ? { 'backgroundColor':'rgb(0,70,6)'}:{}
        return {
            ...this.style,
            ...c
        }
    }

    textSearch= ""
    miniTextReact(by: string = "symbol"){
        return <MiniTextReact
            text={this.textSearch}
            style={{width:"100%"}}
            onText={(text) => {
                this.onTextBySearch(text)
                this.gridApi?.setFilterModel({[by]: {type:"contains", filter: text}})
            }}/>
    }

    onTextBySearch(text: string) {
        super.onTextBySearch(text);
        this.textSearch = text;
        this.forceUpdate()
    }
    save(_searchBy?:string){
        return <div
            style={{padding: "4px 4px"}}
            onClick={() => {
                this.props.save(this.textSearch)
                this.textSearch=""
                this.gridApi?.setFilterModel({[_searchBy ?? this.props.searchBy ?? "symbol"]: {type:"contains", filter: this.textSearch}})
                this.onTextBySearch(this.textSearch)
                this.forceUpdate()
            }}
            className={"toButtonSw"}
        >{"сохранить"}</div>
    }
    searchDiv({table, search}: {table: JSX.Element, search?: string }) {
        const _search = search ?? this.props.searchBy ?? "text"
        return <div style={{ width: "100%", height:"100%"}}>
            <div className={"toLine"} style= {{ width: "100%", height: "20px", background: "#3c3f41"}}>
                {this.search(_search)}
                {!!this.props.name && <p>{this.props.name}</p>}
                {this.textSearch == "" ? this.props.other : this.save(_search)}
            </div>
            <div className={"headerSearchDef"}
                 onMouseEnter={() => {this.onUnMoving(true)}}
                 onMouseLeave={() => {this.onUnMoving(false)}}
            >
                {table}
            </div>
        </div>
    }
}
