import {GetSimpleParams, IParamsReadonly, mergeParamValuesToInfos, SimpleParams} from "../CParams";
import {Indicator,IndicatorConstructorAPI} from "../const";
import {tIndicatorPrototype} from "./indicatorAND";
import {deepCloneObject} from "../../Nav/Common"

export type IndParamsInfoExport = { name: string, version: string, paramInfo: IParamsReadonly };

export type IndParamsExport = { name: string, version: string, params: SimpleParams };


export class CIndicatorPrototype<TParams extends IParamsReadonly = IParamsReadonly> { //implements Readonly<tIndicatorPrototype> {

    protected static numId: number = 0;
    readonly numId;
    protected _base: tIndicatorPrototype<TParams>;
    protected _values?: SimpleParams<TParams>;
    private _indicator?: Indicator;
    get indicator() {
        return this._indicator ??= {
            Name: this._base.name,
            Version: this._base.version,
            paramInfo: this._base.paramInfo,
            construct: this._base.construct
        };
    }

    constructor(data: tIndicatorPrototype<TParams>) {
        //if (!data) throw "data is undefined!";
        this._base = {...data, paramInfo: deepCloneObject(data.paramInfo ?? data.paramDefault)}
        //console.log("data",this);
        this.numId = ++CIndicatorPrototype.numId;
        Object.freeze(this._base);
    }

    get base(): Readonly<tIndicatorPrototype> {
        return this._base;
    }

    get version() {
        return this._base.version
    }

    get name() {
        return this._base.name;
    }

    set paramInfo(paramInfo: TParams) {
        this._base = {...this._base, paramInfo: deepCloneObject(paramInfo)};
        this._values = undefined;
        this._indicator = undefined;
    } //else throw "paramInfo is not defined"  //JSON.parse(JSON.stringify(paramInfo))

    get paramInfo() {
        return this._base.paramInfo;
    }

    get paramInfoDefault() {
        return this._base.paramDefault
    }

    get paramsValues(): SimpleParams<TParams> {
        return this._values ??= GetSimpleParams(this.paramInfo) as SimpleParams<TParams>;
    }

    //set paramsValues(params :SimpleParams) { this._paramsValues= deepCloneObject(params); }


    construct(api :IndicatorConstructorAPI) {
        return this._base.construct(this.paramsValues as SimpleParams, api);
    }

    export(): IndParamsInfoExport {
        return {
            name: this.name,
            version: this.version,
            paramInfo: this.paramInfo
        }
    }
}

// изменяемый класс:

export class CIndicatorPrototypeMutable<TParams extends IParamsReadonly = IParamsReadonly> extends CIndicatorPrototype<TParams> {
    importParams(parsedParamInfo: IParamsReadonly) {
        //let newParams= deepCloneObjectMutable(paramInfo);
        function convert(newObj: { [key: string]: any }, srcObj: { readonly [key: string]: any }) {
            let resObj: { [key: string]: any } = {};
            if (srcObj instanceof Array && !(newObj instanceof Array)) return srcObj;
            for (let a in srcObj) {
                let val = newObj[a];
                let srcval = srcObj[a];
                if (val != undefined && typeof val == typeof srcval) {
                    if (typeof val == "object" ?? !(val instanceof Date))
                        resObj[a] = convert(val, srcval);
                    else resObj[a] = val;
                } else resObj[a] = srcval;
            }
            return resObj;
        }

        this.paramInfo = convert(parsedParamInfo, this.paramInfo) as TParams;
        //this._indInfo.paramInfo = {...data.indicator.paramInfo}
    }

    importParamsValues(parsedParams: SimpleParams) {
        this.paramInfo = mergeParamValuesToInfos(this.paramInfo, parsedParams);
        console.log("Indicator param values -> param infos:", this.paramInfo);
    }

}

//export type IIndicatorPrototype = Omit<CIndicatorPrototype, "importParams" | "importParamsValues">;