import {
    ArgumentIdentifier,
    BoolType,
    FloatType,
    IntType,
    OptionalArg,
    ParmType,
    PointerType,
    StringType
} from "./c_types";
import {ExportC} from "./Exporters/CExporter";
import {Exporter} from "./Exporter";
// import {raylib_enums} from "./raylib_enums";

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
typedef struct Camera2D {
    Vector2 offset;         // Camera offset (displacement from target)
    Vector2 target;         // Camera target (rotation and zoom origin)
    float rotation;         // Camera rotation in degrees
    float zoom;             // Camera zoom (scaling), should be 1.0f by default
} Camera2D;
 */


let Vector2 = e.DefStruct("Vector2")
    .Float("x")
    .Float("y");

let Camera2D = e.DefStruct("Camera2D")
    .AddMember(new ParmType("offset", Vector2))
    .AddMember(new ParmType("target", Vector2))
    .Float("rotation")
    .Float("zoom")

/*
    // What if we didn't want to allocate data for stuff that's already in the header?
    // Allocate Color table, set light userdata to &RAYWHITE

 */
e.DefStructConst("LIGHTGRAY", Color, { r:200, g:200, b:200, a:255 } )
e.DefStructConst("BLUE", Color,{r : 0, g : 0, b : 245, a : 255})
e.DefStructConst("RAYWHITE", Color,{r : 245, g : 245, b : 245, a : 255})

e.DefGlobalFunction("BeginMode2D").Parm(Camera2D, "camera");
e.DefGlobalFunction("EndMode2D")

e.DefGlobalFunction("GetScreenToWorld2D").Parm(Vector2, "position").Parm(Camera2D, "camera").Return(Vector2);
e.DefGlobalFunction("IsKeyPressed").IntParm("key").Return(new BoolType())
e.DefGlobalFunction("IsKeyDown").IntParm("key").Return(new BoolType())
e.DefGlobalFunction("IsKeyReleased").IntParm("key").Return(new BoolType())
e.DefGlobalFunction("IsKeyUp").IntParm("key").Return(new BoolType())

e.DefGlobalFunction("IsMouseButtonDown").IntParm("button").Return(new BoolType())
e.DefGlobalFunction("GetMousePosition").Return(Vector2)
e.DefGlobalFunction("GetMouseDelta").Return(Vector2)


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

// raylib_enums(e);

// rshapes
// DrawPixel, DrawPixelV

e.DefGlobalFunction("DrawLine")
    .FloatParm("startPosX")
    .FloatParm("startPosY")
    .FloatParm("endPosX")
    .FloatParm("endPosY")
    .Parm(Color, "color")

e.DefGlobalFunction("DrawCircle").FloatParm("centerX").FloatParm("centerY").FloatParm("radius").Parm(Color, "color")
e.DefGlobalFunction("DrawRectangle")
    .IntParm("posX")
    .IntParm("posY")
    .IntParm("width")
    .IntParm("height")
    .Parm(Color, "color")

e.DefGlobalFunction("DrawRectangleLinesEx").Parm(Rectangle, "rec").FloatParm("lineThick").Parm(Color, "color")

e.DefGlobalFunction("CheckCollisionLines")
    .Parm(Vector2, "startPos1")
    .Parm(Vector2, "endPos1")
    .Parm(Vector2, "startPos2")
    .Parm(Vector2, "endPos2")
    .Arg(OptionalArg(new ArgumentIdentifier("collisionPoint", new PointerType(Vector2))))
    .Return(new BoolType())

// rtextures

e.DefGlobalFunction("ColorAlpha").Parm(Color, "color").FloatParm("alpha").Return(Color)

// e.DefGlobalFunction("rlRotatef")
//     .FloatParm("angle")
//     .FloatParm("x")
//     .FloatParm("y")
//     .FloatParm("z")

// raymath
e.DefGlobalFunction("Vector2Scale").Parm(Vector2, "v").FloatParm("scale").Return(Vector2)
e.DefGlobalFunction("Vector2Add").Parm(Vector2, "v1").Parm(Vector2, "v2").Return(Vector2)
e.DefGlobalFunction("Vector2Distance").Parm(Vector2, "v1").Parm(Vector2, "v2").Return(new FloatType())
e.DefGlobalFunction("Vector2DistanceSqr").Parm(Vector2, "v1").Parm(Vector2, "v2").Return(new FloatType())

ExportC(e, "/Users/mattj/projects/luatest/luatest/src/raylib_bindings1.cpp", true);

// let luaExporter = new LuaExporter("/Users/mattj/projects/luatest/luatest/resources/raylib_bindings.lua", e);
// luaExporter.Run();
//
// let typescriptDefsExporter = new TypescriptDefsExporter("/Users/mattj/projects/luatest/luatest/ts/rl.d.ts", e);
// typescriptDefsExporter.Run();