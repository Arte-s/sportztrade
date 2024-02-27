//import {func} from "./mydir/some"
import {CBar, CBars, CBarsMutable, TF, Period, const_Date, CTick, CreateRandomBars} from "./Bars"
//import * as lib from "./Bars"
import {CQuotesHistory, CQuotesHistoryMutable} from "./MarketData"


//func();

function print(...args : any[]) { console.log(...args); }

//jjjj
//console.log("!");

//function gggg(arg) { }
/*
let arr : CBar[] =
[
	{
	time: new Date("2020-09-01T00:00:00.000Z"),
	open: -0.02,
	high: 0.76,
	low: -0.6900000000000001,
	close: -0.66,
	volume: 0
},
{
	time: new Date("2020-09-01T01:00:00.000Z"),
		open: -0.58,
		high: -0.41000000000000003,
		low: -0.7000000000000001,
		close: -0.5,
		volume: 0
},
{
	time: new Date("2020-09-01T02:00:00.000Z"),
		open: -0.5700000000000001,
		high: -0.53,
		low: -0.78,
		close: -0.76,
		volume: 0
},
{
	time: new Date("2020-09-01T03:00:00.000Z"),
		open: -0.68,
		high: 0.17,
		low: -0.84,
		close: 0.11,
		volume: 0
}
];
*/

//let bars= new CBars(TF.H1, arr);

test();

function test() {

	let bars = CreateRandomBars(TF.M5, new Date("2020-09-01 00:00"), 8);

	console.log(bars.data);


	let newTf = TF.M15

	console.log("\n=== Convert bars to", newTf.name)


	let newBars = bars.toBars(newTf);

	console.log(newBars.data);


	/*
	console.log("\n=== Add new bar");

	let newBars2 = newBars.concat(new CBar(new Date("2020-09-20"), 0, 0, 0, 0, 0));

	console.log(newBars2);
	*/

	console.log("\n=== Create quotes history");

//let history= new CQuotesHistory(newBars2);
	let history = new CQuotesHistoryMutable();
	history.AddEndBars(newBars);
	//return;
	print(history);

	let bar : CBar = {
		time: new Date("2020-08-31T21:30:00.000Z"),
		open: 0.03,
		high: 0.54,
		low: -0.9400000000000001,
		close: -0.9,
		volume: 900,
		tickVolume: 0
	};


	//let bar2= new CBar(new Date("2020-08-31T21:00:00.000Z"), 0.03, 0.54, -0.9400000000000001, -0.9, 900);

	print("\nAddBar->");
	history.AddEndBars(bar, TF.M30);
	//history.AddEndBars([bar,bar], TF.M30);
	//return;
	print(history.mainDatas[0]);
	//print(history.minTf);

	//return;

	if (1) {
		let tf = TF.H4;
		print("\n=== Get history bars ", tf.name);

		let histbars = history.Bars(TF.H4);

		print(histbars);
	}
	if (1) {
		let tf = TF.H1;
		print("\n=== Add bars ", tf.name);

		let newBar = new CBar(new Date("2020-10-1"), 2, 2.4, 2.2, 1.6, 100);
		history.AddEndBars(newBar, tf);

		print(history.Bars(TF.H4));
	}
	if (1) {
		print("\nAdd ticks");
		let ticks: CTick[] = [
			new CTick(new Date("2020-10-1 00:00:01"), 2.5, 5),
			new CTick(new Date("2020-10-1 00:00:01"), 2.6, 6),
			new CTick(new Date("2020-10-1 10:00"), 2.7, 7)
		];

		let ok = history.AddTicks(ticks);
		print(ok);
		print(history.Bars(TF.S1));
		//print(history.Bars(TF.S5));
	}

	if (0)
	{
		let tf = TF.S5;
		print("\n=== Add bars ", tf.name);
		let newBar = new CBar(new Date("2020-10-2"), 2, 2.4, 2.2, 1.6, 100);
		history.AddEndBars(newBar, TF.H1);
		print(history.Bars(TF.S1));

	}
//print(history.stateID);
}


function Test2()
{
	print("New test");

	let bars= new CBarsMutable(TF.H1);

	let bar= new CBar(new Date("2021-04-21 06:00:00 GMT+3"), 56185, 56204, 55601.5, 55602, 1 )

	//
	bars.Add(bar);

	print("Source bars:\n",bars);

	let history= new CQuotesHistoryMutable();
	history.AddEndBars(bars);

	let tick= {time: new Date("2021-04-21 06:52:39 GMT+3"), price: 55601.5, volume: 10120};

	//bars.AddTick(tick);
	//print("New bars:\n",bars);

	history.AddTicks([tick]);

	print("New bars:\n",history.Bars(TF.S1));
}


function Test3()
{
	let barsM5 : CBar[] =
		[
			{
				time: new Date("2020-09-01T00:00:00Z"),
				open: 20,
				high: 22,
				low: 10,
				close: 15,
				volume: 1,
				tickVolume: 0
			},
			{
				time: new Date("2020-09-01T00:05:00Z"),
				open: 10,
				high: 15,
				low: 5,
				close: 7,
				volume: 2,
				tickVolume: 0
			},
			{
				time: new Date("2020-09-01T00:10:00Z"),
				open: 8,
				high: 20,
				low: 6,
				close: 15,
				volume: 3,
				tickVolume: 0
			},
			{
				time: new Date("2020-09-01T00:15:00Z"),
				open: 16,
				high: 25,
				low: 15,
				close: 23,
				volume: 4,
				tickVolume: 0
			},
		]

	let history = new CQuotesHistoryMutable();

	history.AddEndBars(barsM5, TF.M5);

	print("Было:\n", history.Bars(TF.D1)!.data);

	let barM1 : CBar = {
		time: new Date("2020-09-01T00:16:00Z"),
		open: 24,
		high: 26,
		low: 23,
		close: 25,
		volume: 1,
		tickVolume: 0
	};

	//history.AddEndBars(barM1, TF.M1);

	history.AddNewTick({price: barM1.high, time: barM1.time, volume: barM1.volume})

	print("Стало D1:\n", history.Bars(TF.D1)!.data);

	print("Стало M5:\n", history.Bars(TF.M5)!.data);

	let deleteBeforeTime = new Date("2020-09-01T00:10:00Z")
	print("\nудаляем бары до ",deleteBeforeTime);
	history.deleteBefore(deleteBeforeTime);
	print("Стало D1:\n", history.Bars(TF.D1)?.data);
	print("Стало M5:\n", history.Bars(TF.M5)?.data);

}


Test3();
