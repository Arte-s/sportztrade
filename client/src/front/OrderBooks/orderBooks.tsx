import React from "react";
import {OrderPanel} from "./order";
import {TableOrderBooks} from "./tableOrderBooks";
import {GridApi} from "ag-grid-community";

export class OrderBooks extends React.Component<any, any>{
    gridApi: GridApi|undefined
    render() {
        return <div style={{display: "flex"}}>
            <div className={"maxSize"} style={{width:"50%"}}>
                <TableOrderBooks
                    getApi={(api)=> {
                        this.gridApi = api
                    }}
                />
            </div>
            <div className={"maxSize"} style={{width:"50%"}}>
                <OrderPanel/>
            </div>
        </div>
    }
}
