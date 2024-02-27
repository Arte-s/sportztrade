//
// import {IBars,CBar, TF} from "../Nav/Bars"
// import {CIndiBase, IBuffer} from '../and/const';
// import {CBuffPrice,CIndicatorOld} from '../and/const';
// import {CParams, GetSimpleParams, IParams, ReadonlyFull, SimpleParams} from "../and/CParams";
// import {tAlert, tAlertMini, tOnBars, tOnInit} from "../API";
// import {CIndiBaseDis, CServiceBase} from "../../and/const";
// import {CRBaseMapAll2} from "../../and/histiry base";
// import {CSymbolData} from "../../and/Symbol";
//
//
// class CParams2Ma extends CParams {
//     fast =  { value: 25, range: { min:0, max:200, step:1 } };
//     slow =  { value: 50, range: { min:0, max:300, step:1 } };
// }
//
//
// export class ServiceMa extends CServiceBase {
//     readonly display: CIndiBaseDis;
//     readonly name: "ServiceMa";
//     exchange:string = "Binance Spot";
//     symbols:CSymbolData[];
//     binance: CRBaseMapAll2;
//     indicator=new IndicatorIMA(SimpleParams(new CParams2Ma))
//
//     OnInit(historyAll: CRBaseMapAll2): void {
//         historyAll.getKeys(); //получить все биржи - все ключи
//         this.binance=historyAll.get(this.exchange);
//         const symbols = this.binance.getKeys()
//         for (let [name, element] of this.binance) {
//
//             //element - имеет много всяких нужных мтеодов, где можно просто подгрузить историю
//             // также имеет много вских лишних
//             const historyEl= element.loadHistory(0,TF.H4,1000); //key не используетья , возвращает промис
//
//
//             //CSymbolData - удобная обертка для подключения к истории,
//             // из плюсов нету ненужным методов,
//             // из минуса, по умолчаниб подписывает себе тики... чтобы удалить класс или отписаться надо вызвать Delete
//             const data=(new CSymbolData(element.getSymbolDate()));
//             data.Delete(); // отписаться от сиобытия тики
//
//             data.SetCallbackHistory();/// и т.п. CSymbolData.SetCallbackHistory(     callback: (history: IBars, type: tLoadBar) => void):    CSymbolData
//             data.tf=TF.M30;
//             data.loadHistory(10000); // загрузить 10000 баров
//             this.symbols.push(data);
//         }
//
//     }
// }
//
//
//
// export class IndicatorIMA extends CIndiBase
// {
//     // readonly name=name;//это внутрение имя которое будет отображаться в выборе индикатора в окне
//     name: string;
//     readonly param: SimpleParams<IParams>;
//     static paramInfo : ReadonlyFull<CParams2Ma> = new CParams2Ma();
//     static readonly Name="2MA v 1.00";
//
//     protected paramNew : SimpleParams<CParams2Ma>|null;
//     get Name() { return IndicatorIMA.Name };//это внутрение имя которое будет отображаться в выборе индикатора в окне
//
//     indiMa= new CBuffPrice;//для сбора буферных масивов
//     indiMaFast= new CBuffPrice;//для сбора буферных масивов
//     cma:CMABase;
//     cmaFast:CMABase;
//
//     constructor(params: SimpleParams<CParams2Ma>) {
//         super();
//         this.paramNew=params?{...params}:GetSimpleParams(IndicatorIMA.paramInfo);
//
//         this.cma=new CMABase(this.paramNew.fast);
//         this.cmaFast=new CMABase(this.paramNew.slow);
//         this.display.displayGeneral= true;
//         this._buffers[0]=this.indiMa;// мы собираем ве наши индивары в один масив чтобы отправить
//         this._buffers[1]=this.indiMaFast;// мы собираем ве наши индивары в один масив чтобы отправить
//     }
//
//
//     alert: (data: tAlertMini) => void;
//     OnInit({allBars, getLoadHistory, alert}: tOnInit) {
//         this.alert=alert;
//
//         this.alert({alarm: "проверка", signal: "проверка", text: "проверка"})
//     }
//
//
//
//     async OnBars({newBarIndex, allBars, newBars}: tOnBars, isStopped: () => Promise<boolean>): Promise<void> {
//         this.alert({alarm: "проверка", signal: "проверка", text: "проверка"})
//
//         let i=newBarIndex;
//         for (let k=i; k<allBars.length; k++) {
//             this.indiMa.price[k]= this.cma.MA(allBars,i)??allBars[k].open;
//             this.indiMaFast.price[k]= this.cmaFast.MA(allBars,k)??allBars[k].open;
//             if (k>0){
//                 if (this.indiMa.price[k-1]>this.indiMa.price[k]) this.indiMa.color[k]='#fefdff';
//                 else this.indiMa.color[k]='#ffd204';
//                 if (this.indiMaFast.price[k-1]>this.indiMaFast.price[k]) this.indiMaFast.color[k]='#75ffa2';
//                 else this.indiMaFast.color[k]="rgb(255,165,0)";//'#6779ff';
//             }
//             i++;
//         }
//         if (this.indiMa.price[i-1] && this.indiMaFast.price[i-1]) this.alert({alarm: "", signal: this.indiMaFast.price[i-1]>this.indiMa.price[i-1]?"signal Buy":"signal Sell", text: ""})
//         return Promise.resolve(undefined);
//     }
//
//     //
//     // OnCalculate(prev_calculated: number, bars: IBars, tick_volume: number, volume: number, spread: number): number {//вызываеться таже open, close, height, low, barnow, total
//     //     let rates_total= bars.length;
//     //     for (let i=prev_calculated; i<rates_total; i++){
//     //         this.indiMa.price[i]= this.cma.MA(bars,i);
//     //         this.indiMaFast.price[i]= this.cmaFast.MA(bars,i);
//     //         if (this.indiMa.price[i]==undefined) this.indiMa.price[i]= bars.open(i);
//     //         if (i>0){
//     //             if (this.indiMa.price[i-1]>this.indiMa.price[i]) this.indiMa.color[i]='#fefdff';
//     //             else this.indiMa.color[i]='#ffd204';
//     //             if (this.indiMaFast.price[i-1]>this.indiMaFast.price[i]) this.indiMaFast.color[i]='#75ffa2';
//     //             else this.indiMaFast.color[i]="rgb(255,165,0)";//'#6779ff';
//     //         }
//     //     }
//     //     return rates_total;
//     // }
//
// }  //Облость видимости - тут должны находить такие элементы как Инит Эвент ОнСтрат и прочее в этих кавычках
//
// export class CMABase {
//     //arr;//это ссылка на масив с ценами открытия или закрытия.....незнаю зачем
//     readonly period : number;
//     _lastnbar:number|undefined;
//     _lastprice : number;
//     private buf:number=0;//последнее значение
//     get lastnbar():number|undefined { return this._lastnbar; }
//     get lastprice():number { return this._lastprice; }
//
//     constructor(period : number)   { this.period=period;  this.Reset(); } //{this.Init(period);}
//     Reset()                        { this._lastnbar=undefined;  this._lastprice=undefined;  this.buf=0;   }
//     //Init(period?)           {;}
//     MA(bars: IBars, nbar: number,to=(b:CBar)=>{if (!b || !b.close) {console.error(b)} return b?.close;}):number|undefined{
//         let poz= nbar;
//         let lastnbar=this.lastnbar;
//         if (lastnbar==undefined && poz>=this.period){
//             this.buf=0;
//             for (lastnbar=0; lastnbar<=this.period; lastnbar++) {this.buf+=to(bars[lastnbar]);}
//             this.buf/=(lastnbar);
//         }
//         if (lastnbar!=undefined && lastnbar>=this.period && poz>=this.period){
//             if (lastnbar==poz) {this.buf+=(lastnbar-to(bars[lastnbar]))/this.period; lastnbar=to(bars[lastnbar]); return this.buf;}
//             while (++lastnbar<=poz) {this.buf+=(to(bars[lastnbar])-to(bars[lastnbar-this.period]))/this.period;}
//             this._lastnbar=poz;
//             return this.buf;
//         }
//         return  undefined;
//     }
// }
// //Назначаем функции на вызов, типо подписки на событие (Важно)
