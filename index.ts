import {BoolType, Exporter, IntType, ParmType, StringType} from "./c_types";
import {LuaExporter} from "./Exporters/LuaExporter";
import {CExporter} from "./Exporters/CExporter";
import {raylib_enums} from "./raylib_enums";
import {TypescriptDefsExporter} from "./Exporters/TypescriptDefsExporter";

let e = new Exporter();

let Rectangle = e.DefStruct("Rectangle")
    .Int("x")
    .Int("y")
    .Int("width")
    .Int("height");


let Color = e.DefStruct("Color")
    .Int("r")
    .Int("g")
    .Int("b")
    .Int("a");

/*
    // What if we didn't want to allocate data for stuff that's already in the header?
    // Allocate Color table, set light userdata to &RAYWHITE

 */
e.DefStructConst("LIGHTGRAY", Color, { r:200, g:200, b:200, a:255 } )
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

raylib_enums(e);

// rshapes
// void DrawRectangle(int posX, int posY, int width, int height, Color color);

e.DefGlobalFunction("DrawRectangle")
    .IntParm("posX")
    .IntParm("posY")
    .IntParm("width")
    .IntParm("height")
    .Parm(Color, "color")

e.DefGlobalFunction("DrawRectangleLinesEx").Parm(Rectangle, "rec").FloatParm("lineThick").Parm(Color, "color")

// rtextures

e.DefGlobalFunction("ColorAlpha").Parm(Color, "color").FloatParm("alpha").Return(Color)

// e.DefGlobalFunction("rlRotatef")
//     .FloatParm("angle")
//     .FloatParm("x")
//     .FloatParm("y")
//     .FloatParm("z")

let cExporter = new CExporter("/Users/mattj/projects/luatest/luatest/src/raylib_bindings1.cpp", e);
cExporter.Run();

let luaExporter = new LuaExporter("/Users/mattj/projects/luatest/luatest/resources/raylib_bindings.lua", e);
luaExporter.Run();

let typescriptDefsExporter = new TypescriptDefsExporter("/Users/mattj/projects/luatest/luatest/ts/rl.d.ts", e);
typescriptDefsExporter.Run();