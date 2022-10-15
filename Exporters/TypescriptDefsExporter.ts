import {Exporter} from "../c_types";
import * as fs from "fs";

export class TypescriptDefsExporter {
    path: string;
    writeStream: fs.WriteStream;
    exporter: Exporter;

    constructor(filename: string, exporter: Exporter) {
        this.path = filename;
        this.exporter = exporter;
    }

    Write(s: String) {
        console.log(`TS Defs: ${s}`)
        this.writeStream.write(s + "\n");
    }

    Run() {
        fs.truncateSync(this.path, 0);
        this.writeStream = fs.createWriteStream(this.path);

        this.Write(`declare namespace rl {`);
        for(let s of this.exporter.structs) {
            this.Write(`\t/** @customConstructor rl.${s.name}:new */`);
            this.Write(`\tclass ${s.name} {`);

            let args = [];
            for(let m of s.members) {
                args.push(`${m.name}?: ${m.typeDef.TypeScriptTypeName}`);
            }
            this.Write(`\t\tconstructor(args?: {${args.join(", ")}});`);

            for(let m of s.members) {
                this.Write(`\t\t${m.name}: ${m.typeDef.TypeScriptTypeName};`)
            }

            this.Write(`\t}`);

        }


        for(let s of this.exporter.structConsts) {
            this.Write(`\tconst ${s.name}: ${s.structDef.name};`)
        }

        for(let s of this.exporter.enums) {
            this.Write(`\tenum ${s.name} {`);
            for(let entry of s.entries) {
                this.Write(`\t\t${entry.key} = ${entry.value},`)
            }
            // for(let k of Object.keys(s._enum).filter((v) => isNaN(Number(v)))) {
            //     this.Write(`\t\t${k} = ${s._enum[k]},`)
            // }
            this.Write(`\t}`);
        }

        for(let s of this.exporter.globalFunctions) {
            let args = [];
            for(let arg of s.parms) {
                let optional = "";
                if(arg.isOptional) {
                    optional = "?"
                }
                args.push(`${arg.name}${optional}: ${arg.typeDef.TypeScriptTypeName}`);
            }

            this.Write(`\tfunction ${s.name}(${args.join(", ")}): ${s.returnType.TypeScriptTypeName};`)
        }


        this.Write(`}`);
    }
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