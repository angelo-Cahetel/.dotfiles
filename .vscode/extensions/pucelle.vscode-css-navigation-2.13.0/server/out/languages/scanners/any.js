"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnyTokenScanner = exports.BRACKETS_MAP = void 0;
const language_ids_1 = require("../language-ids");
exports.BRACKETS_MAP = {
    '(': ')',
    '[': ']',
    '{': '}',
};
var ScanState;
(function (ScanState) {
    ScanState[ScanState["EOF"] = 0] = "EOF";
    ScanState[ScanState["AnyContent"] = 1] = "AnyContent";
})(ScanState || (ScanState = {}));
class AnyTokenScanner {
    string;
    scannerStart;
    languageId;
    start = 0;
    offset = 0;
    state = ScanState.AnyContent;
    /** For complex state management when you don't want building a tree. */
    stateStack = [];
    constructor(string, scannerStart = 0, languageId) {
        this.string = string;
        this.scannerStart = scannerStart;
        this.languageId = languageId;
    }
    /** For complex state management when you don't want building a tree. */
    enterState(state) {
        this.stateStack.push(this.state);
        this.state = state;
    }
    /** For complex state management when you don't want building a tree. */
    exitState() {
        if (this.stateStack.length === 0) {
            this.state = ScanState.EOF;
        }
        else {
            this.state = this.stateStack.pop();
        }
    }
    isEnded() {
        return this.state === ScanState.EOF;
    }
    peekChars(move = 0, count) {
        return this.string.slice(this.offset + move, this.offset + move + count);
    }
    peekChar(move = 0) {
        return this.string.substring(this.offset + move, this.offset + move + 1);
    }
    /** Peek text within `start` and `offset`. */
    peekText() {
        return this.string.slice(this.start, this.offset);
    }
    /**
     * It reads matches one by one, and requires each match must connect end to start.
     * Moves cursor to before first not match position.
     * Note the `re` must have `g` flag set.
     * Returns whether had read some characters.
     */
    readUntilNot(re) {
        re.lastIndex = this.offset;
        let readSome = false;
        while (true) {
            let m = re.exec(this.string);
            if (!m) {
                break;
            }
            if (m.index !== this.offset) {
                break;
            }
            this.offset = m.index + m[0].length;
            readSome = true;
        }
        if (this.offset === this.string.length) {
            this.state = ScanState.EOF;
        }
        return readSome;
    }
    /**
     * It moves `offset` to before match.
     * Note the `re` must have `g` flag set.
     */
    readUntilToMatch(re) {
        re.lastIndex = this.offset;
        let m = re.exec(this.string);
        if (m) {
            this.offset = m.index;
        }
        else {
            this.offset = this.string.length;
            this.state = ScanState.EOF;
        }
        return m;
    }
    /**
     * It moves `offset` to after match.
     * Note the `re` must have `g` flag set.
     */
    readOutToMatch(re) {
        re.lastIndex = this.offset;
        let m = re.exec(this.string);
        if (m) {
            this.offset = m.index + m[0].length;
        }
        else {
            this.offset = this.string.length;
            this.state = ScanState.EOF;
        }
        return m;
    }
    /**
     * Read string until position after end quote: `"..."|`.
     * Cursor must before first quote `|"`.
     */
    readString() {
        let quote = this.peekChar();
        // Avoid read start quote.
        this.offset += 1;
        while (true) {
            // "..."|
            if (!this.readOutToMatch(/['"\\$]/g)) {
                break;
            }
            let char = this.peekChar(-1);
            if (char === quote) {
                break;
            }
            // Skip next character.
            if (char === '\\') {
                this.offset += 1;
            }
            // Read template literal.
            if (char === '$' && this.peekChar() === '{' && quote === '`' && language_ids_1.LanguageIds.isScriptSyntax(this.languageId)) {
                if (!this.readBracketed()) {
                    break;
                }
            }
        }
        return this.state !== ScanState.EOF;
    }
    /** Read all whitespaces, move cursor to before first non white space. */
    readWhiteSpaces() {
        return !!this.readUntilToMatch(/\S/g);
    }
    /** Read chars until before `|\r\n`. */
    readLine() {
        if (!this.readUntilToMatch(/[\r\n]/g)) {
            return false;
        }
        // Move cursor to `\r|\n`.
        if (this.peekChar() === '\r' && this.peekChar(1) === '\n') {
            this.offset += 1;
        }
        return true;
    }
    /** Read chars until after `\r\n`. */
    readLineAndEnd() {
        if (!this.readLine()) {
            return false;
        }
        this.offset += 1;
        return true;
    }
    /**
     * Try read an bracketed expression like `[...]`, `(...)`, `{...}`.
     * Must ensure the current char is one of `[{(`,
     * and cursor must before start bracket `[{(`.
     * brackets or quotes must appear in pairs.
     * It stops after found all matching end brackets.
     * Supported language js, css, sass, less.
     */
    readBracketed() {
        let stack = [];
        let expect = null;
        let re = /[()\[\]{}"'`\/]/g;
        while (this.state !== ScanState.EOF) {
            if (!this.readUntilToMatch(re)) {
                break;
            }
            let char = this.peekChar();
            // `|"..."`
            if (char === '"' || char === '\'') {
                this.readString();
                continue;
            }
            // '|`...`'
            else if (char === '`' && language_ids_1.LanguageIds.isScriptSyntax(this.languageId)) {
                this.readTemplateLiteral();
                continue;
            }
            // `|/*`
            else if (char === '/' && this.peekChar(1) === '*') {
                // Move cursor to `/*|`.
                this.offset += 2;
                this.readOutToMatch(/\*\//g);
                continue;
            }
            // `|//`
            else if (char === '/' && this.peekChar(1) === '/' && this.languageId !== 'css') {
                // Move cursor to `//|`.
                this.offset += 2;
                this.readLineAndEnd();
                continue;
            }
            // `|/`, currently can't distinguish it from sign of division.
            // else if (char === '/' && LanguageIds.isScriptSyntax(this.languageId)) {
            // 	// read out whole expression.
            // 	this.readRegExp()
            // 	continue
            // }
            // Eat the char.
            this.offset += 1;
            if (char === expect) {
                if (stack.length > 0) {
                    expect = stack.pop();
                }
                else {
                    break;
                }
            }
            else if (char === '[' || char === '(' || char === '{') {
                if (expect) {
                    stack.push(expect);
                }
                expect = exports.BRACKETS_MAP[char];
            }
        }
        return this.state !== ScanState.EOF;
    }
    /** Read `...`, must ensure the current char is `|``. */
    readTemplateLiteral() {
        let re = /[`\\$]/g;
        // Avoid read start quote.
        this.offset += 1;
        while (true) {
            if (!this.readOutToMatch(re)) {
                break;
            }
            let char = this.peekChar(-1);
            if (char === '`') {
                break;
            }
            else if (char === '$' && this.peekChar() === '{') {
                if (!this.readBracketed()) {
                    break;
                }
            }
            // Skip next character.
            else if (char === '\\') {
                this.offset += 1;
            }
        }
        return this.state !== ScanState.EOF;
    }
    /**
     * Read a regexp expression like `/.../`.
     * Cursor must locate at `|/`.
     * Returns whether read a regexp.
     */
    tryReadRegExp() {
        let withinCharList = false;
        let startOffset = this.offset;
        // Move cursor to `/|`
        this.offset += 1;
        while (true) {
            if (!this.readOutToMatch(/[\\\[\]\/\r\n]/g)) {
                this.offset = startOffset + 1;
                return false;
            }
            let char = this.peekChar(-1);
            // `\|.`, skip next char, even within character list.
            if (char === '\\') {
                // Move to `\.|`
                this.offset += 1;
            }
            // `[|`, start character list.
            else if (char === '[' && !withinCharList) {
                withinCharList = true;
            }
            // `]|`, end character list.
            else if (char === ']' && withinCharList) {
                withinCharList = false;
            }
            // `/|`, end regexp.
            else if (char === '/' && !withinCharList) {
                break;
            }
            // Not correctly ended.
            else if (char === '\r' || char === '\n') {
                // Move to `/|` if failed to read regexp.
                this.offset = startOffset + 1;
                return false;
            }
        }
        // Skip regexp flags.
        !!this.readUntilToMatch(/[^a-z]/g);
        return true;
    }
    /**
     * Back search from `offset` to preceding.
     * Can only search one character each time.
     */
    backSearchChar(from, match, maxCount = Infinity) {
        let until = Math.max(from - maxCount, 0);
        for (let i = from; i >= until; i--) {
            let char = this.string[i];
            if (match.test(char)) {
                return i;
            }
        }
        return -1;
    }
    /** Note it will sync start to offset. */
    makeToken(type, startOffset = 0, endOffset = 0) {
        let start = this.start + startOffset;
        let end = this.offset + endOffset;
        let text = this.string.slice(start, end);
        this.sync();
        return {
            type,
            text: text,
            start: start + this.scannerStart,
            end: end + this.scannerStart,
        };
    }
    /** Moves start to current offset and skip all chars between. */
    sync() {
        this.start = this.offset;
    }
}
exports.AnyTokenScanner = AnyTokenScanner;
//# sourceMappingURL=any.js.map