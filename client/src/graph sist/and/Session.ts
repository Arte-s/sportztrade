import {CSystemBoxArray, ICSystemBoxArray, tBoxExport, tBoxExportShort} from "./sytemBox";


export type tSessionAllData = {name: string, date: Date, boxArray: {box: tBoxExport[]}}
export type tSessionAllDataShort = {name: string, date: Date, boxArray: {box: tBoxExportShort[]}}


export interface ISessionAll {
    boxArray: ICSystemBoxArray;
    name: string;
    date: Date;
    getKeySession(): { date: Date; id: string };
    setKeySession({id, date}: { id: string, date: Date | null }): void;
    Export(): tSessionAllData;
    Import({name, date, boxArray}: tSessionAllData): void;
    ExportShort(): tSessionAllDataShort;
    ImportShort({name, date, boxArray}: tSessionAllDataShort): void;
}

export class CSessionAll implements ISessionAll {
    constructor(name: string) {
        this.name = name
    }

    boxArray: ICSystemBoxArray = new CSystemBoxArray();
    name: string = "base"
    date: Date = new Date()

    getKeySession() {
        return {id: this.name, date: this.date}
    }

    setKeySession({id, date}: { id: string, date: Date | null }) {
        this.name = id;
        this.date = date ?? this.date
        if (typeof date == "string") {
            this.date = new Date(date);
        }
    }

    Export(): tSessionAllData {
        return {name: this.name, date: this.date, boxArray: this.boxArray.Export()}
    }

    Import({name, date, boxArray}: tSessionAllData) {
        this.setKeySession({id: name, date})
        this.boxArray.Import(boxArray);
    }

    ExportShort(): tSessionAllDataShort {
        return {name: this.name, date: this.date, boxArray: this.boxArray.ExportShort()}
    }

    ImportShort({name, date, boxArray}: tSessionAllDataShort) {
        this.setKeySession({id: name, date})
        this.boxArray.ImportShort(boxArray);
    }
}
