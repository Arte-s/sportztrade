
import {HTMLAttributes, ReactElement} from "react";

import React from 'react';
import {mouse} from "../reactI";
import {TF} from "../../graph sist/Nav/Time";

type ReactNode= React.ReactNode;
//виртуальный список


//
// type tVRow={text:string|React.ReactElement}[]
// export function CVirtualScroll({ data, rowHeight, height }:{data:tVRow[], rowHeight:number, height:number}) {
//     const rootRef:any = React.useRef();
//     const [start, setStart] = React.useState(0);
//
//     function getTopHeight() {
//         return rowHeight * start;
//     }
//     function getBottomHeight() {
//         const d=rowHeight * (data.length - (start )) - height;
//         return  d<0?0:d;
//     }
//
//     React.useEffect(() => {
//         function onScroll(e:any) {
//             setStart(Math.min(
//                 Math.floor(data.length - height/rowHeight ),
//                 Math.floor(e.target.scrollTop / rowHeight)
//             ));
//         }
//         rootRef.current?.addEventListener('scroll', onScroll);
//         return () => {
//             rootRef.current?.removeEventListener('scroll', onScroll);
//         }
//     }, [data.length, height/rowHeight, rowHeight]);
//
//     return (
//         <div style={{ height: height + 1, overflow: 'auto' }} ref={rootRef}>
//             <div style={{ height: getTopHeight() }} />
//             <table>
//                 <tbody>
//                 {data.slice(start, start + Math.floor(height/rowHeight )+ 1).map((row, rowIndex) => (
//                     <tr
//                         style={{ height: rowHeight }}
//                         key={start+rowIndex}
//                     >{row.map((text, colIndex) => (
//                         <td key={colIndex}>{text}</td>
//                     ))}</tr>
//                 ))}
//                 </tbody>
//             </table>
//             <div style={{ height: getBottomHeight() }} />
//         </div>
//     )
// }


//клас выбора элемента по нажатию типо кнопки имеет эффект нажатости
export class CNameWindows<T> extends React.Component<{callbackClick:(d:T)=>void, work:T,default:T, children?:any},{}> {
    render(){
        return <div className={this.props.work==this.props.default?"toButtonA":"toButton"} onClick={()=>{this.props.callbackClick(this.props.default);}}>
            {this.props.children??null}
        </div>
    }
}

export type tFNameWindows<T> = {callbackClick: (d:T)=>void, work: T, default: T, children?: any}

export function FNameWindows<T>(data: tFNameWindows<T>) {
    return <div className = {data.work == data.default ? "toButtonA" : "toButton"} onClick={()=>{data.callbackClick(data.default)}}>
        {data.children??null}
    </div>
}


//класс выбора из массива элементов
export class CNameArray extends React.Component<{array:[],callbackClick:(item:any)=>any, work:(item:any)=>any, def:(item:any)=>any},null> {
    render(){
        return <>
            {this.props.array.map((item)=>
                <CNameWindows key={this.props.def(item)} callbackClick={this.props.callbackClick} work={this.props.work(item)} default={this.props.def(item)}>
                    this.props.def(item)
                </CNameWindows>)}
        </>
    }
}


//класс для кнопки
export class CButton extends React.Component<{
    children: JSX.Element,
    name:(type:boolean)=>JSX.Element,
    header?:React.ReactNode,
    className?:string,
    status?:boolean,
    onExpand? :(flag :boolean)=>void
},{
    status:boolean
}>{
    constructor(props:any) {
        super(props);
        this.state= {status: this.props.status ?? false}
    }
    render() {
        //style={{width:"60%"}}
        return (
        <>
            <div className={"toLine"+(this.props.className?" "+this.props.className:"")}>
                <div style={{width:"100%"}}  onClick={()=>{ let status= !this.state.status;  this.setState({status});  this.props.onExpand?.(status); }} >
                    {this.props.name(this.state.status)}
                </div>
                {this.props.header}
            </div>
            {this.state.status && this.props.children}
        </>
        )
    }
}

//класс которые появляется с анимацией выдвижением
export function DivMove({children, style}:{children:JSX.Element, style?:React.CSSProperties}):JSX.Element {
    return <div style={{overflow:"hidden"}}>
        <div  style={{
            animation: "moveDown 0.2s"
        }}>
            {children}
        </div>
    </div>
}

//класс наведение на объект, если на вели на оболочку над children то появиться onFocusUp/focusDw
export class CBaseHoverEasy extends React.Component <{children:(hover:boolean)=>ReactElement, className?:string, style?:any},{hover:boolean}>{
    state={hover:false}
    render(){
        return   <div
            className={this.props.className}
            style={this.props.style}
            onMouseLeave={()=>{this.setState({hover:false})}}
            onMouseEnter={()=>{this.setState({hover:true})}}
        >
            {this.props.children(this.state.hover)
            }
        </div>
    }
}


export class ButtonStatic extends React.Component <{click?:(status:boolean)=>void, button: ReactNode, children: ReactNode, onCLickInit?: ()=>void, onDestroy?:()=>void},{statusClick:boolean}>{
    wrapperRef:HTMLDivElement|undefined;

    readonly Ref=(node:any)=>       {if (node && node!=this.wrapperRef) this.wrapperRef=node}
    state=                          {statusClick:false}
    readonly onCLick=()=>           {
        const {onDestroy, onCLickInit,click} = this.props;
        const statusClick=!this.state.statusClick;
        if (onDestroy && !statusClick) onDestroy();
        if (onCLickInit && statusClick) onCLickInit();
        click?.(statusClick);
        this.setState({statusClick: statusClick});
    }
    render() {
        return <div >
            <div onClick={this.onCLick}>
                {this.props.button}
            </div>
            {this.state.statusClick && this.props.children}
        </div>
    }
}

export class Button extends React.Component <{button: JSX.Element, children: ReactNode},{statusClick:boolean}>{
    wrapperRef:HTMLDivElement|undefined;
    constructor(props:{button:JSX.Element,children: ReactNode}) {
        super(props);
        this.Ref                = this.Ref.bind(this);
        this.handleClickOutside = this.handleClickOutside.bind(this);
    }
    Init():void                 {document.addEventListener('mousedown', this.handleClickOutside);}
    DeInit():void               {document.removeEventListener('mousedown', this.handleClickOutside);}
    handleClickOutside(event:any)   {if (this.wrapperRef && !this.wrapperRef.contains(event.target)) this.onCLick();}
    readonly Ref=(node:any)=>       {if (node && node!=this.wrapperRef) this.wrapperRef=node}
    state=                      {statusClick:false}
    readonly onCLick=()=>       {
        if (!this.state.statusClick) this.Init(); else this.DeInit();
        this.setState({statusClick: !this.state.statusClick});
    }
    render() {
        return <div ref={this.Ref}>
            <div onClick={this.onCLick}>
                {this.props.button}
            </div>
            {this.state.statusClick&&(this.props.children??null)}
        </div>
    }
}
export type tButtonFunc = {getStatus: () => boolean, setStatus: (e: boolean) => void}
type tButtonFuncProps = {button: (enable: boolean)=>JSX.Element, children: ReactNode, getApi?:(api:tButtonFunc)=>void }
export class ButtonFunc extends React.Component <tButtonFuncProps,{statusClick:boolean}>{
    wrapperRef: HTMLDivElement|undefined;
    constructor(props: tButtonFuncProps) {
        super(props);
        this.Ref                = this.Ref.bind(this);
        this.handleClickOutside = this.handleClickOutside.bind(this);
        this.props.getApi?.(this.api)
    }
    api : tButtonFunc = {
        getStatus: ()=>this.state.statusClick,
        setStatus: (e: boolean)=>this.setState({statusClick:e})
    }
    Init():void                 {document.addEventListener('mousedown', this.handleClickOutside);}
    DeInit():void               {document.removeEventListener('mousedown', this.handleClickOutside);}
    handleClickOutside(event:any)   {if (this.wrapperRef && !this.wrapperRef.contains(event.target)) this.onCLick();}
    readonly Ref=(node:any)=>       {if (node && node!=this.wrapperRef) this.wrapperRef=node}
    state=                      {statusClick: false}
    readonly onCLick=()=>       {
        if (!this.state.statusClick) this.Init();
        else this.DeInit();
        this.setState({statusClick: !this.state.statusClick});
    }
    render() {
        return <div ref={this.Ref}>
            <div onClick={this.onCLick}>
                {this.props.button(this.state.statusClick)}
            </div>
            {this.state.statusClick && (this.props.children ?? null)}
        </div>
    }
}

type tButtonFuncFocusProps = {button: (enable: boolean)=>JSX.Element, children: ReactNode, getApi?:(api:tButtonFunc)=>void }
export class ButtonFuncFocus extends React.Component <tButtonFuncProps,{statusClick:boolean}>{
    state = {statusClick: false}
    render() {
        return <div
            onMouseEnter={()=>this.setState({statusClick: true})}
            onMouseLeave={()=>{this.setState({statusClick: false})}
        }>
            {this.props.button(this.state.statusClick)}
            {this.state.statusClick && (this.props.children ?? null)}
        </div>
    }
}



//окно вызывает onDeInit если мышкой нажали мимо окна, не путать с размонтированием
export class WindowLight extends React.Component <{children: ReactNode, onDeInit:()=>void, onRun?:()=>void, tabIndex?:number},{statusClick:boolean}>{
    wrapperRef:HTMLDivElement|undefined;
    //какой то баг из-за лишнего срабатывание первой кнопки которая переноситься при монтировании
    corect = false;
    constructor(props:{children: ReactNode, onDeInit:()=>void}) {
        super(props);
        this.Ref                = this.Ref.bind(this);
        this.handleClickOutside = this.handleClickOutside.bind(this);
    }
    componentDidMount() {
        this.corect=false;
        this.props.onRun?.();
        document.addEventListener('mousedown', this.handleClickOutside);
    }
    componentWillUnmount() {
        document.removeEventListener('mousedown', this.handleClickOutside);
    }
    DeInit():void                       {
        if (this.corect) this.props.onDeInit()
        else {this.corect=true}}
    handleClickOutside(event:any)       {if (this.wrapperRef && !this.wrapperRef.contains(event.target)) this.DeInit();}
    readonly Ref=(node:any)=>           {if (node && node!=this.wrapperRef) this.wrapperRef=node}
    render() {
        return <div ref={this.Ref} tabIndex={this.props.tabIndex}>
            {this.props.children??null}
        </div>
    }
}

//окно вызывает onDeInit если мышкой нажали мимо окна, не путать с размонтированием - без багов
export class WindowLight2 extends WindowLight {
    DeInit():void {
        this.corect=true
        this.props.onDeInit()
    }
}
//окно вызывает onDeInit если мышкой нажали мимо окна, не путать с размонтированием - без багов
export class WindowLight2Clicked extends WindowLight {
    DeInit():void {
        this.corect=true
        this.props.onDeInit()
    }
    componentDidMount() {
        this.corect=false;
        this.props.onRun?.();
        document.addEventListener('mouseup', this.handleClickOutside);
    }
    componentWillUnmount() {
        document.removeEventListener('mouseup', this.handleClickOutside);
    }
}

//окно вызывает onDeInit если мышкой нажали мимо окна, не путать с размонтированием - без багов
export class WindowLight3 extends WindowLight {
    DeInit():void {
        this.corect=true
        this.props.onDeInit()
    }
}


export class Button2 extends Button {
    render() {
        return <div ref={this.Ref} onClick={this.onCLick}>
            <div >
                {this.props.button}
            </div>
            {this.state.statusClick&&(this.props.children??null)}
        </div>
    }
}

//типо модального окна
export class ButtonAbs extends Button{
    render() {
        return <div style={{position:"relative"}} ref={this.Ref}>
            <div onClick={this.onCLick}>
                {this.props.button}
            </div>
            <div style={{zIndex:99, position:"absolute"}}>
                {this.state.statusClick&&(this.props.children??null)}
            </div>
        </div>
    }
}


export class ButtonAbsRight extends Button{
    render() {
        return <div style={{position:"relative"}} ref={this.Ref}>
            <div onClick={this.onCLick}>
                {this.props.button}
            </div>
            <div  style={{zIndex:99, position:"absolute",right:"0px"}}>
                {this.state.statusClick&&(this.props.children??null)}
            </div>
        </div>
    }
}


//большой класс отрисовки тестера и прочее

class Outside extends React.Component <{back:Function,children: ReactNode}>{
    wrapperRef:HTMLDivElement|undefined;
    constructor(props:any) {
        super(props);
        this.setWrapperRef = this.setWrapperRef.bind(this);
        this.handleClickOutside = this.handleClickOutside.bind(this);
    }
    componentDidMount()         {document.addEventListener('mousedown', this.handleClickOutside);}
    componentWillUnmount()      {document.removeEventListener('mousedown', this.handleClickOutside);}
    setWrapperRef(node:any)         {this.wrapperRef = node;}
    handleClickOutside(event:any)   {
        if (this.wrapperRef && !this.wrapperRef.contains(event.target)) {
            this.props.back();
        }
    }
    render() {
        return <div ref={this.setWrapperRef}>{this.props.children}</div>;
    }
}

class OutsideButton extends React.Component <{button:ReactNode,children: ReactNode},{statusClick:boolean}>{
    readonly state={statusClick:false}
    readonly onCLick=()=>{this.setState({statusClick:!this.state.statusClick})}
    readonly onCLickFalse=()=>{this.setState({statusClick:false})}
    render() {
        return <>
            <div onClick={this.onCLick}>
                {this.props.button}
            </div>
            {this.state.statusClick?<Outside back={this.onCLickFalse}>{this.props.children}</Outside>:null}
        </>
    }
}


class CStrategyParamEl extends React.Component<any,any> {
    state={status:false}
    constructor(props:any) {
        super(props);
    }
    render() {
        return (
            <div>
                <div className="toLine">
                    <div  onClick={()=>{this.setState({status:!this.state.status})}} style={{width:"80%"}}>
                        {this.props.name}
                    </div>
                    <div>
                        {this.props.closed}
                    </div>
                </div>
                {this.state.status?this.props.el:null}
            </div>
        )
    }
}//класс для кнопки


export class DivDrag2 extends  React.Component<HTMLAttributes<any> & {stop?:()=>boolean}, {refresh:boolean}>{
    state:{refresh:boolean}={refresh:false}
    Refresh() {return this.setState({refresh:!this.state.refresh})}
    p={x:0,y:0}
    _stop=false;
    render() {
        return <div
            style={{position:"absolute", height:"auto",width:"auto"}}
            className={this.props.className}
            onDoubleClick={this.props.onDoubleClick?(e:any)=>{this.props.onDoubleClick!(e)}:()=>{}}
            onClick={()=>{}}
            onMouseDown={(e:any)=>{console.log(e);
                if (e.clientY) e.target.style.top=String(e.clientY-this.p.y)+"px";
                if (e.clientX) e.target.style.left=String(e.clientX-this.p.x)+"px";
            }}
            onMouseMove={(e)=>{console.log(e)}}
            draggable={true}
            onDrag={(e:any)=>{
                if (!this._stop) {
           //         console.log(e,e.clientY);
           //          if (e.clientY) e.target.style.top=String(e.clientY-this.p.y)+"px";
           //          if (e.clientX) e.target.style.left=String(e.clientX-this.p.x)+"px";
                }
            }}
            onDragStart={(e:any)=>{
                // if ((this.props.stop && !this.props.stop()) || !this.props.stop) {
                //     this.p.x=e.clientX-e.target.offsetLeft;
                //     this.p.y=e.clientY-e.target.offsetTop;
                //     this._stop=false;
                // }
                // else {
                //     this._stop=true;
                // }
            }}
            onDragEnd={(e)=>{
            }}
        >{this.props.children}</div>;
    }
}
//двигает объекты
export class DivDrag extends  React.Component<HTMLAttributes<any> & {stop?:()=>boolean}, {refresh:boolean}>{
    state:{refresh:boolean}={refresh:false}
    Refresh() {return this.setState({refresh:!this.state.refresh})}
    p={x:0,y:0}
    _stop=false;
    render() {
        if (this.props.stop && this._stop!=this.props.stop()) {this._stop=this.props.stop(); this.Refresh();}
        // console.log(this.props.stop? !this.props.stop() : !this._stop);
        return <div
            className={this.props.className}
            onDoubleClick={this.props.onDoubleClick?(e:any)=>{this.props.onDoubleClick!(e)}:()=>{}}
            draggable={this.props.stop? !this.props.stop() : !this._stop}
            onDrag={(e:any)=>{
                if ((this.props.stop && !this.props.stop()) || !this._stop) {
                    if (e.clientY) e.target.style.top=String(e.clientY-this.p.y)+"px";
                    if (e.clientX) e.target.style.left=String(e.clientX-this.p.x)+"px";
                }
            }}
            onDragStart={(e:any)=>{
                if ((this.props.stop && !this.props.stop()) || !this.props.stop) {
                    this.p.x=e.clientX-e.target.offsetLeft;
                    this.p.y=e.clientY-e.target.offsetTop;
                    this._stop=false;
                }
                else {
                    this._stop=true;
                }
            }}
            onDragEnd={(e)=>{
            }}
        >{this.props.children}</div>;
    }
}
export class DivDoubleClickOrDrag extends  React.Component<HTMLAttributes<any> & {classNameFunk:(e:boolean)=>string, stop?:()=>boolean}, any>{
    state={refresh:false, doubleClick:false}
    Refresh() {return this.setState({refresh:!this.state.refresh})}
    render() {
        return <>
        {
            this.state.doubleClick
                ?
                <div
                    className={this.props.classNameFunk(this.state.doubleClick)}
                    onDoubleClick={()=>{
                        if ((this.props.stop && !this.props.stop()) || !this.props.stop) {
                            this.setState({doubleClick:!this.state.doubleClick})
                        }
                    }}
                >{this.props.children}</div>
                :
                <DivDrag
                    stop={this.props.stop}
                    className={this.props.classNameFunk(this.state.doubleClick)}
                    onDoubleClick={()=>{
                        if ((this.props.stop && !this.props.stop()) || !this.props.stop) {
                            this.setState({doubleClick:!this.state.doubleClick})
                        }
                    }}
                >{this.props.children}</DivDrag>
        }
        </>;
    }
}
//не доделал
export class DivDoubleClick extends  React.Component<HTMLAttributes<any> & {classNameFunk:(e:boolean)=>string}, any>{
    state={refresh:false, doubleClick:false}
    Refresh() {return this.setState({refresh:!this.state.refresh})}
    render() {
        return <div
            className={this.props.classNameFunk(this.state.doubleClick)}
            onDoubleClick={()=>{
                this.setState({doubleClick:!this.state.doubleClick})
            }}
        >{this.props.children}</div>;
    }
}

//не доделал
export class DivDragResize extends  React.Component<HTMLAttributes<any>, {refresh:boolean}>{
    state:{refresh:boolean}={refresh:false}
    Refresh() {return this.setState({refresh:!this.state.refresh})}
    p={x:0,y:0}
    l={x:0,y:0}
    render() {
        return <div
            className={this.props.className}
            draggable={true}
            onFocus={()=>{}}

            //     style={{resize:"horizontal"}}
            onDrag={(e:any)=>{
                console.log(e.target.clientWidth,this.p.x);
                //    if (e.clientX) e.target.style.left=String(e.clientX-this.p.x)+"px";
                if (e.clientY) e.target.style.top=String(e.clientY-this.p.y)+"px";
                if (e.clientX) {
                    if (this.p.x<25 ) {
                        //    e.target.style.width=String(e.clientX+e.target.offsetWidth-this.p.x)+"px";
                        //  e.target.style.left=String(e.clientX-this.p.x)+"px";
                    } else
                    if (e.target.clientWidth-this.p.x<25) {
                        e.preventDefault();
                        e.target.style.width=String(e.clientX-this.p.x+this.l.x-e.target.offsetLeft)+"px";
                        //  e.target.style.left=String(e.clientX-this.p.x)+"px";
                    }
                    else e.target.style.left=String(e.clientX-this.p.x)+"px";
                }
            }}
            onDragStart={(e:any)=>{
                this.p.x=e.clientX-e.target.offsetLeft;
                this.p.y=e.clientY-e.target.offsetTop;
                this.l.x=e.target.offsetWidth;
                this.l.y=e.target.offsetHight;
                //offsetLeft
            }}
            onDragEnd={(e)=>{
                // e.target.style.left=String(e.clientX-this.p.x)+"px";
                // e.target.style.top=String(e.clientY-this.p.y)+"px";
            }}
        >{this.props.children}</div>;
    }
}



interface ITableElement {[key:string]: React.ReactElement}
interface ITableData {[key:string]: number|string|boolean}

type tTableMiniStroke = (stroke:number,children:React.ReactElement) => React.ReactElement

type tTableA<T extends ITableData> = {
    headName? : ITableData | (string|number|boolean)[],
    data?: T[]| ITableData[] | (string|number|boolean)[][],
} & tTableStyle & tTableReact &
    {
        //Возвращает событие клика по элементу.... ключ элемента, строку, и номер строки
        onCLick? : ({key,stroke,nStroke}:{key?:string, stroke:ITableData|(string|number|boolean)[], nStroke?:number})=>void
        onCLickHead? : ({key}:{key:string})=>void
        refresh?:(funk:()=>void)=>void
        head? : "static"|"simple"|"off"
    }


type tTableReact = {
    strokeReact? : tTableMiniStroke,
    headStrokeSReact? : tTableMiniStroke,
    elReact? : ITableElement,
    headElReact? : ITableElement,
    headDataReact? : ITableElement,
    dataStyleReact? : ITableElement
}

type tCSS=React.CSSProperties
type tTableStyle = {
    elStyle? : tCSS,
    strokeStyle? : tCSS,
    headElStyle? : tCSS,
    headStrokeStyle? : tCSS
    headDataStyle? : tCSS,
    dataStyle? : tCSS
}

type tChildren={children:React.ReactElement}
// читает и выводит список произвольных листов в иде массива   версия 1.00
export class CTableList2<T extends ITableData> extends React.Component<tTableA<T>, {refresh:boolean, scroll:number}>{
    state={refresh:false, scroll:0}
    //порядок вывода сто столбиков
    keysStroke?:string[];
    typeSort:number[]=[];

    sort:{key:String, type:"up"|"down"|"none"}={key:"",type:"none"}
    headP?:"static"|"simple"|"off"

    style:tTableStyle={};
    react?:tTableReact;
    refresh=()=>{this.setState({refresh:!this.state.refresh})}
    private InitStyle(){
        const strokeBase = {width:"100%", height:"30px", display:"flex"}

        this.headP=this.props.head??"static";

        this.style.strokeStyle = Object.assign(strokeBase,this.props.strokeStyle??{})
        this.style.headStrokeStyle = Object.assign(strokeBase,this.props.headStrokeStyle??{})

        const elWith=Math.round(100/(this.keysStroke?.length??1))

        const content= {
            display: "table-cell",
            verticalAlign: "middle"
        }
        this.style.dataStyle = Object.assign(content,this.props.dataStyle??{})
        this.style.headDataStyle = Object.assign(content,this.props.headDataStyle??{})


        const elBase = {
            width:elWith.toString()+"%",
            height: "100%",
            paddingLeft: (elWith*0.05).toString()+"%",
            border: "1px solid rgba(255,255,255,0.05)",
            textAlign: "center",
            display: "table",

            verticalAlign: "middle"}
        this.style.elStyle = Object.assign(elBase,this.props.elStyle??{})
        this.style.headElStyle = Object.assign(elBase,this.props.headElStyle??{})
    }
    compareNumeric=(a:any, b:any)=> {
        if (typeof a=="number" && typeof  b=="number"){
            if (a > b) return 1;
            if (a == b) return 0;
            return -1;
        }
        if (typeof a=="string" && typeof  b=="string"){
            if (a > b) return 1;
            if (a == b) return 0;
            return -1;
        }
        if (typeof a=="object" && typeof  b=="object"){
            if (a instanceof Date && b instanceof Date) {
                if (a.valueOf() > b.valueOf()) return 1;
                if (a.valueOf() == b.valueOf()) return 0;
                return -1;
            }
            if (a instanceof TF && b instanceof TF) {
                if (a.valueOf() > b.valueOf()) return 1;
                if (a.valueOf() == b.valueOf()) return 0;
                return -1;
            }
        }
        return 0;
    }
    onCLickHead({key}:{key:string}){
     //   console.log("попытка упорядочить,", key, this.props.data[0][key]);
        if (this.props.data && this.props.data[0] ) {
            this.props.data.sort((a:any,b:any)=>this.compareNumeric(a[key]!,b[key]!))
        }
        if (this.sort.key==key) {if (this.sort.type=="up") {this.sort.type="down"} else {this.sort.type="up"}}
        if (this.sort.type=="none") {this.sort.type="up"}
        if (this.sort.type=="up") {}
        if (this.sort.type=="down") {this.props.data?.reverse()}
        this.sort.key=key;
        this.refresh();
    }
    private InitReact(){
        this.react = this.props
    }

    private InitKey=()=>{
        this.keysStroke = Object.keys(this.props.headName??this.props.data![0]??{})
    }

    constructor(p:tTableA<T>) {
        super(p);
        this.InitKey();
        this.InitReact();
        this.InitStyle();
        if (this.props.refresh) this.props.refresh(()=>{this.InitKey(); this.InitReact(); this.InitStyle(); this.refresh();})


    }
    //шаблон строки заголовка
    defaultHead=({children}:tChildren)=>
        {return <div style={this.style.strokeStyle }>{children}</div>}
    //шаблон элемента заголовка - потом тут добавим функции фильтровки и изменения размеров
    // defaultHeadEl=({children, onCLick}:{children:number|string|boolean, onCLick:()=>void})=>{
    //     return <div
    //         onClick={onCLick}
    //         style={this.style.headElStyle}
    //         children={<div style={this.style.headDataStyle}>
    //         {children}
    //         </div>}
    //     />
    // }
    //шаблон элемента заголовка
    // defaultEl=({children, onCLick}:{children:number|string|boolean|object, onCLick:()=>void})=>
    //     {
    //         let ch:string|number|boolean="";
    //         if (typeof children=="object") {
    //             if (children.toString) ch=children.toString()
    //             if (children instanceof Date) ch=children.toString()
    //             if (children instanceof TF) ch=children.name
    //             if (children instanceof Array) ch=children.toString()
    //         }
    //         else {
    //             ch=children;
    //         }
    //         return <div className={"tableHoverEl"} onClick={onCLick} style={this.style.elStyle} children={<div style={this.style.dataStyle}>{ch}</div>}/>
    //     }
    //шаблон строки заголовка
    defaultStroke=({children, num}:tChildren&{num?:number})=>
        {
            return <div className={Boolean(num??0&1)?"tableHoverN":"tableHover"} style={this.style.headStrokeStyle} >{children}</div>
        }

    head=()=>{
        // const el=this.react!.headElReact
        // return <> {
        //         this.keysStroke!.map((key)=>{
        //             const click=this.props.onCLickHead?()=>this.props!.onCLickHead!({key:key}):()=>this.onCLickHead({key:key})
        //             const react = el? el[key] : null;
        //             return react??<this.defaultHeadEl onCLick={click} key={key} children={this.props.headName? this.props.headName[key]??null : String(key)}/>
        //         })
        //     } </>
        return null
    }
    //строка из таблицы
    data=({num, stroke}:{num:number, stroke:ITableData| (string | number | boolean)[]})=>{
        const el=this.props.elReact
        return <> {
            // this.keysStroke?.map((key)=>{
            //     const click=this.props.onCLick? (e:any)=>{this.props.onCLick!({key:key, stroke:stroke, nStroke:num})}:undefined
            //     const bb=(e:any)=>{return ;}
            //     const buf = click??bb
            //     return el? el[key] :<this.defaultEl onCLick={buf} key={key} children={stroke[key]}/>
            // })
        } </>
    }

    //сама таблица
    dataBase=()=>{
        return <> {
            this.props.data?.map((e,i)=>{
                return (
                    this.props.strokeReact ?
                        this.props.strokeReact (i,<this.data num={i} stroke={e}/>) :
                        <this.defaultStroke key={i} num={i}>
                            <this.data num={i} stroke={e}/>
                        </this.defaultStroke>)
            }
            )}
        </>

    }
    buf:{head:HTMLDivElement|null,data:HTMLDivElement|null,wightH:number, wightHC:number}={head:null,data:null,wightH:0,wightHC:0}
    render() {

        return  <div className={"maxSize"}
                     style={this.headP=="simple"?{overflow: "auto"}:{}}
        >
            {
                this.headP!="off"?
                    <div style={{width:(this.buf.wightHC?this.buf.wightHC+"px":"100%")}}
                       ref={(e)=>{
                           if (e) {this.buf.wightH=e.clientWidth; this.buf.head=e;}
                       }}
                    >
                    {
                        this.react?.headStrokeSReact ?
                            this.react.headStrokeSReact(0,<this.head/>) :
                            <this.defaultHead >
                                <this.head/>
                            </this.defaultHead>
                    }
                    </div>
                    :null
            }
            <div className={"maxSize"} style={{...(this.headP=="static"?{overflow: "auto"}:{}), ...(this.buf.head?.clientHeight?{height:"calc(100% - "+this.buf.head.clientHeight+"px)"}:{}) }}
                 onScroll={(e)=>{console.log(e)}}
                 ref={(e)=>{
                     if (e && this.buf.head?.clientWidth!=e.clientWidth) {
                         this.buf.wightHC=e.clientWidth
                         this.refresh();
                 }}}
            >
                <this.dataBase/>
            </div>
        </div>
    }
}

type tMouseMenuByGraph = {
    status: boolean,
    coordinate: {x:number, y:number},
    Refresh: ()=>void
}

export class MouseMenuByGraph extends  React.Component<{children: JSX.Element, menu:(api:tMouseMenuByGraph)=>JSX.Element}, any>{
    data: tMouseMenuByGraph = {
        coordinate: {x: 0, y: 0},
        Refresh: ()=>this.forceUpdate(),
        status: false
    }
    render() {
    const data = {x:0,y:0}
        return <div style={{height: "100%", position:"relative"}}
                onContextMenu={e => {
                    e.preventDefault();
                    e.stopPropagation();
                }}
                ref={(e)=>{
                    if (e) {
                        const r = e.getBoundingClientRect()
                        data.x=r.x
                        data.y=r.y
                    }
                }}
                onMouseDown={(event)=>{
                    if (event.button == 2) {
                        this.data.status= true
                        this.data.coordinate= {x:event.clientX-data.x, y:event.clientY-data.y}
                        this.data.Refresh()
                    }
                    if (event.button == 1) {
                        if (mouse.active) {
                            mouse.active.AutoHeight = !mouse.active.AutoHeight;
                        }
                        this.data.Refresh()
                    }
                }}
        >
        {this.props.children}
        {this.data.status &&
            this.props.menu(this.data) }
    </div>;
    }
}
// function Test11(){
//     return <div>
//         <MouseMenuByGraph
//             menu={(api)=><CMiniMenuForGraphTest
//                 onDeInit={()=>{
//                     api.status=false;
//                     api.Refresh()
//                 }
//                 }
//                 coordinate={api.coordinate}
//                 other={[{name:"символ", status:false//, func:()=>this.SymbolRnd()
//                 }]}
//             />}
//         ><div>dsds</div>
//         </MouseMenuByGraph>
//     </div>
// }
// //
// function RightClickMenu ({children, cor}:{children:React.ReactElement, cor?:{x:number, y:number}}) {
//     const mouseR
//     const data = {x:0,y:0}
//     return <div style={{height: "100%", position:"relative"}}
//                 onContextMenu={e => {
//                     e.preventDefault();
//                     e.stopPropagation();
//                 }}
//                 ref={(e)=>{
//                     if (e) {
//                         const r = e.getBoundingClientRect()
//                         data.x=r.x
//                         data.y=r.y
//                     }
//                 }}
//                 onMouseDown={(event)=>{
//                     if (event.button == 2) {
//                         this.mouseR.status= true
//                         this.mouseR.coordinate= {x:event.clientX-data.x, y:event.clientY-data.y}
//                         this.Refresh();
//                     }
//                     if (event.button == 1) {
//                         if (mouse.active) {
//                             mouse.active.AutoHeight = !mouse.active.AutoHeight;
//                         }
//                         this.Refresh();
//                     }
//                 }}
//     >
//         {children}
//         {this.mouseR.status &&
//             <CMiniMenuForGraphTest
//                 onDeInit={()=>{
//                     this.mouseR.status=false;
//                     this.Refresh()
//                 }
//                 }
//                 coordinate={this.mouseR.coordinate}
//                 other={[{name:"символ", status:false//, func:()=>this.SymbolRnd()
//                 }]}
//             />}
//     </div>
// }
