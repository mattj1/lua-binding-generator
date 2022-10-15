import {DataSource} from "./DataSource";
import {EnumDef, EnumEntry, Exporter} from "../c_types";

let keywords = ["void", "double", "float", "int"];
let structs = {};
let symbols = ["(", ")", "*"];

export function Parse(e: Exporter, ds: DataSource) {
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


    function ExpectKeyword() {
        if (!IsKeyword()) {
            throw "Expected: Keyword";
        }
    }

    function ExpectIdentifier() {
        if (!IsIdentifier()) {
            throw "Expected: Keyword";
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

            ExpectKeyword();

            let arg_type = ParseDataType(ds.GetToken());

            // console.log(`got arg type: |${arg_type}|`);

            if (arg_type == "void") {
                ExpectStr(")");
                break;
            }

            let arg_name = ExpectIdentifier();

            console.log(`Arg: ${arg_type}, ${arg_name}`);

            ds.Next();

            // throw "TEST";
        }

        ds.Next();
        ExpectStr(";");
    }

    function ParseStructMembers() {
        console.log("ParseStructMembers")
        ds.Next();
        while(true) {
            if(IsStr("}")) {
                break;
            }

            let member_type = ParseDataType(ds.GetToken());
            let member_name = ExpectIdentifier();
            ds.Next();
            ExpectStr(";")

            console.log(`ParseStructMembers: got member ${member_type} ${member_name}`)
            ds.Next();
        }

        ds.Next();
        if(IsStr(";")) {
            return;
        }

        let struct_type_name = ExpectIdentifier();

        structs[struct_type_name] = "TEST";

        console.log("ParseStructMembers struct type name: ", struct_type_name);
        ds.Next();
        ExpectStr(";")
        // throw "TEST";
    }

    function ParseStruct() {
        console.log("ParseStruct")
        ds.Next();

        if(IsStr("{")) {
            ParseStructMembers();
            return;
        }

        let struct_name = ExpectIdentifier();
        console.log("ParseStruct struct name:", struct_name);
        ds.Next();
        ExpectStr("{")
        ParseStructMembers();
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
                // TODO: need to be able to parse hex
                let enumValStr = ds.GetToken();
                enumVal = parseInt(ds.GetToken());
                console.log(`Setting enum val ${enum_identifier} = ${enumVal}`);
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

        throw "Done parsing enum";
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
                console.log("Do stuff!");
            }

            break;
        }
    }
// }
}