import {Indicator} from "./and/const";
import {IParams, SimpleParams} from "./and/CParams";
// import {CIndicatorMA} from "./ind/iMA";
// import {CIndicatorMA2} from "./ind/iMA2";
// import {CIndicatorATR} from "./ind/iATR";
// import {CIndicatorZigNew} from "./ind/iZigNew";
// import {CIndicatorMultiVolumes} from "./ind/iMultiVolumes"
//import {IndicatorIMA2} from "./ind/iMA2.js";

// import {IndicatorIMA} from "./ind/iMA";
// import {CIndicatorATR} from "./ind/iATR";

// import {CIndi_3000} from "./ind/abolk/i3000";
// import {CIndi_ATRVolume} from "./ind/abolk/iATRVolume";
// import {CIndi_ATRVolume_Bar} from "./ind/abolk/iATRVolume_Bar";

import {IndicatorLines} from "./ind/iLines";
import {CIndicatorVolume} from "./ind/iVolumes";
import {CIndicator_TickVolume} from "./ind/iTickVolume";
import {CIndicatorOrders} from "./ind/iOrders";


type convertType<T extends { paramInfo: any } & (new (args: T["paramInfo"]) => any)> =
    T
    & { paramInfo: IParams }
    & (new (args: SimpleParams) => any)


// Индикаторы могут быть заданы либо в виде полного класса со статическими полями и конструктором,
// либо в виде объекта Indicator, содержащего эти же поля и метод construct

export const indicators: readonly Indicator[] = [
    // Indicator(CIndicatorZigNew),
    // //Indicator(IndicatorIMA2 as convertType<typeof IndicatorIMA2>), // as typeof IndicatorIMA2 & (typeof IndicatorIMA2)["paramInfo"] & IParams>),
    // Indicator(CIndicatorMA),
    // Indicator(CIndicatorMA2),
    // Indicator(CIndicatorATR),
    Indicator(CIndicatorVolume),
    Indicator(CIndicator_TickVolume),
    // Indicator(CIndicatorMultiVolumes),

    // Indicator(CIndi_3000),
    // Indicator(CIndi_ATRVolume),
    // Indicator(CIndi_ATRVolume_Bar),

    Indicator(IndicatorLines),
    //Indicator(CIndicatorOrders)
];

export default indicators;
