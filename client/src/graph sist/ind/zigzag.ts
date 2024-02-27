
import {const_Date, IBars, IBarsExt, CBar, BarInfo} from "../Nav/Bars";
import {IColor, CColor} from "../and/color";
import {CZig, CZigNode, IZig, IZigNode, IZigNodeExt, IZigExt2} from "./zig";

export {IZig};




export type ZZConfigBase = {
    minWaveSize_atrPercent : number;
};

export type ZZConfig = ZZConfigBase & {
    nBars : number;
};

export type ZZConfigMajor = ZZConfigBase & {
    swingBreakoutRange_HL_atrPerc :number;
    swingBreakoutRange_OC_atrPerc: number
    //internalSections: boolean;
};



export abstract class CZBase {

    readonly st = new CZig();

    static readonly defaultConfig : Readonly<ZZConfigBase> = { minWaveSize_atrPercent: 150 };

    readonly config : Readonly<ZZConfigBase> = CZBase.defaultConfig;

    juniorMainPointIndex : number = -1;
    jnrLastLength= -1;
    jnr? : IZig;

    mainNapUp(i :number=-1) :boolean { let iLeft= i<0 ? -this.st.length : 0;  for(; i>=iLeft; i--) if (this.st.isMain(i)) return this.st.napUp(i);  throw "Main index is not found"; }

    get length() { return this.st.length; }
    napUp(i:number=-1):boolean { return this.st.napUp(i); }//console.assert(i!=0);  return i!=0 ? this.st.price(i)>=this.st.price(i-1) : this.st.price(i)>=this.st.price(1); }
    napDw(i:number=-1):boolean { return this.st.napDw(i); }//console.assert(i!=0);  return i!=0 ? this.st.price(i)<=this.st.price(i-1) : this.st.price(i)<=this.st.price(1); }
    clear() {this.st.clear();  this.juniorMainPointIndex=-1; this.jnrLastLength=-1;  this.jnr= undefined; }

    constructor(config? : Readonly<ZZConfigBase>) { if (config) this.config= {...config}; }

    protected updateBase(up :boolean, price :number, nbar :number, time :const_Date, atr :number, isMajor=false) {
        let st= this.st;
        let nbarFull= nbar;
        if (st.length==0) { st.pushCopy({up,price,nbarFull,time}, true);  return; }
        let n= -1; //this.st.mainPntIndex;
        let napUp= this.napUp(n);
        let napDw= !napUp;
        //обновление максимумов/минимумов
        if (napUp && price>st.price(n)) { st.updateLast({price,nbarFull,time}); return; }// if (st.length>2 && price> st.price(n-2)) st.setMain(n); return; }
        if (napDw && price<st.price(n)) { st.updateLast({price,nbarFull,time}); return; }// if (st.length>2 && price< st.price(n-2)) st.setMain(n);  return; }
        if (st.length==1) { st.pushCopyNext({price,nbarFull,time}, true); return; }
        if (isMajor) return;
        // внеочередное соединение  //if (st.length<2) return;
        if (Math.abs(price - st.price(n)) < (this.config?.minWaveSize_atrPercent??0)/100*atr) return;
        //let delta= this.config);
        if (napUp && price<st.price(n-1)) { st.pushCopyNext({price,nbarFull,time}, st.isMain()); } //console.assert(price<st.price());
        if (napDw && price>st.price(n-1)) { st.pushCopyNext({price,nbarFull,time}, st.isMain()); } //console.assert(price>st.price());
    }
    protected updateFromBarPrice(up :boolean, bar :CBar, nbar: number, atr :number) { this.updateBase(up, up ? bar.high : bar.low, nbar, bar.time, atr); }

    protected updateFromPoint(zzPnt :IZigNode, atr :number) { this.updateBase(zzPnt.up, zzPnt.price, zzPnt.nbarFull, zzPnt.time, atr, true); }
}




export class ZigBase extends CZBase{
    //napBar(bar: Readonly<CBar>):boolean {return bar.open<=bar.close;}
    update(bars: IBars, nbar :number, atr : number)
    {
        let bar= bars[nbar];
        let up = bar.open<bar.close;  // свеча восходящая
        this.updateFromBarPrice(!up, bar, nbar, atr);  // проверяем противоположную точку
        this.updateFromBarPrice(up, bar, nbar+0.5, atr);
        let prevbar= bars[nbar-1];
        let minWaveSize = (this.config?.minWaveSize_atrPercent??0)/100*atr;
        let nbarFull= nbar;
        //переворот у базового зигзага
        if (bar.low - this.st.price() < -minWaveSize)
            if (this.napUp() && prevbar.low > bar.low  && !up) { this.st.pushCopyNext({price: bar.low, nbarFull, time: bar.time}); }//|| this.st.price(-1) >bar.high(nbar)
        if (bar.high - this.st.price() > minWaveSize)
            if (this.napDw() && prevbar.high < bar.high && up) { this.st.pushCopyNext({price: bar.low, nbarFull, time: bar.time}); }//|| this.st.price(-1)  <bar.low(nbar)
    }
}






export class ZigBaseT extends CZBase
{
    override readonly config : Readonly<ZZConfigMajor> = {
        minWaveSize_atrPercent: 150,
        swingBreakoutRange_HL_atrPerc: 40,
        swingBreakoutRange_OC_atrPerc: 20,
        //internalSections :true
    };
    constructor(config? : Readonly<ZZConfigMajor>) { super(config);  if (config) this.config= {...config}; }

    //juniorMainPntIndex : number = 0;  // последняя основная точка на младшем зигзаге

    update(barInfo :BarInfo, st :IZig, iZig :number, atr :number)  // здесь st - младший зигзаг
    {
        let bars= barInfo.getAllBars();
        // Если хай и лоу младшего зигзага на одном и том же баре, то проверяем их по очереди
        if (st.length>1 && st.nbar(-2)==st.nbar(-1) && st.length>this.jnrLastLength) {
            let last = (st.data as CZigNode[]).pop()!;  //console.log("pop");
            this.update(barInfo, st, iZig, atr);
            (st.data as CZigNode[]).push(last);  //console.log("push");
        }
        if (this.jnrLastLength>=0 && st.length<this.jnrLastLength)
            throw("!!!! "+st.length+" < "+this.jnrLastLength+"  jnr is same: "+(st==this.jnr));
        this.jnrLastLength= st.length;
        this.jnr= st;
        //let t= Date.parse("2021-05-11 19:00");

        // Проверка пробития уровня
        const hasBreakout = (levelPrice :number, up :boolean)=> {
            let price= st.price();
            let k = up ? 1 : -1;
            if ((price - levelPrice)*k > this.config.swingBreakoutRange_HL_atrPerc/100*atr)
                return true;
            if (barInfo.closed || st.nbar()<barInfo.index) {
                let bar= bars[st.nbar()];
                price= k==1 ? Math.max(bar.open, bar.close) : Math.min(bar.open, bar.close);
                if ((price - levelPrice) * k > this.config.swingBreakoutRange_OC_atrPerc/100*atr)
                    return true;
            }
            return false;
        }

        //if (st.length>=3 && st.nbar(-3)==this.st.nbar() && st.napUp()==this.napUp())
        // if (iZig==0 && time!.valueOf()==Date.parse("2021-09-06 11:00"))
        //     console.log(st.nbar(-3)!=this.st.nbar(), st.napUp()!=this.napUp(), st.nbar(-2)>=this.st.nbar(), hasBreakout(st.price(-3), st.napUp()));
        if (1)
        if (st.length>=3 && this.st.length>0) { // && st.nbar(-minCount)>=this.st.nbar()) { // три волны (или более) лежат правее старшего свинга
            // if (t?.valueOf()==new Date("2021.09.25 17:15").valueOf() && iZig==0)
            //     console.log("!!",minCount, napUp);
            if (st.nbarFull(-3)!=this.st.nbarFull())
                if (st.nbarFull(-2)>=this.st.nbarFull() && hasBreakout(st.price(-3), st.napUp())) {
                    //if (hasBreakout23(napUp)) {
                    // if (t?.valueOf()==new Date("2021.09.25 17:15").valueOf() && iZig==0)
                    //     console.log(minCount, napUp);
                    let i :number;
                    for(i=st.length-1; i>=0; i--)
                        if (st.nbarFull(i)<=this.st.nbarFull()) // || (st.nbar(i)==this.st.nbar() && st.napUp(i)==this.napUp()))
                            break;
                    let searchUp= !this.napUp();
                    let isMain= st.nbar(-3)<=this.st.nbar() && this.st.isMain(); //i>=st.length-4 && this.st.isMain();
                    // if (t?.valueOf()==Date.parse("2021-09-01 19:00") && iZig==0)
                    //     console.log(JSON_clone(st.data),"\n",JSON_clone(this.st.data));
                    //let ok= i+1<st.length; if (ok) console.log("start");
                    //if (isMain || this.config.internalSections)
                        for(i= i+1; i<st.length; i++) {
                            i = searchUp ? st.iHighest(i, st.length-1) : st.iLowest(i, st.length-1);
                            //console.log(2);
                            this.st.pushCopy(st.at(i), isMain); //i==st.length-1 ? isMain : false);
                            searchUp= !searchUp;
                        }
                    //if (ok) console.log("finish");
                }
        }

        if (this.st.length==0 && st.length>1)
            this.updateFromPoint(st.at(-2), atr);

        this.updateFromPoint(st.at(-1), atr);
        //if (this.st.nbar()==st.nbar()) this.st.mainPntIndex= this.st.length-1;


        // обновляем индекс основной точки младшего зигзага

        let jnrMainPntIndex= this.juniorMainPointIndex;
        if (1)
        if (this.st.nbar()==st.nbar()) {
            let iJnrCheckPnt= jnrMainPntIndex<0 || this.napUp()==st.napUp(jnrMainPntIndex) ? jnrMainPntIndex : jnrMainPntIndex-1;
            let checkPrice :number|undefined;
            let ok = true;
            if (iJnrCheckPnt>=0) {
                let k= st.napUp(iJnrCheckPnt) ? 1 : -1;
                checkPrice= st.price(iJnrCheckPnt);
                ok= (st.price()-checkPrice)*k >0;
            }
            if (ok) {
                let iJnrPnt= st.length-1;
                let len= iJnrPnt - iJnrCheckPnt;
                let startMainPrice= this.st.mainStartPrice() ?? (len>2 ? checkPrice : undefined);
                this.st.setMain(-1, iJnrPnt, startMainPrice);//st.to(iJnrCheckPnt));
                this.juniorMainPointIndex= iJnrPnt;
            }
       }

        // Проверка пробития точек -2 и -3
        function hasBreakout23(up :boolean) {
            return up
                ? hasBreakout(Math.max(st.price(-2), st.price(-3)), true)
                : hasBreakout(Math.min(st.price(-2), st.price(-3)), false)
        }


        return this;

    }
}


type BarPointData = Readonly<{ price: number;  nbar: number;  time: const_Date }>;


// модель N баров
class CModN {
    private length: number = 0;
    private datas : BarPointData[] = [];
    readonly maxLength : number;

    constructor(maxLength: number);
    constructor(maxLength: number, barData :BarPointData, onComplete : (data: BarPointData)=>void)
    constructor(maxLength: number, barData? :BarPointData, onComplete? : (data: BarPointData)=>void) {
        this.maxLength= maxLength;
        if (barData) this.add(barData, onComplete ?? (()=>{}));
    }

    hasData(): boolean { return this.length > 0; }

    lastPrice(): number { return this.datas[this.length - 1]?.price; }

    lastBar(): number { return this.datas[this.length - 1]?.nbar; }

    protected add(data : BarPointData, onComplete: (data :BarPointData) => void) {
        //console.assert(this.length < this.maxLength);
        this.datas[this.length++] = data;
        if (this.length >= this.maxLength) {
            onComplete?.(data);
        }
    }

    protected updateLast(data : BarPointData) {
        console.assert(this.length >=0);
        this.datas[this.length-1] = data;
    }

    addOrUpdateLast(data : BarPointData, onComplete: (data :BarPointData) => void) {
        if (data.nbar == this.lastBar()) this.updateLast(data); else this.add(data, onComplete);
    }
}

// модель 3 бара
class CMod3 extends CModN {
    //constructor(complite: (data: BarPointData)=>void, barData? : BarPointData) {
    constructor() {
        super(3);//, complite, barData);
    }
}



class CModBarsFun
{
    private data: CModN[] = [];
    private nap: number = 1; //1 buy  -1 sell
    readonly maxBars : number;

    constructor(maxBars :number) {
        this.maxBars= maxBars;
    }

    reset() { this.data.length = 0; }

    add(barData :BarPointData, nap :number, onComplete : (barData :BarPointData)=>void|boolean) {
        if (nap && nap != this.nap) {
            this.reset();
            this.nap= nap;
        }
        const _onComplete = (barData :BarPointData) => {
            if (onComplete(barData)!=false)
                this.reset();
        }
        let k= this.nap;  // 1 или -1
        let updated = 0;
        for(let n of this.data) {
            if ((barData.price - n.lastPrice()) * k >= 0) { // точка обновлена
                n.addOrUpdateLast(barData, _onComplete);
                updated = 1;
            }
            else updated = 0;
        }
        if (! updated) { // не пробито
            this.data.push(new CModN(this.maxBars, barData, _onComplete));
        }
    }
}


class ArrayExt<T> extends Array<T> { get last() { return this[this.length-1]; } }





export class ZigBaseN extends CZBase
{
    private model : CModBarsFun;
    //virtualZig = new CZig;
    private points = new ArrayExt<IZigNodeExt>();

    private pointsK : number = 0;

    readonly maxPointsCount : number;

    constructor(config? : Readonly<ZZConfig>) {
        super(config);
        this.maxPointsCount= config?.nBars ?? 3;
        this.model = new CModBarsFun(this.maxPointsCount);
    }

    //update(bars :IBars, nbar :number, atr :number)
    update(bar :CBar, nbar :number, atr :number)
    {
        //let bar= bars[nbar];
        let barUp = bar.open < bar.close;

        this.updateFromBarPrice(!barUp, bar, nbar, atr);

        this.updateFromBarPrice(barUp, bar, nbar+0.5, atr);

        if (0) {
            // //переворот у базового зигзага
            //
            // let [up, k, price]= this.napUp() ? [false, -1, bar.low] : [true, 1, bar.high];
            //
            // if (this.st.nbar()==nbar || k != this.pointsK) {
            //     this.points.length= 0;
            //     this.pointsK= k;
            // }
            //
            // if (!this.points.last || (price - this.points.last.price) *k > 0) {
            //     this.points.push({up, price, nbar, time: bar.time});
            //     if (this.points.length>=this.maxPointsCount)
            //         if (Math.abs(price - this.st.price()) >= (this.config?.minWaveSize_atrPercent??0)/100*atr)
            //         {
            //             this.st.pushCopy(this.points.last);
            //             this.points.length= 0;
            //         }
            // }
        }
        else {
            if (this.st.nbar() == nbar) this.model.reset();

            const onComplete= (barData :BarPointData) => {
                if (Math.abs(barData.price - this.st.price()) >= (this.config?.minWaveSize_atrPercent??0)/100 * atr) {
                    this.st.pushCopyNext({price: barData.price, nbarFull: barData.nbar, time: barData.time});
                    return true;
                }
                return false;
            }

            //переворот у базового зигзага
            if (this.napUp()) {
                this.model.add({price: bar.low, nbar: nbar, time: bar.time}, -1, onComplete);
            } else {
                this.model.add({price: bar.high, nbar: nbar, time: bar.time}, 1, onComplete);
            }
        }
    }
}



export class ZigBase3 extends ZigBaseN {
    constructor(config? : ZZConfigBase) { super( {...(config ? config : CZBase.defaultConfig), nBars: 3} ); }
}


type ZigzagsState = {readonly zigzagLens : readonly number[] };
    //Readonly<{len: number, juniorMainPointIndex :number, jnrLastLength :number}>[];//readonly zigzagLens : readonly number[] }


export class CZigzags {
    private readonly base: ZigBaseN;//(this.zzParams);
    //majorZigzags= [new Zig(BaseT, new ZigBaseT, new ZigBaseT, new ZigBaseT, new ZigBaseT];
    private readonly majors: ZigBaseT[]; //=new ZigBaseT(this.zzParams);
    private allStMutable : CZig[];
    readonly allSt: readonly IZigExt2[];
    //private volumeDatas0 : { currentSectionVolume :number, sumSectionsVolume :number, sectionsCount :number, lastVolume: number }[] = [];
    private _volumeDatas : { sectionVolumes :number[], sumSectionVolumes :number[], avrgSectionVolumes :number[], lastVolume: number }[] = [];
    private _iBar = -1;

    public volumes(iZig :number) : readonly number[] { return this._volumeDatas[iZig]?.sectionVolumes ?? (()=>{throw "wrong ZZ index: "+iZig})(); }
    public averageVolumes(iZig :number) : readonly number[]  { return this._volumeDatas[iZig]?.avrgSectionVolumes ?? (()=>{throw "wrong ZZ index: "+iZig})(); }
    //private _iBar : number= -1;
    private _lengths : number[] = [];

    constructor(zzTotal: number, config: (ZZConfig & ZZConfigMajor) | undefined, colors?: readonly IColor[]) {
        this.base = new ZigBaseN(config);
        this.majors = [];
        for (let i=0; i < zzTotal-1; i++)
            this.majors[i] = new ZigBaseT(config);
        let allZZ = [this.base, ...this.majors];
        for (let [i, zz] of allZZ.entries()) {
            zz.st.colorDefault = colors?.[i] ?? new CColor(0, 0, 0);
            this._volumeDatas[i] ??= {sectionVolumes: [], sumSectionVolumes :[], avrgSectionVolumes :[], lastVolume: 0};
            //zz.isNewVersion = config?.isNewVersion ?? false;
        }
        this.allSt = this.allStMutable = allZZ.map(
            (zz, i) => Object.assign(zz.st, {volumes: this._volumeDatas[i].sectionVolumes, avrgVolumes: this._volumeDatas[i].avrgSectionVolumes })
        );
    }

    clear() {
        this.base.clear();
        for (let zz of this.majors) zz.clear();
        this._lengths= [];
    }


    onBar(bars: IBarsExt, iBar: number, atr: number) {
        //if (iBar==this._iBar)
        let bar= bars[iBar];
        this.base.update(bar, iBar, atr);

        for (let [i, major] of this.majors.entries()) {
            major.update(bars.barInfo(iBar), this.allSt[i], i, atr);
        }

        for(let [i, zz] of this.allSt.entries()) {
            let initVolume= 0;
            // if (zz.length==this._lengths[i])
            //     initVolume= volumeData.sectionVolumes[j]
            for(let j=(this._lengths[i] ?? 1)-1; j<zz.length; j++) {
                let volumeData= this._volumeDatas[i];// ??= {sectionVolumes: [], sumSectionVolumes :[], avrgSectionVolumes :[], lastVolume: 0};
                let fromBar= zz.nbar(j);
                let toBar = j<zz.length-1 ? zz.nbar(j+1) : iBar;
                let sumVolume=0;
                if (zz.length==this._lengths[i]) {
                    fromBar= this._iBar+1;
                    sumVolume= volumeData.sectionVolumes[j];
                }
                for(let b= fromBar; b<=toBar; b++)
                    sumVolume += bars[b].volume;
                //let volumeData= this.volumeDatas[i] ??= {currentSectionVolume :0, sumSectionsVolume :0, sectionsCount :0, lastVolume: 0};
                volumeData.sectionVolumes[j]= sumVolume;
                volumeData.sumSectionVolumes[j]= sumVolume + (j>0 ? volumeData.sumSectionVolumes[j-1] : 0);
                //if (isNaN(volumeData.sumSectionVolumes[j])) console.error(sumVolume+" "+j+" "+volumeData.sumSectionVolumes[j-1]);
                volumeData.avrgSectionVolumes[j]= volumeData.sumSectionVolumes[j] / (j+1);
            }
            this._lengths[i]= zz.length;
        }
        this._iBar= iBar;
        // if (bars[iBar].time>=new Date("2021-08-06 14:45"))
        //     console.log("!!!!", bars[iBar].time, JSON.parse(JSON.stringify(this.allSt[0].data)));
    }

    saveState() : ZigzagsState { return { zigzagLens : this.allSt.map((st)=>st.length) } }
    //saveState() : ZigzagsState { return this.allStMutable.map((st)=>({len: st.length, jnrLastLength: st. })) } }

    loadState(state : ZigzagsState) {
        console.log("load zigzag state");
        console.assert(state.zigzagLens.length==this.allSt.length);
        for(let [i,len] of state.zigzagLens.entries()) {
            console.assert(len<=this.allSt[i].length);
            this.allStMutable[i].crop(len);
            if (i<state.zigzagLens.length-1) this.majors[i].jnrLastLength= len;
            //this.allStMutable[i].juniorPointIndex()
            this._volumeDatas[i].sectionVolumes.length= len;
            this._volumeDatas[i].sumSectionVolumes.length= len;
            this._volumeDatas[i].avrgSectionVolumes.length= len;
            this._lengths[i]= len;
        }
    }
}
