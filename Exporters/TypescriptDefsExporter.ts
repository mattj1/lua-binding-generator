import {Exporter} from "../c_types";
import * as fs from "fs";

export function ExportTypescriptDefs(exporter: Exporter, path: string, dryRun = false) {

    let file: fs.WriteStream;

    function Write(s: String) {
        console.log(`TS Defs: ${s}`)
        if (!dryRun) {
            file.write(s + "\n");
        }
    }

    if (!dryRun) {
        fs.truncateSync(path, 0);
        file = fs.createWriteStream(path);
    }

    Write(`declare namespace rl {`);
    for (let s of exporter.structs) {
        Write(`\t/** @customConstructor rl.${s.name}:new */`);
        Write(`\tclass ${s.name} {`);

        let args = [];
        for (let m of s.members) {
            args.push(`${m.name}?: ${m.typeDef.TypeScriptTypeName}`);
        }
        Write(`\t\tconstructor(args?: {${args.join(", ")}});`);

        for (let m of s.members) {
            Write(`\t\t${m.name}: ${m.typeDef.TypeScriptTypeName};`)
        }

        Write(`\t}`);

    }


    for (let s of exporter.structConsts) {
        Write(`\tconst ${s.name}: ${s.structDef.name};`)
    }

    for (let s of exporter.enums) {
        Write(`\tenum ${s.name} {`);
        for (let entry of s.entries) {
            Write(`\t\t${entry.key} = ${entry.value},`)
        }
        // for(let k of Object.keys(s._enum).filter((v) => isNaN(Number(v)))) {
        //     Write(`\t\t${k} = ${s._enum[k]},`)
        // }
        Write(`\t}`);
    }

    for (let s of exporter.globalFunctions) {
        let args = [];
        for (let arg of s.parms) {
            let optional = "";
            if (arg.isOptional) {
                optional = "?"
            }
            args.push(`${arg.name}${optional}: ${arg.typeDef.TypeScriptTypeName}`);
        }

        Write(`\tfunction ${s.name}(${args.join(", ")}): ${s.returnType.TypeScriptTypeName};`)
    }


    Write(`}`);
}

/*
declare namespace rl {
    /** @customConstructor rl.Color:new */
/*class Color {
    constructor(args?: { r?: number, g?: number, b?: number, a?: number });

    r: number;
    g: number;
    b: number;
    a: number;
}

/** @customConstructor rl.Rectangle:new */
/*class Rectangle {
    constructor(args?: { x?: number, y?: number, width?: number, height?: number });

    x: number;
    y: number;
    width: number;
    height: number;
}

function IsKeyDown(key: number): boolean;
function IsKeyPressed(key: number): boolean;

function DrawText(str: string, x: number, y: number, fontSize: number, color: Color);
function DrawRectangleLinesEx(rec: Rectangle, lineThick: number, color: Color);

const BLUE: Color;

enum KeyboardKey {
    KEY_A               = 65,       // Key: A | a
    KEY_PAUSE           = 284,      // Key: Pause
}
}
 */