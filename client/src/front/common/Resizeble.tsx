import React from "react";
import {Enable, Resizable} from "re-resizable";

type tSize = {height: number|string, width: number|string}
type tExRND = {size: tSize}

export function FResizableReact(){
    return {
        Export:() => {
            // потом надо сделать стандарт отправки данных
            return ResizableReact._map
        },
        Import:() => {
            // потом надо сделать стандарт получения данных
            return ResizableReact._map
        }
    }
}

//класс создает под окно которое можно редактировать мышкой
export class ResizableReact extends React.Component<{style?: React.CSSProperties | undefined, enableResize?:Enable, keyForSave?: string, update?: (data: any) => void, sizeDef: tSize, children: React.ReactElement| JSX.Element }, any> {
    state = {refresh: false}
    static _map = new Map<string, tExRND>();
    sizeDef: tSize = {height: 400, width: 400}
    Refresh() {
        this.setState({refresh: !this.state.refresh})
    }
    componentDidMount() {
        const {sizeDef, keyForSave} = this.props
        let map: tExRND | undefined;
        if (keyForSave) {
            map = ResizableReact._map.get(keyForSave)
            if (map) this.sizeDef = map.size
        }
        // console.log(this.sizeDef);
    }

    constructor(p: any) {
        super(p);
        const {sizeDef, keyForSave} = this.props
        let map: tExRND | undefined;
        if (keyForSave) {
            map = ResizableReact._map.get(keyForSave)
        }
        // this.position = map?.position ?? this.positionDef
        this.sizeDef =  map?.size ?? {...sizeDef}
        if (keyForSave && !map) ResizableReact._map.set(keyForSave, {size: this.sizeDef})
        this.state = { ...sizeDef, refresh: false}
    }

    render() {
        return <Resizable
                    style={this.props.style}
                    enable={this.props.enableResize}
                    onResizeStop={(e, dir, elementRef, delta) => {
                        if (delta.width && typeof this.sizeDef.width == "number") this.sizeDef.width += delta.width;
                        if (delta.height && typeof this.sizeDef.height == "number") this.sizeDef.height += delta.height;
                        // this.Refresh()
                    }}
                    onResize={(e, dir, elementRef, delta) => {
                        this.props.update?.({e, dir, elementRef, delta});
                    }}
                    size={this.sizeDef}
                    defaultSize={this.sizeDef}
        >
            {this.props.children}
        </Resizable>
    }
}
