import {
    Func,
    LiteralExpression,
    ParmType,
    PointerType, StructDef,
    StructuredProjectionExpression, VoidType
} from "../c_types";
import * as fs from "fs";
import {Exporter} from "../Exporter";

export function ExportC(exporter: Exporter, path: string, dryRun = false) {

    let cFile: fs.WriteStream;

    function WriteC(s: String) {
        console.log(`${s}`)
        if(!dryRun) {
            cFile.write(s + "\n");
        }
    }

    function ExportGlobalFunction(func:Func) {
        WriteC(`static int l_${func.name}(lua_State *L) {`);

        let parm_stack_start = -func.parms.length;

        let parm_count = func.parms.length;
        let args = [];

        for (let parm_index = 0; parm_index < func.parms.length; parm_index++) {
            let parm = func.parms[parm_index];

            let stackPos = parm_stack_start + parm_index;

            let var_parm: ParmType;

            if (parm.typeDef.isStructType()) {
                var_parm = new ParmType(parm.name, new PointerType(parm.typeDef));
            } else {
                var_parm = new ParmType(parm.name, parm.typeDef);
            }

            WriteC('\t' + parm.generateLuaGetParm(var_parm, func.name, stackPos))

            // if(parm.typeDef.isStructType()) {
            //     parm_stack_start -= 1;
            // }

            // have to dereference if this parm isn't a pointer but the variable is

            if (var_parm.typeDef.isPointerType() && !parm.typeDef.isPointerType()) {
                args.push(`*${parm.name}`);
            } else {
                args.push(`${parm.name}`);
            }
        }

        let callStr = "\t";

        let return_parm: ParmType = null;

        if (func.returnType && !(func.returnType instanceof VoidType)) {
            return_parm = new ParmType("returnVal", func.returnType);
            callStr += `${return_parm.ToString()} = `;
        }

        callStr += `${func.name}(${args.join(', ')});`;

        WriteC(callStr);

        if (func.returnType) {
            WriteC("\t" + func.returnType.generateLuaPush(new LiteralExpression(return_parm)) + ";");

            if (!func.returnType.isConst && func.returnType.isPointerType()) {
                WriteC(`\tfree(${return_parm.name});`)
            }

            WriteC(`\treturn 1;`);
        } else {

            WriteC(`\treturn 0;`);
        }

        WriteC(`}`);
    }

    if(!dryRun) {
        fs.truncateSync(path, 0);
        cFile = fs.createWriteStream(path);
    }

    let rw_methods = ["read", "write"];

    WriteC(`#include <cstring>`);
    WriteC(`#include <cstdlib>`);
    WriteC(`#include "raylib.h"`);
    WriteC(`#include "raymath.h"`);
    WriteC(`extern "C" {`);
    WriteC(`#include <lua/lauxlib.h>`);
    WriteC(`#include <lua/lualib.h>`);
    WriteC(`}`);

    WriteC(`void *load_member_struct(lua_State *L, int n, const char *member_name) {
    lua_getfield(L, n, member_name);
    lua_pushstring(L, "@"); lua_rawget(L, -2);
    
    void *_val = lua_touserdata(L, -1);
    lua_pop(L, 1); // pop userdata
    lua_pop(L, 1); // pop field
 
    return _val;
}`);

    for (let s of exporter.structs) {
        let var_parm = new ParmType("_val", new PointerType(s));

        WriteC(`${s.name} *load_struct_${s.name}(lua_State *L, int n, bool optional) {`);
        WriteC(`\tif(!lua_istable(L, n)) {`);
        WriteC(`\t\tif(optional) return nullptr;`);
        WriteC(`\t\tprintf("Error: Not a table\\n"); exit(0);`)
        WriteC(`\t\treturn 0;`);
        WriteC(`\t}`);

        WriteC(`\tlua_pushstring(L, "@"); lua_rawget(L, n - 1);`);

        WriteC(`\tif(!lua_isuserdata(L, -1)) {`);
        WriteC(`\t\tprintf("Error: not userdata\\n"); exit(0);`);
        WriteC(`\t\treturn 0;`);
        WriteC(`\t}`);

        WriteC(`\t${var_parm.ToString()} = (${var_parm.typeDef.name}) lua_touserdata(L, -1);`);
        WriteC(`\tlua_pop(L, 1); // pop the userdata`)

        for (let m of s.members) {
            if (!(m.typeDef instanceof StructDef))
                continue;

            let member_parm = new ParmType(`_${m.name}`, new PointerType(m.typeDef));

            WriteC(`\t${member_parm.ToString()} = (${member_parm.typeDef.ToString()}) load_member_struct(L, n, \"${m.name}\");`);
            WriteC(`\t_val->${m.name} = *${member_parm.name};`);
        }

        WriteC(`\t return ${var_parm.name};`);
        WriteC(`}`);
    }

    for (let s of exporter.structs) {
        let userdata_parm = new ParmType("_userdata", new PointerType(s));

        for (let m of s.members) {

            if (m.typeDef instanceof StructDef)
                continue;

            // auto x = val->x;
            // _val->x
            let userdata_proj = new StructuredProjectionExpression(userdata_parm, m);

            let returnVals = [1, 0];
            let stackPos = [-1, -2];
            for (let i = 0; i < 2; i++) {
                let method_name = `${s.name}_${rw_methods[i]}_${m.name}`;
                WriteC(`static int ${method_name}(lua_State *L) {`);

                WriteC(s.generateLuaTo(userdata_parm, method_name, m, stackPos[i]));

                if (i == 0) {
                    // "lua_pushnumber(L, val->x);"
                    WriteC('\t' + m.typeDef.generateLuaPush(userdata_proj) + ";");
                } else {
                    let member_parm = new ParmType(`_${m.name}`, m.typeDef);

                    WriteC('\t' + m.generateLuaGetParm(member_parm, "???", -1));

                    // "_val->x = x;"
                    WriteC(`\t${userdata_proj.ToString()} = ${member_parm.name};\n`);
                }

                WriteC('\t' + `return ${returnVals[i]};`);
                WriteC(`}\n`);
            }
        }

        WriteC(`static int ${s.name}_Alloc(lua_State *L) {`);
        WriteC(`\tauto val = (${s.name} *) lua_newuserdata(L, sizeof(${s.name}));`)
        WriteC(`\tmemset(val, 0, sizeof(${s.name}));`)
        WriteC(`\treturn 1;`);
        WriteC(`}\n`);
    }

    for (let s of exporter.globalFunctions) {
        ExportGlobalFunction(s);
    }

    WriteC(`void init_raylib_bindings1(lua_State *L) {`);
    WriteC(`\tlua_createtable(L, 0, 200);`);
    WriteC(`\tlua_createtable(L, 0, 200);`);
    WriteC(`\tlua_setfield(L, -2, "@");`);
    WriteC(`\tlua_getfield(L, -1, "@");`);
    for (let s of exporter.structs) {
        for (let m of s.members) {
            if (m.typeDef instanceof StructDef)
                continue;

            for (let i = 0; i < 2; i++) {
                let method_name = `${s.name}_${rw_methods[i]}_${m.name}`;
                WriteC(`\tlua_pushcfunction(L, ${method_name});`)
                WriteC(`\tlua_setfield(L, -2, "${method_name}");`)
            }
        }

        WriteC(`\tlua_pushcfunction(L, ${s.name}_Alloc);`)
        WriteC(`\tlua_setfield(L, -2, "${s.name}_Alloc");`)
    }

    WriteC(`\tlua_pop(L, 1);`);

    for (let s of exporter.globalFunctions) {
        WriteC(`\tlua_pushcfunction(L, l_${s.name});`)
        WriteC(`\tlua_setfield(L, -2, "${s.name}");`)
    }

    WriteC(`\tlua_setglobal(L, "rl");`);
    WriteC(`}\n`);

    if(!dryRun) {
        cFile.on('finish', () => {
            console.log("done");
        });
    }

    // fs.closeSync(cFile);
}