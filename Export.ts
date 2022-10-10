import {
    Exporter,
    FloatType,
    Func,
    LiteralExpression,
    ParmType,
    PointerType,
    StructConst,
    StructDef,
    StructuredProjectionExpression
} from "./c_types";
import * as fs from "fs";

export function ExportStructConst(s: StructConst) {
    console.log(`____exports.${s.name} = ${s.structDef.name}:new({${s.parms.join(", ")}})`)
}

export class ExportUtil {
    cPath: string;
    luaPath: string;

    cFile: fs.WriteStream;
    luaFile: fs.WriteStream;

    constructor(cPath: string, luaPath: string) {
        this.cPath = cPath;
        this.luaPath = luaPath;
    }

    WriteLua(s: String) {
        console.log(`lua: ${s}`)
        this.luaFile.write(s + "\n");
    }

    WriteC(s: String) {
        console.log(`C: ${s}`)
        this.cFile.write(s + "\n");
    }

    ExportStruct_Lua(s: StructDef) {
        this.WriteLua(`-- ${s.name}`);
        this.WriteLua(`${s.name} = {}`);
        this.WriteLua(`${s.name}.prototype = {}`);
        this.WriteLua(`${s.name}.read_bindings = {}`);
        this.WriteLua(`${s.name}.write_bindings = {}`);
        for (let m of s.members) {
            this.WriteLua(`${s.name}.read_bindings.${m.name} = function(t) return rl["@"]["${s.name}_read_${m.name}"](rawget(t, "@")) end`);
            this.WriteLua(`${s.name}.write_bindings.${m.name} = function(t, v) return rl["@"]["${s.name}_write_${m.name}"](rawget(t, "@"), v) end`);
        }

        this.WriteLua(`${s.name}.mt = {
    \t __index = function(t, k) return ${s.name}.read_bindings[k](t) end,
    \t __newindex = function(t, k, v) ${s.name}.write_bindings[k](t, v) end
    }`);

        this.WriteLua(`
function ${s.name}:new(o)
    o = o or {}
    setmetatable(o, ${s.name}.mt)

    d = rl["@"]["${s.name}_Alloc"]()
    rawset(o, "@", d)
    return o
end
    `);
        this.WriteLua(`____exports.${s.name} = ${s.name}`)
    }

    private ExportLua(e: Exporter) {
        fs.truncateSync(this.luaPath, 0);
        this.luaFile = fs.createWriteStream(this.luaPath);

        this.WriteLua("return function(____exports)")

        for(let s of e.structs) {
            this.ExportStruct_Lua(s);
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

    ExportGlobalFunction_C(func: Func) {
        this.WriteC(`static int l_${func.name}(lua_State *L) {`);
        let parm_count = func.parms.length;
        let args = [];

        for (let parm_index in func.parms) {
            let parm = func.parms[parm_index];

            let stackPos = -parm_count + parseInt(parm_index);

            let var_parm: ParmType;

            if(parm.typeDef.isStructType()) {
                var_parm = new ParmType(parm.name, new PointerType(parm.typeDef));
            } else {
                var_parm = new ParmType(parm.name, parm.typeDef);
            }

            this.WriteC('\t' + parm.generateLuaGetParm(var_parm, func.name, stackPos))

            // have to dereference if this parm isn't a pointer but the variable is

            if(var_parm.typeDef.isPointerType() && !parm.typeDef.isPointerType()) {
                args.push(`*${parm.name}`);
            } else {
                args.push(`${parm.name}`);
            }
        }

        let callStr = "\t";

        let return_parm: ParmType = null;

        if (func.returnType) {
            return_parm = new ParmType("returnVal", func.returnType);
            callStr += `${return_parm.ToString()} = `;
        }

        callStr += `${func.name}(${args.join(', ')});`;

        this.WriteC(callStr);

        if (func.returnType) {
            this.WriteC("\t" + func.returnType.generateLuaPush(new LiteralExpression(return_parm)) + ";");
            if (!func.returnType.isConst && func.returnType.isPointerType()) {
                this.WriteC(`\tfree(${return_parm.name});`)
            }

            this.WriteC(`\treturn 1;`);
        } else {

            this.WriteC(`\treturn 0;`);
        }
        this.WriteC(`}`);
    }

    ExportC(e: Exporter) {
        let rw_methods = ["read", "write"];



        this.WriteC(`#include <cstring>`);
        this.WriteC(`#include "raylib.h"`);
        this.WriteC(`extern "C" {`);
        this.WriteC(`#include <lua/lauxlib.h>`);
        this.WriteC(`#include <lua/lualib.h>`);
        this.WriteC(`}`);

        for(let s of e.structs) {
            let userdata_parm = new ParmType("_userdata", new PointerType(s));

            for (let m of s.members) {

                // auto x = val->x;
                // _val->x
                let userdata_proj = new StructuredProjectionExpression(userdata_parm, m);


                let returnVals = [1, 0];
                let stackPos = [-1, -2];
                for(let i = 0; i < 2; i++) {
                    let method_name = `${s.name}_${rw_methods[i]}_${m.name}`;
                    this.WriteC(`static int ${method_name}(lua_State *L) {`);


                    // if(!lua_isuserdata(L, -1)) {
                    //  ...
                    // }
                    // "T * val = (T *) lua_touserdata(L, -1)"
                    this.WriteC(s.generateLuaTo(userdata_parm, method_name, m, stackPos[i]));

                    if(i == 0) {
                        // "lua_pushnumber(L, val->x);"
                        this.WriteC('\t' + m.typeDef.generateLuaPush(userdata_proj) + ";");
                    } else {
                        let member_parm = new ParmType(`_${m.name}`, m.typeDef);

                        this.WriteC('\t' + m.generateLuaGetParm(member_parm, "???", -1));
                        // "_val->x = x;"
                        this.WriteC(`\t${userdata_proj.ToString()} = ${member_parm.name};\n`);
                    }

                    this.WriteC('\t' + `return ${returnVals[i]};`);
                    this.WriteC(`}\n`);
                }
            }

            this.WriteC(`static int ${s.name}_Alloc(lua_State *L) {`);
            this.WriteC(`\tauto val = (${s.name} *) lua_newuserdata(L, sizeof(${s.name}));`)
            this.WriteC(`\tmemset(val, 0, sizeof(${s.name}));`)
            this.WriteC(`\treturn 1;`);
            this.WriteC(`}\n`);
        }

        for(let s of e.globalFunctions) {
            this.ExportGlobalFunction_C(s);
        }


        this.WriteC(`void init_raylib_bindings1(lua_State *L) {`);
        this.WriteC(`\tlua_createtable(L, 0, 200);`);
        this.WriteC(`\tlua_createtable(L, 0, 200);`);
        this.WriteC(`\tlua_setfield(L, -2, "@");`);
        this.WriteC(`\tlua_getfield(L, -1, "@");`);
        for(let s of e.structs) {
            for (let m of s.members) {
                for(let i = 0; i < 2; i++) {
                    let method_name = `${s.name}_${rw_methods[i]}_${m.name}`;
                    this.WriteC(`\tlua_pushcfunction(L, ${method_name});`)
                    this.WriteC(`\tlua_setfield(L, -2, "${method_name}");`)
                }
            }

            this.WriteC(`\tlua_pushcfunction(L, ${s.name}_Alloc);`)
            this.WriteC(`\tlua_setfield(L, -2, "${s.name}_Alloc");`)
        }

        this.WriteC(`\tlua_pop(L, 1);`);
        this.WriteC(`\tlua_setglobal(L, "rl");`);
        this.WriteC(`}\n`);

        this.cFile.on('finish', () => {
            console.log("done");
        });
    }

    Run(e: Exporter) {
        fs.truncateSync(this.cPath, 0);
        this.cFile = fs.createWriteStream(this.cPath);

        this.ExportLua(e)
        this.ExportC(e);

        // fs.closeSync(this.cFile);
        // fs.closeSync(this.luaFile);
    }
}