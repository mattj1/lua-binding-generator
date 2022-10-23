import {Exporter} from "./Exporter";

export interface ExportWriter {
    Write(s: String);
}

export interface ParserOptions {
    OnDefine? : (k: string, v: string) => void;
}
