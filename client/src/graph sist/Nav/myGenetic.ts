import {Genetic} from "./async-genetic_my/genetic";
import {ArrayKeyMap, createArrayKeyMap} from "./myHashMap";
import * as lib from "./Common";
import {createCancellableTaskWrapper} from "./Common";

export class GeneticBaseParams {
    readonly populationSize: number = 250;
    readonly crossoverProbability: number = 0.9;
    readonly mutationProbability: number = 0.2;
}

export function myGeneticAlgorithm<T>(gensDatas: readonly (ArrayLike<T>)[], fitnessFunction: (gens: readonly T[]) => Promise<number>,
                                      geneticParams: GeneticBaseParams, fittestNSurvives: number = 1, threadCount?: number) {
    // Создаём мэпы позиций значений генов
    let posMaps: Map<T, number>[] = [];
    for (let i = 0; i < gensDatas.length; i++) {
        posMaps[i] = new Map();
        for (let j = 0; j < gensDatas[i].length; j++)
            posMaps[i].set(gensDatas[i][j], j);
    }

    function crossoverFunction(mother: readonly T[], father: readonly T[]) {
        // two-point crossover
        let son = [], daughter = [];
        for (let i = 0; i < mother.length; i++) {
            let [parent1, parent2] = (Math.random() >= 0.5) ? [father, mother] : [mother, father];
            son.push(parent1[i]);
            daughter.push(parent2[i]);
        }
        return [son, daughter];
    }

    function mutationFunction(srcGens: readonly T[]) {
        // chromosomal drift
        let newGens = [];
        for (let i = 0; i < srcGens.length; i++)
            if (Math.random() < 0.5) { //geneticParams.mutationProbability) {
                let gen = srcGens[i];
                let pos = posMaps[i].get(gen)!;  // позиция в исходном массиве значений данного гена
                let len = gensDatas[i].length;
                let odds = Math.random() - 0.5;  // Перевес (от -0.5 до 0.5)
                odds *= Math.random();  // квадрат вероятности, чтобы приблизиться к нормальному распределению
                let limit = odds >= 0 ? len - 1 : 0;
                let newpos = pos + Math.round(Math.abs(limit - pos) * odds / 0.5);
                newGens[i] = gensDatas[i][newpos];
                if (newGens[i] == null) { // ! (newGens[i]>0)) {
                    console.error("i=" + i, "gen=" + gen, "pos=" + pos, "odds=" + odds, "newpos=", newpos, "allGens=", gensDatas[i]);
                    throw("!!!");
                }
                //newGens[i]= gensDatas[i][Math.floor(Math.random() * gensDatas[i].length)];
            } else newGens[i] = srcGens[i];
        return newGens;
    }

    function randomFunction() {
        let gens = [];
        for (let i = 0; i < gensDatas.length; i++)
            gens[i] = gensDatas[i][Math.floor(Math.random() * gensDatas[i].length)];
        return gens;
    }

    return new Genetic<readonly T[]>({
        mutationFunction,
        crossoverFunction,
        fitnessFunction,
        randomFunction,
        populationSize: geneticParams.populationSize,
        crossoverProbability: geneticParams.crossoverProbability,
        mutateProbability: geneticParams.mutationProbability,
        fittestNSurvives,
        threads: threadCount
    });
}





export async function myGeneticSolve<T>(genetic: Genetic<readonly T[]>, maxBadExpochs: number = 5, isStopped? :()=>boolean) { //},  cancelToken :ICancelToken= null) {

    const GENERATIONS = Number.MAX_VALUE;
    const popSize = genetic.options.populationSize;
    genetic.seed();
    let _worseResult: number | undefined;
    let badEpochs = 0;
    let oldPopulation: typeof genetic.currentPopulation | undefined;
    const print: (...args: any[]) => void = console.log;

    for (let i = 0; i <= GENERATIONS; i++) {
        console.group("Generation", i + ":  populationSize=", i > 0 ? genetic.currentPopulation.length : genetic.options.populationSize);

        const estimateTask= genetic.estimate(); // Расчёт поколения

        let result= await (isStopped ? createCancellableTaskWrapper(estimateTask, isStopped) : estimateTask);

        if (result=="stopped") { console.log("Genetic is stopped!");  return false; }
        //if (cancelToken?.isCancelled()) break;
        let worseResult = genetic.stats.minimum; //genetic.currentPopulation[genetic.currentPopulation.length-1].fitness;
        let avrgResult = genetic.stats.mean;
        print("best result:", genetic.stats.maximum);
        print("average result:", avrgResult);
        print("worst result:", worseResult);

        function isArraysEqual<T>(array1: readonly T[], array2: readonly T[]) {
            return array1.length == array2.length && array1.every((x, index) => x == array2[index]);
        }


        if (oldPopulation)
            if (true) { //genetic.currentPopulation.find((value,index)=> value.fitness < oldPopulation[index].fitness)) {
                //print("Результаты ухудшились. Возвращаем прошлое поколение");
                let newPop = [...oldPopulation, ...genetic.currentPopulation].sort((a, b) => -Math.sign(a.fitness - b.fitness));
                let ndublicates = 0;
                if (0)
                    for (let n = newPop.length - 2; n >= 0; n--)
                        if (isArraysEqual(newPop[n].entity, newPop[n + 1].entity)) {
                            newPop.splice(n + 1, 1);
                            ndublicates++;
                        }
                if (ndublicates > 0) console.log("Removed " + ndublicates + " dublicates");
                genetic.currentPopulation = newPop.slice(0, popSize); //Math.max(newPop.length-popSize, 0)); //newPop.length/2);
                //worseResult= _worseResult;
            }

        oldPopulation = [...genetic.currentPopulation];
        worseResult = oldPopulation[oldPopulation.length - 1].fitness;

        genetic.breed();  // Кроссоверы и мутации
        console.groupEnd();
        //if (_worseResult!=null) console.assert(worseResult>=_worseResult);
        if (worseResult <= (_worseResult ?? Number.MIN_VALUE))
            if (badEpochs < maxBadExpochs) {
                badEpochs++;
                continue;
            } else break;
        badEpochs = 0;
        _worseResult = worseResult;
    }
    return true;
    //console.log("Results:\n",genetic.currentPopulation); //genetic.best(100));
}


export function cachedFitnessFunction(func : (params :readonly number[])=>Promise<number|undefined>, cacheMap? : ArrayKeyMap<readonly number[],number|null>) {
    cacheMap ??= createArrayKeyMap(); //<readonly number[], number|null>();
    let cache= cacheMap;
    const mutex = new lib.Mutex();
    //const STOPPED= "stopped";

    return async function fitnessFunction(params: readonly number[]) : Promise<number> {
        //params= [...params];
        const unlock = await mutex.lock();  // Нужен монопольный доступ к объекту кэша
        //if (stop) { unlock();  throw STOPPED; }
        let res = cache.get(params);
        //let res= map[params.join(",")];

        if (res !== undefined) {
            //print("Найдена комбинация ", params.join(","));
        }
        else {
            //print("Комбинация параметров: ", ...params);
            res = await func(params).catch((reason)=>{ unlock();  throw reason; }) ?? null;
            cache.set(params, res);
            //print("Записана комбинация: ", ...params);
        }
        unlock();

        return res ?? Number.MIN_VALUE;
    }
}

