/* Imports */
/*
import * as am4core from "./node_modules/@amcharts/amcharts4/core";
import * as am4charts from "./node_modules/@amcharts/amcharts4/charts";
import am4themes_animated from "./node_modules/@amcharts/amcharts4/themes/animated";
*/

import * as am4core from "@amcharts/amcharts4/core";
import * as am4charts from "@amcharts/amcharts4/charts";
import am4themes_animated from "@amcharts/amcharts4/themes/animated";


export type ChartBar= Readonly<{
	date,
	open,
	high,
	low,
	close
}>


export function DrawChart(div :string,  bars :readonly ChartBar[]) {
	console.log("Drawing the chart");
	/* Chart code */
// Themes begin
	am4core.useTheme(am4themes_animated);
// Themes end

	let chart = am4core.create(div, am4charts.XYChart);
	chart.paddingRight = 20;

	chart.dateFormatter.inputDateFormat = "yyyy-MM-dd";

	let dateAxis = chart.xAxes.push(new am4charts.DateAxis());
	dateAxis.renderer.grid.template.location = 0;

	let valueAxis = chart.yAxes.push(new am4charts.ValueAxis());
	valueAxis.renderer.opposite = true; // Справа
	valueAxis.tooltip.disabled = true;

	let series = chart.series.push(new am4charts.CandlestickSeries());
	series.dataFields.dateX = "date";
	series.dataFields.valueY = "close";
	series.dataFields.openValueY = "open";
	series.dataFields.lowValueY = "low";
	series.dataFields.highValueY = "high";
	series.simplifiedProcessing = true;
	series.tooltipText = "Open:${openValueY.value}\nLow:${lowValueY.value}\nHigh:${highValueY.value}\nClose:${valueY.value}";

	chart.cursor = new am4charts.XYCursor();

// a separate series for scrollbar
	let lineSeries = chart.series.push(new am4charts.LineSeries());
	lineSeries.dataFields.dateX = "date";
	lineSeries.dataFields.valueY = "close";
// need to set on default state, as initially series is "show"
	lineSeries.defaultState.properties.visible = false;

// hide from legend too (in case there is one)
	lineSeries.hiddenInLegend = true;
	lineSeries.fillOpacity = 0.5;
	lineSeries.strokeOpacity = 0.5;

	let scrollbarX = new am4charts.XYChartScrollbar();
	scrollbarX.series.push(lineSeries);
	chart.scrollbarX = scrollbarX;

	chart.data = bars as ChartBar[];
	/*
		[{
		"date": "2011-08-01",
		"open": "136.65",
		"high": "136.96",
		"low": "134.15",
		"close": "136.49"
	}, {
		"date": "2011-08-02",
		"open": "135.26",
		"high": "135.95",
		"low": "131.50",
		"close": "131.85"
	}];
	*/
}