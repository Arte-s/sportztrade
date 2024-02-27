



class Engine {
    quotes: Map<object,object> | undefined

    elements: any[] = []
    map: any
    onTics(type: any){

        this.elements.forEach(e=> {
            const result = e?.onTics?.()
            if (result.jurnal) {}
        })



    }
}





