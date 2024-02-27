import {CRobotLimits, CRobotMarket} from "../../../../client/src/sistem/robot/CRobot";
import {ExchangeApi} from "./exchange.service";

// export function runBots(){
//     const robot1 = new CRobotLimits({api: ExchangeApi, symbol:'sym1', userId: 111, paramsStrategy:{}})
//     const robotMarket1 = new CRobotMarket({api: ExchangeApi, symbol:'sym1', userId: 111, paramsStrategy:{}})
//
//     robot1.start()
//
//     setTimeout(()=>{
//             robotMarket1.start()
//             // robotMarket1.start()
//         }
//         ,1000)
//
//     setInterval(()=>{ExchangeApi.getBBO('sym1').then(console.log)},1000)
// }
