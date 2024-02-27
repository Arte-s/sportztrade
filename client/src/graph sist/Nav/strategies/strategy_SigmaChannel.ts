import {CBar, TF} from "../Bars";
import {CMA, IIndicator} from "../Indicator";
import {Param, paramType_Bool, paramType_Period} from "../ParamOld";
import {IStrategy} from "../Strategy";



class CStrategy_SigmaChannel implements IStrategy {
	readonly paramInfo = [
		Param("период", {min: 2, step: 1, progressive: true }, 100, {start: 2, end: 10000}),
		Param("число сигм для открытия", {min:1, step: 1}, 2, {start: 1, end: 5}),
		Param("число сигм для закрытия", {min:0, step: 1}, 0, {start: 1, end: 5}),
		Param("только покупки", paramType_Bool, false),
		//Param("Weighted", paramType_Bool, 0)
		//{ name: "Period 1", type: paramType_Period, {min: 1, step: 1, progressive: true}),
		//{ name: "Period 2", {min: 1, step: 1, progressive: true}),
	];
	readonly name = "SigmaChannel";


	getSignaller(param: readonly number[]) {
		const period= param[0];
		const sigmasForOpen = param[1];
		const sigmasForClose = Math.min(param[2], sigmasForOpen);
		const onlyBuy = param[3]==1;
		let _ma= new CMA(period);
		let _prices : number[] = [];
		let _sigma : number|undefined;
		let _signal : number|undefined;

		let _highLevelInd : IIndicator = { value() { return _sigma!=null ? _ma.value()!+sigmasForOpen*_sigma : null; }, name: "High edge" };
		let _lowLevelInd : IIndicator = { value() { return _sigma!=null ? _ma.value()!-sigmasForOpen*_sigma : null; }, name: "Low edge" };

		return {
			onNewBars(bars: readonly CBar[]) {
				let start= Math.max(bars.length - period, 0);
				for(let i=start; i<bars.length; i++) {
					let bar= bars[i];
					_ma.push(bar.close);
					_prices.push(bar.close);
					if (_prices.length==period + 100) _prices.splice(0, 100);
				}
				//_signal= undefined;
			},

			getSignal() {
				//if (_signal!=undefined) return _signal;
				let maValue= _ma.value();  if (maValue==null) return null;
				let sum = 0;
				for(let i= _prices.length-period; i<_prices.length-1; i++)
					sum += (_prices[i] - maValue)**2;
				let sigma= _sigma = Math.sqrt(sum / period);
				let price= _prices[_prices.length-1];
				let offset= price - maValue;
				if (_signal)
					if (offset*Math.sign(_signal)>=sigma*sigmasForClose)
						_signal= 0;
				if (!_signal)
					if (Math.abs(offset) >=sigma*sigmasForOpen)
						_signal= -Math.sign(offset);
					else _signal=0;
				if (onlyBuy && _signal==-1) _signal=0;
				return _signal;
			},

			minRequiredDepthBars: period,

			indicators : [_ma, _highLevelInd, _lowLevelInd]
		}
	}
}




export const Strategy_SigmaChannel = new CStrategy_SigmaChannel;