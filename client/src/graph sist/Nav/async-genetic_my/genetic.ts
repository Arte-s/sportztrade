import { clone, Minimize, Maximize } from './utils';

export const Select = { Tournament2, Tournament3, Fittest, Random, RandomLinearRank, Sequential };
export interface GeneticOptions<T> {
    mutationFunction: (phenotype: T) => T;
    crossoverFunction: (a: T, b: T) => Array<T>;
    fitnessFunction: (phenotype: T) => Promise<number>;
    randomFunction: () => T;
    populationSize: number;
    mutateProbability?: number;
    crossoverProbability?: number;
    fittestNSurvives?: number;
    select1?: (pop :readonly Phenotype<T>[]) => T;
    select2?: (pop :readonly Phenotype<T>[]) => T;
    optimize?: (scoreA: number, scoreB: number) => boolean;
    threads? : number;
}

export interface Phenotype<T> {
    fitness: number;
    entity: T;
}

type GeneticStats = { maximum :number, minimum :number, mean :number, stdev :number };


export class Genetic<T> {
    public stats : GeneticStats= {} as GeneticStats;
    public options: Required<GeneticOptions<T>>;

    protected internalGenState : { [key: string] : number; } = { }; /* Used for random linear */
    private population: Phenotype<T>[] = [];

    public get currentPopulation() :readonly Readonly<Phenotype<T>>[] { return this.population; }
    //console.assert(population.length==this.population.length);
    public set currentPopulation(population : readonly Readonly<Phenotype<T>>[]) { this.population= [...population]; }

    constructor(options: GeneticOptions<T>, private entities: Array<T> = []) {
        let partialCheck : Partial<GeneticOptions<T>>;  // для проверки
        let defaultOptions = partialCheck = {
            populationSize: 250,
            mutateProbability: 0.2,
            crossoverProbability: 0.9,
            fittestNSurvives: 1,
            select1: Select.Tournament2,
            select2: Select.Tournament2,
            optimize: Optimize.Maximize,
            threads: Number.MAX_VALUE, //navigator?.hardwareConcurrency ?? 4
        }
        this.options = { ...defaultOptions, ...options };
    }

    public seed(entities: Array<T> = []) {
        this.entities = entities;

        // seed the population
        for (let i = 0; i < this.options.populationSize; ++i) {
            this.entities.push(this.options.randomFunction());
        }
    }

    public best(count = 1) {
        return this.population.slice(0, count).map((ph) => ph.entity);
    }

    public breed() {
        // crossover and mutate
        const newPop = [];

        // lets the best solution fall through
        if (this.options.fittestNSurvives) {
            newPop.push(...this.population.slice(0, this.options.fittestNSurvives).map((ph) => ph.entity));
        }

        // Length may be change dynamically, because fittest and some pairs from crossover
        while (newPop.length < this.options.populationSize) {
            newPop.push(...this.tryCrossover());
        }

        this.entities = newPop;
    }


    public async estimate() { //isStopped? :()=>boolean) {
        const { fitnessFunction, optimize } = this.options;
        // reset for each generation
        this.internalGenState = {};
        // cleanup score and sort
        this.population.length = 0;

        const tasks = this.entities.map((entity) => fitnessFunction(entity));

        this.population = await (await Promise.all(tasks))
            //this.population = await (await runPromisesByThreads(tasks, this.options.threads))
            .map((fitness, i) => ({ fitness, entity: this.entities[i] }))
            .sort((a, b) => (optimize(a.fitness, b.fitness) ? -1 : 1));

        const popLen = this.population.length;
        const mean = this.getMean();

        this.stats = {
            maximum: this.population[0].fitness,
            minimum: this.population[popLen - 1].fitness,
            mean,
            stdev: this.getStdev(mean),
        };
    }

    private tryCrossover = () => {
        const { crossoverProbability, crossoverFunction } = this.options;
        let selected = crossoverFunction!=undefined && Math.random() <= crossoverProbability ? this.selectPair() : this.selectOne();

        if (selected.length === 2) {
            selected = crossoverFunction(selected[0], selected[1]);
        }

        return selected.map(this.tryMutate);
    };

    private tryMutate = (entity: T) => {
        // applies mutation based on mutation probability
        if (this.options.mutationFunction && Math.random() <= this.options.mutateProbability) {
            return this.options.mutationFunction(entity);
        }

        return entity;
    };

    /**
     * Mean deviation
     */
    private getMean() {
        return this.population.reduce((a, b) => a + b.fitness, 0) / this.population.length;
    }

    /**
     * Standart deviation
     */
    private getStdev(mean: number) {
        const { population: pop } = this;
        const l = pop.length;

        return Math.sqrt(pop.map(({ fitness }) => (fitness - mean) * (fitness - mean)).reduce((a, b) => a + b, 0) / l);
    }

    private selectOne() {
        const { select1 } = this.options;

        return [clone(select1.call(this, this.population))];
    }

    private selectPair() {
        const { select2 } = this.options;

        return [clone(select2.call(this, this.population)), clone(select2.call(this, this.population))];
    }
}

/** Utility */

function Tournament2<T>(this: Genetic<T>, pop :readonly Phenotype<T>[]) {
    const n = pop.length;
    const a = pop[Math.floor(Math.random() * n)];
    const b = pop[Math.floor(Math.random() * n)];

    return this.options.optimize(a.fitness, b.fitness) ? a.entity : b.entity;
}

function Tournament3<T>(this: Genetic<T>, pop: readonly Phenotype<T>[]) {
    const n = pop.length;
    const a = pop[Math.floor(Math.random() * n)];
    const b = pop[Math.floor(Math.random() * n)];
    const c = pop[Math.floor(Math.random() * n)];
    let best = this.options.optimize(a.fitness, b.fitness) ? a : b;
    best = this.options.optimize(best.fitness, c.fitness) ? best : c;

    return best.entity;
}

function Fittest<T>(this: Genetic<T>, pop: readonly Phenotype<T>[]) {
    return pop[0].entity;
}

function Random<T>(this: Genetic<T>, pop: readonly Phenotype<T>[]) {
    return pop[Math.floor(Math.random() * pop.length)].entity;
}

function RandomLinearRank<T>(this: Genetic<T>, pop: readonly Phenotype<T>[]) {
    this.internalGenState['rlr'] = this.internalGenState['rlr'] || 0;
    return pop[Math.floor(Math.random() * Math.min(pop.length, this.internalGenState['rlr']++))].entity;
}

function Sequential<T>(this: Genetic<T>, pop: readonly Phenotype<T>[]) {
    this.internalGenState['seq'] = this.internalGenState['seq'] || 0;
    return pop[this.internalGenState['seq']++ % pop.length].entity;
}

const Optimize = { Minimize, Maximize };



async function runPromisesByThreads<T>(tasks :readonly Promise<T>[], threadCount :number)  { //, taskPerCount = 1) {
    let group = tasks.slice(0, threadCount).map((task, i)=>Promise.all([i, task, i]));
    let results : T[] = [];
    for(let n= group.length; n<=tasks.length; n++) {
        let [i, result, iTask]= await Promise.race(group);
        results[iTask] = result;
        group[i] = Promise.all([i, tasks[n], n]);
    }
    return results;
}