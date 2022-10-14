import {DataSource} from "./DataSource";

let keywords = ["void", "double", "float", "int"];
let symbols = ["(", ")", "*"];

export function Parse(ds: DataSource) {
    function IsKeyword() {
        return keywords.indexOf(ds.GetToken()) != -1;
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
        if(IsSymbol()) {
            // console.log("IsIdentifier, IsSymbol=true, so returning false")
            return false;
        }

        if(IsKeyword())
            return false;


        return true;
    }

    function IsPartOfDataType() {
        if (IsStr("*")) {
            return true;
        }

        return IsKeyword();
    }


    function ExpectKeyword() {
        if(!IsKeyword()) {
            throw "Expected: Keyword";
        }
    }

    function ExpectIdentifier() {
        if(!IsIdentifier()) {
            throw "Expected: Keyword";
        }

        return ds.GetToken();
    }

    function ExpectStr(s: string) {
        if(!IsStr(s)) {
            throw `Expected: '${s}'`;
        }
    }

    function ParseDataType(firstToken: string) {
        let data_type = firstToken;
        while(true) {
            ds.Next();

            if(IsPartOfDataType()) {
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

        if(!IsStr("("))
            throw "Expected: (";

        ds.Next();
        let first = true;

        while(true){

            if(IsStr(")"))
                break;

            if(!first && IsStr(",")) {
                ds.Next();
            }

            first = false;

            ExpectKeyword();

            let arg_type = ParseDataType(ds.GetToken());

            // console.log(`got arg type: |${arg_type}|`);

            if(arg_type == "void") {
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

    function ParseNone() {
        // "Next" will tell us what we are doing...
        ds.Next();

        if (!IsKeyword()) {
            throw `Expected: Keyword. Got ${ds.GetToken()}`;
        }

        // TODO: "typedef", struct etc...
        if(!IsKeyword) {
            throw "Expected: Keyword";
        }

        ParseFunctionDeclaration(ds.GetToken());

        // console.log("Will parse", ds.GetToken());
        // throw "TEST";
    }

// export function Parse(ds: DataSource) {

//
//
// console.log(tokens);
//
// index = -1;
//
// let return_type = expectDataType(false);
//
// if(!isIdentifier()) {
//     throw "Expected: identifier";
// }
//
// let method_name = currentToken();
//
// expectStr("(", false);
// index ++;
//
// while(true) {
//     // console.log("arg check", currentToken());
//     if(isStr(")"))
//         break;
//
//     let arg_type = expectDataType(true);
//     console.log("arg type:", arg_type);
//
//     if(!isIdentifier()) {
//         throw "Expected: identifier name";
//     }
//
//     let arg_name = currentToken();
//     console.log("arg name:", arg_name);
//
//     index ++;
//
//     if(isStr(")"))
//         break;
//
//     expectStr(",", true);
//     index ++;
//
//     // break;
// }
//
// console.log("return type:", return_type);
// console.log("method name", method_name);
    while (true) {
        try {
            ParseNone();
        } catch(e) {
            console.log("Error:")
            console.error(e);

            if(e == "No more lines") {
                console.log("Do stuff!");
            }

            break;
        }
    }
// }
}