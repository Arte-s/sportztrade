///// <reference lib="dom"/>

//declare type HTMLCanvasElement= Object;

import * as Charts from "./lightweight-charts";

import type {IChartApi, ISeriesApi, SeriesMarker, ChartOptions} from "./lightweight-charts"
import {const_Date} from "../Time";
import {BSearch} from "../Common"
import type {ColorString} from "../CGraphObject";

export * from "./lightweight-charts";


//LightweightCharts.createChart(null, null);


//import type LightweightCharts from "lightweight-charts"

//import {LightweightCharts} from "./lightweight-charts.standalone.development.js";
//export type * from "lightweight-charts";


//class ChartMarker { time: Date;  position: string;  color: string;  shape: string;  text: string }

//enum E_MARKERPOSITION { aboveBar"aboveBar", "belowBar" };


///**
// *	@type {Date};  @type {string};  @type {color};  @type {string};  @type {string};
// */
//export class ChartMarker { time : string|const_Date;  position :string;  color :string;  shape :string;  text :string }
export type IChartMarker = SeriesMarker<string|const_Date>;  // //{ time : string|const_Date;  position :string;  color :string;  shape :string;  text :string }


type ChartBar = { time: string|const_Date,  open :number,  high :number,  low :number,  close :number }



export function CreateMyChartArea(div :HTMLElement) {
	const chart = Charts.createChart(div, {  //document.getElementById(div),
		//width: 600,
		//height: 300,
		layout: {
			backgroundColor: '#000000',
			textColor: 'rgba(255, 255, 255, 0.9)',
		},
		grid: {
			vertLines: {
				color: 'rgba(197, 203, 206, 0.5)',
			},
			horzLines: {
				color: 'rgba(197, 203, 206, 0.5)',
			},
		},
		crosshair: {
			mode: Charts.CrosshairMode.Normal,
		},
		rightPriceScale: {
			borderColor: 'rgba(197, 203, 206, 0.8)',
			scaleMargins: {
				top: 0.1,
				bottom: 0.05,
			},
		},
		timeScale: {
			borderColor: 'rgba(197, 203, 206, 0.8)',
			timeVisible: true,
			rightOffset: 5
		},
	});

	// Отключаем ограничение на минимальную ширину бара
	(chart as any)._private__chartWidget._private__model._private__timeScale._private__minBarSpacing= 0;

	return chart;
}

export const DefaultChartColor = 'rgba(255,144,0,1)';


export function DrawCandleChart(bars :readonly Readonly<ChartBar>[],  divOrChart :HTMLElement|IChartApi,  color :string|undefined=DefaultChartColor, markers? :readonly IChartMarker[]|null, timeShift_s :number=0)
	: [IChartApi, ISeriesApi<'Candlestick'>]
{
	let chart= (divOrChart as IChartApi).addBarSeries!=undefined ? divOrChart as IChartApi : CreateMyChartArea(divOrChart as HTMLElement);

	let options : ChartOptions = chart.options();

	//options.rightPriceScale.scaleMargins= { bottom: 0.05, top: 0.1 };
	let candleSeries = chart.addCandlestickSeries({
		upColor: '#000',
		downColor: color,
		borderDownColor: color,
		borderUpColor: color,
		wickDownColor: color,
		wickUpColor: color,
		//period: "60",
	});
	//let series : ISeriesApi<"Candlestick"> = candleSeries;

	//console.log("***************",timeShift_s);
	function shiftedDate(time :const_Date|string, shift_s :number) : Date { return time instanceof Date ? new Date(time.valueOf()+shift_s*1000) : shiftedDate(new Date(time as string), shift_s); }
	let srcBars = bars;
	if (timeShift_s!=0)
	{
		bars= bars.map((bar)=>{ return { time: shiftedDate(bar.time, timeShift_s),  open: bar.open,  high: bar.high,  low: bar.low,  close: bar.close}; });
		if (markers) markers= markers.map((marker)=>{ marker= {...marker};  marker.time= shiftedDate(marker.time, timeShift_s);  return marker; }); // }//{ time: shiftedDate(bar.time, timeShift_s),  open: bar.open,  high: bar.high,  low: bar.low,  close: bar.close}; });
	}

	candleSeries.setData(bars);//, $div);

	//candleSeries.update({time: "2020-10-01", open: 1000, high: 2000; low: 500; close: 800});

	if (markers) candleSeries.setMarkers(markers);

	//Object.SeriesMarkersPaneView.prototype._internal_autoScaleMargins;

	if (0)
	chart.timeScale().setVisibleLogicalRange({
		from: 0,
		to: bars.length+1
	});


	//console.log("before: ",{...chart.timeScale().getVisibleLogicalRange()});
	//if (0)
	//if (chart.timeScale().getVisibleLogicalRange())
	//let visibleRange= chart.timeScale().getVisibleLogicalRange();  console.log(visibleRange);
	//if (visibleRange) chart.timeScale().setVisibleLogicalRange({from: visibleRange.from,  to: visibleRange.to+5});
	//console.log("after: ",{...chart.timeScale().getVisibleLogicalRange()});
	return [ chart, candleSeries ]
}


export type ChartInternalPoint = { readonly _internal_time : { readonly _internal_timestamp: number }; } //get timeStamp()  { return this._internal_time._internal_timestamp; } }

interface IChartApiMy extends IChartApi {
	internalPoints : readonly ChartInternalPoint[];
	timeToIndex(time :const_Date) :number;
	scrollChartToTime(time :const_Date) : void;
}

let ChartsModule = Charts as typeof Charts & Mutable<IChartApiMy>;


//export {IChartApiMy as IChartApi};
//chartInternalPoints(chart :IChartApi) : readonly ChartInternalPoint[]
//ChartsModule.internalPoints = get

export function chartInternalPoints(chart :IChartApi) : readonly ChartInternalPoint[] { return (chart.timeScale() as any)._private__model._private__timeScale._private__points as []; }

export function chartTimeToIndex(chart : IChartApi,  time :const_Date) {
	//let pos= priceChart.timeScale().scrollPosition();
	let points= chartInternalPoints(chart);  if(!points) return -1;
	let i= BSearch(points, time.valueOf(), (point, timeVal)=>Math.sign(point._internal_time._internal_timestamp*1000 - timeVal), BSearch.LESS_OR_EQUAL);
	return i;
}

export function scrollChartToTime(chart : IChartApi,  time :const_Date) {
	if (!chart) return;
	let i= chartTimeToIndex(chart, time);
	let range= chart.timeScale()?.getVisibleLogicalRange();
	let rangeSize= range ? range.to.valueOf() - range.from.valueOf() : 0; //if (range)alert(range.from+"  "+range.to);
	chart.timeScale().scrollToPosition(-(chartInternalPoints(chart).length-1-i - rangeSize/2), true);
}
