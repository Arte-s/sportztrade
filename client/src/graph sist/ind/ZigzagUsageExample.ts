
import {defaultParamInfoZZ, CIndicatorZZ,CParamInfoZZ} from "./iZigzag"
import {CIndiBase, tOnBarIndicator} from "../and/const";
import {CParams, CParamsReadonly, ReadonlyFull, SimpleParams} from "../and/CParams";


class MyParametersInfo extends CParamsReadonly {
    a = { name: "SomeParameter", value: 0, range: { min:0, max:99, step:1 } };
    zigzag = { name: "Зигзаги", value: defaultParamInfoZZ }
}





class MyIndicator extends CIndiBase<typeof MyIndicator> {

    static readonly paramInfo = new MyParametersInfo();
    static readonly Name="ZigzagExample";
    static readonly Version="1.0";
    private zigzagInd : CIndicatorZZ;

    constructor(params :SimpleParams<MyParametersInfo>) {
        super();
        this.zigzagInd= new CIndicatorZZ(params.zigzag);
    }

    override async OnBar(data: tOnBarIndicator)
    {
        this.zigzagInd.onBar2(data.allBars, data.index);
        let zz0= this.zigzagInd.zigzags[0]; // младший зигзаг
        if (zz0.length>0)
            console.log(zz0.nbar());  // печатаем номер бара последнего свинга

        return data.allBars.length;
    }

    // override async OnBars(data: tOnBarsIndicator, isStopped: () => Promise<boolean> | boolean): Promise<number | void>
    // {
    //     for (let i=data.newBarIndex; i<data.allBars.length; i++) {
    //         if (i%100==99 && await isStopped()) return i;
    //         this.zigzagInd.onBar2(data.allBars, i);
    //         let zz0= this.zigzagInd.zigzags[0]; // младший зигзаг
    //         if (zz0.length>0)
    //             console.log(zz0.nbar());  // печатаем номер бара последнего свинга
    //     }
    //     return data.allBars.length;
    // }
}