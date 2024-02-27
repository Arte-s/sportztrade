import {CIndiBase, CIndiBaseExt,CParams, tOnBarIndicator} from "../and/indicatorAPI";
import {Signal, SignalID} from "./Signal";



class CIndicatorExample extends CIndiBase<typeof CIndicatorExample> {
    static readonly Name="Example";
    static readonly Version="1.0";
    static readonly paramInfo= {};
    private highID? : SignalID;
    private lowID? : SignalID;

    constructor(params :{}) { super(); }

    override OnBar(data :tOnBarIndicator) {

        let {bar, api, index} = data;

        // удаляем старые лимитные сигналы
        if (this.highID) api.signals.delete(this.highID);
        if (this.lowID) api.signals.delete(this.lowID);

        // добавляем лимитный сигнал на продажу
        this.lowID = api.signals.add({
            volume: -1,
            price: bar.high,
            type: "limit",
            name: "мой сигнал"
        });
        // добавляем лимитный сигнал на покупку
        this.highID = api.signals.add({
            volume: 1,
            price: bar.low,
            type: "limit"
        });

        // добавляем рыночный сигнал на покупку по текущей цене
        if (index % 100 ==0)
            api.signals.add({
                volume: 1,
            });

        if (0) { // либо можно задать текущий список сигналов с помощью метода set. Все имеющиеся сигналы автоматически удалятся
            api.signals.set( [{
                    volume: -1,
                    price: bar.high,
                    type: "limit"
                }, {
                    volume: 1,
                    price: bar.low,
                    type: "limit"
                }
            ]);
        }
    }
}