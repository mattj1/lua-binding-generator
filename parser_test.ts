import {DataSource, processTokens} from "./Parser/Datasource";
import {Parse} from "./Parser/Parser";

const { Readable } = require("stream")

let keywords = ["void", "double", "float", "int"];
let symbols = ["(", ")", "*"];
let tokens = [];

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

let rawData = `

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

RLAPI void rlScalef(float x, float y, float z);       // Multiply the current matrix by a scaling matrix
    RLAPI void rlMultMatrixf(float *matf);                // Multiply the current matrix by another matrix
    
RLAPI void rlFrustum(double left, double right, double bottom, double top, double znear, double zfar);
RLAPI void rlOrtho(double left, double right, double bottom, double top, double znear, double zfar);
RLAPI void rlViewport(int x, int y, int width, int height); // Set the viewport area
`

let ds = new DataSource(rawData);
Parse(ds);

// findNextKeyword();
// console.log(currentToken());