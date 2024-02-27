import React, {ReactElement} from 'react';
import { canvasV2, mouse} from "../reactI";
import {WindowLight} from "../common/reactCommon";
import {IControlDisplayCanvas2D} from "./controlDisplayCanvas2D";
import {TF} from "../../graph sist/Nav/Time";

import * as api from "../../graph sist/API";
import { CSettingsOther } from './MuneSettingInputColor';

type tMenuReact = {name:string, onClick?:(e:any)=>void, active?:()=>boolean, status?:boolean, next?:()=>tMenuReact[], func?:()=>ReactElement, onFocus?:()=>tMenuReact[]}
// CBaseHoverEasy - класс для наведения на объект.
// DivMove - класс, который появляется, с анимацией выдвижением.
// WindowLight - окно при нажатии мимо которого вызолиться deInit

type tMenuRState = {refresh:boolean}



class CMenuRBase extends React.Component<{data:tMenuReact[], onDeInit?:()=>void ,coordinate:{x:number,y:number}, id?:number, tabIndex?:number}, tMenuRState>{
    state:tMenuRState = {refresh:false}
    Refresh(){this.setState({refresh:!this.state.refresh})}

    MenuCod(arr:tMenuReact[], coordinate:{x:number,y:number}={x:0,y:0}, id:number = 0){

        return <>
            {arr.map((e,i,max)=>{
                e.status??=false
                return <div key={i} className={("graph-controls__item_" + e.name) + " graph-controls__item" + (e.active?.()?" _active":"")}
                            // onMouseEnter={()=>{
                            //     if (e.status) return;
                            //     for (let j = 0; j < max.length; j++) {
                            //         max[j].status= j==i
                            //     }
                            //    arr[i].status=true;
                            //     this.Refresh();
                            // }}
                >
                    <div className={"graph-controls__lbl " + (e.active?.()?"_active":"")}
                         onClick={()=>{e.onClick?.(e); this.Refresh();}}
                        >{e.name}</div>
                    <>
                        {e.next?.() && <div className={"graph-controls-submenu"} style={{position:"relative"}}><CMenuRBase data={e.next()} coordinate={{x:0,y:0}}/></div> }
                        {e.func?.()}
                    </>
                </div>
            })}
        </>
    }
    render() {
        return this.MenuCod(this.props.data, this.props.coordinate, this.props.id)
    }

}

class CMenuR extends React.Component<{data:tMenuReact[], onDeInit?:()=>void ,coordinate:{x:number,y:number}, id?:number, tabIndex?:number}, tMenuRState>{
    state:tMenuRState = {refresh:false}
    Refresh(){this.setState({refresh:!this.state.refresh})}

    render() {
        return <div className="graph-controls">
            <CMenuRBase data={this.props.data} coordinate={this.props.coordinate}/>
        </div>;
    }
}
function settingBars() {
    return [
        {
            name: "setting", status: false, next: () => [
                {name: "bar",       status: false, onClick: () => {mouse.active?.SetStyleGraph('bar')},    active: ()=>mouse.active?.GetStyleGraph()=="bar" },
                {name: "candle",    status: false, onClick: () => {mouse.active?.SetStyleGraph('candle')}, active: ()=>mouse.active?.GetStyleGraph()=="candle" },
                {name: "line",      status: false, onClick: () => {mouse.active?.SetStyleGraph('line')},   active: ()=>mouse.active?.GetStyleGraph()=="line" }
            ]
        }]
}

function windowsDefault(data: IControlDisplayCanvas2D) {
    return [
        {
            name: "1 window", status: false, onClick: async () => {mouse.active = await data.creatMini(1, undefined,mouse.active?.GetSystemBox().lastBox) }
        },
        {
            name: "1 x 1", status: false, onClick: async () => { mouse.active = await data.creatByStruct(
                {
                    h:[
                        {},
                        {}
                    ]
                }
            ) }
        },
        {
            name: "1 / 1", status: false, onClick: async () => {mouse.active = await  data.creatByStruct(
                {
                    v:[
                        {},
                        {}
                    ]
                }
            ) }
        },
        {
            name: "1 x 2", status: false, onClick: async () => {mouse.active = await  data.creatByStruct(
                {
                    h:[
                        {},
                        {
                            v: [{},{}]
                        }
                    ]
                }
            ) }
        },
        {
            name: "1 x 3", status: false, onClick: async () => {
                mouse.active = await  data.creatByStruct(
                    {
                        h: [
                            {},
                            {
                                v: [{},{},{}]
                            }
                        ]
                    }
                )
            }
        },
        {
            name: "2 x 2", status: false, onClick: async () => {
                mouse.active = await data.creatByStruct(
                    {
                        h: [{v: [{},{}]},{v: [{},{}]}]
                    }
                )
            }
        },
        {
            name: "2 x 3", status: false, onClick: async () => {
                mouse.active = await data.creatByStruct(
                    {
                        h: [
                            {v: [{},{}]},
                            {v: [{},{},{}]}
                        ]
                    }
                )
            }
        },
        {
            name: "alfa", status: false, onClick: async () => {
                mouse.active = await data.creatByStruct(
                    {
                        h: [
                            {},{v: [{},{h:[{},{}]}]}
                        ]
                    }
                )
            }
        }]

}

export class CMiniMenuForGraph extends React.Component<{children?:ReactElement, other?:tMenuReact[], onDeInit?:()=>void ,coordinate?:{x:number,y:number}}, any>{
    coordinate: {x: number, y: number}
    constructor(p:any) {
        console.log("120002", p)
        super(p);
        this.coordinate = this.props.coordinate??{x:0,y:0}
        console.log("122", this.coordinate, this.props.coordinate)
    }

    timeFrame ():tMenuReact[]{
        return TF.all.filter(e=>!!e).map((e)=>{return {name:e.name, status:false, active:()=> mouse.active?.symbolData?.tf==e, onClick:()=>{mouse.active?.symbolData?.Set({tf:e})}}}).slice(11)
    }

    timeFrameMini ():tMenuReact[]{
        // return api.MainTimeframes.map((e)=>{return {name:e.name, status:false, active:()=> mouse.active?.symbolData?.tf==e, onClick:()=>{mouse.active?.symbolData?.Set({tf:e})}}})
        return api.MainTimeframes.map((e)=>{
            return {
                name:e.name,
                status:false
            }
        })
    }

    timeFrameMenu(){

        let arr : tMenuReact[]= this.timeFrameMini();

        const move = [
            {
                name:"<<", status: false, onClick: async () => {mouse.active?.MoveToStart()}
            },
            {
                name:">>", status: false, onClick: async () => {mouse.active?.MoveToEnd()}
            }
        ]


        const tff =
            {
                name:"all", next:()=>this.timeFrame(), status:false
            }

        arr.push(tff)

        return [
            {name: "1D", status: false},
            {name: "5D", status: false},
            {name: "1W", status: false},
            {name: "1M", status: false},
            {name: "1Y", status: false},
            {name: "All", status: false}
        ]
    }
    Menu(){
        let indicator: tMenuReact  =  {
            // name: "indicators", status: false, next: () =>
            //     mouse.active?.indicators?.indicators!.map((e)=>{
            //         return {
            //             name: e.name,
            //             status: false,
            //             active:()=>e.visible,
            //             onClick:()=> {e.visible=!e.visible; mouse.active?.Draw()}
            //         }
            //     }) ??[]
            name: "indicators", status: false, next:()=> [
                {name: "Trendline", status: false},
                {name: "Horizontal line", status: false},
                {name: "Vertical line", status: false},
                {name: "Moving average", status: false},
                {name: "Fibonacci retracement", status: false},
                {name: "Average range", status: false}
            ]

        }


        let arr : tMenuReact[]= [];

        const move = [
            {
                name:"<<", status: false, onClick: async () => {mouse.active?.MoveToStart()}
            },
            {
                name:">>", status: false, onClick: async () => {mouse.active?.MoveToEnd()}
            }
        ]


        const tff =
            // {
            //     name:"timeframe", next:()=>[
            //         {name:"all", next:()=>this.timeFrame(), status:false},
            //         ...this.timeFrameMini()] // вызываем меню таймфреймов
            // }
            {
                name:"1H", next:()=>this.timeFrame(), status:false

            }
            // {
            //     name:"символ", status:false , func:()=><SelectSymbolTableModal keyForSave={"menuR"}/>
            // }
        arr.push(tff)
        // arr.push(...move)
        if (this.props.other) arr.push(...this.props.other)
        // arr.push(...[
        //     {
        //     name:"проверка", status:false, next:()=>[
        //         {name:"пусто", status:false, next:()=>[
        //                 {name:"пусто", status:false, next:()=>[]},
        //                 {name:"пусто", status:false, next:()=>[]}, ]},
        //         {name:"пусто", status:false, next:()=>[
        //                 {name:"пусто", status:false, next:()=>[]},
        //                 {name:"пусто", status:false, next:()=>[]}, ]},
        //     ]// вызываем меню таймфреймов
        // }])

   //     if (this.props.other) arr.push(...this.props.other)
        arr.push(...[{
            name: "graph", status: false, next: () => [
                {name: "bar",       status: false, onClick: () => {mouse.active?.SetStyleGraph('bar')},    active: ()=>mouse.active?.GetStyleGraph()=="bar" },
                {name: "candle",    status: false, onClick: () => {mouse.active?.SetStyleGraph('candle')}, active: ()=>mouse.active?.GetStyleGraph()=="candle" },
                {name: "line",      status: false, onClick: () => {mouse.active?.SetStyleGraph('line')},   active: ()=>mouse.active?.GetStyleGraph()=="line" }
            ]
        }, indicator
        ])
        return arr
    }

    render() {//
        return <div className={"graph__controls"}>
            <CMenuR coordinate={this.coordinate} data={this.timeFrameMenu()} id={0} tabIndex={999}
                    onDeInit={() => this.props.onDeInit?.()}/>
            {/*<CMenuR coordinate={this.coordinate} data={this.timeFrame()} id={0} tabIndex={999} onDeInit={()=>this.props.onDeInit?.()}/>*/}
            <CMenuR coordinate={this.coordinate} data={this.Menu()} id={0} tabIndex={999}
                    onDeInit={() => this.props.onDeInit?.()}/>

            {this.props.children}
        </div>;
    }
}


export class CMiniMenuForGraphTest extends React.Component<{
    children?: ReactElement,
    other?: tMenuReact[], onDeInit?:()=>void ,coordinate?:{x:number,y:number}}, any>{
    coordinate:{x:number,y:number}
    constructor(p:any) {
        super(p);
        this.coordinate = this.props.coordinate??{x:0,y:0}
    }


    Menu(){
        let indicator: tMenuReact  =  {
            name: "indicators", status: false, next: () =>
                mouse.active?.indicators?.indicators!.map((e)=>{
                    return {
                        name: e.name,
                        status: false,
                        active:()=>e.visible,
                        onClick:()=> {e.visible=!e.visible; mouse.active?.Draw()},
                    }
                }) ??[] //indicatorSetup(e)

        }

        let arr : tMenuReact[]= []
        arr.push(...[
                {
                    name: "setting", status: false, func: () => {
                        return <CSettingsOther key={10} coordinate={{x:0, y:0 , h:500, w:500}}/>
                    }
                }, indicator,...settingBars(),
          //   {
          //       name: "окна",       status: false,  next: () => [...windowsDefault(canvasVTest)]
          //   },
            {
                name: "auto",       status: false, onClick: () => {if (mouse.active) mouse.active.AutoHeight=!mouse.active.AutoHeight},    active: ()=>!!mouse.active?.AutoHeight
            }

        ])
        return arr
    }

    render() {//
        return <div className={"test"}>
            <CMenuR coordinate={this.coordinate} data={this.Menu()} id={0} tabIndex={999} onDeInit={()=>this.props.onDeInit?.()}/>
            {this.props.children}
        </div>;
    }
}
