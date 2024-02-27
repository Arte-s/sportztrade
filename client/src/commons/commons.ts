
export function NormalizeDouble(value :number, digits :number) { let factor= 10**digits;  return Math.round(value * factor)/factor; }


//callback версия 2.0 по массивам (вдруг окажется производительнее)
export class CObjectEventsArr{
    private data :tListEvent<any, void|object|undefined>[] = []

    private set setup(link:tListEvent) {
        const data = link
        data.del = ()=>{
            for (let i = 0; i < this.data.length; i++) {
                if (this.data[i]==data) {
                    this.data[i].OnDel?.();
                    this.data.splice(i,1)
                    data.OnDel?.();
                    return;
                }
            }
            console.error("элемент уже был удален")
            console.trace()
            data.OnDel?.();
            console.log(this.count());
        }
    }
    AddStart(data:tListEvent)               {this.data.unshift(data); this.setup = data}
    AddEnd(data:tListEvent)                 {this.data.push(data); this.setup = data}
    Add(data:tListEvent)                    {this.data.push(data); this.setup = data}
    OnEvent(data?:any)                      {this.data.forEach((e)=>{e.func?.(data); e.func2?.(data);})}
    // OnSpecEvent<T extends object>(f:(e:T)=>void)           {this.data.forEach((e)=>{let l=e.func?.() as T; if (l) {f(l);}  e.func2?.();})}
    OnSpecEvent<T extends object>(f:(e:T)=>void)           {this.data.forEach((e)=>{const l=e.func?.() as T|undefined; l&&f(l); e.func2?.();})} // l&&f(l);  if (l) {f(l);}
    Clean()                                 {
        for (let i = this.data.length - 1; i >= 0; i--) {
            this.data[i].del?.();
            this.data[i].OnDel?.();
        }
        this.data=[];
    }
    count()                                 {return this.data.length}
    get length()                            {return this.count()}
}

export type tListEvent<T=any, T2=void> = {
    // что нужно выполнить при событии
    func?:(data?:T)=>T2,
    // что нужно выполнить при событии выполниться сразу после первого func2(){this.del()} - удалит текущее событие после выполнения, вызовет OnDel() если он есть
    func2?:(data?:T)=>void,
    // Удаление данного события из списка из вне
    del?:()=>void,
    // Вызывается после удаления данного события из списка
    OnDel?:()=>void
}

export function waitRun() {
    let lastTime: number = Date.now()
    let funcAsync = Promise.resolve();
    let busy: boolean = false
    let lastFunc1: () => void
    return {
        //Сперва запускает, потом ставит ограничения до след запуска, Примечание, просо фильтрует запуск если по времени пауза еще не прошла. Т.е. запуск может не исполнится
        refreshAsync: (ms: number, func: () => void | Promise<void>) => {
            if (lastTime + ms < Date.now() && !busy) {
                busy = true;
                funcAsync = funcAsync.then<void>(() => {
                    func();
                    busy = false;
                    lastTime = Date.now()
                    return;
                })
            }
        },
        //сперва ждет, потом гарантировано запускает последний переданный вариант
        refreshAsync2: (ms: number, func?: () => void | Promise<void>) => {
            if (!func) return;
            lastFunc1 = func
            if (!busy) {
                busy = true;
                funcAsync = funcAsync.then<void>(async () => {
                    await sleepAsync(ms)
                    lastFunc1?.();
                    busy = false;
                    return;
                })
            }
        }
    }
}

export async function sleepAsync(msec :number=0) {
    return new Promise((resolve, reject) => { setTimeout(resolve, msec); });
}


