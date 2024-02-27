
import {CBar, const_Date, IBars, TF,timeLocalToStr_yyyymmdd_hhmm} from "../../Nav/Bars";
import {ICScaleBaseX, ICScaleBaseY} from "./Canvas2D";
import {IIndicatorANDBase,CIndicatorAND} from "../indicatorBaseClass/indicatorAND";
import {IGraphObjectB} from "../interface/IIndicator";
import {ColorString, ILine, IObjects} from "../../Nav/CGraphObject";
import {IGraphLabel} from "../labels";
import {IBuffer} from "../const";
import {CanvasContext2D} from "../vgraf3";
import {ISetColors2, tStyleAndSettingGraph2} from "./Canvas2dStyle";
import {CreateDom} from "../../CCreateDom";



type tDrawPrice = {
    canvas: CanvasRenderingContext2D,
    styleGraph: tStyleAndSettingGraph2,
    win: {x: ICScaleBaseX, y: ICScaleBaseY}
    styleColor: ISetColors2,
    history: IBars,
    size?: {width: number, height: number}
    // минимальный тф для горизонта
    tf: TF,
    // количество точек после запятой
    fixed: number
}

export function Draw2dPrice({canvas, styleGraph, history, fixed, tf, styleColor, win:{x, y}, size}: tDrawPrice) {
    const can = canvas;
    const h: IBars = history;

    const {width, height} = size ?? canvas.canvas//this.display.size;
    const pMin = x.pixmin - x.scale;
    const toY = (f: number) => (y.maxprice - f) * y.scale;
    const toX = (f: number) => (f - x.minBar) * x.scale + pMin;
    const color = styleColor;

    if (!h || y.minprice == undefined || y.scale == Infinity || y.scale == 0.0 || y.scale == undefined) return;

    if (x.minBar > h.length) {
        let buf = x.maxBar - x.minBar;
        x.minBar = h.length - 1;
        x.maxBar = x.minBar + buf;
    }

    const end: number = x.maxBar < h.length - 1 ? x.maxBar + 1 : h.length - 1;
    const start: number = x.minBar > 0 ? x.minBar - 1 : 0;


    let lineYStart: number;
    let lineYStep: number;

    let fTimePanel = {startTime: 0, stepTime: 0};//для нижней панели времени и для сетки
    {
        const {abs, trunc, round, log10, floor, ceil} = Math
        const num = trunc(abs(height) / 30); //шаг 200 пикселей минимальный
        const stepPrice = (y.maxprice - y.minprice) / num;
        const nStep = round(log10(stepPrice));
        const dsd = 10 ** nStep;
        const normsStep  = ((ceil((stepPrice * 10 / dsd) / 10) * 10) * 0.1) * (dsd);
        let start_ = floor(y.minprice / normsStep) * normsStep;
        can.strokeStyle = color.grid.color;
        can.fillStyle = color.grid.color;
        lineYStart = start_;
        lineYStep = normsStep;
        if (styleGraph.styleGrid > 2) {
            if (color.grid.switcher)
                for (let i = start_; i < y.maxprice; i += normsStep) {
                    can.moveTo(0, toY(i));
                    can.lineTo(width - 60, toY(i));
                    can.stroke();
                    can.beginPath();
                }//горизонтальная сетка
            let periodOnPix = 300;// как часто ставим вертикальные (от этого числа будут счиатться другие круглые значения)
            let barOnPeriod = Math.ceil(periodOnPix / x.scale);
            let timeStep = barOnPeriod * tf.sec;
            const fTime = function (d: number): number {
                if (d > TF.D1.sec * 90) {
                    return TF.D1.sec * 90;
                }
                if (d > TF.D1.sec * 30) {
                    return TF.D1.sec * 30;
                }
                if (d > TF.D1.sec * 7) {
                    return TF.D1.sec * 7;
                }
                if (d > TF.D1.sec * 2) {
                    return TF.D1.sec * 2;
                }
                for (let i = TF.all.length - 1; i >= 0; i--) {
                    const time = TF.all[i]?.sec
                    if (time && d > time) return time
                }
                return 1
            };//потом надо сделать две доделки, перевести отсчет от начала года и сделать все что выше 3х недель кратно месяцам....
            let step = fTime(timeStep) * 1000;
            let znBar: CBar;
            let startTime = Math.floor(h[start].time.getTime() / step) * step;  // тут надо считать так то с начала текущего года как вроде

            fTimePanel.startTime = startTime;
            fTimePanel.stepTime = step;
            if (color.grid.switcher)
                for (let i = start; i <= end; i++) {//вся функция отрисовки вертикальной сетки
                    znBar = h[i];
                    if (startTime <= h[i].time.getTime()) {
                        startTime += fTimePanel.stepTime;
                        znBar = h[i];
                        can.moveTo(toX(i), 0);
                        can.lineTo(toX(i), height);
                        can.stroke();
                        can.beginPath();
                    }
                }
        }
    }//сетка расположение за графиком ил иперед

    if (styleGraph.styleGrid > 4) {
        can.fillStyle = color.backgroundCanvas.color;
        can.fillRect(width - 45, 0, 80, height);
    }
    if (styleGraph.styleGrid > 1 ) {

        can.font = '500 8px Inter';
        can.textBaseline = "middle";
        can.textAlign = 'left';

        //шакала цен с права
        // && styleGraph.gridV
        if (styleGraph.price) {
            let _color = '#949494';
            can.fillStyle = _color;
            let textSpace = 50;
            let toCenter = textSpace - (textSpace - can.measureText(lineYStart.toFixed(fixed)).width) / 2;
            for (let i: number = lineYStart; i < y.maxprice; i += lineYStep) {
                can.fillText(i.toFixed(fixed), width - toCenter, toY(i), 45);
            }
        }

        //шакала времени
        if (styleGraph.time) {
            const downDis = 12;//отступ с низу
            let lastIndex = 0;
            let startTime = fTimePanel.startTime;
            for (let i = start == 0 ? 1 : start; i <= end; i++) {
                if (startTime <= h[i].time.getTime()) {
                    startTime += fTimePanel.stepTime;
                    if (h[i].time.getFullYear() != h[lastIndex].time.getFullYear()) {
                        can.fillText(
                            h[i].time.toLocaleString("en-GB", {year: 'numeric', month: 'numeric', day: 'numeric'})
                            , toX(i) + x.scale * 0.4, height - downDis, 50
                        );

                        lastIndex = i;
                        continue;
                    }
                    if (h[i].time.getMonth() != h[lastIndex].time.getMonth()) {
                        can.fillText(
                            h[i].time.toLocaleString("en-GB", {month: 'long', day: 'numeric'})
                            , toX(i) + x.scale * 0.4, height - downDis, 50
                        );
                        lastIndex = i;
                        continue;
                    }
                    if (h[i].time.getDate() != h[lastIndex].time.getDate()) {
                        can.fillText(
                            h[i].time.toLocaleString("en-GB", {hour: 'numeric', minute: 'numeric', day: 'numeric'})
                            , toX(i) + x.scale * 0.4, height - downDis, 50
                        );
                        lastIndex = i;
                        continue;
                    }
                    if (h[i].time.getHours() != h[lastIndex].time.getHours()) {
                        can.fillText(
                            h[i].time.toLocaleString("en-GB", {hour: 'numeric', minute: 'numeric'})
                            , toX(i) + x.scale * 0.4, height - downDis, 50
                        );
                        lastIndex = i;
                        continue;
                    }
                    if (h[i].time.getMinutes() != h[lastIndex].time.getMinutes()) {
                        can.fillText(
                            h[i].time.toLocaleString("en-GB", {hour: 'numeric', minute: 'numeric'})
                            , toX(i) + x.scale * 0.4, height - downDis, 50
                        );
                        lastIndex = i;
                        continue;
                    }
                }
            }
        }
        //временная шкала
    }
}


export function Draw2dText(text: string, canvas: CanvasContext2D, x: number, y: number, angle: number, alignH: CanvasTextAlign, alignV: "top" | "bottom" | "center" = "top", leftOffset: number, bottomOffset: number, color?: ColorString, font?: string) {
    //let angle = angleDeg * Math.PI / 180;
    canvas.save();
    if (color) canvas.fillStyle = color; //'black';
    if (font) canvas.font = font;
    canvas.translate(x, y);
    canvas.rotate(angle);
    canvas.textAlign = alignH; //'right';

    const rows = text.split("\n");

    const metrics = canvas.measureText(text);

    const rowHeight = metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent + 5;
    //if (metrics.fontBoundingBoxAscent<0 || metrics.fontBoundingBoxDescent<0) throw "!!! "+metrics.fontBoundingBoxAscent+" "+metrics.fontBoundingBoxDescent;

    let offsetUp = metrics.fontBoundingBoxDescent + rowHeight * (rows.length - 1);
    if (alignV == "bottom")
        offsetUp = -(metrics.fontBoundingBoxDescent + metrics.actualBoundingBoxAscent);
    if (alignV == "center")
        offsetUp = -metrics.actualBoundingBoxAscent / 2 + rowHeight * (rows.length - 1) / 2;

    bottomOffset += offsetUp;

    let yOffset = -bottomOffset;

    for (let row of rows) { //for(let i=0; i<rows.length; i++) {
        canvas.fillText(row, leftOffset, yOffset); //-lineHeight / 2);
        yOffset += rowHeight;
    }
    canvas.restore();
}

type tDraw2dIndicator = {
    canvas: CanvasRenderingContext2D,
    indicator: IIndicatorANDBase,
    history: IBars,
    window?: IGraphObjectB,
    tf: TF,
    styleGraph: tStyleAndSettingGraph2,
    win: {x: ICScaleBaseX, y: ICScaleBaseY}
    size: {width: number, height: number}
    TimeToBar: (time: number)=> number

}

type ImageBuffer = HTMLCanvasElement; //ImageBitmap;

export type ImageData = Readonly<{ bmp: ImageBuffer, shiftX: number, shiftY: number }>

export type ImageData2<T> = ImageData & {helper?: T}

class ImageMapEasy<T extends object, Helper=undefined> {
    protected map = new WeakMap<T, [ImageBuffer, number, number , Helper]>();
    protected maxDelta: number;

    constructor(maxDelta: number) {
        this.maxDelta = maxDelta;
    }

    getImage(key: T, x0: number, y0: number): ImageData2<Helper> | null {
        const [bmp, _x, _y, helper] = this.map.get(key) ?? [null, 0, 0 , undefined];
        if (!bmp) return null;
        const shiftX = x0 - _x;
        const shiftY = y0 - _y;
        if (Math.max(Math.abs(shiftX), Math.abs(shiftY)) > this.maxDelta) return null;
        return {bmp, shiftX, shiftY, helper};
    }

    setImage(key: T, bmp: ImageBuffer, x0: number, y0: number, helper:Helper): ImageData2<Helper> | ImageData {
        this.map.set(key, [bmp, x0, y0, helper]);
        return {bmp, shiftX: 0, shiftY: 0, helper}
    }
}

class ImageMap<T extends object> {
    protected  map = new WeakMap<T, [ImageBuffer, number, number ]>();
    protected maxDelta: number;

    constructor(maxDelta: number) {
        this.maxDelta = maxDelta;
    }

    getImage(key: T, x0: number, y0: number): ImageData | null {
        let [bmp, _x, _y] = this.map.get(key) ?? [null, 0, 0];
        if (!bmp) return null;
        let shiftX = x0 - _x;
        let shiftY = y0 - _y;
        if (Math.max(Math.abs(shiftX), Math.abs(shiftY)) > this.maxDelta) return null;
        return {bmp, shiftX, shiftY};
    }
    setImage(key: T, bmp: ImageBuffer, x0: number, y0: number) :ImageData {
        this.map.set(key, [bmp, x0, y0]);
        return {bmp, shiftX: 0, shiftY: 0};
    }
}


export function Draw2dIndicatorBase() {
    type Key = readonly ILine[] | readonly IGraphLabel[] | readonly IBuffer[];
    type KeyByLine2 = IObjects
    type tHelperByLine = number

    let imageMap: ImageMap<readonly ILine[] | readonly IGraphLabel[] | readonly IBuffer[]> //| undefined;
    let imageMap2: ImageMapEasy<IObjects, number> // | undefined
    const indicatorUpdatesMap = new WeakMap<IIndicatorANDBase, number>();
    let visualInfo : {
        scaleX: number;
        scaleY: number;
        x0: number;
        y0: number;
    }


    return {
        base: ({indicator, history, win, size, window, tf, canvas, TimeToBar, styleGraph }: tDraw2dIndicator) => {

            if (!indicator.visible) return;
            if (!window) window = indicator;
            if (!window) return;

            const bars = history
            const {x, y} = win
            const {width, height} = size
            const pmin = x.pixmin - x.scale;
            const corX = x.scale * 0.4;
            const toY = (price: number) => (y.maxprice - price) * y.scale;
            const toX = (ibar: number) => (ibar - x.minBar) * x.scale + pmin + corX;

            if (x.minBar > bars.length) {
                const buf = x.maxBar - x.minBar;
                x.minBar = bars.length - 1;
                x.maxBar = x.minBar + buf;
            }
            const startBar: number = x.minBar > 0 ? x.minBar - 1 : 0;
            const endBar: number = Math.min(x.maxBar < bars.length-1 ? x.maxBar + 1 : x.maxBar, bars.length-1);

            const newVisualInfo = {
                scaleX: x.scale,
                scaleY: y.scale,
                x0: Math.round(toX(0)),
                y0: Math.round(toY(0))
            }

            const oldVisualInfo = visualInfo;
            const needRedraw = !oldVisualInfo || Math.abs(newVisualInfo.scaleX - oldVisualInfo.scaleX) > 1e-10 || Math.abs(newVisualInfo.scaleY - oldVisualInfo.scaleY) > 1e-10;
            const maxDelta = 200;  // макс. дельта буферизации в пикселях с каждой стороны
            //let shiftX= newVisualInfo.x0 - oldVisualInfo?.x0 ??0;
            //let shiftY= newVisualInfo.y0 - oldVisualInfo?.y0 ??0;
            //needRedraw ||= Math.max(Math.abs(shiftX), Math.abs(shiftY)) > maxDelta;

            imageMap ??= new ImageMap<Key>(maxDelta);
            imageMap2 ??= new ImageMapEasy<KeyByLine2, tHelperByLine>(maxDelta);
            const {x0, y0} = newVisualInfo;

            function getImage(key: Key) {
                return imageMap.getImage(key, x0, y0);
            }

            function saveImage(key: Key, bmp: ImageBuffer) {
                return imageMap.setImage(key, bmp, x0, y0,);
            }

            function getImageByLine2(key: KeyByLine2) {
                return imageMap2.getImage(key, x0, y0);
            }

            function saveImageByLine2(key: KeyByLine2, bmp: ImageBuffer, helper: tHelperByLine) {
                return imageMap2.setImage(key, bmp, x0, y0, helper);
            }

            function drawImage(data: ImageData) {
                canvas.drawImage(data.bmp, data.shiftX - maxDelta, data.shiftY - maxDelta);
            }

            // function drawImage2(data: globalThis.ImageData) {
            //     const bmp = data.bmp as unknown as globalThis.ImageData
            //     // canvas.drawImage()
            //     // canvas.drawImage(bmp)
            //     canvas.putImageData(bmp, data.shiftX - maxDelta, data.shiftY - maxDelta)
            //     // canvas.drawImage(bmp, data.shiftX - maxDelta, data.shiftY - maxDelta);
            // }

            function newOffscreenCanvasContext() {
                const data: HTMLCanvasElement = CreateDom.createElement('canvas');
                data.width = width + maxDelta * 2;
                data.height = height + maxDelta * 2;
                return data.getContext("2d")?? (() => {
                        throw "failed to get canvas context!";
                    })();
                //
                // const tt =data.getContext("2d")// data.transferControlToOffscreen()
                //
                // let linesCanvasObj = tt// new COffscreenCanvas.OffscreenCanvas(width + maxDelta * 2, height + maxDelta * 2);// data//
                // return linesCanvasObj.getContext('2d') ?? (() => {
                //     throw "failed to get canvas context!";
                // })();
            }

            function barToX(ibar: number) { return toX(ibar) + maxDelta; }

            function priceToY(price: number) { return toY(price) + maxDelta; }

            function xToX(x :number) { return x + maxDelta; }
            function yToY(y :number) { return y + maxDelta; }

            const rect = {xMin: 0, xMax: width + maxDelta * 2, yMin: 0, yMax: height + maxDelta * 2};


            if (true)
            {
                {
                    const indUpdates = indicator.updatesCount();

                    const buffers = window.iBuffers;
                    let bitmapData0 = getImage(buffers);
                    if (needRedraw || indicator.isCalculating() || indicatorUpdatesMap.get(indicator) != indUpdates || !bitmapData0) {

                        let canvas = newOffscreenCanvasContext();
                        for (const [nbuf, buffer] of buffers?.entries() ?? []) {
                            canvas.lineWidth=1;
                            buffer.Draw(canvas as CanvasContext2D, startBar, endBar, barToX, priceToY, {
                                bars: history,
                                style: styleGraph,
                                win: win
                            });
                        }

                        if (!indicator.isCalculating()) indicatorUpdatesMap.set(indicator, indUpdates);
                        // const tt = canvas.getImageData(0,0,width,height)

                        const buffer = canvas.canvas; //canvas.canvas.transferToImageBitmap();// canvas.getImageData(0,0,width,height);//
                        bitmapData0 = saveImage(buffers ?? [], buffer);

                    }
                    if (bitmapData0) drawImage(bitmapData0);

                    const timer0 = Date.now();

                    const {lines, lines2, labels} = window

                    let bitmapData = getImage(lines);
                    let bitmapDataLine2 = getImageByLine2(lines2);
                    let bitmapData2 = getImage(labels);

                    if (lines2?.length) // отрисовка lines2
                        if (needRedraw || !bitmapDataLine2 || (bitmapDataLine2?.helper ?? 0) != lines2.updatesCounter)//lines!=this.lines)
                        {
                            const canvas = newOffscreenCanvasContext();

                            let drawLinesCount = 0;

                            for (const line of lines2.data ?? []) {
                                const point = line.point.data();
                                if (line.point.length == 1) {
                                    point.push(point[0])
                                }
                                for (let i = 1; i < line.point.length; i++) {

                                    const [startP, endP] = point[i - 1].x < point[i].x ? [point[i - 1], point[i]] : [point[i], point[i - 1]];

                                    const beginBar = TimeToBar(startP.x);
                                    const endBar = TimeToBar(endP.x);

                                    const x1 = barToX(beginBar);
                                    const y1 = priceToY(startP.y);
                                    const x2 = barToX(endBar);
                                    const y2 = priceToY(endP.y);
                                    if ((y1 < rect.yMin && y2 < rect.yMin) ||
                                        (y1 > rect.yMax && y2 > rect.yMax) ||
                                        (x1 < rect.xMin && x2 < rect.xMin) ||
                                        (x1 > rect.xMax && x2 > rect.xMax)
                                    ) continue;

                                    drawLinesCount++;

                                    const color = line.color[0].color;

                                    if (color) {
                                        canvas.strokeStyle = color;
                                        canvas.moveTo(x1, y1);
                                        canvas.lineWidth = line.width ?? 1;
                                        const dash = line.style == "dash" ? [10, 5] : line.style == "dashdot" ? [10, 3, 1, 3] : line.style == "dot" ? [1, 2] : [];
                                        canvas.setLineDash(dash);
                                        canvas.lineTo(x2, y2);
                                        canvas.stroke();
                                        canvas.beginPath();
                                    }
                                    const text = line.text;
                                    if (text == null) continue;
                                    const textColor = line.textColor ?? color;
                                    if (!textColor) continue;
                                    const textAlignH = line.textAlignH ?? "left";
                                    const textPosH = line.textPosH ?? textAlignH;

                                    const textAlignV = line.textAlignV ??
                                        ((textAlignH == "left" && textPosH == "right") || ((textAlignH == "right" && textPosH == "left"))
                                                ? "center" : "top"
                                        );
                                    const [textX, textY] =
                                        (textPosH == "left") ? [x1, y1] :
                                            (textPosH == "right") ? [x2, y2] :
                                                (textPosH == "center") ? [(x2 + x1) / 2, (y1 + y2) / 2] : [null, null];

                                    const angle = Math.atan2(y2 - y1, x2 - x1);  // угол в радианах

                                    let size = line.textSize ?? 9;
                                    if (line.textSizeAuto)
                                        size = Math.round((line.textSizeAuto * x.scale) ** 0.5) || 1

                                    const font = size + "pt sans-serif";
                                    const leftOffset = 0;
                                    const bottomOffset = 0;

                                    if (textX && textY)
                                        Draw2dText(text, canvas, textX, textY, angle, textAlignH, textAlignV, leftOffset, bottomOffset, textColor, font);
                                }

                            }
                            const buffer = canvas.canvas; ////  canvas.canvas.transferToImageBitmap();// canvas.getImageData(0,0,width,height);//  canvas.canvas.transferToImageBitmap();
                            bitmapDataLine2 = saveImageByLine2(lines2 ?? [], buffer, lines2.updatesCounter);
                        }

                    if (bitmapDataLine2) drawImage(bitmapDataLine2);
                    //console.log({x, y});

                    if (lines?.length) // отрисовка lines
                        if (needRedraw || !bitmapData) {
                            const canvas = newOffscreenCanvasContext();

                            let drawLinesCount = 0;

                            for (const line of lines ?? []) {
                                const [startP, endP] = line.begin.x < line.end.x ? [line.begin, line.end] : [line.end, line.begin];
                                let [x1,y1,x2,y2] = [0,0,0,0];
                                if (line.static==true) {
                                    [x1,y1,x2,y2]= [xToX(startP.x), yToY(startP.y), xToX(endP.x), yToY(endP.y)];
                                }
                                else {
                                    const beginBar = TimeToBar(startP.x);
                                    const endBar = TimeToBar(endP.x);

                                    x1 = barToX(beginBar);
                                    y1 = priceToY(line.begin.y);
                                    x2 = barToX(endBar);
                                    y2 = priceToY(line.end.y);
                                }

                                if ((y1 < rect.yMin && y2 < rect.yMin) ||
                                    (y1 > rect.yMax && y2 > rect.yMax) ||
                                    (x1 < rect.xMin && x2 < rect.xMin) ||
                                    (x1 > rect.xMax && x2 > rect.xMax)
                                ) continue;

                                drawLinesCount++;

                                const color = line.color;

                                if (color) {
                                    canvas.strokeStyle = color;
                                    canvas.moveTo(x1, y1);
                                    canvas.lineWidth = line.width ?? 1;
                                    const dash = line.style == "dash" ? [10, 5] : line.style == "dashdot" ? [10, 3, 1, 3] : line.style == "dot" ? [1, 2] : [];
                                    canvas.setLineDash(dash);
                                    canvas.lineTo(x2, y2);
                                    canvas.stroke();
                                    canvas.beginPath();
                                }
                                const text = line.text;
                                if (text == null) continue;
                                const textColor = line.textColor ?? color;
                                if (!textColor) continue;
                                const textAlignH = line.textAlignH ?? "left";
                                const textPosH = line.textPosH ?? textAlignH;
                                const textAlignV = line.textAlignV ??
                                    ((textAlignH == "left" && textPosH == "right") || ((textAlignH == "right" && textPosH == "left"))
                                            ? "center" : "top"
                                    );
                                const [textX, textY] =
                                    (textPosH == "left") ? [x1, y1] :
                                        (textPosH == "right") ? [x2, y2] :
                                            (textPosH == "center") ? [(x2 + x1) / 2, (y1 + y2) / 2] : [null, null];

                                const angle = Math.atan2(y2 - y1, x2 - x1);  // угол в радианах

                                const font = "9pt sans-serif";
                                const leftOffset = 0;
                                const bottomOffset = 0;

                                if (textX && textY) Draw2dText(text, canvas, textX, textY, angle, textAlignH, textAlignV, leftOffset, bottomOffset, textColor, font);
                            }
                            const buffer = canvas.canvas; // canvas.canvas.transferToImageBitmap();//  canvas.getImageData(0,0,width,height); //canvas.canvas.transferToImageBitmap();
                            bitmapData = saveImage(lines ?? [], buffer);
                        }

                    if (bitmapData) drawImage(bitmapData);
                    if (0)
                        if (lines.length > 0)
                            console.log("Затрачено на отрисовку линий:", Date.now() - timer0, "мс");

                    if (labels?.length) // отрисовка labels
                        if (needRedraw || !bitmapData2) {
                            const canvas = newOffscreenCanvasContext();
                            canvas.lineWidth = 1;
                            canvas.setLineDash([]);

                            const barsDelta = Math.round(maxDelta / x.scale + 1);
                            const bufferStartBar = Math.max(startBar - barsDelta, 0);

                            const tStart = bars.time(bufferStartBar).getTime();
                            const tEnd = (bars.time(endBar).getTime() + (x.pixmax / x.scale + barsDelta) * tf.valueOf());

                            for (const label of labels ?? []) {
                                const point = label.point;
                                if (point.x >= tStart && point.x <= tEnd) {
                                    label.Draw(TimeToBar, barToX, priceToY, canvas as CanvasContext2D, x.scale);
                                }
                            }
                            const buffer = canvas.canvas; // canvas.canvas.transferToImageBitmap();//  canvas.getImageData(0,0,width,height);// canvas.canvas.transferToImageBitmap();
                            bitmapData2 = saveImage(labels ?? [], buffer);
                            Object.freeze(labels);
                        }

                    if (bitmapData2) drawImage(bitmapData2);
                }
            }
        }
    }
}
