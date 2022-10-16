const regex = /(\w+)|\*|\(|\)|(\/\/)|,|;|\{|\}|\=/gm;

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

    return _tokens;
}


export class DataSource {
    lines = [];
    current_line = -1;

    tokens = [];

    current_token = 0;
    constructor(rawData: string) {
        this.lines = rawData.split("\n").map(value=>value.trim()).filter(value => value.length != 0)
        console.log(this.lines)
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

    Next(): string {
        while(true) {
            this.current_token++;
            if (this.tokens[this.current_token] == undefined) {
                this.NextLine();
                continue;
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
