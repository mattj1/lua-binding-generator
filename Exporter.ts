import {EnumDef, Func, StructConst, StructDef} from "./c_types";

export class Exporter {
    structs: Array<StructDef> = [];
    globalFunctions: Array<Func> = [];
    structConsts: Array<StructConst> = []
    enums: Array<EnumDef> = [];

    constructor() {
    }

    DefStruct(name: string): StructDef {
        let s = new StructDef(name);
        this.structs.push(s);
        return s;
    }

    DefGlobalFunction(name: string): Func {
        let s = new Func(name);
        this.globalFunctions.push(s);
        return s;
    }

    DefStructConst(name: string, structDef: StructDef, vals: any): any {
        if(structDef == null) {
            throw `struct not found`;
        }
        this.structConsts.push(new StructConst(structDef, name, vals));
    }

    // DefEnum(_enum: any, name: string) {
    //     this.enums.push(new EnumDef(name, _enum));
    // }

    GetStructForName(name: string) {
        let results = this.structs.filter(value => value.name == name);
        if(results.length == 1) {
            return results[0];
        }

        return null;
    }
}