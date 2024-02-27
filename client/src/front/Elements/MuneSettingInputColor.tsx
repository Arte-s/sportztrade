import React, {ReactElement} from "react";
import {canvasAPI, mouse} from "../reactI";
import {CNameWindows} from "../common/reactCommon";
import {tSetColorBase, tSets} from "../../graph sist/and/canvas2d/Canvas2dStyle";
import {waitRun} from "../../commons/commons";

//установить цвета
export function SetColorsGraph(data:tSets){
    mouse.active?.SetColors(data);
    if (data.backgroundCanvas && canvasAPI._divParents) canvasAPI._divParents.style.background=data.backgroundCanvas.color;
    // SessionSave();
}

//установить цвета
export function GetColorsGraph(){
    return mouse.active?.GetColors();
}


export class CSettingsOther extends React.Component<{coordinate?:{x:number,y:number,w?:number, h?:number}},{refresh:boolean, dis:ReactElement, select:string}> {
    constructor(props:any) {
        super(props);
        this.state={select:"Color",dis:this.Color(),refresh:false};
    }
    wait = waitRun().refreshAsync2
    // value="#4186f1"
    Refresh(){this.setState({refresh:!this.state.refresh})}
    Color(){
        const color: tSets|undefined=mouse.active?.GetColors();
        const set=(data:tSets)=>{
            this.wait(50, ()=>SetColorsGraph(data))
        };
        if (!color) return <></>
        return <>
            <CMenuSettingItem name={"background"}>
                <InputColor onChange={(color)=>{set({backgroundCanvas:{color:color}}); this.Refresh();}}
                            defaultValue={color.backgroundCanvas!.color}/>
            </CMenuSettingItem>

            <CMenuSettingItemColor name={"bar up"}
                                   status={()=>{return color!.barUp!.switcher}}
                                   onClose={()=>{set({barUp:{switcher:false, color: color.barUp!.color}});}}
                                   onAdd={()=>{set({barUp:{switcher:true, color: color.barUp!.color}});}}
            >
                <InputColor
                    onChange={(color)=>{set({barUp:{color:color}}); this.Refresh();}}
                    defaultValue={color!.barUp!.color}/>
            </CMenuSettingItemColor>

            <CMenuSettingItemColor name={"bar down"}
                                   status={()=>{return color.barDw!.switcher}}
                                   onClose={()=>{set({barDw:{switcher:false, color: color.barDw!.color} });}}
                                   onAdd={()=>{set({barDw:{switcher:true, color: color.barDw!.color}});}}
            >
                <InputColor
                    onChange={(color)=>{set({barDw:{color:color}}); this.Refresh();}}
                    defaultValue={color.barDw!.color}/>
            </CMenuSettingItemColor>


            <CMenuSettingItemColor name={"line"}
                                   status={()=>{return color.lineGraph!.switcher}}
                                   onClose={()=>{set({lineGraph:{switcher:false, color: color.lineGraph!.color}});}}
                                   onAdd={()=>{set({lineGraph:{switcher:true, color: color.lineGraph!.color}});}}
            >
                <InputColor
                    onChange={(color)=>{set({lineGraph:{color:color}}); this.Refresh();}}
                    defaultValue={color.lineGraph!.color}/>
            </CMenuSettingItemColor>


            <CMenuSettingItemColor name={"grid"}
                                   status={()=>{return color.grid!.switcher}}
                                   onClose={()=>{set({grid:{switcher:false, color: color.grid!.color}});}}
                                   onAdd={()=>{set({grid:{switcher:true, color: color.grid!.color}});}}
            >
                <InputColor
                    onChange={(color)=>{set({grid:{color:color}}); this.Refresh();}}
                    defaultValue={color.grid!.color}/>
            </CMenuSettingItemColor>


            <CMenuSettingItemColor name={"mini price panel"}
                                   status={()=>{return color.textHL!.switcher}}
                                   onClose={()=>{set({textHL:{switcher:false, color: color.textHL!.color}});}}
                                   onAdd={()=>{set({textHL:{switcher:true, color: color.textHL!.color}});}}
            >
                <InputColor
                    onChange={(color)=>{set({textHL:{color:color}}); this.Refresh();}}
                    defaultValue={color.textHL!.color}/>
            </CMenuSettingItemColor>


            <CMenuSettingItemColor name={"panel"}
                                   status={()=>{return color.textTable!.switcher}}
                                   onClose={()=>{set({textTable:{switcher:false, color: color.textTable!.color}});}}
                                   onAdd={()=>{set({textTable:{switcher:true, color: color.textTable!.color}});}}
            >
                <InputColor
                    onChange={(color)=>{set({textTable:{color:color}}); this.Refresh();}}
                    defaultValue={color.textTable!.color}/>
            </CMenuSettingItemColor>

            <CMenuSettingItemColor name={"watermark"}
                                   status={()=>{return color.textWater!.switcher}}
                                   onClose={()=>{set({textWater:{switcher:false, color: color.textTable!.color}});}}
                                   onAdd={()=>{set({textWater:{switcher:true, color: color.textTable!.color}});}}
            >
                <InputColor
                    onChange={(color)=>{set({textWater:{color:color}}); this.Refresh();}}
                    defaultValue={color.textWater!.color}/>
            </CMenuSettingItemColor>
        </>;
    }
    Base(){
        return <>
            <CMenuSettingItem name={"show menu timeframe"}>
                <div>#######</div>
            </CMenuSettingItem>
            <CMenuSettingItem name={"min load history"}>
                <div>#######</div>
            </CMenuSettingItem>
            <CMenuSettingItem name={"auto save session"}>
                <div>#######</div>
            </CMenuSettingItem>
        </>;
    }
    Temple(){
        return <>
            <CMenuSettingItem name={"save template"}>
                <div>#######</div>
            </CMenuSettingItem>
            <CMenuSettingItem name={"load template"}>
                <div>#######</div>
            </CMenuSettingItem>
            <CMenuSettingItem name={"other"}>
                <div>#######</div>
            </CMenuSettingItem>
        </>;
    }

    Button=(name:string, callback:()=>ReactElement,select?:boolean)=>{
        // if (select) {this.setState({select:name,dis:callback()})}
        return <CNameWindows key={name} work={this.state.select} callbackClick={(d)=>{this.setState({select:d,dis:callback()});}} default={name}>{name}</CNameWindows>
    }
    render(){//classWindowsHead
        const {coordinate} = this.props
        return <div className={"classWindowsDefault"} style={{zIndex:99, position:"fixed",
            // top: coordinate?.y??"10%",
            // left: coordinate?.x??"30%",
            width: coordinate?.w??"40%",
            height: coordinate?.h??"500px",
        }}>
            <div className={"classWindowsHead"}>Setting</div>
            <div className={"toLine"} style={{fontSize:"14px"}}>
                {this.Button("color",this.Color,true)}
                {this.Button("template",this.Temple)}
                {this.Button("other",this.Base)}
            </div>
            <div style={{fontSize:"14px",padding:"20px 20px"}}>
                {this.state.dis}
            </div>

        </div>
    }
}


//общий класс
export class CMenuSettingItem extends React.Component<{children:ReactElement, name:string, style?:object},any>{
    render(){
        return <div className={"toLine"} style={this.props.style??{padding: "2px"}} onMouseUp={()=>{}}>
            <div style={{width:"200px", marginTop:"5px"}}>{this.props.name}</div>
            {this.props.children}
        </div>
    }
}

//общий класс
export class CMenuSettingItemColor extends React.Component<{children:ReactElement, name:string, status?:()=>boolean|undefined, style?:object, onClose?:()=>void, onAdd?:()=>void},any>{
    constructor(props:any) {
        super(props);
        this.state={ref:false,hover:false};
    }
    Refresh(){this.setState({ref:!this.state.ref})}
    Add(){
        return <div className={'toButton'} onClick={()=>{this.Refresh(); if (this.props.onAdd) this.props.onAdd();}}>+</div>
    }
    Close(){
        return <div className={'toButton'} onClick={()=>{this.Refresh(); if (this.props.onClose)  this.props.onClose();}}>x</div>
    }
    render(){
        const p=this.props;
        return <div className={"toLine"} style={this.props.style??{padding: "2px", height:"30px"}}
                    onMouseEnter={()=>{this.setState({hover:true})}}
                    onMouseLeave={()=>{this.setState({hover:false})}}
        >
            <div style={{width:"200px", marginTop:"5px"}}>{this.props.name}</div>
            { p.status==undefined || p.status()==true?this.props.children:null}
            {(!this.state.hover || p.status==undefined)?
                null:
                (p.status())?
                    this.Close():
                    this.Add()}
        </div>
    }
}

export class InputColor extends React.Component <{onChange:(color:string)=>void,defaultValue:string}>{
    render() {
        return <input type="color"
                      onChange={(a) => {
                          this.props.onChange(a.currentTarget.value)
                      }}
                      defaultValue={this.props.defaultValue}/>
    }
}
//класс заточен под код для выбора цвета и переключатель
export class InputColorSwitcher extends React.Component <{onChange:(color:string)=>void, target:tSetColorBase}>{
    Input(){
        const target=this.props.target;
        const onChange=this.props.onChange;
        return <input type="color"
                      onChange={(a) => {
                          onChange(a.currentTarget.value)
                      }}
                      defaultValue={target.color}/>
    }
    Switcher(){
        const target=this.props.target;
        const onChange=this.props.onChange;
        return <input type="color"
                      onChange={(a) => {
                          onChange(a.currentTarget.value)
                      }}
                      defaultValue={target.color}/>
    }
    render() {
        return <>
            {this.props.target.switcher!==false?null:this.Input()}
        </>

    }
}


