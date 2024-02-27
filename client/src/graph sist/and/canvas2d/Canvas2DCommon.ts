
type tDistance2D = {
    line: {x1:number, y1:number, x2:number, y2:number},
    point: {x:number, y:number},
}
export function DistancePointToLine2D({point:{y,x}, line:{y1,y2,x2,x1}}: tDistance2D) {
    // const {point:{y,x}, line:{y1,y2,x2,x1}} = data
    return Math.abs((y2-y1)*x - (x2-x1)*y + x2*y1 - y2*x1)/Math.cbrt((y2-y1)**2 + (x2-x1)**2)
}

// Попадает ли точка рядом с отрезком с учетом delta-ы. Если да то вернет расстояние, если нет, то вернет -1
export function DistancePointToLine2DBoolean(data: tDistance2D & {delta: number}){
    let {point:{y,x}, line:{y1,y2,x2,x1}, delta} = data;
    [y1,y2] = y1>y2?[y2,y1]:[y1,y2];
    [x1,x2] = x1>x2?[x2,x1]:[x1,x2];
    if (y2 > y + delta
        || y1 < y - delta
        || x2 > x + delta
        || x1 < x - delta //|| isNaN(y2) || isNaN(y1) || isNaN(x2) || isNaN(x1) || !y2 || !y1 || !x2 || !x1
    ) return -1
    const buf = DistancePointToLine2D(data)
    return buf>delta ? -1 : buf
}

// поиск максимального значения и минимального среди массива массивов
export function SearchMaxMinByArray(arrays: number[][]) {
    let max: number | undefined, min: number | undefined
    for (const array of arrays) {
        if (!array?.length) continue
        const [newMax, newMin] = [Math.max(...array), Math.min(...array)]
        if (!max || max < newMax) max = newMax
        if (!min || min > newMin) min = newMin
    }
    [max, min] = [max ?? 1, min ?? 0]
    return {max, min}
}
