import {DataSource, processTokens} from "./DataSource";
import {
    BoolType,
    EnumDef,
    EnumEntry,
    FloatType,
    Func,
    IntType,
    ParmType,
    PointerType, StringType,
    StructDef,
    TypeDef,
    VoidType
} from "../c_types";
import {Exporter} from "../Exporter";

let keywords = ["void", "double", "float", "int", "unsigned", "char", "bool", "const"];
let structs = {};
let symbols = ["(", ")", "*"];

export function Parse(e: Exporter, ds: DataSource) {

    function ExporterDataTypeForTypeString(s: string): TypeDef {
        let tokens = processTokens(s);
        console.log("ExporterDataTypeForTypeString", tokens);
        let pointerCount = 0;
        for(let i = tokens.length-1; i >= 0; i--) {
            if(tokens[i] == "*")
                pointerCount ++;
        }

        let structDef = e.GetStructForName(tokens[0]);

        let t;

        if(tokens.length == 3 && tokens[0] == "const" && tokens[1] == "char" && tokens[2] == "*") {
            t = new StringType();
            pointerCount = 0; // hack
            t.isConst = true;
        }
        else if (structDef != null) {
            t = structDef;
        } else if (tokens[0] == "bool") {
            t = new BoolType();
        } else if (tokens[0] == "float") {
            t = new FloatType();
        } else if (tokens[0] == "int") {
            t = new IntType();
        } else if (tokens[0] == "unsigned" && tokens[1] == "char") {
            t = new IntType();
        } else if (tokens[0] == "void") {
            t = new VoidType();
        }
        if (t != null) {
            for (let i = 0; i < pointerCount; i++) {
                t = new PointerType(t);
            }

        }

        if(t == null) {
            throw `Invalid type: ${s}`;
        }

        return t;
    }

    function IsKeyword() {
        return keywords.indexOf(ds.GetToken()) != -1;
    }

    function IsDataType() {
        if (structs[ds.GetToken()] != undefined) {
            return true;
        }

        if(IsKeyword())
            return true;

        return false;
    }

    function IsSymbol() {
        let result = symbols.indexOf(ds.GetToken()) != -1;
        // console.log(`IsSymbol: ${ds.GetToken()}, result: ${result}`)
        return result;
    }

    function IsStr(str: string): boolean {
        return ds.GetToken() == str;
    }

    function IsIdentifier() {
        if (IsSymbol()) {
            // console.log("IsIdentifier, IsSymbol=true, so returning false")
            return false;
        }

        if (IsKeyword())
            return false;


        return true;
    }

    function IsPartOfDataType() {
        if (IsStr("*")) {
            return true;
        }

        if (structs[ds.GetToken()] != undefined) {
            return true;
        }

        if (IsKeyword())
            return true;

        return false;
    }

    function ExpectPartOfDataType() {
        if(!IsPartOfDataType()) {
            throw "Expected: Part of data type";
        }
    }

    function ExpectKeyword() {
        if (!IsKeyword()) {
            throw "Expected: Keyword";
        }
    }

    function ExpectIdentifier() {
        if (!IsIdentifier()) {
            throw "Expected: Identifier";
        }

        return ds.GetToken();
    }

    function ExpectStr(s: string) {
        if (!IsStr(s)) {
            throw `Expected: '${s}', got '${ds.GetToken()}'`;
        }
    }

    function ParseDataType(firstToken: string) {
        let data_type = firstToken;
        while (true) {
            ds.Next();

            if (IsPartOfDataType()) {
                // console.log(`adding to data type: |${ds.GetToken()}|`);
                data_type += " " + ds.GetToken();
            } else {
                // console.log("ParseDataType: Breaking on ", ds.GetToken())
                break;
            }
        }

        return data_type.trim();
    }

    function ParseFunctionDeclaration(firstToken: string) {
        let data_type = ParseDataType(firstToken);
        let function_name = ds.GetToken();

        let func = new Func(function_name);
        func.returnType = ExporterDataTypeForTypeString(data_type);

        let args = [];

        console.log(`data type: ${data_type}, name: ${function_name}`);

        ds.Next();

        if (!IsStr("("))
            throw "Expected: (";

        ds.Next();
        let first = true;

        while (true) {

            if (IsStr(")"))
                break;

            if (!first && IsStr(",")) {
                ds.Next();
            }

            first = false;

            ExpectPartOfDataType();

            let arg_type = ParseDataType(ds.GetToken());

            // console.log(`got arg type: |${arg_type}|`);

            if (arg_type == "void") {
                ExpectStr(")");
                break;
            }

            let arg_name = ExpectIdentifier();

            console.log(`Arg: ${arg_type}, ${arg_name}`);

            func.Parm(ExporterDataTypeForTypeString(arg_type), arg_name);

            ds.Next();
        }

        ds.Next();
        ExpectStr(";");

        e.globalFunctions.push(func);

    }

    function ParseStructMembers(structDef: StructDef) {
        console.log("ParseStructMembers")
        ds.Next();
        while(true) {
            if(IsStr("}")) {
                break;
            }

            let member_type = ParseDataType(ds.GetToken());

            while(true) {
                let member_name = ExpectIdentifier();

                console.log(`ParseStructMembers: got member ${member_type} ${member_name}`)

                let dt = ExporterDataTypeForTypeString(member_type);
                if (dt == null) {
                    throw `type not supported: ${member_type}`;
                } else {
                    structDef.AddMember(new ParmType(member_name, dt));
                }

                ds.Next();

                if(IsStr(";")) {
                    ds.Next();
                    break;
                }

                ExpectStr(",");

                ds.Next();
            }
        }

        ds.Next();
        if(IsStr(";")) {
            return;
        }

        let struct_type_name = ExpectIdentifier();
        structDef.setName(struct_type_name);
        e.structs.push(structDef);

        structs[struct_type_name] = "TEST";

        console.log("ParseStructMembers struct type name: ", struct_type_name);
        ds.Next();
        ExpectStr(";")
    }

    function ParseStruct() {
        let structDef = new StructDef("");

        console.log("ParseStruct")
        ds.Next();

        if(IsStr("{")) {
            ParseStructMembers(structDef);
            return;
        }

        let struct_name = ExpectIdentifier();
        structDef.setName(struct_name);

        console.log("ParseStruct struct name:", struct_name);
        ds.Next();
        ExpectStr("{")
        ParseStructMembers(structDef);
    }

    function ParseEnum() {
        console.log("ParseEnum");
        let enumDef = new EnumDef("");

        ds.Next();
        ExpectStr("{");
        ds.Next();
        let enumVal = 0;
        while(true) {
            if(IsStr("}"))
                break;

            let enum_identifier = ExpectIdentifier();

            ds.Next();

            if(IsStr("=")) {
                ds.Next();
                let enumValStr = ds.GetToken();
                enumVal = parseInt(ds.GetToken());
                // console.log(`Setting enum val ${enum_identifier} = ${enumVal}`);
                enumDef.entries.push(new EnumEntry(enum_identifier, enumValStr))
                ds.Next();
            }

            enumVal ++;

            if(IsStr(",")) {
                ds.Next();
            }
        }

        ds.Next();

        enumDef.name = ExpectIdentifier();
        console.log(`Enum name: ${enumDef.name}`);
        e.enums.push(enumDef);

        ds.Next();
        ExpectStr(";");
    }

    function ParseTypedef() {
        console.log("ParseTypedef");
        ds.Next();
        switch (ds.GetToken()) {
            case "struct":
                ParseStruct();
                return;
            case "enum":
                ParseEnum();
                return;

        }
    }

    function ParseNone() {
        ds.Next();

        if (IsStr("typedef")) {
            ParseTypedef();
            return;
        }

        if(IsDataType()) {
            ParseFunctionDeclaration(ds.GetToken());
            return;
        }

        // TODO: "typedef", struct etc...

        if (!IsKeyword()) {
            throw `Expected: Keyword. Got ${ds.GetToken()}`;
        }

        ParseFunctionDeclaration(ds.GetToken());

        // console.log("Will parse", ds.GetToken());
        // throw "TEST";
    }

    while (true) {
        try {
            ParseNone();
        } catch (e) {
            console.log("Error:")
            console.error(e);

            if (e == "No more lines") {
                console.log("Will now export...");
            } else {
                throw "some other error";
            }

            break;
        }
    }
}