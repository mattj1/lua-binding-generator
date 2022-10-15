import {StructDef} from "../c_types";

import * as fs from "fs";
import {Exporter} from "../Exporter";

export function ExportLua(exporter: Exporter, path: string, dryRun = false) {

    let luaFile: fs.WriteStream;

    function Write(s: String) {
        console.log(s);
        if(!dryRun) {
            luaFile.write(s + "\n");
        }
    }

    function ExportStruct(s: StructDef) {
        Write(`-- ${s.name}`);
        Write(`local ${s.name} = {}`);
        Write(`${s.name}.prototype = {}`);
        Write(`${s.name}.read_bindings = {}`);
        Write(`${s.name}.write_bindings = {}`);
        for (let m of s.members) {
            if (m.typeDef instanceof StructDef)
                continue;

            // Write(`${s.name}.read_bindings.${m.name} = function(t) return rl["@"]["${s.name}_read_${m.name}"](rawget(t, "@")) end`);
            Write(`${s.name}.read_bindings.${m.name} = rl["@"]["${s.name}_read_${m.name}"]`);
            // Write(`${s.name}.write_bindings.${m.name} = function(t, v) return rl["@"]["${s.name}_write_${m.name}"](rawget(t, "@"), v) end`);
            Write(`${s.name}.write_bindings.${m.name} = rl["@"]["${s.name}_write_${m.name}"]`);
        }

        Write(`${s.name}.mt = {
    \t __index = function(t, k) return ${s.name}.read_bindings[k](t) end,
    \t __newindex = function(t, k, v) ${s.name}.write_bindings[k](t, v) end
    }`);

        Write(`function ${s.name}:new(args)`);
        Write(`\tlocal o = {}`);
        for (let m of s.members) {
            if (!(m.typeDef instanceof StructDef))
                continue;

            Write(`\to.${m.name} = ${m.typeDef.name}:new()`);
        }

        Write(`
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
        Write(`____exports.${s.name} = ${s.name}`)
    }

    if(!dryRun) {
        fs.truncateSync(path, 0);
        luaFile = fs.createWriteStream(path);
    }

    Write("return function(____exports)")

    for (let s of exporter.structs) {
        ExportStruct(s);
    }

    for (let s of exporter.structConsts) {
        let parms = [];
        for (let member of s.structDef.members) {
            parms.push(`${member.name} = ${s.vals[member.name]}`);
        }

        // ____exports.RAYWHITE = Color:new({r = 245, g = 245, b = 245, a = 255})
        Write(`____exports.${s.name} = ${s.structDef.name}:new({${parms.join(", ")}})`);
    }

    for (let s of exporter.enums) {
        Write(`____exports.${s.name} = {`);


        for (let entry of s.entries) {
            Write(`\t${entry.key} = ${entry.value},`)
        }
        // for(let k of Object.keys(s._enum).filter((v) => isNaN(Number(v)))) {
        //
        // }

        Write(`}`)
    }
    Write("return ____exports")
    Write("end")

    if(!dryRun) {
        luaFile.on('finish', () => {
            console.log("done");
        });
    }
}