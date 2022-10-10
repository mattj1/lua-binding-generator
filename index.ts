import {Exporter, IntType, ParmType, StringType} from "./c_types";
import {ExportUtil} from "./Export";

// DefStruct("Rectangle")
//     .Int("x")
//     .Int("y")
//     .Int("w")
//     .Int("h");
//

let e = new Exporter();

// let Color = e.DefStruct("Color")
//     .Int("r")
//     .Int("g")
//     .Int("b")
//     .Int("a");
//
// e.DefStructConst(Color, "RAYWHITE", {r : 245, g : 245, b : 245, a : 255})
let Vector2 = e.DefStruct("Vector2")
    .Float("x")
    .Float("y");

// let VectorContainer = e.DefStruct("VectorContainer")
//     .AddMember(new ParmType("vec", Vector2))

//
// // DrawRectangleV(Vector2 position, Vector2 size, Color color);
// e.DefGlobalFunction("DrawRectangleV")
//     .Parm(Vector2, "position")
//     .Parm(Vector2, "size")
//     .Parm(Color, "color");
//
// DefGlobalFunction("DrawRectangleV")
//     .Parm(Vector2, "position")
//     .Parm(Vector2, "size")
//     .Parm(Color, "color")
//     .IntParm("foo");

// RLAPI int GetRandomValue(int min, int max);
// e.DefGlobalFunction("GetRandomValue")
//     .IntParm("min")
//     .IntParm("max")
//     .Return(new IntType());

// e.DefGlobalFunction("MakeAVector")
//     .IntParm("foo")
//     .Return(Vector2);

// // char *LoadFileText(const char *fileName);
// e.DefGlobalFunction("LoadFileText")
//     .Parm(new StringType(), "fileName")
//     .Return(new StringType())
//
// // void DrawText(const char *text, int posX, int posY, int fontSize, Color color);
// e.DefGlobalFunction("DrawText")
//     .Parm(new StringType().Const(), "text")
//     .IntParm("posX")
//     .IntParm("posY")
//     .IntParm("fontSize")
//     .Parm(Color, "color")

let e1 = new ExportUtil("test.c", "test.lua");
e1.Run(e);