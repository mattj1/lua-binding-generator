import {DataSource} from "./DataSource";


function ParseNone(ds: DataSource) {

}

export function Parse(ds: DataSource) {

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
    ds.Next();
    while(true) {
        ParseNone(ds);
        ds.Next();
    }



    console.log(ds.Next());
    console.log(ds.Next());
    console.log(ds.Next());
    console.log(ds.Next());
    console.log(ds.Next());
    console.log(ds.Next());
    console.log(ds.Next());
    console.log(ds.Next());
    console.log(ds.Next());
    console.log(ds.Next());
    console.log(ds.GetToken());
    console.log(ds.GetToken());

}