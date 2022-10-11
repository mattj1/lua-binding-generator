import {BoolType, Exporter, IntType, ParmType, StringType} from "./c_types";
import {LuaExporter} from "./LuaExporter";
import {CExporter} from "./CExporter";

let e = new Exporter();

// DefStruct("Rectangle")
//     .Int("x")
//     .Int("y")
//     .Int("w")
//     .Int("h");
//

let Color = e.DefStruct("Color")
    .Int("r")
    .Int("g")
    .Int("b")
    .Int("a");

/*
    // What if we didn't want to allocate data for stuff that's already in the header?
    // Allocate Color table, set light userdata to &RAYWHITE

 */
e.DefStructConst("BLUE", Color,{r : 0, g : 0, b : 245, a : 255})
e.DefStructConst("RAYWHITE", Color,{r : 245, g : 245, b : 245, a : 255})

let Vector2 = e.DefStruct("Vector2")
    .Float("x")
    .Float("y");

e.DefGlobalFunction("IsKeyPressed").IntParm("key").Return(new BoolType())
e.DefGlobalFunction("IsKeyDown").IntParm("key").Return(new BoolType())
e.DefGlobalFunction("IsKeyReleased").IntParm("key").Return(new BoolType())
e.DefGlobalFunction("IsKeyUp").IntParm("key").Return(new BoolType())

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
e.DefGlobalFunction("DrawText")
    .Parm(new StringType().Const(), "text")
    .IntParm("posX")
    .IntParm("posY")
    .IntParm("fontSize")
    .Parm(Color, "color")

// e.DefGlobalFunction("rlRotatef")
//     .FloatParm("angle")
//     .FloatParm("x")
//     .FloatParm("y")
//     .FloatParm("z")

let cExporter = new CExporter("test.c", e);
cExporter.Run();

let luaExporter = new LuaExporter("test.lua", e);
luaExporter.Run();