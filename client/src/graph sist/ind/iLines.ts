import {CBuffColorBars, CIndiBase, ColorString, tOnInitIndicator, tOnTick, tOnBarIndicator} from '../and/const';
import {CParams, ReadonlyFull, SimpleParams} from "../and/CParams";
import {IBars, TF} from "../Nav/Bars"


class CParamsLines extends CParams {
    fast =  { value: 25, range: { min:0, max:200, step:1 } };
}


export class IndicatorLines extends CIndiBase<typeof IndicatorLines>
{
    static paramInfo : ReadonlyFull<CParamsLines> = new CParamsLines();
    static readonly Name="Lines";
    static readonly Version="1.00";

    colorsBars = new CBuffColorBars

    constructor(params: SimpleParams<CParamsLines>) {
        super();
        this._buffers.push(this.colorsBars)
       // this.windows.push(new CIndicatorObject(new CBuffPrice,new CBuffPrice))
    }

    point=0;
    tickSize=0;

    override OnInit({symbol, symbols, loadHistory, alert}: tOnInitIndicator) {
        this.point = symbol.info?.minPrice ?? (()=>{throw "minPrice is not defined"})();
        this.tickSize = symbol.info?.tickSize ?? (()=>{throw "tickSize is not defined"})();
        alert({alarm: "проверка", signal: "проверка", text: "проверка"});


        let address = symbol.getAddress();
        console.log(address);
        let allEx = symbols.addByAddress([]).getKeys()
        console.log(allEx);

        symbols.addByAddress(["Binance Futures"]).getKeys()
        if (0) {
            // примеры как просто единоразово получить историю
            //let bars = symbol.history.Bars(TF.H4) // для текущего символа
            // возвращает адрес символа, к примеру текущий адрес на битке будет ['binance','BTCUSDT'] там также может быть поле фьючей и прочее
            let address = symbol.getAddress();
            let exchangeAddress= address.slice(0, -2); // адрес биржи
            // получить историю по другому символу с этой же биржи, к примеру по ETHUSDT символ который нам нужен TF.H4 какой нужен таймфрейм, вообще через поле адрес можно подключиться к другой бирже
            let keySymbol = symbols.addByAddress([...exchangeAddress,"Binance Spot", "ETHUSDT"])
            let keySymbol2 = symbols.addByAddress([...exchangeAddress,"Binance Futures", "ETHUSDT"])
            // let keySymbol = symbols.addByAddress([...exchangeAddress,"Binance", "ETHUSDT"])


            let barsOther = keySymbol.history.Bars(TF.H4)  // получаем наши бары


            // // список доступных бирж
            let exchanges = symbols.getKeys()
            console.log({exchanges});
            //список доступных символов на бирже 'Binance'
            let symbolsNames = symbols.add('Binance Spot').getKeys()
            console.log({symbolsNames});
            //можно закачать историю до определённой даты, или по количеству баров
            keySymbol.LoadHistoryForEvent(TF.H4, 10000); // закачает 10000 баров по H4
            keySymbol.LoadHistoryForEvent(TF.D1, new Date('2021-01-01')); // закачает c 2021-01-01
            // keySymbol - также можно установить адрес любой истории
            keySymbol= symbols.addByAddress([...exchangeAddress,"BTCUSDT"])
            console.log({keySymbol});
        }
        //
        // //более правильно подписываться через класс CSymbolData, тут мы также должны указать символ и поставить наши колбэки
        // // создаем колбэки для нашей новой подписки их правильнее будет создовать во вне этого класса
        // const callback:tSymbolCallback2 = {
        //     onSetSymbolData:data => {}, // при изменении символа
        //     onBar:data => {}, // при приходе нового бара
        //     onTick:data => {},
        //     onHistory: history => {} // вызывается при закачке новой истории
        // }
        //
        // let fallows = new CSymbolData(keySymbol.getSymbolDate(), callback);
        // // в дальнейшем мы можем изменить адрес символа или таймфрейм или загрузить историю
        // fallows.tf=TF.D1 //
        // fallows.symbol="ETHUSDT"
        // fallows.loadHistoryAbs(new Date('2021-01-01')) //немного другой формат т.к. таймерам считается уже установлен
        //
        //
        // if (countDopWin==0) {
        //     countDopWin++
        //
        //     // можно сделать полноценный запуск индикатора, или множества индикаторов, запуск будет считаться фоновым
        //     // // по факту бокс это минимальный интерфейс для запуска индикаторо с собственной подпиской на символ
        //     // // закладки на основном экране это тот же самый бок по этому есть возможность добавить свой внутрей бокс туда как закладку
        //     //
        //     // box.InitSymbol(keySymbol.getSymbolDate())
        //     // box.indicators!.add( createIndicatorPrototype( Indicator(IndicatorIMA)))
        //     // // доступ к буферу
        //     // let buf1 = box.indicators?.indicators[0].iBuffers[0]
        //     // console.log({buf1});
        //     // // также есть возможность менять тф и прочее
        //     // box.symbolData!.tf=TF.H4
        //     // Sessions.boxArray.add(box) // создать вкладку на экране с нашим box
        //     // надо контролировать количество запусков, а то при каждом обновлении параметров вызывается OnInit
        // }
        //
        //
        // //поскольку бокс состоит из множества колбэков по истории - его надо удалять явно
        // // box.Delete();
        // // box может скопировать свои внутренность всех индикаторов к примеру, для того чтобы перенести их на основной экран
        // //box.Export()
        //

        // let win=this.windows[0];
        // const [b0,b1]=[win.iBuffers[0] as CBuffPrice,win.iBuffers[1] as CBuffPrice]
        // b0.price.push(...allBars.closes)
    }

    private draw(allBars :IBars) {
        {
            let tt = 0
            let tStep = 10;
            let left = Math.round(250 / tStep)
            for (let r = 10; r <= 250; r += tStep) {
                tt++;
                this.colorsBars.setColor(allBars.length - left *1 - tt, `rgb(${r},0,0)`)
                this.colorsBars.setColor(allBars.length - left *2 - tt, `rgb(0,${r},0)`)
                this.colorsBars.setColor(allBars.length - left *3 - tt, `rgb(0,0,${r})`)

                this.colorsBars.setColor(allBars.length - left *4 - tt, `rgb(${r},250,0)`)
                this.colorsBars.setColor(allBars.length - left *5 - tt, `rgb(250,${r},0)`)
                this.colorsBars.setColor(allBars.length - left *6 - tt, `rgb(250,0,${r})`)
            }
        }

        this.lines2.push({
            color: [{color:"#12ff04" as  ColorString}], point: [{x:Date.now()-1000*60*60, y: allBars.last?.close??65000},{x:Date.now(), y: allBars.last?.close??60000}], static: false, type: "line"
        })

        let greenLine = this.lines2[this.lines2.length-1]

        //Способы редактирвоания
        //теперь линия явлеться не отрезком а ломаной и может содержать в себе любое количство точек
        //добавить точку в ломаную линию
        const step = allBars.Tf.valueOf()
        const lastX = (allBars.last?.time.valueOf()??Date.now())
        const price = allBars.last?.close??60000;

        this.lines2[0].point.add({x:Date.now()-step*14, y: allBars.last?.close??60000})


        //вывели нашу ломаную лиинию в переменную
        const line=this.lines2[0];
        line.point.last.y+=200;

        //по факту позволительно редактирование в любой удобной форме
        //   line.point.last={x:line.point.last.x+100, y:line.point.last.y}
        //this.lines2.log
        line.point[0] = {x: line.point.last.x-step*4, y: line.point.last.y*1.02}

        line.point[2].x = lastX-step*5
        line.point[2].y = allBars.close(allBars.count-2)??60000

        line.point[3] = {x: line.point.last.x-step*8, y: line.point.last.y} //создали новую точку путем расширения массива

        line.point[3].x = line.point[3].x+step
        line.point.last.x = line.point[3].x+step

        //this.lines2.add({textAlignV})


        line.text="3232323323"
        line.textSizeAuto=5;

        // line.point[3].x += step// сдивнили точку правее на один бар
        // line.point[3].y = allBars.last?.close??60000
        line.point.add({x:line.point.last.x-step, y:line.point.last.y}) // добавили еще одну точку в ломанную линию в конец


        // this.lines2[1].point.add({x:Date.now()-step*14, y: allBars.last?.close??60000})
        // this.lines2[1].text="**********"


        // const newLine = this.lines2.add({point:[{x:0,y:0},{x:0,y:0}],color: {color:"#12ff04" as  ColorString}, static: false, type: "line" })
        // const lastPoint = newLine.point.last; // получили класс последний точки
        // lastPoint.x= Date.now()-step*4  // изменили координату х
        // lastPoint.y= allBars.last?.close??60000 // изменили координату у


        // при любой установке новоых параметров создаеться новый обьект принимаемых значений которрый окутывается в спецальный класс т.е. если сосолаться на одну и ту же точку то создаться две одинаковых точки, и это будут разные обьекты
        //
        // для более детального управления точкаму надо использываться доступ непосредственно к рабочему мосиву
        // const mas = newLine.point.data() // непосредственно рабочий масив точек - без модификаторов, при его изменении надо также контроливаровать обновление точек
        // пример ссылки

        //


        const testLine = this.lines2.add({
            static: false, type: "line", color:[{color:"#f10d0d" as  ColorString}],
            point:[
                {x:lastX-step*12, y: price*1.02},
                {x:lastX-step*5,  y: price*1.02},
                {x:lastX-step*12,  y: price*1.01},
                {x:lastX-step*1,  y: price*1.01}
            ]
        })
        console.log(...testLine.point.data());
        testLine.point.splice(2,1)
        console.log(...testLine.point.data());
     //   testLine.point[1]//={x:lastX-step*5,  y: price*1.02}

        //пример рисует звездочку
        this.lines2.add({
            static: false, type: "line", color:[{color:"#d5a21d" as  ColorString}],
            point:[
                {x:lastX-step*10, y: price*0.99},
                {x:lastX-step*5,  y: price*1.01}, // центр
                {x:lastX-step*0,  y: price*0.99},
                {x:lastX-step*11, y: price*1.0},
                {x:lastX-step*0,  y: price*1.0},
                {x:lastX-step*10, y: price*0.99},
            ]
        })

        //пример текстовой метки
        this.lines2.add({
            static: false, type: "label", color:[{color:"#d5a21d" as  ColorString}],
            text:"****",
            point:[
                {x:lastX-step*10, y: price*0.995},
            ]
        })
    }

    override OnTick(data: tOnTick) {
        let obj = this.lines2[0];
        obj.point.last.y = data.tick.price;
        obj.point.last.x = data.tick.time.valueOf();
    }

    override OnBar({bar, closed, allBars, index, finish, api} : tOnBarIndicator) {
        if (!finish) return;

        this.draw(allBars);
        this.draw= ()=>{};  // запрещаем повторные отрисовки

        // пример дорисовки до последнего бара
        let obj = this.lines2[0];
        console.log({index});
        console.log({allBars});
        console.log(this.lines2.data);
        //this.lines2[0].Delete();
        if (allBars.last && obj) {
            obj.point.last.x = allBars.last.time.valueOf();
            console.log("произошла дорисовка линии", this.lines2.updatesCounter, allBars.last.time.valueOf());
        }
        // this.lines2.deleteAll()
        api.alert({alarm: "проверка", signal: "проверка", text: "проверка"})
    }

}


