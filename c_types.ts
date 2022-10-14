abstract class TypeDef {
    protected _name: string;

    get name(): string {
        return this._name;
    }

    isConst: boolean;

    protected constructor(name: string) {
        this._name = name;
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

    get TypeScriptTypeName(): string {
        return "";
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


    get name(): string {
        if(this.isConst) {
            return "const char *";
        }

        return "char *";
    }

    get TypeScriptTypeName(): string {
        return "string";
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

    get TypeScriptTypeName(): string {
        return "number";
    }
}

export class BoolType extends SimpleTypeDef {
    constructor() {
        super("bool");
    }

    generateLuaTo(var_parm: ParmType, funcName: string, parm: ParmType, stackPos: number) {
        return `${var_parm.ToString()} = lua_toboolean(L, ${stackPos});`
    }

    generateLuaPush(expr: Expr): string {
        return `lua_pushboolean(L, ${expr.ToString()})`;
    }

    get TypeScriptTypeName(): string {
        return "boolean";
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

    get TypeScriptTypeName(): string {
        return "number";
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
        return `${var_parm.ToString()} = load_struct_${this.name}(L, ${stackPos}, false);`;
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

    get TypeScriptTypeName(): string {
        return this.name;
    }
}

export class VoidType extends SimpleTypeDef {

    constructor() {
        super("void");
    }

    generateLuaPush(expr: Expr): string {
        return "";
    }

    generateLuaTo(var_parm: ParmType, funcName: string, parm: ParmType, stackPos: number): string {
        return "";
    }

    get TypeScriptTypeName(): string {
        return "void";
    }
}

export class PointerType extends TypeDef {
    typeDef: TypeDef;

    constructor(typeDef: TypeDef) {
        super(`${typeDef.name} *`);

        this.typeDef = typeDef;
    }

    generateLuaTo(var_parm: ParmType, funcName: string, parm: ParmType, stackPos: number) {
        // return "generateLuaTo ????";

        // let isOptional = "false";

        return `\t${var_parm.ToString()} = load_struct_${this.typeDef.name}(L, ${stackPos}, true);`;
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

    get TypeScriptTypeName(): string {
        return this.typeDef.TypeScriptTypeName;
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

export class ArgumentIdentifier extends ParmType {
    isOptional: boolean;

    constructor(name: string, typeDef: TypeDef) {
        super(name, typeDef);
    }
}

export function OptionalArg(arg: ArgumentIdentifier): ArgumentIdentifier {
    arg.isOptional = true;
    return arg;
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

    parms: ArgumentIdentifier[];
    returnType: TypeDef;

    constructor(name: string) {
        this.name = name;
        this.parms = [];
        this.returnType = new VoidType();
    }

    Arg(arg: ArgumentIdentifier) {
        this.parms.push(arg);
        return this;
    }

    Parm(typeDef: TypeDef, name: string): Func {
        this.parms.push(new ArgumentIdentifier(name, typeDef));
        return this;
    }

    IntParm(name: string) {
        return this.Parm(new IntType(), name);
    }

    FloatParm(name: string) {
        return this.Parm(new FloatType(), name);
    }

    Return(returnType: TypeDef): Func {
        this.returnType = returnType;
        return this;
    }
}

export class StructConst {
    structDef: StructDef;
    name: string;
    vals: any = {};

    constructor(structDef: StructDef, name: string, vals: any) {
        this.structDef = structDef;
        this.name = name;
        this.vals = vals;
    }
}

export class EnumDef {
    name: string;
    _enum: any;

    constructor(name: string, _enum: any) {
        this.name = name;
        this._enum = _enum;
    }
}

export class Exporter {
    structs: Array<StructDef> = [];
    globalFunctions: Array<Func> = [];
    structConsts: Array<StructConst> = []
    enums: Array<EnumDef> = [];

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

    DefStructConst(name: string, structDef: StructDef, vals: any): any {
        this.structConsts.push(new StructConst(structDef, name, vals));
    }

    DefEnum(_enum: any, name: string) {
        this.enums.push(new EnumDef(name, _enum));

    }
}