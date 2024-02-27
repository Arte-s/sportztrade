

/*
* Зарезервированые имена мной
*
* cwin  - собержит в себе информацию о мышке и окне (позцияи по времени по бару номер и размер баров с леваокна и справа)
*
* indi[] - содержит в себе подписки на список индикатоов, в нем же храняться все сылки на буферы... кстати легко реализовать работу в тиле iCustom(indi)
*
* generalbase - так наван запускаемый клас... название глабоальное чтобы получить подписки на события мышки прочее туц
*
* timenow - клас для текущего времени
*
* timeconvert - клас для текущего ковертирования
*
* ну ибольше всего глобальны переменных в этом класе
* */
 export const timeoptions:any  = { //станларт вывода даты
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    month: 'numeric',//'long',
    day: 'numeric',
};



let darkdisig = {//темная тема
    backgraound:'#1d262c',          //фон

    barup:'#4985e7',                //бар вверз
    bardown:'#ef5350',              //бар вниз
    textbigconsol:'#ffd800',        //большая консоль /окно данных ввв
    mousetargetON:'#ffd800',         //крестик мыши
 //   funmousecon:(f:any)=>f.element.style.cursor = "none", //"crosshair", //вид курсора

    watersymbol:'rgba(85,109,122,0.2)',        //водяной знак
    mousetargetOFF:'#384850',        //крестик мыши п
    textminiconsol:'#384850',        //мини консоль
  //  funmousemin:(f:any)=>f.element.style.cursor = "none" //вид курсора
};

let lightdisig = {//светлая тема - Редактируй
    backgraound:'#16131c',          //фон

    watersymbol:'rgba(85,109,122,0.2)',        //водяной знак
    barup:'#000000',                //бар вверз
    bardown:'#ef6e00',              //бар вниз
    textbigconsol:'#ff7100',        //большая консоль /окно данных
    mousetargetON:'#ff7100',         //крестик мыши
  //  funmousecon:(f:any)=>f.element.style.cursor = "none", //"crosshair", //вид курсора

    mousetargetOFF:'#384850',        //крестик мыши п
    textminiconsol:'#384850',        //мини консоль
  //  funmousemin:(f:any)=>f.element.style.cursor = "none" //вид курсора
};

export let disignnowT=darkdisig;//darkdisig;//lightdisig; //текущий дизайн



