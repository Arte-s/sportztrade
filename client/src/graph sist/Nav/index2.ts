/// <reference lib="dom" />

import {CreateMyChartArea, DrawCandleChart, IChartApi, ISeriesApi, scrollChartToTime} from "./Chart/Chart";

import * as lib from "./Common";

///import {FBinanceSymbols, FBinanceLoad} from "../and/LoadHistoryBinance"
import * as MyTester from "./myTester"
import {EquityChartColor, PriceChartColor, SetChartAutoResize, SymbolQuotesGetter, SymTradeData, TradeData} from "./myTester"

import {CHistoryCacheable_Binance, CHistoryCacheable_MsTrade} from "./HistoryLoader"

//await lib.sleepAsync(100);
//alert("!");//fff());
import {const_Date, createStrategyObject, CTesterConfig, CTesterInfo, CTradeBar, GetSumEquity, IParamValues, IStrategy, ISymbolInfo, LoadSymbolQuotesForTesterInfo, ValueEnum} from "./TesterAPI";

//import { Strategy_MA, Strategy_Pan, Strategy_Lana, Strategy_Lana2, AllStrategies } from "./Strategies";
import {AllStrategies} from "./Strategies";


import * as Param from "./ParamOld"
import {ValueInfo} from "./ParamOld"

import * as Time from "./Time"; //Time= await import("./Time");   // Такой вариант, иначе PHPStorm не видит его
import {TF} from "./Time";

import {colorGenerator} from "./color"


//MyTester= _MyTester;
//import type * as MyTester from "./MyTester"
//import * as Tester from "./TesterAPI";
//import {RunSignallerTest} from "./Tester";
import {SetAutoStepForElement} from "./inputAutoStep";
import {MyGeneticParams} from "./Optimizer";

import {getCookie, setCookie} from "./Cookie"
import {ITradeStatistics, TradeStatistics} from "./TradeStatistics";
import {removePopupMessage, showPopupMessage} from "./Popup";
import {colorStringToRGBA, isSimilarColors} from "./color";


//MyTester;
//import { Period } from "./Time";

//moduleFunc();
//async function moduleFunc()

//let MyTester= MyTester;
//let c = MyTester.CTesterSpeed;

//import * as MSTrade from "./Data_MSTrade";

//type JQueryMy<T> = JQuery<T> & { val() : string; };

//function ff(element : string) { return JQueryStatic. }

//declare function $(html: JQuery.htmlString,  ownerDocument_attributes?: Document | JQuery.PlainObject):  { val : ()=>string; } & JQuery<HTMLElement>;


/**
 * Creates DOM elements on the fly from the provided string of raw HTML.
 * @param html _&#x40;param_ `html`
 * <br>
 * * `html (ownerDocument)` — A string of HTML to create on the fly. Note that this parses HTML, not XML. <br>
 * * `html (attributes)` — A string defining a single, standalone, HTML element (e.g. &lt;div/&gt; or &lt;div&gt;&lt;/div&gt;).
 * @param ownerDocument_attributes _&#x40;param_ `ownerDocument_attributes`
*/
function $1<T extends HTMLElement= HTMLElement>(html: JQuery.htmlString,  ownerDocument_attributes?: Document | JQuery.PlainObject) {
	return $(html, ownerDocument_attributes) as { val : ()=>string; } & JQuery<T>;
}

type HTMLInputNumberElement = { min?: number; max?: number; step?: number; value: number } & HTMLInputElement;


//const $1 = $ as <T>(html: JQuery.htmlString,  ownerDocument_attributes?: Document | JQuery.PlainObject) => { val : ()=>string; } & JQuery<T>


type ParamValueInfo = { start :number; end :number; step? :number; progres? :number; single :number; };

export type ParamValueInfoExt = ParamValueInfo & { checked?: boolean }


function ShowPreloaderImage(destination :HTMLElement) {
	let html= '<img class="preloaderIcon" src="preloader_1495_256x256.gif" width="128" height="128" style="z-index: 999; left: 50%; margin-left:-64px; margin-top:64px; position: absolute" alt="running">';
	let el : HTMLDivElement = document.createElement("div");
	//el.style.marginLeft="auto";
	el.innerHTML= html;
	destination.insertBefore(el, destination.firstChild);
	$(el).show();
	return el;
}


export type SourceAPI = {
	ClearStrategyParameterTable() :void;
	AddStrategyParameterToTable(param :string, config :ParamValueInfoExt, info :ValueInfo|ValueEnum) :void;
	ClearOptimizTable() :void;
	AddResultToOptimizTable(params :readonly number[], statistics: ITradeStatistics, equityValues? :readonly number[]) : void;
	InitTradeTable(useSymbolColumn :boolean) : void;
	AddTradesToTable(trades : readonly SymTradeData[], onclick: (time :string)=>void) : void;
	GetGeneticConfig() :MyGeneticParams;
	SetExchanges(names : readonly string[]) : void;
	SetSymbols(names : readonly string[]) : void;

	AddQuotesChart(name :string) : HTMLElement;
	AddEquityChart(name :string) : HTMLElement;
	SetLegendToChart(chart: HTMLElement, legendName :string, onClick? :(element :HTMLInputElement)=>void) :void;
	AddLegendItemToChart(chart: HTMLElement, item :string, checked :boolean, color :string, onClick? :(element :HTMLInputElement)=>void) :void;
	ClearUserCharts() : void;
	AddNewStatisticTableFromBody(body :HTMLElement|null) : HTMLTableElement|undefined;
}


type Exchange = "Binance Spot"|"MsTrade";

//const Exchanges : readonly Exchange[] = ["MsTrade","Binance Spot"];
const Exchanges : readonly Exchange[] = ["Binance Spot", "MsTrade"];

const SymbolsByExchange : { [exchange in Exchange] : readonly string[]|undefined } =  { } as any;


/**@param{HTMLElement} e
 */
function isHover(e :HTMLElement) { return e.parentElement?.querySelector(':hover') === e; }  //element.matches(':hover') или [element]:hover




function Core() {

}



export async function Run({ClearStrategyParameterTable, AddStrategyParameterToTable, ClearOptimizTable, AddResultToOptimizTable, InitTradeTable,
						AddTradesToTable, GetGeneticConfig, SetExchanges, SetSymbols, AddQuotesChart, AddEquityChart, ClearUserCharts,
						AddNewStatisticTableFromBody, SetLegendToChart, AddLegendItemToChart}
						: SourceAPI
)
{
	const historyMsTrade = new CHistoryCacheable_MsTrade();
	const historyBinance = new CHistoryCacheable_Binance();


	function exchange() { return $exchange.val() as Exchange; }

	function historySource(exchange :Exchange) { return exchange=="Binance" ? historyBinance : exchange=="MsTrade" ? historyMsTrade : null; }

	function historySourceMy() { return historySource(exchange()); }


	function GetSymbolQuotesGetter(symbol :string, tickSize :number, quoteCurrency :string) {
		let source = historySource(exchange());
		return source ? SymbolQuotesGetter(symbol, tickSize, quoteCurrency, source) : null;
	}

	//SymbolsByExchange["MsTrade"] = ["BTCUSD", "ETHUSD", "LTCUSD", "XRPUSD"];

	const $exchange= $1("#exchange");

	async function onChangeExchange() {
		let exchange = $exchange.val() as Exchange;
		SetSymbols(SymbolsByExchange[exchange] ?? []);
		let newSymbols= await historySource(exchange)?.getSymbols();
		if (newSymbols)
			SetSymbols(SymbolsByExchange[exchange] = newSymbols);

		LoadSymbolBars();
	}

	$exchange[0].onchange= async()=> {
		onChangeExchange();
	}

	//await lib.sleepAsync(500);

	SetExchanges(Exchanges);
	onChangeExchange();

	const $symbols = $<HTMLSelectElement>("#symbol");

	function selectedSymbols() : string[] { let val= $symbols.val();  return (val instanceof Array ? val : [val]) as string[]; }

	const $strategy = $1<HTMLSelectElement>("#strategy");

	const $tf = $1<HTMLSelectElement>("#tf");

	const $startDate = $1<HTMLInputElement>("#startDate");

	const $endDate = $1<HTMLInputElement>("#endDate");

	const $priceChart= $("#quotesChart");
	const $priceChartName= $("#quotesChartName");
	const $equityChart= $("#equityChart");

	//let _loadBarsCounter = 0;

	async function LoadSymbolBars() {

		if ($priceChart![0].parentElement!.style.display=='none') return;
		if (selectedSymbols().length >1) return;
		//alert(111);  return;
		//$("#quotesChartName")[0].innerText = "fuck";  return;
		let symbol = selectedSymbols()[0]; //$symbols.val();
		let tfName = $tf.val();
		let tf= TF.get(tfName);
		if (!symbol || !tf) return false;
		//let counter= ++_loadBarsCounter;
		let preloadImg = ShowPreloaderImage($priceChart[0]);
		let bars = await historySourceMy()?.getBars(symbol, tf, new Date(Date.now()-1000*tf.msec), new Date()).finally(()=>preloadImg.remove());
		if (_testing) return;
		//if (counter!=_loadBarsCounter) return;  // Отрисовываем только последний запрос
		$priceChart.empty();
		if (1)
		if (bars)
			DrawCandleChart(bars, $priceChart[0], PriceChartColor);  //
		$priceChartName[0].innerText = symbol+", "+tfName;
		$priceChartName[0].style.color= 'white';
		$priceChartName[0].style.fontSize= "small";


		//SetLegendToChart($priceChart[0], "Items", (element)=>alert(element.value));

		// console.log("Ignoring: ",EquityChartColor," -> ",lib.colorStringToRGBA(EquityChartColor))
		// let i=0;
		// for(let clr of lib.colorGenerator())
		// 	if (++i<30) {
		// 		console.log("!!",clr);
		// 	}
		// 	else break;
		// let generator= lib.colorGenerator();
		// //console.log(generator.next().value);
		// //console.log(generator.next().value);
		// //let xxx = generator.next().value;
		// for(let n=0; n<30 ;n++) {
		// 	let [r,g,b] = generator.next().value;
		// 	if (lib.isSimilarColors([r,g,b], EquityChartColor)) continue;
		// 	AddLegendItemToChart($priceChart[0], (n*100)+"", true, "rgb("+r+","+g+","+b+")");
		// }
		//for(let value of ["101", "200", "300", "400", "500"])
			//AddLegendItemToChart($priceChart[0], value, true, 'rgb(254,176,0')//;[]((r, g, b)=>"rgb("+r+","+g+","+b+")")(...generator.next().value));}

	}


	$symbols[0].onchange= LoadSymbolBars; // .addEventListener('change', LoadSymbolBars);
	$tf[0].onchange= LoadSymbolBars; ////.addEventListener('change', LoadSymbolBars);

	//LoadSymbolBars();
	//$(document).on('change', '#tf', function(e){ alert("!"); }


	const $paramTableBody= $("#paramTableBody");


	namespace Strategies {
		/**
		 * @param { IStrategy } strategy
		 * @param { ParamValueInfo[] } valuesConfigs - Конфигурации параметров
		 */
		function _SetStrategyParams(strategy :IStrategy, valuesConfigs? :readonly Readonly<ParamValueInfoExt>[])
		{
			let params= strategy.paramInfo;
			ClearStrategyParameterTable();
			//let state= stategyParamTableState.get(strategy.name);
			//if (state) { $pramTableBody[0].innerHTML= state;  return; }
			for(let [i,param] of params.entries()) {
				//let checked=false;
				let config= valuesConfigs ? valuesConfigs[i] : null;
				let info= param.type.valuesInfo;
				let defaultValue= param.defaultValue;
				let defaultRange= param.defaultRange;
				let infoVal= info as ValueInfo;
				//if (!info) [info,checked]= state ? state[i]: null;
				if (!config && defaultRange) config= {...defaultRange, step: defaultRange.step ?? infoVal.step, progres: infoVal.progressive ? 1.1 : 1, single: defaultValue ?? defaultRange.start};
				if (!config) {
					//console.log(param);
					let start= infoVal.min ?? defaultValue ?? (()=>{throw(strategy.name+"  Параметр "+i+": Не заданы значения для min и defaultValue")})();
					let end= infoVal.max ?? defaultValue!;
					let step = start!=null && end!=null  ? (infoVal.step ?? (end - start)/10)  : null;
					let single= defaultValue ?? start;
					if (step) config= { start, end, step, single, progres: infoVal.progressive ? 1.1 : 1 };
					else throw(strategy.name+"  Параметр "+i+": некорректные значения");
				}
				if (config.checked==undefined && param.static)
					config= {...config, checked: false}
				//console.log(strategy.name, param.name, config);
				AddStrategyParameterToTable(param.name, config, param.type.valuesInfo); //info?.single, info?.start, info?.end, info?.step, info?.progres);
				//AddStrategyParameterToTable('1st MA period', 10,  1, 20, 1, 1.1);
				//AddStrategyParameterToTable('2nd MA period', 20,  5, 100, 5, 1.1);
			}
			//$(".inputParamProgres").each((index,element)=>SetAutoStepForElement(element as HTMLInputElement, 0.1));
			//$(".inputParamNumber").each((index,element)=>SetAutoStepForElement(element as HTMLInputElement));
		}

		// Хэшмэп состояния таблицы параметров по названию стратегии
		//const stategyParamTableState = new Map<string, string>();
		const strategyParamTableState = new Map<string, readonly ParamValueInfoExt[]>();


		/** Хэшмэп стратегий по имени
		 * @type {Map<string, IStrategy>}
		 */
			//const stategiesMap = new Map<string, IStrategy>();
		const strategiesMap : { [name : string] : IStrategy; } = {};



		// /** Хэшмэп состояния параметров по названию стратегии
		//  * @type {Map< string, { info :CParamValueInfo, checked :boolean }[] >}
		//  */
		// let stratParamStates= new Map;

		let currentStrategyName :string;
		let currentStrategy : IStrategy;


		let $paramTable = $("#parameters");



		function SaveCurrentStrategyParamsToMap() {
			//let checkboxesStates = $(".inputParamCheckBox").map((i, el)=>el.checked);
			//stategyParamTableState.set(currentStrategyName, $paramTable[0].innerHTML); //[$paramTable[0].innerHTML, checkboxesStates]);
			strategyParamTableState.set(currentStrategyName, GetParamInfos());
		}
		/**@param{string} strategyName
		 */
		function RecoverStrategyParamsFromMap(strategyName :string) {
			//let [innerHtml, checkboxStates] = stategyParamTableState.get(currentStrategyName);
			//console.log("!!!",stategyParamTableState.get(strategyName));
			//$paramTable[0].innerHTML= stategyParamTableState.get(strategyName);
			_SetStrategyParams(strategiesMap[strategyName], strategyParamTableState.get(strategyName));
			//console.log("Recover: ",stategyParamTableState.get(strategyName));
			//function isVisible(el :HTMLElement) { return el.getBoundingClientRect().width>0 && el.getBoundingClientRect().height>0; }//window.getComputedStyle(el).visibility!=="hidden" && el.style.display!=="none"; }
			//$(".inputParamCheckBox").each((i, el: HTMLInputElement)=> { el.checked= isVisible($(".inputParamStart")[i]); });
		}

		/**
		 * @param {IStrategy} strategy
		 * @param {ParamValueInfo[]} valuesConfigs
		 */
		function AddStrategy(strategy :IStrategy, valuesConfigs? :readonly ParamValueInfo[]) //= null)
		{
			SaveCurrentStrategyParamsToMap();
			let name= strategy.name;
			$strategy.append('<option value="'+name+'">'+name+'</option>');
			//$strategy[0].selectIndex= $strategy[0].length-1;
			$strategy[0].value= name;
			//alert($strategy[0].selectIndex);
			_SetStrategyParams(strategy, valuesConfigs);

			currentStrategyName= name;
			currentStrategy= strategy;
			strategiesMap[name] = strategy;
		}

		for(let strategy of AllStrategies)
			AddStrategy(strategy);
		// if (1)
		// 	AddStrategy(Strategy_MA,
		// 		[
		// 			{ single: 10,  start: 1, end: 50, step: 1, progres: 1.1 },
		// 			{ single: 20,  start: 2, end: 100, step: 2, progres: 1.1 },
		// 			//{ single: 0,  start: 0, end: 1, step: 1, progres: 1 }
		// 		]
		// 	);
		// if (1)
		// 	AddStrategy(Strategy_Pan);
		//
		// if (1)
		// 	AddStrategy(Strategy_Lana//,
		// 		// [
		// 		// 	{ single: 10,  start: 1, end: 50, step: 1, progres: 1.1 },
		// 		// 	{ single: 20,  start: 2, end: 100, step: 2, progres: 1.1 },
		// 		// 	//{ single: 0,  start: 0, end: 1, step: 1, progres: 1 }
		// 		// ]
		// 	);
		//
		// if (1)
		// 	AddStrategy(Strategy_Lana2);


		function OnSetParams() {
			// Пересчитываем и отображаем число комбинаций при изменении любого параметра
			$("#parameters :input").on("change", ()=> ShowAmountOfCombinations() );
			ShowAmountOfCombinations();
			SetOnClickComboCountEvent();
			$(".inputParamNumber").not(".inputParamProgres").each((index,element)=>SetAutoStepForElement(element as HTMLInputElement));
			$(".inputParamProgres").each((index,element)=>SetAutoStepForElement(element as HTMLInputElement, 0.1));
			$<HTMLInputElement>("#loadParams")[0].disabled= !getCookie(currentStrategyName);
		}

		$strategy.on("change", ()=> {
			//alert($strategy.val());
			SaveCurrentStrategyParamsToMap();
			currentStrategyName= $strategy.val();
			currentStrategy= strategiesMap[currentStrategyName];
			//console.log("Save: ",$paramTable[0]);
			RecoverStrategyParamsFromMap(currentStrategyName);
			OnSetParams();
		});



		OnSetParams();



		function SaveParams() {
			try {
				let infos = GetParamInfos().map(function(info, i){ return {name: currentStrategy.paramInfo[i].name, ...info}});
				setCookie(currentStrategyName, JSON.stringify(infos));
			}
			catch(e) { alert(e);  throw(e); }
		}

		function LoadParams() {
			try {
				let str= getCookie(currentStrategyName);
				if (! str) throw("Cookie for "+currentStrategyName+" is not defined")
				let params : (Partial<ParamValueInfoExt>&{name?:string})[] = JSON.parse(str);
				for(let [i,paramInfo] of currentStrategy.paramInfo.entries()) { //for(let [i,param] of params.entries()) }
					let param= params[i];
					if (param && param.name!=paramInfo.name) throw "Загружено не совпадающее имя параметра #"+i+": "+param.name;
					function goodVal(val :any) { return typeof val=="number" && !isNaN(val); }
					if (! param || !goodVal(param.start) || !goodVal(param.end) || !goodVal(param.step) || !goodVal(param.single))
						throw "Loaded invalid info for parameter #"+i+": "+JSON.stringify(param);
					_SetStrategyParams(currentStrategy, params as ParamValueInfoExt[]);
				}
			}
			catch(e) { alert(e);  throw(e); }
		}


		$("#saveParams")[0].onclick= ()=>{ SaveParams();  showPopupMessage(null, "Параметры сохранены", 1000); $<HTMLInputElement>("#loadParams")[0].disabled= false; }
		$("#loadParams")[0].onclick= ()=>{ LoadParams();  showPopupMessage(null, "Параметры загружены", 1000); }
		$("#resetParams")[0].onclick= ()=>{ _SetStrategyParams(currentStrategy);  showPopupMessage(null, "Параметры сброшены", 1000); };



		// Показать общее число комбинаций
		function ShowAmountOfCombinations() {
			let errors :string[] = [];
			let infos= GetParamsOptimizArrays( function onErr(i,msg) { errors[i]=msg; } );
			$('.cellParamComboCount').each((i, el)=> {
				el.innerHTML= infos && infos[i] ? "["+infos[i]?.length+"]" : errors[i] ? "<span style='color:red'>"+errors[i]+"</span>": "";
				//if (!infos || !infos[i]) console.log($('#parameters tbody tr')[i]); tr.getElementsByClassName('')[0].checked
				let border= (infos && infos[i]) ? "1px solid" : "2px red solid";
				$($('#parameters tbody tr')[i]).find("td:has(input[type=number])").css("border", border); //"").style.border= "2px red";  // :HTMLElement
			})
			$("#paramComboCount")[0].innerHTML = "" + infos?.reduce((prev, curr) => prev * (curr?.length?? 0), 1);
		}




		function GetParamInfos() { return GetParamInfosPartial((i :number, msg :string)=>{throw("Param "+i+": "+msg); }) as ParamValueInfoExt[]; }


		function GetParamInfosPartial(onError? :(i :number, msg :string)=>any)  : Partial<ParamValueInfoExt>[]
		{
			let paramsRows= $('#parameters')[0].getElementsByTagName('tbody')[0].getElementsByTagName("tr");

			function ensureValid(i :number, val :number, name: string) { if (isNaN(val)) { console.error(`Parameter "${i}" ("${name}"): wrong value: `+val);  if (onError) onError(i, "Wrong value "+val); return false; } return true; }

			function parse(value :any) { return parseFloat(value+""); }

			let params :Partial<ParamValueInfoExt>[] = [];
			for(let i=0; i<paramsRows.length; i++)
			{
				function getItemValue(elem : JQuery<HTMLElement>, name :string) { let num = parse(elem.val()); return ensureValid(i, num, name) ? num : undefined }

				let $paramRow= $(paramsRows[i]);

				function getItemValue_(selector_element : string) { return getItemValue($paramRow.find(selector_element) ?? (()=>{throw "Unknown element: "+selector_element})(), $paramRow.find(".cellParamName")[0].innerHTML); }

				let value= getItemValue_('.inputParamValue');
				let start= getItemValue_('.inputParamStart');
				let end= getItemValue_('.inputParamEnd');
				let step= getItemValue_('.inputParamStep');
				let progres= getItemValue_('.inputParamProgres');
				let checked= $paramRow.find<HTMLInputElement>('.inputParamCheckBox')[0].checked;
				params.push({start, end, step, progres, checked, single: value})
			}
			return params;
		}

	}




	let _testing= false;

	let _paused= false;

	let testerSpeedMutable = new MyTester.CTesterSpeed();

	const $startBtn= $<HTMLInputElement>('#startBtn');

	const $pauseBtn= $<HTMLInputElement>('#pauseBtn');

	const $visualCheckbox= $<HTMLInputElement>('#visualModeCB');

	const $speedRange= $<HTMLInputElement>('#speed');

	const $onlyPositiveResultsCheckBox = $<HTMLInputElement>("#onlyPositiveResults_checkBox");

	//$('#Speed')[0].addEventListener('input', alert("!"));
	//$('#Speed')[0].addEventListener('change', ()=>alert("!"));

	$speedRange.on('input', ()=> {
		let value= Number($speedRange[0].value);
		if (!_paused)
			testerSpeedMutable.value = value; //=  ()=>alert($('#speed')[0].value));
	});

	$speedRange.on('change', ()=> {  //$('#speed')[0].addEventListener
		let value= Number($speedRange[0].value);
		console.log("Set testing speed=",value);
		if (!_paused)
			testerSpeedMutable.value = value; //=  ()=>alert($('#speed')[0].value));
	});

	//alert($('#visualModeCB')[0].checked);

	//const pauseChar= "\u23F8\uFE0E";//\uFE0E'; //U+23F8;
	//const playChar= '\u23F5\uFE0E';
	////const playChar= '\u25B6'; //U+25B6; //'&#x25B6';

	if ($visualCheckbox[0].checked) $speedRange.trigger("change");

	/** @param{boolean} paused */
	function SetPaused(paused :boolean) {
		if (paused) testerSpeedMutable.value = 0;
		else        testerSpeedMutable.value = Number($speedRange[0].value);
		_paused = paused;
		//$pauseBtn[0].value = paused ? playChar : pauseChar; //
		$pauseBtn[0].className= paused ? "fa fa-play" : "fa fa-pause";
		$pauseBtn[0].title= paused ? "Продолжить" : "Пауза";
	}

	$pauseBtn[0].onclick= ()=>SetPaused(!_paused);

	SetPaused(false); //'&#x25B6';



	let __lastClickTarget :HTMLElement|null;

	function SetOnClickComboCountEvent() {
		// События клика на числе комбинаций отдельного параметра
		$(".cellParamComboCount").on("click", (event)=>{
			//tr.getElementsByClassName("cellParamComboCount")[0].onclick= (event)=> {
			let el = event.target;
			removePopupMessage();
			if (el==__lastClickTarget) { __lastClickTarget= null;  return; }
			__lastClickTarget= null;
			let iParam= $(".cellParamComboCount").index(el);
			let paramDatas= GetParamsOptimizArrays();
			let text= paramDatas && iParam>=0 ? "Значения:<br>"+[...(paramDatas[iParam] ??["???"])].join("<br>") : "";
			if (text==="") return;

			showPopupMessage(el, text, 0, true, false);
			__lastClickTarget= el;//if (isHover($(".popup"))) alert(113); }// { if (! isHover($(".popuptext")[0])) $(".popup")[0].remove(); }
		});
	}
	//SetParamsOnClickComboCount();
	//document.onclick= (e)=> { if (__lastClickTarget && e.target!=__lastClickTarget && e.target!=currentPopup()) { removePopupMessage();  __lastClickTarget= null; }}

	// комиссия
	let $fee= $1<HTMLInputElement>("#fee");

	SetAutoStepForElement($fee[0]);


	$(document).on('submit', 'form', function(e){
		e.preventDefault();  // Предотвращаем отправку данных формы
		OnClickStartBtn();
	});


	let cancelToken = new lib.CancelToken();

	/**@type{JQuery<HTMLInputElement>}
	 */
	const $geneticCheckBox = $<HTMLInputElement>("#genetic_checkBox");

	/**@type{JQuery<HTMLInputElement>}
	 */
	const $threadsCountInput = $("#threadsCountInput");

	/**@param{boolean} isOptimiz
	 */
	async function OnClickStartBtn(isOptimiz? :boolean) // = null)
	{
		if (_testing) { testerSpeedMutable.value= -1;  cancelToken.cancel();  return; }

		let isOptimization = isOptimiz ?? $("#tabContentOptimization").is(":visible");

		let startBtn= isOptimization ? $<HTMLInputElement>("#startOptimizBtn") : $startBtn;

		startBtn[0].value= "Стоп";

		let disabling_elements = [$("[name='tab-btn']"),  $('.header :input, .header select')]; //: JQuery<HTMLElement>[] = [, ];

		if (isOptimization) {
			disabling_elements.push(...[$onlyPositiveResultsCheckBox, $threadsCountInput, $geneticCheckBox, $("#geneticConfig :input")]);
		}
		else {
			disabling_elements.push($visualCheckbox);
			//$visualCheckbox.prop("disabled", true);
			$pauseBtn.prop('disabled', false);
			if (! $visualCheckbox[0].checked) testerSpeedMutable.value = Number.MAX_VALUE;
		}

		// Отключаем элементы
		for(let $el of disabling_elements) $el.prop("disabled", true);
		//$(disabling_elements).prop("disabled", true);  // не работает!

		_testing= true;
		cancelToken = new lib.CancelToken();

		$("#btnErrorText").remove();

		try {
			if (isOptimization)
				await _Optimizate();
			else await _Test();
		}
		catch(e) { startBtn.parent().append("<div id='btnErrorText' style='color:red'>Ошибка!</div>");  throw(e); }

		finally {
			startBtn[0].value= "Старт";
			//$('#startBtn').prop( "disabled", false );
			for(let $el of disabling_elements) $el.prop("disabled", false);
			//$(disabling_elements).prop("disabled", false); // не работает!

			if (isOptimization) {
			}
			else {
				$pauseBtn.prop('disabled', true);
				SetPaused(false);
			}

			_testing= false;
			let audio = new Audio('./expert.wav');
			audio.play();
		}
	}
	//document.OnClickStartBtn= OnClickStartBtn;


	// async function OnClickOptimizButton()
	// {
	// 	$("#startOptimizBtn")[0].value= "Стоп";
	// 	$(".tabs").prop("disabled",true);
	// 	_Optimizate();
	// 	$("#startOptimizBtn")[0].value= "Старт";
	// 	$(".tabs").prop("disabled",false);
	// }





	/** Получаем массивы оптимизируемых параметров*/

	function GetParamsOptimizArrays( onError :(i :number, msg :string)=>void|never = (i :number, msg :string)=>{throw("Param "+i+": "+msg);} ) //ensureValid=false)
	: (Param.IParamValues|null)[]
	{
		let paramInfos = Strategies.GetParamInfosPartial(onError);
		let allParams : (Param.IParamValues|null)[] = [];  //CParamStepper

		for(let [i,param] of paramInfos.entries())
		{
			let isOpt= param.checked;
			let value= param.single;
			//if (i===0) { console.log("Задаём первый параметр как оптимизируемый!!");  isOpt=true; }
			let [start, end, step, progres] = isOpt ? [param.start, param.end, param.step, param.progres] : [value, value, 1, 1];
			if (start==null || end==null || step==null || progres==null) {
				allParams.push(null);  continue;
			}
			try {
				let values;
				if (progres === 1)
					values= new MyTester.CParamStepper(start, end, step);
				else
					values= Param.CreateUniqueValues_start_end_step_stepX_endMatch(start, end, step, progres, Param.E_MATCH_END.FIT, true);
				allParams.push(values);
			}
			catch(msg) { if (onError) onError(i, msg);  allParams.push(null); }//allParams.push(new Error(msg));  if (onError) onError(i, msg); }
		}
		return allParams;
	}


	async function _Optimizate()
	{
		console.log("Optimizate");

		ClearOptimizTable();

		let symbol = selectedSymbols()[0];  if (!symbol) return; //$symbols.val();
		let strategy = $strategy.val();
		let startDate = $startDate.val();
		let endDate = $endDate.val();
		let tfName = $tf.val();
		let comission = { value: parseFloat($fee.val()),  unit: $1("#feeType").val() };

		let strategyObj= stategiesMap[strategy];  //Strategy_MA;
		if (! strategyObj) throw("Неизвестная стратегия: "+strategy);

		let params= GetParamsOptimizArrays() as IParamValues[];  console.assert(params.every((param)=>param!=null));

		//symInfo.tickSize= 1;
		//symInfo.quoteCurrency= "USD";
		let tickSize= 1;  //symInfo.tickSize= 1;
		let quoteCurrency= "USD"; ////symInfo.quoteCurrency= "USD";
		let priceInfo= GetSymbolQuotesGetter(symbol, tickSize, quoteCurrency) ?? (()=>{throw("Failed to get quotes getter")})(); //MyTester.MsTradeSymbolQuotes(symbol, tickSize, quoteCurrency);

		let symInfo : ISymbolInfo = {
			name: symbol,
			lotSize: 1,
			comissionPerSide: comission,
			priceInfo
		}

		let config= new CTesterConfig(
			new Date(startDate),
			new Date(endDate),
			0
		);
		let tf= TF.get(tfName)!;  console.assert(tf!=null);
		//config.defaultTf= TF.get(tfName);
		//alert(config.defaultTF.name);

		let startTimeMs= Date.now();

		let combosTotal= params.reduce((prev, curr)=> prev * (curr?.length??1), 1);
		let combosComputed= 0;

		let isGenetic= $geneticCheckBox[0].checked;

		let geneticConfig = isGenetic ? GetGeneticConfig() : null;

		function onOptimizTimer(stopped=false) {
			$("#optimizStatus")[0].style.visibility = "visible";
			let percent= combosComputed*100/combosTotal;
			($("#optimProgressBar")[0] as HTMLInputElement).value= percent+"";
			let elapsedMs= Date.now()-startTimeMs;
			let timeStr= combosTotal<100 && elapsedMs<10000 ? Time.durationToStr_h_mm_ss_ms(elapsedMs) : Time.durationToStr_h_mm_ss(elapsedMs);
			//$("#optimizStatus")[0].innerHTML = combosComputed+"/"+combosTotal+" ("+Math.round(combosComputed*100/combosTotal)+"%)   "+timeStr;
			$("#optimizStatusText")[0].innerHTML = timeStr+"\nВыполнено:  "+combosComputed+"/"+combosTotal+" ("+Math.round(percent)+"%)"
				+"\nСкорость:  "+lib.DblToStrAuto(combosComputed/elapsedMs*1000,-1)+" прох./сек"
				+(!stopped && combosComputed>0 && elapsedMs>2000 && !isGenetic ?  "\nОсталось: ~"+Time.durationToStr((combosTotal-combosComputed)/combosComputed*elapsedMs) : "");
		}


		let timerId= setInterval(onOptimizTimer, 50);

		/**@type{{paramValue,profit}[][]}
		 */
		let profitsByParamValue :{paramValue: number, profit: number}[][] = [];

		let threadCount= Number($threadsCountInput.val());

		//console.log(geneticConfig);  return;

		//alert(threadCount);  return;
		let localTimeMs= 0;
		try {
			await MyTester.Optimizate({symbolInfo: symInfo, strategy: strategyObj}, tf,  params,  config,  threadCount,  geneticConfig,  OnGetResult, cancelToken);//, testerSpeedMutable);
		}
		finally { clearInterval(timerId); }

		onOptimizTimer(true);
		// Показать кнопки в таблице результатов
		$(".optResultButtonCell").show(); //$("#optimizTableBody button").show();


		/**@param {number[]} params
		 * @param {ITradeStatistics} result
		 * @param {number[]} equityValues
		 */
		async function OnGetResult(params :readonly number[], result :ITradeStatistics, equityValues? :readonly number[]) { //= null) {
			combosComputed++;
			console.log("got result:");
			console.log("params: "+[...params].join(",")+"\nprofit: "+result?.resultProfit);
			if (result.resultProfit>0 || ! $onlyPositiveResultsCheckBox[0].checked)
				if (result) AddResultToOptimizTable(params, result, equityValues);

			for(let i=0; i<params.length; i++) {
				if (!profitsByParamValue[i]) profitsByParamValue[i] = [];
				profitsByParamValue[i].push({paramValue: params[i], profit: result.resultProfit})
			}
			//await lib.sleepAsync(0);
			if (0)
				if (Date.now()-localTimeMs>50) {
					await lib.sleepAsync(0);
					//$('.tsort').tsort();
					// $("#optimizTable").tablesorter();
					localTimeMs= Date.now();
				}
		}

		// Сортируем значения каждого параметра по прибыли
		for(let paramData of profitsByParamValue)
			paramData.sort((a,b)=> a.profit - b.profit);


		let div= $("#optimizParamRangesDiv");
		div.empty();
		for(let i=0; i<params.length; i++) {
			let paramName= strategyObj.paramInfo[i].name;
			let valueId= "rangeVal"+i;
			let rangeId= "optimizInputRange"+i;
			div.append(`
						<div><label>${paramName}
						<div>
							<div id="${valueId}" class="rangeVal"></div>
							<input id="${rangeId}" class="optimizInputRange" type="range">
						</div>
						</label></div>
					`);

			let rangeElem= $<HTMLInputNumberElement>("#"+rangeId)[0];
			rangeElem.oninput= ()=> {
				let paramDatas= profitsByParamValue[i];
				if (! paramDatas || paramDatas.length===0) return;
				const value = +rangeElem.value;
				const min = rangeElem.min || 0;
				const max = rangeElem.max || 100;
				const ratio = (value - min) / (max - min);

				let iData=  Math.round(ratio * (paramDatas.length-1));
				iData= paramDatas.length - 1 - iData;   // В обратном порядке, т.к. убытки у нас справа, а прибыли слева

				displayRangeValue(rangeElem, $("#" + valueId)[0], paramDatas[iData].paramValue+"")
			}
			//<input class="optimizInputRange" type="range" oninput="displayValue(this, document.getElementById('${spanId}'))">
		}
	}



	async function _Test() {
		//$('#startBtn').prop( "disabled", true );
		console.log("Test");


		let strategyName = $strategy.val();
		let startDate = $startDate.val();
		let endDate = $endDate.val();
		let tfName = $tf.val();

		let comission = { value: parseFloat($fee.val()),  unit: $1("#feeType").val() };

		// src="./Tester">

		//import * as aaa from "./Tester";
		//alert("!");
		//console.log(stategiesMap.keys());

		let strategy= strategiesMap[strategyName];  //Strategy_MA;
		if (! strategy) throw("Неизвестная стратегия: "+strategyName);

		let paramElements= $<HTMLInputNumberElement>('#parameters tbody .inputParamValue');
		if (paramElements.length !== strategy.paramInfo.length) {
			throw("Wrong parameters count: "+paramElements.length+" != "+strategy.paramInfo.length);
		}
		//alert(paramElements.length);
		let params : number[]= [];
		for(let i=0; i<paramElements.length; i++) {
			let val= parseFloat(paramElements[i].value+"");
			if (isNaN(val)) { alert("Parameter "+i+": wrong value: "+val);  return; }
			params.push(val);
		}

		let config= new CTesterConfig(
			new Date(startDate),
			new Date(endDate),
			0
		);


		let symbols= selectedSymbols();

		let $mainQuotesChartParent= $1("#quotesChartParent");

		let $equityChartName = $("#equityChartName");

		let isMultiSym = symbols.length>1;


		if (isMultiSym) $mainQuotesChartParent.hide(); else $mainQuotesChartParent.show();

		$equityChartName[0].innerText= isMultiSym ? "Equity Total" // for "+symbols.length+" symbols"
			: "Equity for "+symbols[0]+", "+tfName+", "+strategyName;


		let tradesTable_useSymbolColumn = selectedSymbols().length>1;

		InitTradeTable(tradesTable_useSymbolColumn);
		ClearUserCharts();
		$priceChart.empty(); //innerHTML= "";
		$equityChart.empty(); //.innerHTML= "";

		let clrGenerator= colorGenerator();

		let equityColors = [EquityChartColor];
		let multiEquityChart : IChartApi;

		if (isMultiSym) {
			equityColors= symbols.map((symbol)=> {
				for(let rgb :[number,number,number];  (rgb=clrGenerator.next().value)!=null; )
					if (! isSimilarColors(rgb, EquityChartColor) && !isSimilarColors(rgb, [0,0,0]))
						return (([r,g,b])=>"rgb("+r+","+g+","+b+")")(rgb);
				throw "color is not defined";
			});
			SetLegendToChart($equityChart[0], "Symbols", (element)=>alert(element.value));
			//for(let symbol of symbols)
				//AddLegendItemToChart($equityChart[0], symbol, false, equityColors[i]);
			multiEquityChart= CreateMyChartArea($equityChart[0]);
			SetChartAutoResize(multiEquityChart, $("#chartsDiv")[0]);
		}

		let _mainChartSeries :ISeriesApi<"Line">|undefined;
		//const $statisticTableBody = $("#statisticsTableBody");
		//$statisticTableBody.empty();

		function addStatisticsTable(stats : ITradeStatistics, scrollChartFunc :(time:const_Date)=>void) {
			AddNewStatisticTableFromBody( createStatisticsTableBody(stats, scrollChartFunc) );
		}

		function ClearStatisticsTables() { $("#statisticsTables").empty(); }


		ClearStatisticsTables();

		const mainStatsTable = isMultiSym ? AddNewStatisticTableFromBody(null) : undefined;

		const $testProgressBar = $<HTMLProgressElement>("#testProgressBar");


		$testProgressBar[0].value= 0;
		//setInterval(()=>testProgressBar)

		// Функция отображения прогресса выполнения
		function setTesterProgress(percent :number) { $testProgressBar[0].value= percent; }

		let percents : number[] = [];

		function onSymbolTesterProgress(iSymbol :number, percent :number) {
			let delta= percent - (percents[iSymbol]??0); percents[iSymbol]= percent;
			$testProgressBar[0].value += delta / selectedSymbols().length;
		}

		let symTradeArrays : (TradeData[]|null|undefined)[] = [];
		let symScrollers : ((time :const_Date)=>void)[] = [];

		//function addSymbolTradesToTable(iSymbol :number, trades :readonly TradeData[], scroller :(time :string)=>void) {
		function SaveSymbolTrades(iSymbol :number, trades :readonly TradeData[], scroller :(time :const_Date)=>void) {
			let symTrades= symTradeArrays[iSymbol] ??= [];
			symTrades.push(...trades);
			//symTrades.push(...trades);
			symScrollers[iSymbol]= scroller;
			//AddTradesToTable(trades.map((trade)=>({...trade, symbol: symbols[iSymbol]})), scroller);
			//SyncTrades();
		}

		function SyncTrades() {
			let [minTime, minTimeArray, index] : [const_Date|null, TradeData[]|null, number] = [null, null, -1];
			let tradesTotal = 0;
			for(let [i,trades] of symTradeArrays.entries())
				if (! trades?.length)
					if (trades!=null) return; // пока нет сделок по символу
					else continue;  // иначе символ уже не используется
				else {
					tradesTotal += trades.length;
					if (trades[0] && (!minTime || toTime(trades[0].time)<=minTime))
						[minTime, minTimeArray, index] = [toTime(trades[0].time), trades, i];
				}
			if (!minTimeArray) return;
			let [firstTrade] = minTimeArray.splice(0, 1);
			AddTradesToTable([{...firstTrade, symbol: symbols[index]}], scrollerWrap(symScrollers[index]));
			if (tradesTotal>1) SyncTrades();
		}


		//let sumEquity : CTradeBar[] = [];

		let results : [ITradeStatistics, CTradeBar[]][] = [];


		console.log("Запускаем тестирование по",symbols.length,"символам: ",symbols.join(", "));

		let preloadImage= !$visualCheckbox[0].checked ? ShowPreloaderImage($equityChart[0]) : null;//.parent()[0]);


		//for(let syminfo of )


		try
		{
			let testerInfos : CTesterInfo[] = [];


			for(let [iSymbol, symbol] of symbols.entries())
			{
				//let symbol = symbols[0]; //$symbols.val();

				let tickSize= 1;  //symInfo.tickSize= 1;
				let quoteCurrency= "USD"; ////symInfo.quoteCurrency= "USD";
				let priceInfo= GetSymbolQuotesGetter (symbol, tickSize, quoteCurrency) ?? (()=>{throw "Failed to get QuotesGetter"})();

				let symInfo : ISymbolInfo = { //= new ISymbolInfo;
					name: symbol,
					lotSize: 1,
					comissionPerSide: comission,
					priceInfo
				}

				let stratInfo= createStrategyObject(strategy, params, TF.get(tfName)!);

				let testerInfo= new CTesterInfo(symInfo, stratInfo, config);

				testerInfos.push(testerInfo);
			}

			// предварительно подгружаем историю по всем символам
			if (isMultiSym) {
				$equityChartName[0].innerText= "Подгрузка истории по "+symbols.length+" символам";
				await Promise.all( testerInfos.map((info)=>LoadSymbolQuotesForTesterInfo(info)) );
				$equityChartName[0].innerText= "Тестирование по "+symbols.length+" символам";
			}


			for(let [iSymbol, symbol] of symbols.entries())
			{
				let testerInfo= testerInfos[iSymbol];
				//defaultSymbol : null,
				//defaultTF : tf
				// /** Функция добавления сделки в таблицу
				//  * @param{TradeData[]} trades
				//  * @param{function(time :string)} scroller  // функция прокрутки к выбранной дате на графике
				//  */
				// function addTradesToTable(trades :readonly TradeData[], scroller :(time :string)=>void) {
				// 	SaveSymbolTrades(iSymbol, trades, scroller);
				// 	// _scrollChartFunc= scroller;
				// 	// AddTradesToTable(trades, scroller);
				// }

				function saveTrades(trades :readonly TradeData[], scroller :(time :const_Date)=>void) {
					SaveSymbolTrades(iSymbol, trades, scroller);
				}

				function onTesterProgress(percent :number) { onSymbolTesterProgress(iSymbol, percent); }

				let [priceChartElement, equityChartElement] =
					symbols.length==1 ? [$priceChart[0], $equityChart[0]]
									  : [AddQuotesChart(symbol+", "+tfName), AddEquityChart(symbol+", "+tfName+", "+strategyName)];
				if (priceChartElement!=$priceChart[0])
					priceChartElement.style.marginTop = "30px";
				else $priceChartName[0].innerText= symbol+", "+tfName;

				let preloadImg = equityChartElement!=$equityChart[0] ? ShowPreloaderImage(equityChartElement) : null;
				//let [result, equity];
				function getSpeed() { return testerSpeedMutable.value; }

				//=== Функция тестирования //====

				let result = await MyTester.Test(testerInfo, priceChartElement, equityChartElement, saveTrades, getSpeed, onTesterProgress)
					.finally(()=>preloadImg?.remove());
				await lib.sleepAsync(0);

				results.push(result);

				console.log("Statistics:",result ? result[0] : undefined);

				if (result)
					addStatisticsTable(result[0], symScrollers[iSymbol]);

				if (isMultiSym && result) {
					let color= equityColors[iSymbol];
					let series :ISeriesApi<"Line">|null;
					AddLegendItemToChart($equityChart[0], symbol, false, equityColors[iSymbol],
					(el :HTMLInputElement)=> {
						if (series) multiEquityChart.removeSeries(series);
						series= null;
						if (el.checked) {
							//if (series) series.remove();
							series = multiEquityChart.addLineSeries({
								color: color,
								lineWidth: 1,
							});
							let equity = result[1];
							//let range = { from: Number.MAX_VALUE, to: Number.MIN_VALUE, ...multiEquityChart.timeScale().getVisibleRange() };
							series.setData(equity.map((bar)=>function(){ return { time: bar.time, value: bar.close}}()));
							if (equity.length>0 && results.length==1)  // расчитываем только при первом элементе
								multiEquityChart.timeScale().setVisibleRange(
									{from: equity[0].time, to: equity[equity.length-1].time}
									//{from: Math.min(range.from.valueOf(), equity[0].time.valueOf()), to: Math.max(range.to.valueOf(), equity[equity.length-1].time.valueOf())}
								);
						}
					});
					DrawSumEquity(false); //$testProgressBar[0].value); //percents[iSymbol]);
				}
				if (!_testing || testerSpeedMutable.value==-1) break;
				//symTradeArrays[iSymbol] = null;
				//sumEquity.push(...equity);
			}
		}
		finally { preloadImage?.remove(); }

		// Сортируем сделки от символов и выводим в таблицу
		let allTrades : (SymTradeData & {symIndex :number})[] = [];
		for(let [i,trades] of symTradeArrays.entries())
			for (let trade of trades??[]) allTrades.push({...trade, symbol: symbols[i], symIndex: i});

		function toTime(t :string|const_Date) { return typeof t=="string" ? new Date(t) : t; }
		//for(let [i,trades] of symTradeArrays.entries()) allTrades.push([...trades?.map((trade)=>({{...trade}, symbol: symbols[i], symIndex: i}))]);
		allTrades.sort((a,b)=> toTime(a.time).valueOf() - toTime(b.time).valueOf()); //a.symIndex - b.symIndex );
		if (symbols.length==1)
			AddTradesToTable(allTrades, scrollerWrap(symScrollers[0]));
		else
			for(let trade of allTrades) AddTradesToTable([trade], scrollerWrap(symScrollers[trade.symIndex]));
		//SyncTrades();

		//console.log("allTrades:",allTrades);


		function DrawSumEquity(finished = false) //percent :number = 100)
		{	// Рисуем график суммарного эквити
			let barsArrays = results.map((result)=>result[1]);
			let sumEquity = isMultiSym ? GetSumEquity(barsArrays) : barsArrays[0];
			//let chart= DrawCandleChart(sumEquity, $equityChart[0])[0];
			let [r,g,b]= colorStringToRGBA(EquityChartColor)!;
			let alpha = finished ? 1 : (results.length/symbols.length)**2;
			let color= `rgba(${r},${g},${b},${alpha})`;
			//console.log("percent= "+percent,"  alpha="+alpha);
			//let finished = percent==100;
			if (_mainChartSeries) multiEquityChart.removeSeries(_mainChartSeries);
			let series = multiEquityChart!.addLineSeries({
				color: color, //'rgba(255, 144, 0, 1)',
				lineWidth: isMultiSym ? 2 : 1,
				//lineStyle: finished ? "Solid" : "Dotted"
			});
			_mainChartSeries = series;
			series.setData(sumEquity.map((bar)=>function(){ return { time: bar.time, value: bar.close}}()));

			if (sumEquity.length)
				multiEquityChart!.timeScale().setVisibleRange({from: sumEquity[0].time, to: sumEquity[sumEquity.length-1].time});

			$equityChartName[0].innerText=
				results.length==symbols.length
					? "Equity Total for "+symbols.length+" symbols"
					: "Equity Total for "+results.length+"/"+symbols.length+" symbols";
			// SetLegendToChart($equityChart[0], "Symbols", (element)=>alert(element.value));
			// for(let symbol of symbols)
			// 	AddLegendItemToChart($equityChart[0], symbol, false, equityColors[0]);
			return sumEquity;
		}


		let sumEquity= isMultiSym ? DrawSumEquity(true) : results[0][1];

		let sumStats = isMultiSym ? new TradeStatistics(sumEquity) : results[0][0];

		if (isMultiSym) console.log("TotalEquity:",[sumEquity.map(function(bar){ return { time: bar.time, close: bar.close, volume: bar.volume, comission: bar.comission};})]);

		let scrollChartFunc = symScrollers[0];

		if (isMultiSym)
			scrollChartFunc = (time :const_Date)=>scrollChartToTime(multiEquityChart, time); //new Date(time+" GMT"));

		function scrollerWrap(srcSroller : (time :const_Date)=>void) { return (timeStr :string)=>srcSroller(new Date(timeStr+" GMT")); }

		//console.log(mainStatsTable!=null);

		mainStatsTable?.append( createStatisticsTableBody(sumStats, scrollChartFunc) );

		console.log("finish");

		//addStatisticsTable(sumStats, scrollChartFunc ? (time)=>scrollChartFunc!(time) : undefined);

		// if (symbols.length>1)
		// 	for(let [i, symbol] of symbols.entries())
		// 		if (results[i])
		// 			addStatisticsTable(results[i][0], symScrollers[i]);
		// 		else break;


		//document.getElementById(quotesChartName).innerText= symbol;
		//document.getElementById(quotesChartName).innerHTML= symbol;

		// $quotesChartName[0].innerText = symbol+", "+tfName;
		// $("#equityChartName")[0].innerText= "Equity for "+symbol+", "+tfName+", "+strategy;

		//alert($("#quotesChartName").text());
		//alert("!");
		//alert(params);

		//let signaller= strategyInfo.getSignaller(params);

		//Tester.RunSignallerTest(signaller, params, 5);

		//alert(symbol+"  "+strategy+"  "+startDate);
	}
}

//Test();

/**
 * @param{HTMLInputNumberElement} rangeElement
 * @param{HTMLElement} valueElement
 * @param{string} valueStr
 */
function displayRangeValue (rangeElement :HTMLInputNumberElement, valueElement :HTMLElement, valueStr? :string) {
	const inp = rangeElement;
	const value= +inp.value;
	const min = inp.min ?? 0;
	const max = inp.max ?? 100;
	const width = inp.offsetWidth;
	const offset = -20;
	const percent = (value - min) / (max - min);
	const pos = percent * (width + offset);// - 40;
	//const pos = percent * (width);
	valueElement.innerHTML = valueStr ?? value+"";
	//console.log("percent="+percent,"width="+width, "offset="+offset," pos="+pos)
	valueElement.style.marginLeft = pos+'px';
}




function createStatisticsTableBody(stats : ITradeStatistics, scrollChartFunc? :(time:const_Date)=>void) {
	let statBody= document.createElement("tbody");
	setStatisticsTableToBody($(statBody), stats, scrollChartFunc ? (time)=>scrollChartFunc(time) : undefined);
	return statBody;
}


// /** @param {TradeStatistics} stat
//  * @param {(Date)=>void} onClickTime
//  */
function setStatisticsTableToBody(tableBody : JQuery<HTMLTableSectionElement>, stat :ITradeStatistics, onClickTime? :(time :const_Date)=>void) // : Readonly<MyTester.TradeStatistics>)
{
	tableBody.empty();
	if (!stat) return;

	function push(name :string, value :number|string|const_Date|undefined|null, value2? :number|const_Date, unit? :string) {
		if (unit) unit=" "+unit; else unit="";
		function valToStr(val :typeof value) { return val instanceof Date ? Time.timeToStr_yyyymmdd_hhmm(val) : typeof val=="number" ? lib.DblToStrAuto(val, -4)+unit : val; }
		let valStr= valToStr(value);
		let tr = document.createElement("tr");
		if (value==undefined) valStr="-";
		else if (value2!=undefined) valStr += " &nbsp;("+ "<a style='font-size:small'>"+valToStr(value2)+"</a>" + ")";
		tr.innerHTML = `<td>${name}</td> <td>${valStr}</td>`;
		if (value2 instanceof Date) {
			let el= $(tr).children()[1];
			el.style.cursor="pointer";  if (onClickTime) el.onclick= ()=>onClickTime(value2); //_scrollChartFunc(value2.toString());
		}
		tableBody.append(tr);

		return $(tr).children()[1];
	}

	function push$(name :string, value :number|undefined|null, value2? :const_Date) { return push(name, value, value2, "$"); }

	push$("Прибыль", stat.resultProfit);
	push$("Максимум прибыли",stat.maxProfit, stat.maxProfitTime);
	push$("Минимум прибыли",stat.minProfit, stat.minProfitTime);
	push$("Макс. просадка ",stat.maxDrawdown, stat.maxDrawdownTime);
	push("Всего сделок",stat.trades);
	push("Число покупок",stat.buys);
	push("Число продаж",stat.sells);
	push("Всего лотов",stat.totalVolumes);
	push("Лотов на покупку",stat.buyVolumes);
	push("Лотов на продажу",stat.sellVolumes);
	push$("Комиссии",stat.comissions);
	push$("Сред. профит на сделку",stat.avrgProfitPerTrade);
	push$("Сред. профит на лот",stat.avrgProfitPerVolume);
	push("Сред. длительность позиции",Time.durationToStrNullable(stat.avrgTradeDuration_ms));
	push("Фактор восстановления",stat.recoveryFactor);
	push("Коэффициент Шарпа",stat.sharpCoef);
}





