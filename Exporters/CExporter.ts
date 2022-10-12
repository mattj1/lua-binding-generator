import {
    Exporter,
    Func,
    LiteralExpression,
    ParmType,
    PointerType, StructDef,
    StructuredProjectionExpression, VoidType
} from "../c_types";
import * as fs from "fs";


export class CExporter {
    cPath: string;
    cFile: fs.WriteStream;
    exporter: Exporter;

    constructor(cPath: string, exporter: Exporter) {
        this.cPath = cPath;
        this.exporter = exporter;
    }

    WriteC(s: String) {
        console.log(`C: ${s}`)
        this.cFile.write(s + "\n");
    }

    ExportGlobalFunction(func: Func) {
        this.WriteC(`static int l_${func.name}(lua_State *L) {`);

        let parm_stack_start = -func.parms.length;

        let parm_count = func.parms.length;
        let args = [];

        for (let parm_index = 0; parm_index < func.parms.length; parm_index ++) {
            let parm = func.parms[parm_index];

            let stackPos = parm_stack_start + parm_index;

            let var_parm: ParmType;

            if(parm.typeDef.isStructType()) {
                var_parm = new ParmType(parm.name, new PointerType(parm.typeDef));
            } else {
                var_parm = new ParmType(parm.name, parm.typeDef);
            }

            this.WriteC('\t' + parm.generateLuaGetParm(var_parm, func.name, stackPos))

            // if(parm.typeDef.isStructType()) {
            //     parm_stack_start -= 1;
            // }

            // have to dereference if this parm isn't a pointer but the variable is

            if(var_parm.typeDef.isPointerType() && !parm.typeDef.isPointerType()) {
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

    Run() {
        fs.truncateSync(this.cPath, 0);
        this.cFile = fs.createWriteStream(this.cPath);

        let rw_methods = ["read", "write"];

        this.WriteC(`#include <cstring>`);
        this.WriteC(`#include <cstdlib>`);
        this.WriteC(`#include "raylib.h"`);
        this.WriteC(`#include "raymath.h"`);
        this.WriteC(`extern "C" {`);
        this.WriteC(`#include <lua/lauxlib.h>`);
        this.WriteC(`#include <lua/lualib.h>`);
        this.WriteC(`}`);

        this.WriteC(`void *load_member_struct(lua_State *L, int n, const char *member_name) {
    lua_getfield(L, n, member_name);
    lua_pushstring(L, "@"); lua_rawget(L, -2);
    
    void *_val = lua_touserdata(L, -1);
    lua_pop(L, 1); // pop userdata
    lua_pop(L, 1); // pop field
 
    return _val;
}`);

        for(let s of this.exporter.structs) {
            let var_parm = new ParmType("_val", new PointerType(s));

            this.WriteC(`${s.name} *load_struct_${s.name}(lua_State *L, int n) {`);
            this.WriteC( `\tif(!lua_istable(L, n)) {`);
            this.WriteC(`\t\tprintf("Error: Not a table\\n"); exit(0);`)
            this.WriteC(`\t\treturn 0;`);
            this.WriteC(`\t}`);

            this.WriteC(`\tlua_pushstring(L, "@"); lua_rawget(L, n - 1);`);

            this.WriteC(`\tif(!lua_isuserdata(L, -1)) {`);
            this.WriteC(`\t\tprintf("Error: not userdata\\n"); exit(0);`);
            this.WriteC(`\t\treturn 0;`);
            this.WriteC(`\t}`);

            this.WriteC(`\t${var_parm.ToString()} = (${var_parm.typeDef.name}) lua_touserdata(L, -1);`);
            this.WriteC(`\tlua_pop(L, 1); // pop the userdata`)

            for(let m of s.members) {
                if(!(m.typeDef instanceof StructDef))
                    continue;

                let member_parm = new ParmType(`_${m.name}`, new PointerType(m.typeDef));

                this.WriteC(`\t${member_parm.ToString()} = (${member_parm.typeDef.ToString()}) load_member_struct(L, n, \"${m.name}\");`);
                this.WriteC(`\t_val->${m.name} = *${member_parm.name};`);
            }

            this.WriteC(`\t return ${var_parm.name};`);
            this.WriteC(`}`);
        }

        for(let s of this.exporter.structs) {
            let userdata_parm = new ParmType("_userdata", new PointerType(s));

            for (let m of s.members) {

                if(m.typeDef instanceof StructDef)
                    continue;

                // auto x = val->x;
                // _val->x
                let userdata_proj = new StructuredProjectionExpression(userdata_parm, m);

                let returnVals = [1, 0];
                let stackPos = [-1, -2];
                for(let i = 0; i < 2; i++) {
                    let method_name = `${s.name}_${rw_methods[i]}_${m.name}`;
                    this.WriteC(`static int ${method_name}(lua_State *L) {`);

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

        for(let s of this.exporter.globalFunctions) {
            this.ExportGlobalFunction(s);
        }

        this.WriteC(`void init_raylib_bindings1(lua_State *L) {`);
        this.WriteC(`\tlua_createtable(L, 0, 200);`);
        this.WriteC(`\tlua_createtable(L, 0, 200);`);
        this.WriteC(`\tlua_setfield(L, -2, "@");`);
        this.WriteC(`\tlua_getfield(L, -1, "@");`);
        for(let s of this.exporter.structs) {
            for (let m of s.members) {
                if(m.typeDef instanceof StructDef)
                    continue;

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

        for(let s of this.exporter.globalFunctions) {
            this.WriteC(`\tlua_pushcfunction(L, l_${s.name});`)
            this.WriteC(`\tlua_setfield(L, -2, "${s.name}");`)
        }

        this.WriteC(`\tlua_setglobal(L, "rl");`);
        this.WriteC(`}\n`);

        this.cFile.on('finish', () => {
            console.log("done");
        });

        // fs.closeSync(this.cFile);
    }
}