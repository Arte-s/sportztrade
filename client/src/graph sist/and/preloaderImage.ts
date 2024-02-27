import {sleepAsync} from "../Nav/Common"

export function ShowPreloaderImageOld(destination: HTMLElement) {
    const html = '<img class="preloaderIcon" src="preloader_1495_256x256.gif" width="128" height="128" style="z-index: 999; left: 50%; margin-left:-64px; margin-top:64px; position: absolute" alt="running">';
    const el: HTMLDivElement = document.createElement("div");
    //el.style.marginLeft="auto";
    el.innerHTML = html;
    destination.insertBefore(el, destination.firstChild);
    $(el).show();
    return el;
}

type PreloaderImageElement = HTMLElement & { readonly textElement?: HTMLParagraphElement, setText?(txt :string, txt2? :string) : void };


export function createPreloaderImage1(destination: HTMLElement) : PreloaderImageElement {
    const html =
        `<div style="left: 50%;  top:30%; position: absolute;  transform: translateX(-50%) translateY(-50%);  z-index: 999;  pointer-events: none">
            <img class="preloaderIcon" src="preloader_1495_256x256.gif" width="192" style="" alt="running">
            <p style="position: absolute; top: 50%; transform: translateY(-50%); color: white; vertical-align: middle; margin: 0; text-align: center; width: 100%; font-size:24px; user-select: none">
            </p>
        </div>`;
    const div: HTMLDivElement = document.createElement("div");
    //el.style.marginLeft="auto";
    div.innerHTML= html;
    const el= div.firstChild as HTMLDivElement;
    destination.insertBefore(el, destination.firstChild);
    const textEl= el.getElementsByTagName("p")[0];
    return Object.assign(el, { textElement: textEl });
}


export function createPreloaderImage2(destination: HTMLElement, styles?: {width?: number, bottomOffset?: number, opacity?: number|string}) : PreloaderImageElement {
    let {width=300, bottomOffset=0, opacity="30%"} = styles ?? {};
    const child = (i :number)=>
                `<img class="preloaderIcon" src="preloader_1495_256x256.gif" width="${width/2}" style="opacity: 70%; transform: scaleX(${i==1 ?1:-1})" alt="running">
                 <p style="position: absolute; top: 50%; transform: translateY(-50%); color: lime; vertical-align: middle; margin: 0; text-align: center; width: 100%; font-size:${width/10}px; user-select: none">
                 </p>`;
    const html =  //{transition: 1s ease-in-out">}
        `<div style="left: 50%;  bottom: ${bottomOffset};  position: absolute;  transform: translateX(-50%);  z-index: 999;  pointer-events: none;">
            <img class="preloaderIcon" src="duck_face.png" width="${width}" style="opacity: ${opacity}" alt="running">
            <div style="position:absolute; left:27%; top:53%; transform: translateX(-50%) translateY(-50%)">
                ${child(1)}
            </div>
            <div style="position:absolute; right:-25%; top:53%; transform: translateX(-50%) translateY(-50%)">
                ${child(2)}
            </div>
        </div>`;
    const div: HTMLDivElement = document.createElement("div");
    //el.style.marginLeft="auto";
    div.innerHTML= html;
    const el= div.firstChild as HTMLDivElement;
    destination.insertBefore(el, destination.firstChild);
    const textEl1= el.getElementsByTagName("div")[0].getElementsByTagName("p")[0];
    const textEl2= el.getElementsByTagName("div")[1].getElementsByTagName("p")[0];
    let t= Date.now();
    function onSetText(txt :string) {
        // let val= Number.parseFloat(txt);  /*if (! isNaN(val))*/
        // if (Date.now()-t>2000) {
        //     t=Date.now()*2;  //$(el).animate({transform:'scale(2)'}, 1000);}
        //     (el.firstChild as HTMLImageElement).style.transform= "scale(2)";
        // }
    } //(el.firstChild as HTMLImageElement).style.width= (width * 2)+"px";}}// * (1+val/100))}}
    return Object.assign(el, {
        textElement: textEl1,
        setText :(txt :string, txt2? :string)=> { textEl1.innerText= txt;  textEl2.innerText= txt2 ?? txt; }//onSetText(textEl1.innerText= textEl2.innerText= txt) }
    });
}


function showPreloaderImage(el :PreloaderImageElement) {
    //let el= createPreloaderImage(destination);
    const textEl= el.textElement;
    let _ftext :(()=>string)|undefined;
    let _ftext2 :(()=>string|undefined)|undefined;
    let _task : Promise<unknown>|undefined;
    const setText= el.setText ?? (textEl ? (text)=>textEl.innerText= text : undefined);
    async function _showText(ftext :()=>string, ftext2? :()=> string|undefined) {
        if (!setText) return;
        _ftext= ftext;
        _ftext2= ftext2;
        if (_task) return;
        setText(ftext(), ftext2?.());
        await (_task= sleepAsync(50));
        _task= undefined;
        if (_ftext != ftext || _ftext2 != ftext2) await _showText(_ftext, _ftext2);
    }
    async function showText(text :string, text2? :string|undefined) {
        return _showText(()=>text, ()=>text2);
    }
    function durationToString(ms :number) { return Math.floor(ms/1000/60%60)+":"+String(100 + ms/1000%60).slice(1,3); }
    function showProgress(percent :number|string, elapsed_ms? :number) {
        _showText(()=> (typeof percent=="number" ? percent.toFixed(0) : percent) + "%", elapsed_ms ? ()=>durationToString(elapsed_ms) : undefined);
    }

    $(el).show("slow");
    return Object.assign(el, {
        setText(text :string, text2?: string) { showText(text, text2); },
        setProgressState(data :{percent :number|string, elapsed_ms? :number}) { showProgress(data.percent, data.elapsed_ms); },
        show: ()=>$(el).show("slow"),
        hide: ()=>$(el).hide("slow")
    } as const);
}

export type PreloaderImage = ReturnType<typeof showPreloaderImage>;


export function ShowPreloaderImage1(destination: HTMLElement) {
    return showPreloaderImage(createPreloaderImage1(destination));
}

export function ShowPreloaderImage2(destination: HTMLElement, styles?: {width?: number, bottomOffset?: number, opacity?: number|string}) {
    return showPreloaderImage(createPreloaderImage2(destination, styles));
}

export const ShowPreloaderImage = ShowPreloaderImage2;








