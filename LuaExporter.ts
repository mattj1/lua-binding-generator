import {Exporter, StructConst, StructDef} from "./c_types";

import * as fs from "fs";

export function ExportStructConst(s: StructConst) {
    console.log(`____exports.${s.name} = ${s.structDef.name}:new({${s.parms.join(", ")}})`)
}

export class LuaExporter {
    luaPath: string;
    luaFile: fs.WriteStream;
    exporter: Exporter;

    constructor(filename: string, exporter: Exporter) {
        this.luaPath = filename;
        this.exporter = exporter;
    }

    WriteLua(s: String) {
        console.log(s);
        this.luaFile.write(s + "\n");
    }

    ExportStruct(s: StructDef) {
        this.WriteLua(`-- ${s.name}`);
        this.WriteLua(`local ${s.name} = {}`);
        this.WriteLua(`${s.name}.prototype = {}`);
        this.WriteLua(`${s.name}.read_bindings = {}`);
        this.WriteLua(`${s.name}.write_bindings = {}`);
        for (let m of s.members) {
            // this.WriteLua(`${s.name}.read_bindings.${m.name} = function(t) return rl["@"]["${s.name}_read_${m.name}"](rawget(t, "@")) end`);
            this.WriteLua(`${s.name}.read_bindings.${m.name} = rl["@"]["${s.name}_read_${m.name}"]`);
            // this.WriteLua(`${s.name}.write_bindings.${m.name} = function(t, v) return rl["@"]["${s.name}_write_${m.name}"](rawget(t, "@"), v) end`);
            this.WriteLua(`${s.name}.write_bindings.${m.name} = rl["@"]["${s.name}_write_${m.name}"]`);
        }

        this.WriteLua(`${s.name}.mt = {
    \t __index = function(t, k) return ${s.name}.read_bindings[k](t) end,
    \t __newindex = function(t, k, v) ${s.name}.write_bindings[k](t, v) end
    }`);

        this.WriteLua(`
function ${s.name}:new(args)
    o = {}
    setmetatable(o, ${s.name}.mt)

    d = rl["@"]["${s.name}_Alloc"]()
    rawset(o, "@", d)
    if args then
        for a0, a1 in pairs(args) do
            o[a0] = a1
        end
     end
    return o
end`);
        this.WriteLua(`____exports.${s.name} = ${s.name}`)
    }

    Run() {
        fs.truncateSync(this.luaPath, 0);
        this.luaFile = fs.createWriteStream(this.luaPath);

        this.WriteLua("return function(____exports)")

        for(let s of this.exporter.structs) {
            this.ExportStruct(s);
        }

        // for(let s of e.structConsts) {
        //     ExportStructConst(s);
        // }
        //
        // for(let s of e.globalFunctions) {
        //     ExportGlobalFunction(s);
        // }

        this.WriteLua("return ____exports")
        this.WriteLua("end")

        this.luaFile.on('finish', () => {
            console.log("done");
        });
    }

}