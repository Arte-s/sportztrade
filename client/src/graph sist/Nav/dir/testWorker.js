let globalVar;
//import Worker from 'worker_threads';
//const worker = require('worker_threads');
function Calculate(cyclesCount = 1) {
    let start = Date.now();
    globalVar = start;
    //return start;
    let count = CycleSize * cyclesCount;
    let stop = start + count;
    let sum = 0;
    for (let i = start; i < stop; i++)
        sum += Math.sqrt(i);
    //for(let i=0; i<count; i++)
    //sum += Math.sqrt(i+globalVar);
    //console.log("result: ",sum," Elapsed:",Date.now()-start,"ms");
    return sum;
}
let onmessage = async function (ev) {
    let result = Calculate(1);
    postMessage(result);
};
function JSON_clone(obj) { return JSON.parse(JSON.stringify(obj)); }
class CMyWorker {
    constructor(file) {
        this.handlers = [];
        this.worker = new Worker(file, { type: "module" });
        this.worker.onmessage = (msg) => { var _a; (_a = this.handlers.splice(0, 1)[0]) === null || _a === void 0 ? void 0 : _a.onResolve(msg.data); };
        this.worker.onerror = (msg) => { var _a; (_a = this.handlers.splice(0, 1)[0]) === null || _a === void 0 ? void 0 : _a.onReject(msg); };
    }
    //async send(arg) : Promise<ParsedUrlQueryInputMy> { return new Promise((onResolve, onReject)=> { this.worker.onmessage= (msg)=>{ return onResolve(msg.data); }; this.worker.onerror= onReject;  this.worker.postMessage(JSON_clone(arg)); }); }
    async send(arg) { return new Promise((onResolve, onReject) => { this.handlers.push({ onResolve, onReject }); this.worker.postMessage(JSON_clone(arg)); }); }
    terminate() { this.worker.terminate(); }
}
const CycleSize = 1000000;
export async function Test(nthreads) {
    //if ((nthreads as any) instanceof String) nthreads= Number.parseInt(nthreads as any);
    let workers = [];
    let tasks = [];
    let time = Date.now();
    let threadCount = 4;
    let isParallel = Boolean(0);
    if (nthreads != undefined) {
        threadCount = nthreads;
        isParallel = threadCount > 1;
    }
    //threadCount=1;
    //isParallel=false;
    console.log(isParallel ? "Параллельное вычисление: " + threadCount + " потоков" : "Одиночное вычисление");
    //console.log(threadCount);
    let sum = 0;
    if (threadCount > 0)
        for (let n = 0; n < 240 / threadCount; n++)
            if (!isParallel)
                sum += Calculate(threadCount);
            else {
                for (let i = 0; i < threadCount; i++) {
                    let worker = n == 0 ? workers[i] = new CMyWorker("testWorker") : workers[i]; //if (n == 0) workers.push(worker);
                    let task = worker.send(null);
                    tasks.push(task);
                    //if (i==0) console.log(n);
                }
            }
    if (isParallel)
        console.log(tasks.length + " задач");
    if (isParallel)
        sum = (await Promise.all(tasks)).reduce((prev, curr) => prev + curr);
    console.log("Elapsed total:", Date.now() - time, "ms,  Sum=", sum);
}
Test(2);
