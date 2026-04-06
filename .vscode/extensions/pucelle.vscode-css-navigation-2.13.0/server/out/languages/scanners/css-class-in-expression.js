"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CSSClassInExpressionTokenScanner = exports.CSSClassInExpressionTokenType = void 0;
const language_ids_1 = require("../language-ids");
const any_1 = require("./any");
/** CSS class-in-expression token type. */
var CSSClassInExpressionTokenType;
(function (CSSClassInExpressionTokenType) {
    /** A class name. */
    CSSClassInExpressionTokenType[CSSClassInExpressionTokenType["ClassName"] = 0] = "ClassName";
    /**
     * "" or '', become a class name after complete.
     * or "| a", "a |", or "a | b".
     */
    CSSClassInExpressionTokenType[CSSClassInExpressionTokenType["PotentialClassName"] = 1] = "PotentialClassName";
    CSSClassInExpressionTokenType[CSSClassInExpressionTokenType["ReactModuleName"] = 2] = "ReactModuleName";
    CSSClassInExpressionTokenType[CSSClassInExpressionTokenType["ReactModuleProperty"] = 3] = "ReactModuleProperty";
})(CSSClassInExpressionTokenType || (exports.CSSClassInExpressionTokenType = CSSClassInExpressionTokenType = {}));
var ScanState;
(function (ScanState) {
    ScanState[ScanState["EOF"] = 0] = "EOF";
    ScanState[ScanState["AnyContent"] = 1] = "AnyContent";
    ScanState[ScanState["WithinString"] = 2] = "WithinString";
    ScanState[ScanState["WithinExpression"] = 3] = "WithinExpression";
    ScanState[ScanState["WithinVariable"] = 4] = "WithinVariable";
    ScanState[ScanState["WithinObject"] = 5] = "WithinObject";
    ScanState[ScanState["WithinArray"] = 6] = "WithinArray";
})(ScanState || (ScanState = {}));
/** For scanning class name in expression. */
class CSSClassInExpressionTokenScanner extends any_1.AnyTokenScanner {
    /** Start index of string part. */
    stringStart = -1;
    stringStartStack = [];
    /**
     * If can knows that current string is absolute an expression,
     * no bracket marker like `{...}`,
     * like x-bind:class=`variable ? a : b`,
     * or :class=`{prop: boolean}`
     * `alreadyAnExpression` indicates whether have no `${...}` or `{...}` wrapped and already an expression.
     */
    constructor(string, scannerStart = 0, languageId, alreadyAnExpression) {
        super(string, scannerStart, languageId);
        if (alreadyAnExpression) {
            this.enterState(ScanState.WithinExpression);
        }
    }
    get quoted() {
        if (this.stringStart > 0) {
            return this.string[this.stringStart - 1];
        }
        else {
            return null;
        }
    }
    enterStringState() {
        this.enterState(ScanState.WithinString);
        if (this.stringStart > -1) {
            this.stringStartStack.push(this.stringStart);
        }
        this.stringStart = this.offset;
    }
    exitStringState() {
        this.exitState();
        this.stringStart = this.stringStartStack.pop();
    }
    /**
     * Parse to CSS selector tokens.
     * This is rough tokens, more details wait to be determined.
     */
    *parseToTokens() {
        let offset = -1;
        while (this.state !== ScanState.EOF) {
            // Base rules: offset must move ahead in each loop.
            if (this.offset <= offset) {
                this.offset = offset + 1;
            }
            offset = this.offset;
            if (this.state === ScanState.AnyContent) {
                if (!this.readUntilToMatch(/['"`{$]/g)) {
                    break;
                }
                let char = this.peekChar();
                // `|${`
                if (char === '$' && this.peekChar(1) === '{' && language_ids_1.LanguageIds.isScriptSyntax(this.languageId)) {
                    // Move to `${|`
                    this.offset += 2;
                    this.enterState(ScanState.WithinExpression);
                }
                // `|{`
                else if (char === '{' && language_ids_1.LanguageIds.isScriptSyntax(this.languageId)) {
                    // Move to `{|`
                    this.offset += 1;
                    this.enterState(ScanState.WithinExpression);
                }
                // `|'` or `|"` or `|``
                else if (char === '\'' || char === '"' || char === '`') {
                    // Move to `"|`
                    this.offset += 1;
                    this.enterStringState();
                }
            }
            else if (this.state === ScanState.WithinString) {
                if (!this.readUntilToMatch(/['"`\\\w-${\s]/g)) {
                    break;
                }
                let char = this.peekChar();
                // `|${`
                if (char === '$') {
                    if (this.peekChar(1) === '{' && language_ids_1.LanguageIds.isScriptSyntax(this.languageId)) {
                        // Move to `${|`
                        this.offset += 2;
                        this.enterState(ScanState.WithinExpression);
                    }
                    else {
                        // Move to `$|`
                        this.offset += 1;
                    }
                }
                // `|\\`, skip next char.
                else if (char === '\\') {
                    // Move to `\"|`
                    this.offset += 2;
                }
                // `|'` or `|"` or `|``
                else if (char === '\'' || char === '"' || char === '`') {
                    if (char === this.quoted) {
                        // "|"
                        if (this.stringStart === this.offset) {
                            this.sync();
                            yield this.makeToken(CSSClassInExpressionTokenType.PotentialClassName);
                        }
                        // "name |"
                        else if (/\s/.test(this.peekChar(-1))) {
                            this.sync();
                            yield this.makeToken(CSSClassInExpressionTokenType.PotentialClassName);
                        }
                        // Move to `"|`
                        this.offset += 1;
                        this.exitStringState();
                    }
                    else {
                        // Move after `"|`
                        this.offset += 1;
                    }
                }
                // `| `
                else if (/\s/.test(char)) {
                    this.sync();
                    yield* this.handleClassNameSpaces();
                }
                // `|[\w_]`
                else {
                    this.sync();
                    yield* this.handleClassName();
                }
            }
            else if (this.state === ScanState.WithinExpression) {
                if (!this.readUntilToMatch(/['"`{\[\w\}]/g)) {
                    break;
                }
                let char = this.peekChar();
                // `|'` or `|"` or `|``
                if (char === '\'' || char === '"' || char === '`') {
                    // Move to `"|`
                    this.offset += 1;
                    this.enterStringState();
                }
                // `|{`
                else if (char === '{') {
                    // Move to `{|`
                    this.offset += 1;
                    this.enterState(ScanState.WithinObject);
                }
                // `|[`
                else if (char === '[') {
                    // Move to `[|`
                    this.offset += 1;
                    this.enterState(ScanState.WithinArray);
                }
                // `|}`
                else if (char === '}') {
                    // Move to `}|`
                    this.offset += 1;
                    this.exitState();
                }
                // `|a`
                else {
                    this.enterState(ScanState.WithinVariable);
                    this.sync();
                }
            }
            else if (this.state === ScanState.WithinVariable) {
                // `abc|`
                this.readUntilNot(/\w/g);
                let nameToken = this.makeToken(CSSClassInExpressionTokenType.ReactModuleName);
                if (!this.readWhiteSpaces()) {
                    break;
                }
                let char = this.peekChar();
                if (char === '.') {
                    // Move to `.|`
                    this.offset += 1;
                    this.sync();
                    this.readUntilNot(/\w/g);
                    let propertyToken = this.makeToken(CSSClassInExpressionTokenType.ReactModuleProperty);
                    if (propertyToken.text.length > 0) {
                        yield nameToken;
                        yield propertyToken;
                    }
                }
                else if (char === '[') {
                    // Move to `[|`
                    this.offset += 1;
                    if (!this.readWhiteSpaces()) {
                        break;
                    }
                    char = this.peekChar();
                    // Move to `|'`
                    if (char === '\'' || char === '"' || char === '`') {
                        this.sync();
                        if (!this.readString()) {
                            return;
                        }
                        let propertyToken = this.makeToken(CSSClassInExpressionTokenType.ReactModuleProperty, 1, -1);
                        if (propertyToken.text.length > 0) {
                            yield nameToken;
                            yield propertyToken;
                        }
                        // Move to `'|`
                        this.offset += 1;
                        // Move to `]|`
                        this.readOutToMatch(/]/g);
                    }
                }
                this.exitState();
            }
            else if (this.state === ScanState.WithinObject) {
                // `{|`
                if (!this.readUntilToMatch(/[\w'"`}]/g)) {
                    break;
                }
                let char = this.peekChar();
                // `|}`
                if (char === '}') {
                    // Move to `}|`
                    this.offset += 1;
                    this.exitState();
                }
                // `|'...':`
                else if (char === '\'' || char === '"' || char === '`') {
                    this.sync();
                    if (!this.readString()) {
                        break;
                    }
                    let propertyToken = this.makeToken(CSSClassInExpressionTokenType.ClassName, 1, -1);
                    if (!this.readWhiteSpaces()) {
                        break;
                    }
                    if (this.peekChar() === ':') {
                        if (propertyToken.text.length > 0) {
                            yield propertyToken;
                        }
                    }
                }
                // `|a`
                else {
                    this.sync();
                    // `abc|`
                    this.readUntilNot(/\w/g);
                    let propertyToken = this.makeToken(CSSClassInExpressionTokenType.ClassName);
                    if (!this.readWhiteSpaces()) {
                        break;
                    }
                    if (this.peekChar() === ':') {
                        if (propertyToken.text.length > 0) {
                            yield propertyToken;
                        }
                    }
                }
                while (true) {
                    if (!this.readUntilToMatch(/[\{\[\(,}]/g)) {
                        break;
                    }
                    char = this.peekChar();
                    // Skip all bracket expressions.
                    if (char === '{' || char === '[' || char === '(') {
                        this.readBracketed();
                    }
                    else if (char === ',') {
                        // Move to `,|`
                        this.offset += 1;
                        break;
                    }
                    else if (char === '}') {
                        break;
                    }
                }
            }
            else if (this.state === ScanState.WithinArray) {
                // `{|`
                if (!this.readUntilToMatch(/['"`,\{\]]/g)) {
                    break;
                }
                let char = this.peekChar();
                // `|'...':`
                if (char === '\'' || char === '"' || char === '`') {
                    // Move to `"|`
                    this.offset += 1;
                    this.enterStringState();
                }
                // `|{`
                else if (char === '{') {
                    // Move to `{|`
                    this.offset += 1;
                    this.enterState(ScanState.WithinObject);
                }
                // `|,`
                else if (char === ',') {
                    // Move to `,|`
                    this.offset += 1;
                }
                // `|]`
                else if (char === ']') {
                    // Move to `]|`
                    this.offset += 1;
                    this.exitState();
                }
            }
        }
    }
    *handleClassName() {
        // `abc|`
        if (!this.readUntilToMatch(/['"`\s\\$]/g)) {
            return;
        }
        // Skip `abc${...}`
        let char = this.peekChar();
        if (char === '$') {
            // Move to `$|`
            this.offset += 1;
            if (this.peekChar() === '{' && language_ids_1.LanguageIds.isScriptSyntax(this.languageId)) {
                // Read until `${...}|`
                if (!this.readBracketed()) {
                    return;
                }
            }
        }
        // `|\\`, skip next char.
        else if (char === '\\') {
            // Move to `\"|`
            this.offset += 2;
        }
        // `|'` or `|"` or `|``.
        else if (char === '\'' || char === '"' || char === '`') {
            if (char === this.quoted) {
                yield this.makeToken(CSSClassInExpressionTokenType.ClassName);
            }
            else {
                // Move after `"|`
                this.offset += 1;
            }
        }
        // `|\s`
        else {
            yield this.makeToken(CSSClassInExpressionTokenType.ClassName);
        }
    }
    *handleClassNameSpaces() {
        // ` |`
        this.readUntilNot(/[\s]/g);
        // At least two spaces.
        if (this.offset - this.start > 1 || this.start === this.stringStart) {
            yield this.makeToken(CSSClassInExpressionTokenType.PotentialClassName, 1, -1);
        }
    }
}
exports.CSSClassInExpressionTokenScanner = CSSClassInExpressionTokenScanner;
//# sourceMappingURL=css-class-in-expression.js.map