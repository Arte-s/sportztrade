import React from "react";
import {CSSTransition, TransitionGroup} from "react-transition-group";
import {Color} from "../../graph sist/Nav/color";
import {tListEvent} from "../../graph sist/and/interface/mini";
import {tFullAlert2} from "../../graph sist/and/СJournal";

type tMessageMiniProps = {
    getApi: (api: tMessageMiniApi) => void
}
type tMessageMiniApi = {
    message: (data: tMessageMiniData) => void
}
export type tMessageMiniData = {
    key?: object|string
    header?: string
    data: string
    color?: Color
    timeOutSec?: number
}
export class MessageMini extends React.Component<tMessageMiniProps, any>{
    static count =0
    timeOut = 4
    componentDidMount() {
        this.props.getApi(this.api)
    }

    api: tMessageMiniApi = {
        message: (data: tMessageMiniData) =>this.message(data)
    }
    map = new Map <object|string,{jsx: JSX.Element, time: Date, key: number}>()
    elementToDiv(data: tMessageMiniData, key?: number){
        const result =  <div style={{width:"200px", color:"rgb(255,255,255)", height:"auto", marginTop:"10px", borderRight:"5px solid #5D9FFA", background:data.color??"rgb(23,73,35)"}}
                    key={key ?? MessageMini.count++}
        >
            <p style={{textAlign:"center", fontSize: "12px", marginBottom:"1px"}}>{data.header??"оповещение"}</p>
            <hr style={{
                backgroundImage: "linear-gradient(to right, transparent, rgba(255, 255, 255, 1), transparent)",
                border: 0,
                height: "1px",
                margin: "0 0 0 0",
                boxSizing: "content-box" ,
                display: "block"
            }}/>
            <div style={{textAlign:"right", marginRight:"10px"}}>{data.data}</div>

            <p style={{float:"inline-end", textAlign:"right",  marginRight:"10px"}}>{(new Date()).toLocaleDateString()}</p>
        </div>
     //   return result
        return  <CSSTransition
            key={MessageMini.count}
            timeout={{
                appear: 500,
                enter: 300,
                exit: 500,
            }}
            classNames="example"
        >
            {result}
            </CSSTransition>
    }
    message(data: tMessageMiniData) {
        const key = data.key ?? data
        const newTime = new Date(Date.now().valueOf() + (data.timeOutSec ?? this.timeOut)*1000)
        const num = this.map.get(key)?.key ?? MessageMini.count++
        this.map.set(key, {jsx: this.elementToDiv(data, num), time: newTime, key : num})
        const func = () => {
            const time =this.map.get(key)?.time;
            // console.log({time, result: time && time.valueOf() < Date.now()})
            if (time && time.valueOf() < Date.now()) {
                this.map.delete(key);
                this.forceUpdate()
            }
            else setTimeout( ()=>func() , (data.timeOutSec ?? this.timeOut)*1000)
        }
        func();

        this.forceUpdate()

    }
     render() {
        const data: JSX.Element[] = []
         for (const value of this.map.values()) {
             data.push(value.jsx)
         }
         return <div style={{position: "absolute", right: "20px"}}>
            {/*<CSSTransition></CSSTransition>*/}
             <TransitionGroup className="todo-list">
                 {data}
             </TransitionGroup>


         </div>;
     }
}

export class CMessageMini {
    api: tMessageMiniApi | undefined
    private map = new Map<string,tListEvent>()
    connectStream(key: string) {
        const func:tListEvent = {
            func:(data: tFullAlert2)=> this.api?.message?.({data: data.text, header: data.type, color: data.color, key: data.key})
        }
        if (this.map.has(key)) this.map.get(key)?.del?.()
        this.map.set(key, func)
        return func
    }
    delete(key: string) {
        if (this.map.has(key)) {
            this.map.get(key)?.del?.()
            this.map.delete(key)
        }
    }
    clean(){
        this.map.forEach(e=>e.del?.())
        this.map.clear();
    }
    react() {return <MessageMini getApi={api1 => this.api=api1}/>}
}



