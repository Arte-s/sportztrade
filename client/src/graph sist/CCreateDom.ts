class CCreateDom {
    document: Document | any //= document ?? null
    window: any

    createElement(data: string) {
        // console.trace("!!!")
        return this.document?.createElement(data)
    }
}

export const CreateDom = new CCreateDom()
