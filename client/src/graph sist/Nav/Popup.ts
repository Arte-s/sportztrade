/// <reference lib="dom"/>


//import "./popup.css";

function addCSS(s :string) { document.head.appendChild(document.createElement("style")).innerHTML= s; }



addCSS(`
    /* Popup container - can be anything you want */
.popup {
    position: relative;
    display: inline-block;
    cursor: pointer;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
}

/* The actual popup */
.popup .popuptext {
    visibility: hidden;
    width: 160px;
    background-color: #555;
    color: #fff;
    text-align: center;
    border-radius: 6px;
    padding: 8px 0;
    position: absolute;
    z-index: 1;
    top: 125%;
    left: 50%;
    /*margin-left: -80px;*/
}

/*!* Popup arrow *!*/
/*.popup .popuptext::after {*/
/*    content: "";*/
/*    position: absolute;*/
/*    top: 100%;*/
/*    left: 50%;*/
/*    margin-left: -5px;*/
/*    border-width: 5px;*/
/*    border-style: solid;*/
/*    border-color: #555 transparent transparent transparent;*/
/*}*/

/* Toggle this class - hide and show the popup */
.popup .show {
    visibility: visible;
    -webkit-animation: fadeIn 1s;
    animation: fadeIn 1s;
}

/* Add animation (fade in the popup) */
@-webkit-keyframes fadeIn {
    from {opacity: 0;}
    to {opacity: 1;}
}

@keyframes fadeIn {
    from {opacity: 0;}
    to {opacity:1 ;}
}
`);


//import {MouseEvent} from "react";

type MyPopupElement =
    HTMLElement
    & { hideOnClickOutside?: boolean; ignoreClickElement?: HTMLElement; event?: MouseEvent }

export function removePopupMessage(popupElement?: HTMLElement) {
    (popupElement ?? currentPopup())?.parentElement!.parentElement!.remove();
} //$(".popup")?.remove(); }


export function showPopupMessage(element: HTMLElement | null, text: string, timeout_ms: number = 0, hideOnClickOutside = true, hideOnClickElement = true) {
    removePopupMessage();
    let span = document.createElement('span') as HTMLSpanElement;
    span.classList.add("popupParent");
    let e: MouseEvent | undefined = window.event as MouseEvent | undefined; // делаем принудительный кастинг, т.к. это событие ужа официально не поддерживается (устарело)
    if (!element) {
        let posX = e?.pageX ?? 0;
        let posY = e?.pageY ?? 0;
        element = document.body;
        span.style.left = posX + "px";
        span.style.top = posY + "px";
        span.style.position = "absolute";
        //console.log(posX, posY)
    }
    span.innerHTML = '<div class="popup" style="top:3pt;"><div class="popuptext" id="myPopup" style="width:max-content;margin-left:-20pt;padding:5px">' + text + '</div></div>';
    element.appendChild(span); //'<div className="popuptext" id="myPopup">A Simple Popup!</div>');
    let myPopup = $("#myPopup")[0] as MyPopupElement;
    myPopup.classList.toggle("show");
    if (timeout_ms) setTimeout(() => removePopupMessage(myPopup), timeout_ms);
    myPopup.hideOnClickOutside = hideOnClickOutside;
    myPopup.ignoreClickElement = hideOnClickElement ? undefined : element;
    myPopup.event = e;
    return myPopup;
}

export function currentPopup() {
    return $("#myPopup")?.get(0) as Readonly<MyPopupElement>;
}



document.addEventListener("onclick", (e)=>{
    let popup= currentPopup();
    //console.log(popup.event==window.event
    if (popup && e.target!=popup && popup.hideOnClickOutside && e.target!=popup.ignoreClickElement && popup.event != e)
        removePopupMessage();
});