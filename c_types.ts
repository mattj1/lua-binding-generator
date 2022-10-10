abstract class TypeDef {
    public name: string;
    isConst: boolean;

    protected constructor(name: string) {
        this.name = name;
        this.isConst = false;
    }

    Const(): TypeDef {
        this.isConst = true;
        return this;
    }

    abstract generateLuaTo(var_parm: ParmType, funcName: string, parm: ParmType, stackPos: number): string;

    abstract generateLuaPush(expr: Expr): string;

    getProjection(): string {
        return "";
    }

    isPointerType(): boolean {
        return false;
    }

    isStructType(): boolean {
        return false;
    }

    ToString(): string {
        return `${this.name}`
    }
}

abstract class SimpleTypeDef extends TypeDef {

}

export class StringType extends TypeDef {
    constructor() {
        super("char *");
    }

    generateLuaPush(expr: Expr): string {
        return `lua_pushstring(L, ${expr.ToString()});`;
    }

    generateLuaTo(var_parm: ParmType, funcName: string, parm: ParmType, stackPos: number) {
        return `${var_parm.ToString()} = lua_tostring(L, ${stackPos});`
    }

    isPointerType(): boolean {
        return true;
    }
}

export class IntType extends SimpleTypeDef {

    constructor() {
        super("int");
    }

    generateLuaTo(var_parm: ParmType, funcName: string, parm: ParmType, stackPos: number) {
        return `${var_parm.ToString()} = lua_tointeger(L, ${stackPos});`
    }

    generateLuaPush(expr: Expr): string {
        return `lua_pushinteger(L, ${expr.ToString()})`;
    }
}

export class FloatType extends SimpleTypeDef {
    constructor() {
        super("float");
    }

    generateLuaTo(var_parm: ParmType, funcName: string, parm: ParmType, stackPos: number) {
        return `${var_parm.ToString()} = lua_tonumber(L, ${stackPos});`
    }

    generateLuaPush(expr: Expr): string {
        return `lua_pushnumber(L, ${expr.ToString()})`;
    }
}

export class StructDef extends TypeDef {
    members: ParmType[];
    membersDict: Map<string, ParmType>;

    constructor(name: string) {
        super(name);
        this.members = [];
        this.membersDict = new Map();
    }

    AddMember(parmType: ParmType): StructDef {
        this.members.push(parmType);
        this.membersDict[parmType.name] = parmType;
        return this;
    }

    Int(name: string): StructDef {
        return this.AddMember(new ParmType(name, new IntType()))
    }

    Float(name: string): StructDef {
        return this.AddMember(new ParmType(name, new FloatType()))
    }

    generateLuaTo(var_parm: ParmType, funcName: string, parm: ParmType, stackPos: number) {
        /*
                if(!lua_istable(L, -1)) {                                   (stackPos)
                    printf("Color_read_r: Not a table\n");
                    return 0;
                }

                lua_pushstring(L, "@"); lua_rawget(L, -2);                  (stackPos-1)

                if(!lua_isuserdata(L, -1)) {                                (-1)
                    printf("Color_read_r: Error: r is not userdata\n");
                    return 0;
                }

                Color * _userdata = (Color *) lua_touserdata(L, -1);        (-1)
         */


        let s = "";

        s += `\tif(!lua_istable(L, ${stackPos})) {\n`;
        s += `\t\tprintf("${funcName}: Error: Not a table\\n");\n`
        s += `\t\treturn 0;\n`;
        s += `\t}\n`;

        s += `\tlua_pushstring(L, "@"); lua_rawget(L, ${stackPos - 1});\n`

        s += `\tif(!lua_isuserdata(L, -1)) {\n`;
        s += `\t\tprintf("${funcName}: Error: ${parm.name} is not userdata\\n");\n`;
        s += `\t\treturn 0;\n`;
        s += `\t}\n`;

        s += `\t${var_parm.ToString()} = (${var_parm.typeDef.name}) lua_touserdata(L, -1);\n`;

        return s;
    }

    generateLuaPush(expr: Expr): string {
        // e.g. Image variableName = Image_New()
        // Need to call
        let s = `\t
        lua_getglobal(L, "rl");
        lua_getfield(L, -1, \"${this.name}\");
        lua_getfield(L, -1, \"new\");
        lua_pushvalue(L, -2);
        lua_call(L, 1, 1);
        
        lua_pushstring(L, "@");
        lua_rawget(L, -2);
        
        auto userdata = (${this.name} *) lua_touserdata(L, -1);
        *userdata = ${expr.ToString()};
        
        lua_pop(L, 1); // pop userdata
        `;
        return s;
    }

    getProjection(): string {
        return ".";
    }

    isStructType(): boolean {
        return true;
    }
}

export class PointerType extends TypeDef {
    typeDef: TypeDef;

    constructor(typeDef: TypeDef) {
        super(`${typeDef.name} *`);

        this.typeDef = typeDef;
    }

    generateLuaTo(var_parm: ParmType, funcName: string, parm: ParmType, stackPos: number) {
        return "generateLuaTo ????";
    }

    generateLuaPush(expr: Expr): string {
        // e.g. Image variableName = Image_New()
        // Need to call
        let s = `\tNOT IMPLEMENTED`;
        return s;
    }

    getProjection(): string {
        return "->";
    }

    isPointerType(): boolean {
        return true;
    }
}


export class ParmType {
    name: string;
    typeDef: TypeDef;

    constructor(name: string, typeDef: TypeDef) {
        this.name = name;
        this.typeDef = typeDef
    }

    generateLuaGetParm(varParm: ParmType, funcName: string, stackPos: number): string {
        return this.typeDef.generateLuaTo(varParm, funcName, this, stackPos);
    }

    ToString(): string {
        return `${this.typeDef.ToString()} ${this.name}`;
    }
}

export abstract class Expr {
    abstract ToString(): string;
}

export class LiteralExpression extends Expr {

    parm: ParmType;

    constructor(parm: ParmType) {
        super();
        this.parm = parm;
    }

    ToString(): string {
        return `${this.parm.name}`;
    }
}

export class StructuredProjectionExpression extends Expr {
    parm: ParmType;
    member: ParmType;

    constructor(parm: ParmType, member: ParmType) {
        super();

        this.parm = parm;
        this.member = member;
    }

    ToString(): string {
        return `${this.parm.name}${this.parm.typeDef.getProjection()}${this.member.name}`;
    }
}

export class Func {
    name: string;

    parms: ParmType[];
    returnType: TypeDef;

    constructor(name: string) {
        this.name = name;
        this.parms = [];
    }

    Parm(typeDef: TypeDef, name: string): Func {
        this.parms.push(new ParmType(name, typeDef));
        return this;
    }

    IntParm(name: string) {
        return this.Parm(new IntType(), name);
    }

    Return(returnType: TypeDef): Func {
        this.returnType = returnType;
        return this;
    }
}

export class StructConst {
    structDef: StructDef;
    name: string;
    parms: string[] = [];

    constructor(structDef: StructDef, name: string, parms: string[]) {
        this.structDef = structDef;
        this.name = name;
        this.parms = parms;
    }
}
// let structs: {[key: string]: StructDef} = {};


export class Exporter {
    structs: Array<StructDef> = [];
    globalFunctions: Array<Func> = [];
    structConsts: Array<StructConst> = []

    constructor() {
    }

    DefStruct(name: string): StructDef {
        let s = new StructDef(name);
        this.structs.push(s);
        return s;
    }

    DefGlobalFunction(name: string): Func {
        let s = new Func(name);
        this.globalFunctions.push(s);
        return s;
    }

    DefStructConst(structDef: StructDef, name: string, vals: any): any {
        // ____exports.RAYWHITE = Color:new({r = 245, g = 245, b = 245, a = 245})
        let parms = [];
        for (let key in vals) {
            parms.push(`${key} = ${vals[key]}`);
        }

        this.structConsts.push(new StructConst(structDef, name, parms));
    }
}