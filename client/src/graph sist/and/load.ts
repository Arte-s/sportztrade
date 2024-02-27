
import {CDivNode} from './vgraf3';
import {mouseG,CMouse} from './cmouse';

import {tNodeG} from "./vgraf3";
import {DisplayRefresh} from "../API";

if (0)
    Object.prototype.valueOf= function(this) {
        if (this.constructor.name=="CallSite") return this; //undefined as unknown as object;
        console.error("function 'valueOf' is not defined in object",this.constructor.name,":",this);
        console.trace();
        throw("function 'valueOf' is not defined!!!");
        return this;
    }


export function Event(canvasEl:HTMLDivElement|HTMLElement, nodeGeneral: CDivNode, parensDiv?:HTMLDivElement|HTMLElement){
    function funcweel(e:any) {
        comandToFocus(nodeGeneral,mouseG.To(e,canvasEl),OnMouseWeelFunk); //FlyDraw(nodeGeneral);
    }
    if (canvasEl.addEventListener) {
        if ('onwheel' in document) {canvasEl.addEventListener("wheel",                 (e:any)=>funcweel(e), {passive :true});}
        else if ('onmousewheel' in document) {canvasEl.addEventListener("mousewheel",  (e:any)=>comandToFocus(nodeGeneral,mouseG.To(e,canvasEl),OnMouseWeelFunk),);
        } else {canvasEl.addEventListener("MozMousePixelScroll", (e:any)=>funcweel(e),);}
    }


    window.addEventListener("resize",      (e)=>nodeGeneral.CheckResizeBlock(), false);

    canvasEl.addEventListener("resize",         (e:any)=>{nodeGeneral.CheckResizeBlock();});
    canvasEl.addEventListener("contextmenu",    (e:any)=>{ e.preventDefault();}, false);
    canvasEl.addEventListener("mousemove",      (e:any)=>{
     //   let last=nodeGeneral.needToRef;
      //  nodeGeneral.needToRef=false;
        comandToFocus(nodeGeneral, mouseG.To(e,canvasEl), OnMouseMoveFunk);

       // if (1 && !CDivNode.needToRef) { AllDraw(nodeGeneral);}
        //FlyDrow(nodeGeneral);
    }, false);
    canvasEl.addEventListener("mousedown",      (e)=>{
        mouseG.ChekLight(mouseG.To(e,canvasEl));
        let last=comandToFocus(nodeGeneral,mouseG,(div,m)=>{OnMouseDownFunk(div,m)});
        if (last) mouseG.setLastDiv(last);
        //FlyDrow(nodeGeneral);
    }, false);
    canvasEl.addEventListener("onmouseover",    (e)=>{comandToFocus(nodeGeneral,mouseG.To(e,canvasEl),OnMouseFinalFunk); // FlyDrow(nodeGeneral)
    }, false);
    window.addEventListener("keydown",          (e)=>{mouseG.getGraph()?.OnKeyDown?.(e);}, false);

    window.addEventListener("click",            (e)=>{ mouseG.getGraph()?.OnClick?.(e); } );

    //canvasEl.addEventListener("keydown",        (e)=>{console.error("dsds ",mouseG.getGraph()); if (mouseG.getGraph() && mouseG.getGraph().OnKeyDown) mouseG.getGraph().OnKeyDown(e);}, false);
    canvasEl.addEventListener("onmouseleave",   (e)=>comandToFocus(nodeGeneral,mouseG.To(e,canvasEl),OnMouseFinalFunk), false);

    canvasEl.addEventListener("touchmove",      (e)=>{comandToFocus(nodeGeneral,mouseG.To(e,canvasEl),Ontouchmove); //FlyDrow(nodeGeneral);
    }, false);
    canvasEl.addEventListener("touchstart",     (e)=>{
        let last=comandToFocus(nodeGeneral,mouseG,(div,m)=>{Ontouchstart(div,m)});
        if (last) mouseG.setLastDiv(last);
        //FlyDrow(nodeGeneral);
    }, false);
}

let _tofocus:CDivNode[]=[];

//export function AllRefr(nodeGeneral) {  AllDrow(nodeGeneral);}
//export function AllRew(nodeGeneral)  {nodeGeneral.GetFunkAll((div)=>{div.Rew()});}
export function AllDraw(nodeGeneral:tNodeG) {nodeGeneral.GetFunkAll((div)=>{div.DrawNow()}); /*FlyDrow();*/}

function Ontouchstart (div:CDivNode, mouse:CMouse){div.OnTouchstart(mouse);}
function Ontouchmove (div:CDivNode, mouse:CMouse){div.OnTouchmove(mouse);}
function OnMouseMoveFunk (div:CDivNode, mouse:CMouse){
    div.OnMouseMove(mouse);
}
function OnMouseDownFunk (div:CDivNode, mouse:CMouse){div.OnMouseDown(mouse);}
function OnMouseFinalFunk(div:CDivNode, mouse:CMouse){div.OnMouseFinal(mouse);}
function OnMouseWeelFunk (div:CDivNode, mouse:CMouse){div.OnMouseWheel (mouse);}

function comandToFocus(div: CDivNode, mouse:CMouse, funk=(div:CDivNode, mouse:CMouse)=>{}){
    for (let i=0; i<_tofocus.length; i++)   {
        if (_tofocus[i] && !_tofocus[i].focusBool(mouse)) {_tofocus[i].OnMouseOver(mouse);}
    }////  OnMouseOver
    _tofocus.length=0;
    let last;
    funk(div,mouse);
    _tofocus.push(div);

    for (let next=div.findFocus(mouse); next?.data; next=next.data.findFocus(mouse)){
        //if mouse.divnow



        last=next.data;
        funk(next.data,mouse);
        _tofocus.push(next.data);
    }
    return last;
}// возвращает самый верхний элемент на котором также находился курсор
