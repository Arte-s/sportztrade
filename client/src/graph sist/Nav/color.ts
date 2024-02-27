declare type Nominal<T, Name extends string> = T & { [Symbol.species]: Name; }

// // Создаём числовой тип Index
// type Index = Nominal<number, 'Index'>;
//
// let index : Index;
//
// index= 42; // Ошибка
//
// index = 42 as Index;  // OK


export type ColorNumber = Nominal<number, 'Color'>;

type HEXSymbol = "0"|"1"|"2"|"3"|"4"|"5"|"6"|"7"|"8"|"9"|"A"|"B"|"C"|"D"|"E"|"F";

type HEXPair= `${HEXSymbol}${HEXSymbol}`;

//type HXX= `#${HEXPair}${HEXPair}${HEXPair}`;

//export type ColorString = Nominal<string, 'ColorString'>;
//type RgbString= `rgb(${number},${number},${number})` | `rgba(${number},${number},${number},${number})`;
//type HexString = `#${HEXSymbol}${HEXSymbol}${HEXSymbol}${HEXSymbol}${HEXSymbol}${HEXSymbol}`;

export type ColorString = `rgb(${number},${number},${number})` | `rgba(${number},${number},${number},${number})`; // | ;

export type ColorRGB = Readonly<{ red :number;  green :number;  blue :number; }>;

export type ColorRGBA = Readonly<{ red :number;  green :number;  blue :number;  alpha :number }>;

export type ColorAny = ColorNumber | ColorString | Readonly<ColorRGBA>;

export type Color = ColorString;

export function rgb(red :number, green :number, blue :number) : ColorString { return `rgb(${red},${green},${blue})`; } // Генератор цветов


export function* colorGenerator(): Generator<[number, number, number]> {
    for (let step=127; step>=1; step/=2) {
        let v=254/step;
        for (let rStep=0, r=0; rStep<=v; rStep++, r+=step)
            for (let gStep=0, g=0; gStep<=v; gStep++, g+=step)
                for (let bStep=0, b=0; bStep<=v; bStep++, b+=step) {
                    if (r%(step*2)==0 && g%(step*2)==0 && b%(step*2)==0)
                        continue;
                    yield [Math.round(r), Math.round(g), Math.round(b)]
                }
    }
    yield [-1, -1, -1];
}


//светлость оттенков
export function colorGeneratorByCount(value=180, count=100, index=1) : ColorString {
    const step = Math.floor(value * 6 * index / count)
    const p = Math.floor(step / value)
    const z = Math.floor(step % value)
    const r = (p==0 || p==5) ? value : (p==1) ? value-z : (p==4) ? z : 0
    const g = (p==1 || p==2) ? value : (p==3) ? value-z : (p==0) ? z : 0
    const b = (p==3 || p==4) ? value : (p==5) ? value-z : (p==2) ? z : 0
    return `rgb(${r},${g},${b})`;
}

export function colorStringToRGBA(str :ColorString) : [number,number,number,number];
export function colorStringToRGBA(str :string) : [number,number,number,number]|undefined;

export function colorStringToRGBA(str :string) : [number,number,number,number]|undefined {
	let arr = str.match(/^rgb?[\s+]?\([\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?/i);
	//let a= rgb.match(/^rgba?[\s+]?\([\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?/i);
	if (!arr || arr[1]==null) arr= str.match(/^rgba?[\s+]?\([\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?/i);
	const nums : (number|null)[]= arr?.slice(1).map((str)=>(str!=null ? parseInt(str) : null)) ?? [];
    let [r, g, b, a]= nums;
    if (r==null || g==null || b==null) return undefined;
	a ??= 1;  // alpha
	return [r, g, b, a];
}

export function toColorString(str :string) { if (colorStringToRGBA(str)) return str as ColorString;  throw `the string '${str}' is not valid 'rgb' or 'rgba' string`; }

// Проверяет цвета на схожесть по заданной максимальной дельте
export function isSimilarColors(color1 :ColorString|readonly[number,number,number], color2 :ColorString|readonly[number,number,number], maxDelta = 32) {
	let [r1, g1, b1] = typeof color1=="string" ? colorStringToRGBA(color1) : color1;
	let [r2, g2, b2] = typeof color2=="string" ? colorStringToRGBA(color2) : color2;
	let delta = Math.max(r1-r2) + Math.max(g1-g2) + Math.max(b1-b2);
	return delta <= maxDelta;
}

