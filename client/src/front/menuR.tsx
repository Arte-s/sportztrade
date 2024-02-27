import React from "react";
import {mouse} from "./reactI";
import {CMiniMenuForGraph} from "./Elements/miniMenu";


export function RightClickMenu ({children, cor}:{children: React.ReactElement, cor?:{x:number, y:number}}) {
    const data = {x:0,y:0}

    const [show, setShow] = React.useState<{status: boolean, coordinate?: {x: number, y: number}}>({status: true})
    let coordinate= {x: 0, y: 0}
    const coordinateF = () => coordinate

    return <div style={{height: "100%", position: "relative", minWidth: "500px"}}
                onContextMenu={e => {
                    e.preventDefault();
                    e.stopPropagation();
                }}
                ref={(e) => {
                    if (e) {
                        const r = e.getBoundingClientRect()
                        data.x = r.x
                        data.y = r.y
                    }
                }}
                onMouseDown={(event) => {
                    if (event.button == 2) {
                        coordinate = {x: event.clientX - data.x, y: event.clientY - data.y}
                        // coordinate.x = event.clientX - data.x
                        // coordinate.y = event.clientY - data.y
                        console.log({coordinate})
                        setShow({status: true, coordinate: {x: event.clientX - data.x, y: event.clientY - data.y}})
                    }
                    if (event.button == 1) {
                        if (mouse.active) {
                            mouse.active.AutoHeight = !mouse.active.AutoHeight;
                        }

                        setShow({status: false})
                    }
                }}
    >
        {children}
        {show.status &&
            <CMiniMenuForGraph
                onDeInit={() => {
                    setShow({status: false})
                }
                }
                coordinate={{...show.coordinate!}}
            />}
    </div>
}