/*
RLAPI void rlMatrixMode(int mode);                    // Choose the current matrix to be transformed
RLAPI void rlPushMatrix(void);                        // Push the current matrix to stack
RLAPI void rlPopMatrix(void);                         // Pop lattest inserted matrix from stack
RLAPI void rlLoadIdentity(void);                      // Reset current matrix to identity matrix
RLAPI void rlTranslatef(float x, float y, float z);   // Multiply the current matrix by a translation matrix
RLAPI void rlRotatef(float angle, float x, float y, float z);  // Multiply the current matrix by a rotation matrix
RLAPI void rlScalef(float x, float y, float z);       // Multiply the current matrix by a scaling matrix
RLAPI void rlMultMatrixf(float *matf);                // Multiply the current matrix by another matrix
RLAPI void rlFrustum(double left, double right, double bottom, double top, double znear, double zfar);
RLAPI void rlOrtho(double left, double right, double bottom, double top, double znear, double zfar);
RLAPI void rlViewport(int x, int y, int width, int height); // Set the viewport area
*/
const { Readable } = require("stream")

const regex = /(\w+)|\*|\(|\)|(\/\/)|,|;/gm;

let keywords = ["void", "double", "float", "int"];
let symbols = ["(", ")", "*"];
let tokens = [];
let defines = {"RLAPI": ""}

let index = -1;

function _isKeyword(s: string) {
    return keywords.indexOf(s) != -1;
}

function _isSymbol(s: string) {
    return symbols.indexOf(s) != -1;
}

function isKeyword() {
    return _isKeyword(tokens[index]);
}


function isSymbol() {
    return _isSymbol(currentToken());
}

function isPartOfDataType() {
    if(isStr("*")) {
        return true;
    }

    return isKeyword();
}

function currentToken() {
    return tokens[index];
}

function isStr(str: string): boolean {
    return currentToken() == str;
}

function processTokens(str) {
    let _tokens = [];

    let m;

    while ((m = regex.exec(str)) !== null) {
        // This is necessary to avoid infinite loops with zero-width matches
        if (m.index === regex.lastIndex) {
            regex.lastIndex++;
        }

        // The result can be accessed through the `m`-variable.
        m.forEach((match, groupIndex) => {
            // console.log(`Found match, group ${groupIndex}: ${match}`);
            if(groupIndex == 0) {
                _tokens.push(match);
            }
        });
    }

    return _tokens;
}


function findNextKeyword() {
    while(true) {
        index++;
        if (isKeyword()) {
            return true;
        }
    }
}

function isIdentifier() {
    if(isKeyword())
        return false;

    if(isSymbol())
        return false;

    return true;
}

function expectStr(str, from_current) {
    if(!from_current)
        index ++;

    if(tokens[index] != str) {
        throw `Expected: ${str}`;
    }
}

tokens = processTokens(`RLAPI void rlOrtho(double *left, double right, double bottom, double top, double znear, double zfar);`);

while(true) {
    let done = true;
    let newTokens = [];
    for(let i = 0; i < tokens.length; i++) {
        if (defines[tokens[i]] != undefined) {
            // console.log("replace ", tokens[i]);
            newTokens.push(defines[tokens[i]]);
            done = false;
        } else {
            newTokens.push(tokens[i]);
        }
    }

    let newStr = newTokens.join(" ");
    // console.log("new str: ", newStr)
    tokens = processTokens(newStr);

    if(done)
        break;
}


function expectDataType(from_current: boolean) {
    let data_type = "";
    let didGetDataType = false;
    let first = true;
    while(true) {
        if(first) {
            if(!from_current) {
                index ++;
            }
        } else {
            index ++;
        }

        if (!isPartOfDataType()) {
            if(!didGetDataType) {
                throw "Expected: data type";
            }

            break;
        } else {
            data_type += currentToken() + " ";
            didGetDataType = true;
        }

        first = false;
    }

    return data_type;
}
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

class DataSource {
    lines = [];
    current_line = -1;

    tokens = [];

    current_token = 0;
    constructor(rawData: string) {
        this.lines = rawData.split("\n").map(value=>value.trim()).filter(value => value.length != 0)
        console.log(this.lines)
    }

    private NextLine() {
        this.current_line++;
        this.current_token = 0;
        this.tokens = processTokens(this.lines[this.current_line]);
    }
    GetToken() : string {
        while(true) {
            this.current_token++;
            if (this.tokens[this.current_token] == undefined) {
                this.NextLine();
            }

            let current_token = this.tokens[this.current_token]
            if (current_token == "//") {
                this.NextLine();
                continue;
            }

            return current_token;
        }
    }
}

let rawData = `

RLAPI void rlScalef(float x, float y, float z);       // Multiply the current matrix by a scaling matrix
    RLAPI void rlMultMatrixf(float *matf);                // Multiply the current matrix by another matrix
    
RLAPI void rlFrustum(double left, double right, double bottom, double top, double znear, double zfar);
RLAPI void rlOrtho(double left, double right, double bottom, double top, double znear, double zfar);
RLAPI void rlViewport(int x, int y, int width, int height); // Set the viewport area
`

let ds = new DataSource(rawData);

console.log(ds.GetToken());
console.log(ds.GetToken());
console.log(ds.GetToken());
console.log(ds.GetToken());
console.log(ds.GetToken());
console.log(ds.GetToken());
console.log(ds.GetToken());
console.log(ds.GetToken());
console.log(ds.GetToken());
console.log(ds.GetToken());
console.log(ds.GetToken());
console.log(ds.GetToken());
console.log(ds.GetToken());
console.log(ds.GetToken());
console.log(ds.GetToken());
console.log(ds.GetToken());
console.log(ds.GetToken());

// findNextKeyword();
// console.log(currentToken());