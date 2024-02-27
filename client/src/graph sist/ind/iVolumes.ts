
import {IBars,CBar, TF} from "../Nav/Bars"
import {
    CBuffPrice,
    CBuffColorBars,
    CBuffPriceHistogram,
    CIndiBase,
    CIndicatorGraphObject,
    ColorString,
    IBuffer,
    tOnInitIndicator,
    tOnBarsIndicator,
    tOnTicks,
} from '../and/const';

import {CParams, GetSimpleParams, IParams, ReadonlyFull, SimpleParams} from "../and/CParams";
import {tAlert, tAlertMini} from "../and/interface/mini";


class CVolumeIndicatorParameters extends CParams {
    colorBars = { value: false }
    fast =  { value: 1, range: { min:0, max:200, step:1 } };
    slow =  { value: 45, range: { min:0, max:300, step:1 } };
}

export class CIndicatorVolume extends CIndiBase<typeof CIndicatorVolume>
{
    static readonly paramInfo : ReadonlyFull<CVolumeIndicatorParameters> = new CVolumeIndicatorParameters();
    static readonly Name="Volume";
    static readonly Version="1.00";

    colorsBarsBuf = new CBuffColorBars()
    colorsBars:boolean

    bufferMA= {
        volume : new CBuffPrice(),
        volume2 : new CBuffPriceHistogram(),
        percent : new CBuffPriceHistogram(),
        fast : new CBuffPrice,
        slow : new CBuffPrice(),
    }
    cma: CMABaseVolume;
    cmaFast: CMABaseVolume;

    constructor(params: SimpleParams<CVolumeIndicatorParameters>) {
        super();
        //this.params= params? {...params} : GetSimpleParams(IndicatorIMA.paramInfo);

        console.log("stat MA");
        // this.new.window()

        this.cma = new CMABaseVolume(params.fast);
        this.cmaFast = new CMABaseVolume(params.slow);
        this.colorsBars = params.colorBars
        // this.display.displayGeneral= true;
        // this._buffers[0] = this.bufferMA.slow;// мы собираем ве наши индивары в один масив чтобы отправить
        // this._buffers[1] = this.bufferMA.fast;// мы собираем ве наши индивары в один масив чтобы отправить

  //      this.windows[0] = new CIndicatorObject(this.bufferMA.fast, this.bufferMA.slow, this.bufferMA.volume)
        if (this.colorsBars) this._buffers.push(this.colorsBarsBuf)
        this.windows[0] = new CIndicatorGraphObject(this.bufferMA.volume2)
        this.windows[1] = new CIndicatorGraphObject(this.bufferMA.percent)
    }

    override OnInit({loadHistory, alert}: tOnInitIndicator) {
        alert({alarm: "проверка", signal: "проверка", text: "проверка"})
    }

    override async OnTicks(data: tOnTicks, isStopped: () => boolean|Promise<boolean> ) {
        const {slow, fast, volume,volume2, percent} = this.bufferMA
        let k = data.bars?.count ?? 0
        if (k) k-=1
        volume.values[k] = data.bars?.[k].volume ?? 0
        volume2.values[k] = volume.values[k]
        percent.values[k] = ((volume.values[k] / volume.values[k-1]) -1) *100

        if (volume.values[k-1]>volume.values[k]) volume.color[k]='#fefdff';
        else volume.color[k]='#ffd204';
        volume2.color[k] = volume.color[k]
        if (slow.values[k-1]>slow.values[k]) slow.color[k]='#fefdff';
        else slow.color[k]='#ffd204';
        if (fast.values[k-1]>fast.values[k]) fast.color[k]='#75ffa2';
        else fast.color[k]="rgb(255,165,0)";//'#6779ff';
    }

    override async OnBars({newBarIndex,allBars,api}: tOnBarsIndicator, isStopped: () => boolean|Promise<boolean> ) {

        api.alert({alarm: "проверка", signal: "проверка", text: "проверка"})
        const {slow, fast, volume,volume2, percent} = this.bufferMA


        let i=newBarIndex;

        for (let k=i; k<allBars.length; i=++k) {

            if (this.colorsBars) {
                let log = Math.round((Math.log10(allBars[i].volume)/4)*255)
                this.colorsBarsBuf.setColor(i,"rgb("+log.toFixed(0)+","+(255-log).toFixed(0)+",0)" as ColorString)
            }

            slow.values[k]= this.cma.MA(allBars,i,(b: { volume: number; }) => b.volume) ?? allBars[k].volume;
            fast.values[k]= this.cmaFast.MA(allBars,k,(b: { volume: number; }) => b.volume)??allBars[k].volume;
            volume.values[k] = allBars[k].volume
            volume2.values[k] = volume.values[k]
            percent.values[k] = 0
            if (k>0) {
                if (volume.values[k-1]>volume.values[k]) volume.color[k]='#fefdff';
                else volume.color[k]='#ffd204';
                volume2.color[k] = volume.color[k]
                if (slow.values[k-1]>slow.values[k]) slow.color[k]='#fefdff';
                else slow.color[k]='#ffd204';
                if (fast.values[k-1]>fast.values[k]) fast.color[k]='#75ffa2';
                else fast.color[k]="rgb(255,165,0)";//'#6779ff';


                percent.values[k] = ((volume.values[k] / volume.values[k-1]) -1) *100
                percent.color[k] = "rgb(255,255,255)"
            }
        }
        if (slow.values[i-1] && fast.values[i-1]) api.alert({alarm: "", signal: fast.values[i-1]>slow.values[i-1]?"signal Buy":"signal Sell", text: ""})
        return undefined;
    }

}  //Облость видимости - тут должны находить такие элементы как Инит Эвент ОнСтрат и прочее в этих кавычках

class CMABaseVolume {
    //arr;//это ссылка на масив с ценами открытия или закрытия.....незнаю зачем
    readonly period : number;
    _lastnbar:number|undefined;
    _lastprice : number|undefined;
    private buf:number=0;//последнее значение
    get lastnbar():number|undefined { return this._lastnbar; }
    get lastprice():number { return this._lastprice!; }

    constructor(period : number)   { this.period=period;  this.Reset(); } //{this.Init(period);}
    Reset()                        { this._lastnbar=undefined;  this._lastprice=undefined;  this.buf=0;   }
    //Init(period?)           {;}
    MA(bars: IBars, nbar: number,to=(b:CBar)=>{if (!b || !b.close) {console.error(b)} return b?.close;}):number|undefined{
        let poz= nbar;
        let lastnbar=this.lastnbar;
        if (lastnbar==undefined && poz>=this.period){
            this.buf=0;
            for (lastnbar=0; lastnbar<=this.period; lastnbar++) {this.buf+=to(bars[lastnbar]);}
            this.buf/=(lastnbar);
        }
        if (lastnbar!=undefined && lastnbar>=this.period && poz>=this.period){
            if (lastnbar==poz) {this.buf+=(lastnbar-to(bars[lastnbar]))/this.period; lastnbar=to(bars[lastnbar]); return this.buf;}
            while (++lastnbar<=poz) {this.buf+=(to(bars[lastnbar])-to(bars[lastnbar-this.period]))/this.period;}
            this._lastnbar=poz;
            return this.buf;
        }
        return  undefined;
    }
}
//Назначаем функции на вызов, типо подписки на событие (Важно)



