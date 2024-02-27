

export function divCreatEasy(par:HTMLElement,tagName:string, nameClass?:string){
    const buf=document.createElement(tagName);
    if (nameClass) buf.classList.add(nameClass);
    par.appendChild(buf);
    return buf;
}

export function divCreatEl(tagName:string, h?:string,w?:string,y?:string,x?:string){
    const buf=document.createElement(tagName);
    if (!w) buf.style.width='100%'; else buf.style.width=w;
    if (!h) buf.style.height='100%'; else buf.style.height=h;
    if (x)  buf.style.left=x;
    if (y)  buf.style.top=y;
    return buf;
}
