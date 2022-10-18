const regex = /(\w+)|\*|\(|\)|(\/\/)|,|;|\{|\}|\=|\#/gm;

let defines = {"RLAPI": "", "RMAPI": ""}

export function processTokens(str): Array<string> {

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

    let tokens2 = [];
    let inDoubleQuotes = false;
    for(let t of _tokens) {
        if(t == "\"") {
            // TODO: If we're in double quotes and this is preceded by a \, then doesn't count.
            inDoubleQuotes = !inDoubleQuotes;
        }

        if(t == "//") {
            if(!inDoubleQuotes) {
                break;
            }
        }

        tokens2.push(t);
    }

    // console.log(tokens2);
    return tokens2;
}

interface ParserOptions {
    OnDefine? : (k: string, v: string) => void;
}

export class DataSource {
    lines = [];
    current_line = -1;

    tokens = [];

    current_token = 0;
    options: ParserOptions;
    constructor(rawData: string, parserOptions: ParserOptions) {
        this.lines = rawData.split("\n").map(value=>value.trim()).filter(value => value.length != 0)
        this.options = parserOptions;
        // console.log(this.lines)
    }

    private NextLine() {
        this.current_line ++;
        this.current_token = -1;

        if(this.current_line >= this.lines.length) {
            throw "No more lines";
        }


        let tokens = processTokens(this.lines[this.current_line]);
        // console.log(tokens);
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

            // console.log("new str: ", newTokens.join(" "))
            tokens = processTokens(newTokens.join(" "));

            // console.log("done? ", this.tokens);
            if(done)
                break;
        }

        this.tokens = tokens;
        // console.log("tokens: ", this.tokens);
    }

    GetToken() : string {
        return this.tokens[this.current_token];
    }

    private ReadToEndOfLine() : string {
        let str = "";
        while(true) {
            let t = this._Next(true);
            if(t == undefined) {
                return str;
            }

            str += t;
        }
    }

    private _Next(stop_at_end_of_line: boolean = false) : string {
        while(true) {
            this.current_token++;
            if (this.tokens[this.current_token] == undefined) {
                this.NextLine();

                if(stop_at_end_of_line) {
                    return undefined;
                }

                continue;
            }

            return this.tokens[this.current_token];
        }
    }

    Next(): string {

        while(true) {
            this._Next();

            let current_token = this.GetToken();

            if (current_token == "#") {
                this._Next();
                if(this.GetToken() == "define") {
                    this._Next();
                    let def_key = this.GetToken();
                    let def_value = this.ReadToEndOfLine();

                    // console.log("will define:", def_key)
                    // console.log("define value:", def_value);

                    if(this.options && this.options.OnDefine) {
                        this.options.OnDefine(def_key, def_value);
                    }

                    continue;
                }
            }

            return this.GetToken();
        }
    }
}
