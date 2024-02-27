import {CBar, const_Date, IBars} from "../Nav/Bars";
import {ColorString, IColor, ILine, LineStyle, Point} from "../and/graph";
import {newArrow} from "../and/labels";

export * from "../and/labels"

export function CheckBarFilterOK(bar: CBar, atr: number, filterOC_atrPercent: number, filterHL_atrPercent: number) {
    // Фильтр тела свечи:
    if (Math.abs(bar.open - bar.close) > filterOC_atrPercent * atr / 100)
        return false;
    let highShadow = bar.high - Math.max(bar.open, bar.close);
    let lowShadow = Math.min(bar.open, bar.close) - bar.low;
    // Фильтр верхней/нижней тени свечи:
    let maxShadow = Math.max(highShadow, lowShadow);
    if (maxShadow > filterHL_atrPercent * atr / 100)
        return false;
    return true;
}


export function Point_(x: number | const_Date, y: number): Point {
    return {x: x.valueOf(), y};
}

export function Line(start: Point, end: Point, color: ColorString|null, width = 1, style?: LineStyle, text?: string, textAlign: "left"|"right"|"center" = "right")
    : ILine {
    return {begin: start, end, color, width, style, text, textAlignH: textAlign};
}

// Создать текстовую линию
export function CreateTextLine(text: string, point: Point, color: ColorString|IColor, hAlign: "left"|"right"|"center", vAlign: "top"|"bottom"|"center", angle_degrees=0) {
    let angle= angle_degrees / 180 * Math.PI;
    let point2= angle==0 ? point : { x: point.x + 0.0001 * Math.cos(angle), y: point.y + 0.0001 * Math.sin(angle) };
    let colorStr= typeof color=="string" ? color : color.getString();
    let line : ILine = { begin: point, end: point2, color: null, text, textColor: colorStr, textAlignH: hAlign, textAlignV:  vAlign};
    return line;
}

export function CreateArrow(time :const_Date, price :number, up :boolean, scale=1) {
    return newArrow({x: time.valueOf(), y: price}, up ? 1 : -1, 5, scale);
}

export function CreateArrowOnClose(bar : CBar, up: boolean) {
     return CreateArrow(bar.time, bar.close, up);
}


export function CreateArrowOutside(bar : CBar, up: boolean) {
    return CreateArrow(bar.time, up ? bar.low : bar.high, up);
}


// Рисование стрелочки
export function CreateCustomArrow(bars: IBars, i: number, up: boolean, ATR: number): ILine[] //|null
{
    if (i < 0 || i >= bars.length) return [];//null;
    let k = up ? 1 : -1;
    let time1 = i > 0 ? bars[i - 1].time.valueOf() : bars[i].time.valueOf() - bars.Tf.msec;
    let time2 = bars[i].time.valueOf();
    let time3 = i < bars.length - 1 ? bars[i + 1].time.valueOf() : bars[i].time.valueOf() + bars.Tf.msec * 1.1;
    let price2 = (up ? bars[i].low : bars[i].high) - ATR / 10 * k;
    let price1 = price2 - ATR / 4 * k;
    let color: ColorString = "red" as ColorString;
    let width = 3;

    function line(start: Point, end: Point) {
        return Line(start, end, color, width);
    }

    let [point1, point2, point3] = [Point_(time1, price1), Point_(time2, price2), Point_(time3, price1)];
    let point4 = Point_(time2, price2 - ATR * k);
    let lines = [line(point1, point2), line(point2, point3), line(point2, point4)];
    return lines;
}


export type TextInfo = { text: string, color: ColorString, y?: number };


export function getMultiColorTextLines(
    rows: readonly(readonly Readonly<TextInfo>[])[],
    point: Point,
    hAlign: "left" | "right" | "center",
    vAlign: "top" | "bottom" | "center",
    delimiter = ""
) {
    let lines: ILine[] = [];
    let prefix = "";

    function getTextSpaces(text: string) {
        let spaces = "";
        for (let char of text) spaces += ["-", ".", " ", "(", ")", " "].includes(char) ? " " : "  ";
        return spaces;
    }

    let delimSpaces = getTextSpaces(delimiter);
    for (let row of rows) {
        let spaces = "";
        for (let textData of row) {
            let text = textData.text;
            let txtPoint = textData.y == null ? point : {x: point.x, y: textData.y};
            let line = CreateTextLine(prefix + spaces + text + delimiter, txtPoint, textData.color, hAlign, vAlign);
            lines.push(line);
            for (let char of text) spaces += ["-", ".", " ", "(", ")", " "].includes(char) ? " " : "  ";
            spaces += delimSpaces;
        }
        prefix += "\n";
    }
    return lines;
}


export function line_timeToString(line :ILine) {
    return {...line, begin: {x: new Date(line.begin.x).toString(), y: line.begin.y}, end: {x: new Date(line.end.x).toString(), y: line.end.y}}
}

export function lines_timeToString(lines :readonly ILine[]) { return lines.map(line=>line_timeToString(line)); }