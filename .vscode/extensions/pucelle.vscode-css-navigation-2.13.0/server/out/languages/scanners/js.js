"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JSTokenScanner = exports.JSTokenType = void 0;
const any_1 = require("./any");
var JSTokenType;
(function (JSTokenType) {
    JSTokenType[JSTokenType["HTML"] = 0] = "HTML";
    JSTokenType[JSTokenType["CSS"] = 1] = "CSS";
    JSTokenType[JSTokenType["Script"] = 2] = "Script";
})(JSTokenType || (exports.JSTokenType = JSTokenType = {}));
var ScanState;
(function (ScanState) {
    ScanState[ScanState["EOF"] = 0] = "EOF";
    ScanState[ScanState["AnyContent"] = 1] = "AnyContent";
    ScanState[ScanState["WithinSingleLineComment"] = 2] = "WithinSingleLineComment";
    ScanState[ScanState["WithinMultiLineComment"] = 3] = "WithinMultiLineComment";
})(ScanState || (ScanState = {}));
/**
 * Scan for embedded html and css codes within js or ts files.
 * Note: this is a very simple scanner, it ignore template nesting.
 */
class JSTokenScanner extends any_1.AnyTokenScanner {
    /** Parse html string to tokens. */
    *parseToTokens() {
        while (this.state !== ScanState.EOF) {
            if (this.state === ScanState.AnyContent) {
                yield* this.onAnyContent();
            }
            else if (this.state === ScanState.WithinSingleLineComment) {
                yield* this.onWithinSingleLineComment();
            }
            else if (this.state === ScanState.WithinMultiLineComment) {
                yield* this.onWithinMultiLineComment();
            }
        }
        yield* this.makeScriptToken();
    }
    *onAnyContent() {
        // Parse for at most 100KB.
        if (this.offset > 100000) {
            this.state = ScanState.EOF;
            return;
        }
        if (!this.readUntilToMatch(/[`'"\/]/g)) {
            return;
        }
        let char = this.peekChar();
        // `|//`
        if (char === '/' && this.peekChar(1) === '/') {
            // Move to `//|`
            this.offset += 2;
            this.state = ScanState.WithinSingleLineComment;
        }
        // `|/*`
        else if (char === '/' && this.peekChar(1) === '*') {
            // Move to `/*|`
            this.offset += 2;
            this.state = ScanState.WithinMultiLineComment;
        }
        // `|/`, currently can't distinguish it from sign of division.
        else if (char === '/') {
            this.tryReadRegExp();
        }
        // `|'`
        else if (char === '\'' || char === '"') {
            this.readString();
        }
        // '|`'
        else if (char === '`') {
            yield* this.mayMakeTemplateLiteralToken();
        }
        else {
            this.offset += 1;
        }
    }
    *onWithinSingleLineComment() {
        // `|\n`
        if (!this.readLine()) {
            return;
        }
        // Move to `\n|`
        this.offset += 1;
        this.state = ScanState.AnyContent;
    }
    *onWithinMultiLineComment() {
        // `|*/`
        if (!this.readUntilToMatch(/\*\//g)) {
            return;
        }
        // Move to `*/|`
        this.offset += 2;
        this.state = ScanState.AnyContent;
    }
    *makeScriptToken() {
        if (this.start < this.offset) {
            yield this.makeToken(JSTokenType.Script);
        }
        else {
            this.sync();
        }
    }
    *mayMakeTemplateLiteralToken() {
        let templateTagName = '';
        let nonWhiteSpacesOffset = this.backSearchChar(this.offset - 1, /\S/g);
        if (nonWhiteSpacesOffset > -1) {
            let nameStartOffset = this.backSearchChar(nonWhiteSpacesOffset, /[^\w]/g);
            templateTagName = this.string.slice(nameStartOffset + 1, nonWhiteSpacesOffset + 1);
        }
        if (templateTagName === 'html') {
            yield* this.makeScriptToken();
            this.readTemplateLiteral();
            yield this.makeToken(JSTokenType.HTML);
        }
        else if (templateTagName === 'css') {
            yield* this.makeScriptToken();
            this.readTemplateLiteral();
            yield this.makeToken(JSTokenType.CSS);
        }
        else {
            this.readTemplateLiteral();
        }
    }
}
exports.JSTokenScanner = JSTokenScanner;
//# sourceMappingURL=js.js.map