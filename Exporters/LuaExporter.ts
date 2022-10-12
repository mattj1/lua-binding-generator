import {Exporter, StructConst, StructDef} from "../c_types";

import * as fs from "fs";

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

        for(let s of this.exporter.structConsts) {
            let parms = [];
            for(let member of s.structDef.members) {
                parms.push(`${member.name} = ${s.vals[member.name]}`);
            }

            // ____exports.RAYWHITE = Color:new({r = 245, g = 245, b = 245, a = 255})
            this.WriteLua(`____exports.${s.name} = ${s.structDef.name}:new({${parms.join(", ")}})`);
        }

        for(let s of this.exporter.enums) {
            this.WriteLua(`____exports.${s.name} = {`);


            for(let k of Object.keys(s._enum).filter((v) => isNaN(Number(v)))) {
                this.WriteLua(`\t${k} = ${s._enum[k]},`)
            }

            this.WriteLua(`}`)
        }
        this.WriteLua("return ____exports")
        this.WriteLua("end")

        this.luaFile.on('finish', () => {
            console.log("done");
        });
    }

}