export type tSetColorBase = {
    color: string,
    switcher?: boolean;
    name?: string,
    value?: string,
    min?: string,
    max?: string,
    step?: string,
}
export type ISetColors2 = {
    backgroundHtml: tSetColorBase,
    backgroundCanvas: tSetColorBase,
    textTable: tSetColorBase,
    textWater: tSetColorBase,
    textHL: tSetColorBase,
    grid: tSetColorBase,
    lineGraph: tSetColorBase,
    barUp: tSetColorBase,
    barDw: tSetColorBase,
    mouseTarget: tSetColorBase,
    textGrid: tSetColorBase
}
export type tSets = Partial<ISetColors2>

export class CCanvasColors implements ISetColors2 {
    constructor(data?: tSets) {
        return new Proxy<any>(this, { // (*)
            set(target, prop: string, val: tSetColorBase) { // для перехвата записи свойства
                Object.assign(target[prop] as tSetColorBase, val);
                return true;
            }
        })
    }

    backgroundHtml: tSetColorBase = {color: "#171e23",};
    backgroundCanvas: tSetColorBase = {color: "#171e23",};
    textTable: tSetColorBase = {color: "#A9AEBD", switcher: true};
    textWater: tSetColorBase = {color: "#28343b", switcher: true};
    pozitionWater?:{x:number, y: number, X:"LEFT"|"RIGHT", Y:"TOP"|"DOWN"} //= {}
    textHL: tSetColorBase = {color: "#A9AEBD", switcher: true};
    grid: tSetColorBase = {color: "#37474f", switcher: false};
    lineGraph: tSetColorBase = {color: "#14B890"};
    barUp: tSetColorBase = {color: "#14B890"};
    barDw: tSetColorBase = {color: "#ef5350"};
    mouseTarget: tSetColorBase = {color: "#A9AEBD", switcher: true};
    textGrid: tSetColorBase = {color: "#A9AEBD", switcher: true};
}

export type tStyleBarM = "candle" | "bar" | "line"
export type tStyleMouseM = "cross" | "off" | "crossMini"
type tGraphFon = {
    price: boolean,
    time: boolean
    timeStyle: "weekday" | "standard"
    timeMouse: boolean
    gridV: boolean,
    gridH: boolean
}

interface tStyleAndSettingGraphD {
    consoleHelper: boolean;
    styleBar: tStyleBarM;// 0 - candel  1 - bar 3 - line
    autoSizeGraph: boolean;
    animation: boolean;
    styleGrid: number;
    styleMouse: tStyleMouseM
}

export interface tStyleAndSettingGraph2 extends tStyleAndSettingGraphD, tGraphFon {
}

export interface tStyleAndSettingGraph extends Partial<tStyleAndSettingGraph2> {
}

export class CStyleAndSettingGraph implements tStyleAndSettingGraph2 {
    Set(data: tStyleAndSettingGraph2 | tStyleAndSettingGraph) {
        Object.assign(this, data)
    }

    price = true;
    time = true;
    timeStyle: "weekday" | "standard" = "standard"
    gridV = true;
    gridH = true;
    timeMouse = true;

    animation = false;
    autoSizeGraph = true;
    consoleHelper = false;
    styleBar: tStyleBarM = "candle";
    styleGrid = 5;
    styleMouse: tStyleMouseM = "cross";
}
