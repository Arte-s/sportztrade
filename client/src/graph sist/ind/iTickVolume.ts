import {CBuffHistogramSimple, CIndiBase, CIndicatorGraphObject, tOnBarIndicator} from "../and/indicatorAPI";
import {CParams, ReadonlyFull, SimpleParams} from "../and/CParams";


class CParamsTickVolume extends CParams {
    p1 = {name: "Volume", value: true };
    p2 = {name: "VolumeTick", value: true };
    p3 = {name: "VolumeTick/Volume", value: true };
    p4 = {name: "Volume/VolumeTick", value: false };
}

export class CIndicator_TickVolume extends CIndiBase<typeof CIndicator_TickVolume> {
    static readonly paramInfo = new CParamsTickVolume
    static readonly Name = "Tick Volume";
    static readonly Version = "1.00";

    private buf1= new CBuffHistogramSimple("rgb(255,255,0)");
    private buf2= new CBuffHistogramSimple("rgb(255,255,0)");
    private buf3= new CBuffHistogramSimple("rgb(255,255,0)");
    private buf4= new CBuffHistogramSimple("rgb(255,255,0)");

    params : SimpleParams<CParamsTickVolume>
    constructor(params: SimpleParams<CParamsTickVolume>) {
        super();
        this.params=params
        const {p1,p2,p3,p4} = this.params
        if (p1) this.windows.push(new CIndicatorGraphObject(this.buf1))
        if (p2) this.windows.push(new CIndicatorGraphObject(this.buf2))
        if (p3) this.windows.push(new CIndicatorGraphObject(this.buf3))
        if (p4) this.windows.push(new CIndicatorGraphObject(this.buf4))
    }

    override OnBar({bar:{volume,tickVolume},index:i,allBars} :tOnBarIndicator) {
        const {p1,p2,p3,p4} = this.params
        const {buf1,buf2,buf3,buf4} = this

        if (p1) {
            buf1.values[i]= volume;
        }

        if (p2) {
            buf2.values[i]= tickVolume;
        }

        if (p3) {
            buf3.values[i]= tickVolume/volume;
        }
        if (p4) {
            buf4.values[i]= tickVolume;
        }
    }
}