import {CBar,const_Date, IBarsExt, TF} from "../Nav/Bars";
import {Trader} from "../Nav/Trader";
import {CIndicatorGraphObject, ILine, ColorString} from "../and/const";
import {isDate} from "../Nav/Common"
import {IGraphLabel} from "../and/labels";



export class CGraphSLTP extends CIndicatorGraphObject {
    private _tf : TF;
    constructor(tf :TF, strategyName? :string) {
        super( (strategyName ? strategyName+" " : "")+"SL/TP" );
        this._tf= tf;
    }
    addSL(barOrTime :CBar|const_Date, price :number) { this.addSLTP(barOrTime, price, "sl"); }
    addTP(barOrTime :CBar|const_Date, price :number) { this.addSLTP(barOrTime, price, "tp"); }

    addSLTP(barOrTime :CBar|const_Date, price :number, type :"sl"|"tp") {
        //const price= bar.close;
        let time= isDate(barOrTime) ? barOrTime : barOrTime.time;
        let line :ILine = {
            begin: {x: time.valueOf(), y: price},
            end: {x: time.valueOf() + this._tf.msec, y: price},
            color: null, //(mode=="sl" ? "#FF0000" : "#00FF00") as ColorString,
            //style: "dot",
            text: "-",
            textColor: (type=="sl" ? "#FF0000" : "#00FF00") as ColorString,
            textAlignV: "center"
        }
        // let label : IGraphLabel = {
        //     point : {x: bar.time.valueOf(), y: price},
        //     color : (mode=="sl" ? "#FF0000" : "#00FF00") as ColorString,
        //     text : "-";
        // }
        this._fixedLines.push(line);
    }
}


export abstract class CTrader implements Trader {
    private _bar? :CBar;
    private _tf : TF;
    private _indicatorSLTP : CGraphSLTP;
    protected abstract _onBar(...args :Parameters<Trader["onBar"]>) :void;
    protected abstract _indicators : Trader["indicators"];

    constructor(strategyName :string, tf :TF) {
        this._tf= tf;
        this._indicatorSLTP= new CGraphSLTP(tf, strategyName);
    }

    //onBar(...args: Parameters<Trader["onBar"]>) { this._price= args[0].close;  this._onBar(...args); }
    onBar : Trader["onBar"] = (bar, closed, bars, ...args)=>{
        this._bar= bar;  //this._tf=bars.Tf;
        return this._onBar(bar, closed, bars, ...args);
    }

    get indicators() { return (this._indicators ??[]).concat(this._indicatorSLTP); }

    private drawSLTP(price :number, type :"sl"|"tp") {
        let bar= this._bar;
        if (! bar) throw "bar is not defined";
        this._indicatorSLTP.addSLTP(bar, price, type);
    }
    drawSL(price :number) { this.drawSLTP(price, "sl"); }
    drawTP(price :number) { this.drawSLTP(price, "tp"); }
}