

class CBaseList<T>{
    data:T|undefined;
}

export class CListNode<T>  extends  CBaseList<T> implements iListNodeMini{
    get count(): number {
        return this._home?._count??-1;
    }

//Просто узлы с контрольным первым и последним узлом - данный узел не доступен через метод Prev() Next() он вернет undefined, тет система закольцовано с жестким разделителем поэтому доступ через методы не будет закольцован) но это джава скриптовый язык
    //так как система закольцована в ней никогда не может содержаться undefined, если он как то туда попал то был нарушен доступ к приватным переменным
    //data;

    private  _stop:boolean=false;//waring   запрещено изменение вне из класа и внутри клсса только при инициализации класса(списка)

    protected _count:number =0
    private _prev:CListNode<T>=this;            //для закольцовывания должна быть приватной
    private _next:CListNode<T>=this;            //для закольцовывания должна быть приватной
    private _home:CListNode<T>|undefined;            //центральный элемент
    private _Init(prev:CListNode<T>,next:CListNode<T>, home:CListNode<T>)        {
        this._prev=prev;
        this._next=next;
        prev._next=next._prev=this;
        this._home=home;
        this.countRef(); // технически может быть про инициализировано множество цепочек за раз, поэтому и пересчитываю количество
        return this;
    } //для закольцовывания должна быть приватной
    //работает только если введено два значения, при пустой инициализации создает новый список т.е. контрольный узел, в котором еще нету рабочих узлов и игнорирует data
    //переносить можно лишь рабочие узлы
    constructor(prev?:CListNode<T>,next?:CListNode<T>, home?:CListNode<T>)  {
        super();
//        console.log(CListNode._valueG);
        CListNode._valueG++;
        CListNode._valueG2++;
        this.id= CListNode._valueG;
        if (prev && next && home) {
            this._Init(prev,next,home);}
        else {
            this._stop=true;
            this._home=this;
        }
        //if ((this._home?.count??0) >50) console.trace("list node",this._home?.count )
    };
    static _valueG:number=0;
    static _valueG2:number=0;
    readonly id:number=CListNode._valueG;
    override valueOf()               {return this.id;}
    countRef():number       {
        let count=0;
        for (let i=this.First(); i; i=i.Next()) {count++}
        if (this._home) this._home._count=count;
        return count;
    }

    Prev():CListNode<T>|undefined             {return !this._prev._stop?      this._prev: undefined;}
    Next():CListNode<T>|undefined             {return !this._next._stop?      this._next: undefined;}
    isPrev():boolean        {return !this._prev._stop;}
    isNext():boolean        {return !this._next._stop;}

    //если произошло зацикливание - значит где есть обращение к приватным методом, скорее свего был сброшен флаг _first и _end
    private _First():CListNode<T>           {let buf:CListNode<T>=this; while (!buf._stop) {buf=buf._prev;} return buf;}//private
    private _End():CListNode<T>             {let buf:CListNode<T>=this; while (!buf._stop) {buf=buf._next;} return buf;}//private

    First():CListNode<T>|undefined            {return this._First().Next();}
    End():CListNode<T>|undefined              {return this._End().Prev();}

    get dataFirst():T|undefined             {return this._First().dataNext;}
    get dataEnd():T|undefined               {return this._End().dataPrev;}
    get dataPrev():T|undefined              {return this.Prev()?.data;}
    get dataNext():T|undefined              {return this.Next()?.data;}
    get dataThis():T|undefined              {return this._stop?          undefined: this.data;}

    isForbidden():boolean   {return this._stop;}
    isExists():boolean      {return this.isForbidden() || this._prev._stop || this._next._stop;}
    //надо дописать для возможного забирания всех элементов списка, ну типо если добавляем целый списко в этотм список, чтобы происходило
    private static _Add<T>(prev:CListNode<T>,next:CListNode<T>,home:CListNode<T>,a:T):CListNode<T> {let buf=new CListNode<T>(prev,next, home); buf.data=a; return buf;}
    AddNext(a?:CListNode<T>|T):CListNode<T>   {return a instanceof CListNode? a._Init(this,this._next, this): a? CListNode._Add<T>(this,this._next,this._home!,a) : new CListNode<T>(this,this._next);}
    AddPrev(a?:CListNode<T>|T):CListNode<T>   {return a instanceof CListNode? a._Init(this._prev,this, this): a? CListNode._Add<T>(this._prev,this,this._home!,a) : new CListNode<T>(this._prev,this);}
    AddEnd(a?:CListNode<T>|T):CListNode<T>    {return this._stop? this.AddPrev(a): this._End().  AddNext(a);}
    AddStart(a?:CListNode<T>|T):CListNode<T>  {return this._stop? this.AddNext(a): this._First().AddPrev(a);}
    forEach(el:(item:T,e?:CListNode<T>)=>void)                         {
        for (let buf=this.First(); buf?.data && !buf.isForbidden();) { let t=buf.Next(); el(buf.data,buf); buf=t;}
    }
    GetArray():T[] {let a:T[]=[]; this.forEach(e=>a.push(e)); return a}
    find(el:(e:CListNode<T>)=>boolean):CListNode<T>|undefined       {let buf=this.First(); for (; buf; buf=buf.Next()) { if (el(buf)) return buf;} return undefined;}
    DeleteLink()             {this._prev._next=this._next; this._next._prev=this._prev; this._prev=this._next=this; this._stop=true; this._home?.countRef(); CListNode._valueG2--; this._home=undefined; }//console.log("DeleteLink")}
    //добавление пачки узлов, переносит только рабочие узлы, можно сослаться на контрольный узел и тогда перенес начнеться с первого рабочего узла
    // AddNextArrayList(start:CListNode<T>,finish:CListNode<T>|undefined=undefined) {// метод не реализован
    //     if (finish===undefined) finish=this.End();
    //     if (start instanceof CListNode && finish instanceof CListNode) {
    //         if (start._stop)  start = start._next;
    //         if (finish._stop) finish=finish._prev;
    //         if (this._prev) {this._prev._next=this._next;} if (this._next) {this._prev._next=this._next;} this._prev=undefined; this._next=undefined;
    //         start ._prev._next=finish._next;//вырезали из прошлого списка
    //         finish._next._prev=start ._prev;//вырезали из прошлого списка
    //         finish._next=this._next;
    //         start ._prev=this;
    //         this._next._prev=finish;
    //         this._next=start;
    //     }
    // }
}


export interface iListNodeMini{
    DeleteLink():void;
}

