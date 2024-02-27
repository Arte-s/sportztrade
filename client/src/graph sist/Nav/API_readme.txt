
Файл TesterAPI.ts
==================


Запуск теста (асинхронный):

  export async function RunTest(info :Readonly<CTesterInfo>,  onTick :(testerTick :TesterTick, indicators? :readonly IIndicator[], percent? :number)=>Promise<boolean|void>)  :   Promise<CTradeHistory|null>;

 где info   - исходная инфа о тестировании (конфигурация)

     onTick - обработчик каждого тика (асинхронный),
              где TesterTick - получаемый тик тестера,
                  indicators - используемые индикаторы (можно узнать их значения для текущего тика)
                  percent - процент выполнения

 возвращаемое значение: TradeHistory (история торгов)

При этом происходит автоматическая подкачка истории по запрашиваемому символу при необходимости.



export class CTesterInfo
{
	symInfo :CSymbolInfo;      // Инфа по символу
	strategy :IStrategy;       // Стратегия
	strategyParams: number[];  // Значения параметров стратегии
	tf :TF;                    // Таймфрейм
	config :CTesterConfig;     // Конфигурация тестера
}



Интерфейс стратегии:

export interface IStrategy
{
	readonly name : string;                  // Имя стратегии
	readonly params : readonly ParamInfo[];  // Инфа о параметрах стратегии

	getTrader?(params : readonly number[]) : ITrader;   // Создание трейдера для заданных параметров стратегии (в текущей версии не используется!)

	getSignaller(params : readonly number[]) : IStrategySignaller;  // Создание сигналлера (используется для генерации простых сигналов на покупку/продажу)
}


Интерфейс сигналлера:


export interface IStrategySignaller
{
	onNewBars(bars: readonly CBar[]) : void;     // Обработчик события получения новых баров
	getSignal() : number|null;                   // Текущий сигнал
	readonly indicators : readonly IIndicator[]; // Используемые индикаторы
	readonly minRequiredDepthBars? :number;      // Минимальное требуемое число баров (глубина) для расчёта
}




