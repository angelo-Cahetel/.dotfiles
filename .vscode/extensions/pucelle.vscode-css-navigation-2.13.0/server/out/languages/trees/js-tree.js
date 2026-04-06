"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JSTokenTree = void 0;
const scanners_1 = require("../scanners");
const parts_1 = require("../parts");
const picker_1 = require("./picker");
const utils_1 = require("../../utils");
const css_tree_1 = require("./css-tree");
const js_node_1 = require("./js-node");
const html_tree_1 = require("./html-tree");
const language_ids_1 = require("../language-ids");
const class_names_in_js_1 = require("../class-names-in-js");
class JSTokenTree extends js_node_1.JSTokenNode {
    /** Make a HTML token tree by string. */
    static fromString(string, scannerStart = 0, languageId = 'js') {
        let tokens = new scanners_1.JSTokenScanner(string, scannerStart, languageId).parseToTokens();
        return JSTokenTree.fromTokens(tokens, languageId);
    }
    /** Make a token tree by tokens. */
    static fromTokens(tokens, languageId = 'js') {
        let tree = new JSTokenTree(languageId);
        for (let token of tokens) {
            if (token.type === scanners_1.JSTokenType.HTML
                || token.type === scanners_1.JSTokenType.CSS
                || token.type === scanners_1.JSTokenType.Script) {
                let tagNode = new js_node_1.JSTokenNode(token, tree);
                tree.children.push(tagNode);
            }
        }
        return tree;
    }
    languageId;
    constructor(languageId) {
        super({
            type: scanners_1.JSTokenType.Script,
            text: '',
            start: -1,
            end: -1,
        }, null);
        this.languageId = languageId;
        this.children = [];
    }
    *walkParts() {
        for (let node of this.walk()) {
            yield* this.parseNodeParts(node);
        }
    }
    /** Parse node and attributes. */
    *parseNodeParts(node) {
        if (node.token.type === scanners_1.JSTokenType.HTML) {
            yield* this.parseHTMLParts(node);
        }
        else if (node.token.type === scanners_1.JSTokenType.CSS) {
            yield* this.parseCSSParts(node);
        }
        else if (node.token.type === scanners_1.JSTokenType.Script) {
            yield* this.sortParts(this.parseScriptParts(node));
        }
    }
    /** Parse html template part. */
    *parseHTMLParts(node) {
        // HTML tree accept current language, and it affects some actions.
        let htmlTree = html_tree_1.HTMLTokenTree.fromString(node.token.text, node.token.start, this.languageId);
        yield* htmlTree.walkParts();
    }
    /** Parse css template part. */
    *parseCSSParts(node) {
        let cssTree = css_tree_1.CSSTokenTree.fromString(node.token.text, node.token.start, 'css');
        yield* cssTree.walkParts();
    }
    /** Parse script text for parts. */
    *parseScriptParts(node) {
        let text = node.token.text;
        let start = node.token.start;
        // `querySelect('.class-name')`
        // `$('.class-name')`
        let matches = picker_1.Picker.locateAllMatches(text, /(?:\$|\.querySelector|\.querySelectorAll)\s*\(\s*['"`](.*?)['"`]/g, [1]);
        for (let match of matches) {
            let selector = match[1].text;
            let selectorStart = match[1].start + start;
            let tokens = new scanners_1.CSSSelectorTokenScanner(selector, selectorStart, 'css').parseToTokens();
            for (let token of tokens) {
                if (token.type === scanners_1.CSSSelectorTokenType.Tag) {
                    yield new parts_1.Part(parts_1.PartType.CSSSelectorQueryTag, token.text, token.start);
                }
                else if (token.type === scanners_1.CSSSelectorTokenType.Id) {
                    yield new parts_1.Part(parts_1.PartType.CSSSelectorQueryId, token.text, token.start);
                }
                else if (token.type === scanners_1.CSSSelectorTokenType.Class) {
                    yield new parts_1.Part(parts_1.PartType.CSSSelectorQueryClass, token.text, token.start);
                }
            }
        }
        // `.classList.add('...')`
        matches = picker_1.Picker.locateAllMatches(text, /\.classList\.add\s*\(\s*['"`]([\w-]*)['"`]/g, [1]);
        for (let match of matches) {
            yield (new parts_1.Part(parts_1.PartType.Class, match[1].text, match[1].start + start)).trim();
        }
        // `var xxxClassNameXXX = `
        for (let part of class_names_in_js_1.ClassNamesInJS.walkParts(text, start)) {
            yield part;
        }
        // `setProperty('--variable-name')`
        matches = picker_1.Picker.locateAllMatches(text, /\.setProperty\s*\(\s*['"`](-[\w-]*)['"`]/g, [1]);
        for (let match of matches) {
            yield (new parts_1.Part(parts_1.PartType.CSSVariableAssignment, match[1].text, match[1].start + start)).trim();
        }
        // `import * from '...'`
        // `import abc from '...'`
        // `import '...'`
        matches = picker_1.Picker.locateAllMatches(text, /import\s+(?:\w+\s+from\s+)?['"`](.+?)['"`]/g, [1]);
        for (let match of matches) {
            let path = match[1].text;
            if ((0, utils_1.isCSSLikePath)(path)) {
                yield (new parts_1.Part(parts_1.PartType.CSSImportPath, match[1].text, match[1].start + start)).trim();
            }
        }
        // Parse react elements.
        if (language_ids_1.LanguageIds.isReactScriptSyntax(this.languageId)) {
            yield* this.parseReactElementParts(node);
        }
    }
    /** Parse react elements. */
    *parseReactElementParts(node) {
        let text = node.token.text;
        let start = node.token.start;
        // Start a white list HTML tree to parse for React Elements.
        let tokens = new scanners_1.WhiteListHTMLTokenScanner(text, start, this.languageId).parseToTokens();
        let htmlTree = html_tree_1.HTMLTokenTree.fromTokens(tokens, this.languageId);
        yield* htmlTree.walkParts();
    }
}
exports.JSTokenTree = JSTokenTree;
//# sourceMappingURL=js-tree.js.map