import * as Gconst from "./const";
import {CDivNode,tGraph,tNodeG} from "./vgraf3";
import {AllDraw} from './load';
import {CListNode} from './listNode';
import {CGraphCanvas} from "./canvas2d/Canvas2D";
import {CGraphCanvas3D} from "./Canvas3D";
import {CObjectEvents} from "./const";
import {tListEvent} from "./interface/mini";


interface ICMouse{
    x:number;
    dx:number;
    dy:number;
    y:number;
    e:any; // тут по факту должно быть типо два Event от тачпада нажатия, или мышки... два вида интерфейса
    _menulight:(CDivNode|undefined)[];// типо меню которе исчезает при клике не туда

    ChekLight(e:this) :void //проверка для нажатия правой кнопки мыши
    LightMenuDel(index:number) :void
    //див на которого произвели нажатие, последний активный среди всех дивов
    getLastDiv():tNodeG|undefined
    //типо функция over - при снятии нажатия, последний эфект с обьекта с которого убрали фокус
    setLastDiv(last:tNodeG) :void
    setGraph(graph:CGraphCanvas, over:boolean) :void
    getGraph():tGraph|undefined
    logsEvent() :void
    //установить события при активации нового графика
    addEventGraph(callback:tListEvent):void
    generalEL:HTMLElement|undefined;
    Init(element:HTMLElement):void
    last:{x:number,dx:number,y:number,dy:number,ev:number};
    To(e:any,el:HTMLElement) :this;
    setListEvent(e:()=>void|number|-1):void
}



class CMouse implements ICMouse{

    private divX:number=0;//ползиция основного дива
    private divY:number=0;//ползиция основного дива
    x:number=0;
    dx:number=0;
    dy:number=0;
    y:number=0;
    e:any=0; // тут по факту должно быть типо два Event от тачпада нажатия, или мышки... два вида интерфейса
    _menulight:(CDivNode|undefined)[]=[];// типо меню которе исчезает при клике не туда
    private ChekL(e:CMouse=this):number {
        let late:number=-1;
        function funck(now:CMouse){
            for (let i=0; i<now._menulight.length; i++) {
                if (now._menulight[i] && now._menulight[i]?.focusBool(e)) {
                    late=++i; break;
                }
            }
        }
        if ((e.e.buttons&Gconst.CLICKSCRULL) == Gconst.CLICKSCRULL) {funck(this);}
        else if ((e.e.buttons&Gconst.CLICKLEFT)   == Gconst.CLICKLEFT)   {funck(this);}
        else if ((e.e.buttons&Gconst.CLICKRIGHT)  == Gconst.CLICKRIGHT)  {funck(this);}
    return late;
    }//проверка для нажатия правой кнопки мыши
    ChekLight(e:CMouse=this):void {
        let late=this.ChekL();
        if (late==-1) late=0;
        let flag=false;
        for (let i=late; i<this._menulight.length; i++) {if (this._menulight[i]) {this._menulight[i]?.node?.DeleteLink(); this._menulight[i]=undefined; flag=true;}}
        this._menulight.length=late;
    }//проверка для нажатия правой кнопки мыши
    LightMenuDel(index:number){
        let flag=false;
        for (let i=index; i<this._menulight.length; i++) {if (this._menulight[i]) {this._menulight[i]?.node?.DeleteLink(); this._menulight[i]=undefined; flag=true; }}
        this._menulight.length=index;
    }
    private _divlastclicl:tNodeG|undefined;//див на которого произвели нажатие, последний активный среди всех дивов
    getLastDiv(){return this._divlastclicl;};

    setLastDiv(last:tNodeG) {if (!(last===this._divlastclicl)) {this._divlastclicl=last;}};
    private _divnowGraph:tGraph|undefined;
    //private _nodeGraph:(()=>void)[]=[]; // tListEvent
    private _nodeGraph2 = new CObjectEvents; // tListEvent

    setGraph(graph:CGraphCanvas|CGraphCanvas3D, over=true) {
        console.log("setGraph")
        if (this._divnowGraph && over) {
            if (this._divnowGraph) {
                this._divnowGraph.OnMouseOver();}
        }
        this._divnowGraph=graph  as CGraphCanvas ; // as CGraphCanvas
        //this._nodeGraph.forEach(i=>i());
        this._nodeGraph2.OnEvent()
    };

    logsEvent(){this._nodeGraph2.log() }

    getGraph():tGraph|undefined{return this._divnowGraph;}

    // addEventGraph(funk:()=>void) {
    //     this._nodeGraph.push(funk);
    // }

    addEventGraph(callback:tListEvent) {
        this._nodeGraph2.Add(callback);
    }

    generalEL:HTMLElement|undefined;
    Init(element:HTMLElement){
        this.generalEL=element;
        let t=element.getBoundingClientRect();
        this.divX=t.x;
        this.divY=t.y;
        //console.log(this)
    } // утсновить контрольные размеры x y - у дива
    last={x:0,dx:0,y:0,dy:0,ev:0};
    To(e:any,el:HTMLElement){
        this.Init(el);//это костыль
        this.last.x=this.x;
        this.last.y=this.y;
        if (e.x!=undefined) {
            this.e=e;
            this.x=e.x-this.divX;
            this.y=e.y-this.divY;
        }
        else {
            this.e=e;
            this.x=e.touches[0].pageX-this.divX;
            this.y=e.touches[0].pageY-this.divY;
        }
        this.dx=this.last.x-this.x;
        this.dy=this.last.y-this.y;

        for (let next=this._eventNode.Next(); next;) {let a=next; next=next.Next(); if (a.data?.()==-1) {a.DeleteLink()};}//if (next.data && next.data()===1){let a=next; next=next.Next(); a.DeleteLink(); };
        return this;
    }

    protected _eventNode2 = new CObjectEvents()
    protected _eventNode = new CListNode<()=>void|number|-1>();//списко событий которые надо выполнять в первую очердь - типо перетащить что-то куда-то на экране
    // если функция вернет -1 то она будет удалена
    setListEvent(e:()=>void|number|-1){

        this._eventNode.AddEnd(e);
        if (this._eventNode.count>10) console.error("errrrrr",this._eventNode.countRef());
    }

}

export {CMouse};
export const mouseG=new CMouse();
