import React from "react";
import {ResizeEnable, Rnd} from "react-rnd";

type tPosition = { x: number, y: number }
type tSize = { height: number, width: number }
export type tExRND = { position: tPosition, size: tSize }

type tExRNDProps = {
    zIndex?: number,
    disableDragging?: () => boolean,
    keyForSave?: string,
    update?: (data: any) => void,
    position?: tPosition,
    size?: tSize,
    // getApi?: (api: tExRNDApi)=> void
    children: React.ReactElement
}
type tExRNDAState = {refresh: boolean, disableDragging: boolean|undefined}
export type tExRNDApi = {
    disableDragging: (status: boolean)=> void
}
//класс создает под окно которое можно редактировать мышкой
export class ExRND extends React.Component<tExRNDProps, any> {
    static ExRNDMap = new Map<string, tExRND>();
    private readonly position: tPosition
    private readonly size: tSize
    // api: tExRNDApi = {
    //     disableDragging: status => this.setState({disableDragging: status})
    // }

    positionDef: tPosition = {x: 0, y: 30}
    sizeDef: tSize = {height: 400, width: 400}
    Refresh() {
        this.setState({refresh: !this.state.refresh})
    }

    constructor(p: any) {
        super(p);
        const {position, size, keyForSave} = this.props
        if (position) this.positionDef = {...position}
        if (size) this.sizeDef = {...size}
        let map: tExRND | undefined;
        if (keyForSave) {
            map = ExRND.ExRNDMap.get(keyForSave)
        }
        this.position = map?.position ?? this.positionDef
        this.size = map?.size ?? this.sizeDef
        if (keyForSave && !map) ExRND.ExRNDMap.set(keyForSave, {position: this.position, size: this.size})
        this.state = {...position, ...size, refresh: false, disableDragging: undefined}
    }

    render() {
        return <Rnd disableDragging={this.props.disableDragging?.() ?? false}
                  //  enableResize={this.props.enableResize}
                    style={{
                        zIndex: this.props.zIndex ?? 99,
                    }}
                    onDragStop={(e, data) => {
                        this.position.x = data.x;
                        this.position.y = data.y;
                        this.Refresh()
                    }}
                    onResizeStop={(e, dir, elementRef, delta, position) => {
                        this.position.x = position.x;
                        this.position.y = position.y;
                        this.size.width += delta.width;
                        this.size.height += delta.height;
                        this.Refresh()
                    }}
                    onResize={(e, dir, elementRef, delta, position) => {
                        this.props.update?.({e, dir, elementRef, delta, position});
                    }}
                    position={this.position}
                    size={this.size}
                    default={{...this.positionDef, ...this.sizeDef}}
        >
            {this.props.children}
        </Rnd>
    }
}