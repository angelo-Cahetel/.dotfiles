"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HTMLTokenTree = void 0;
const scanners_1 = require("../scanners");
const parts_1 = require("../parts");
const utils_1 = require("./utils");
const picker_1 = require("./picker");
const css_tree_1 = require("./css-tree");
const html_node_1 = require("./html-node");
const js_tree_1 = require("./js-tree");
const language_ids_1 = require("../language-ids");
const class_names_in_js_1 = require("../class-names-in-js");
/**
 * Tags that self closing.
 * Reference from https://developer.mozilla.org/en-US/docs/Glossary/Void_element
 */
const SelfClosingTags = [
    'area',
    'base',
    'br',
    'col',
    'embed',
    'hr',
    'img',
    'input',
    'link',
    'meta',
    'param',
    'source',
    'track',
    'wbr',
];
class HTMLTokenTree extends html_node_1.HTMLTokenNode {
    /** Make a HTML token tree by string. */
    static fromString(string, scannerStart = 0, languageId = 'html') {
        let tokens = new scanners_1.HTMLTokenScanner(string, scannerStart, languageId).parseToTokens();
        return HTMLTokenTree.fromTokens(tokens, languageId);
    }
    /** Make a token tree by tokens. */
    static fromTokens(tokens, languageId = 'html') {
        let tree = new HTMLTokenTree(languageId);
        let current = tree;
        let currentAttr = null;
        for (let token of tokens) {
            if (token.type === scanners_1.HTMLTokenType.StartTagName) {
                let tagNode = new html_node_1.HTMLTokenNode(token, current);
                current.children.push(tagNode);
                current = tagNode;
            }
            else if (token.type === scanners_1.HTMLTokenType.EndTagName) {
                do {
                    // </name>
                    if (current.token.text === token.text) {
                        current = current.parent ?? tree;
                        break;
                    }
                    // </>
                    if (token.text === '') {
                        current = current.parent ?? tree;
                        break;
                    }
                    current = current.parent ?? tree;
                } while (current !== tree);
            }
            else if (token.type === scanners_1.HTMLTokenType.TagEnd) {
                if (current && current.token.type === scanners_1.HTMLTokenType.StartTagName
                    && SelfClosingTags.includes(current.token.text)) {
                    current = current.parent ?? tree;
                }
            }
            else if (token.type === scanners_1.HTMLTokenType.SelfCloseTagEnd) {
                if (current && current.token.type === scanners_1.HTMLTokenType.StartTagName) {
                    current = current.parent ?? tree;
                }
            }
            else if (token.type === scanners_1.HTMLTokenType.AttributeName) {
                if (current && current.token.type === scanners_1.HTMLTokenType.StartTagName) {
                    currentAttr = { name: token, value: null };
                    current.attrs.push(currentAttr);
                }
            }
            else if (token.type === scanners_1.HTMLTokenType.AttributeValue) {
                if (currentAttr) {
                    currentAttr.value = token;
                }
            }
            else if (token.type === scanners_1.HTMLTokenType.Text) {
                let textNode = new html_node_1.HTMLTokenNode(token, current);
                current.children.push(textNode);
            }
            else if (token.type === scanners_1.HTMLTokenType.CommentText) {
                let commentNode = new html_node_1.HTMLTokenNode(token, current);
                current.children.push(commentNode);
            }
        }
        return tree;
    }
    languageId;
    constructor(languageId) {
        super({
            type: scanners_1.HTMLTokenType.StartTagName,
            text: 'root',
            start: -1,
            end: -1,
        }, null);
        this.languageId = languageId;
    }
    *walkParts() {
        for (let node of this.walk()) {
            yield* this.parseNodeParts(node);
        }
    }
    /** Parse node and attributes. */
    *parseNodeParts(node) {
        if (node.token.type === scanners_1.HTMLTokenType.StartTagName) {
            let partType = /^[A-Z]/.test(node.token.text) ? parts_1.PartType.ComponentTag : parts_1.PartType.Tag;
            yield new parts_1.Part(partType, node.token.text, node.token.start, node.tagLikeEnd);
            // Parse attributes and sort them.
            yield* this.sortParts(this.parseAttrParts(node));
            if (node.tagName === 'script') {
                yield* this.parseScriptPart(node);
            }
            else if (node.tagName === 'style') {
                yield* this.parseStylePart(node);
            }
        }
    }
    /** Parse attributes for parts. */
    *parseAttrParts(node) {
        for (let attr of node.attrs) {
            yield* this.parseAttrPart(attr.name, attr.value);
        }
        yield* this.parseImportPart(node);
    }
    /** For attribute part. */
    *parseAttrPart(attrName, attrValue) {
        let name = attrName.text;
        let unQuotedAttrValue = attrValue ? (0, utils_1.removeQuotesFromToken)(attrValue) : null;
        if (name === 'id') {
            if (unQuotedAttrValue) {
                yield new parts_1.Part(parts_1.PartType.Id, unQuotedAttrValue.text, unQuotedAttrValue.start);
            }
        }
        else if (name === 'style') {
            if (unQuotedAttrValue) {
                yield* this.parseStylePropertyParts(unQuotedAttrValue.text, unQuotedAttrValue.start);
            }
        }
        // For `lupos.html`, complete `:class.|name|` with class names.
        else if (language_ids_1.LanguageIds.isScriptSyntax(this.languageId) && name.startsWith(':class.')) {
            yield new parts_1.Part(parts_1.PartType.Class, attrName.text.slice(7), attrName.start + 7);
        }
        // For `lupos.html`, complete `:style.-` with CSS Variables.
        else if (language_ids_1.LanguageIds.isScriptSyntax(this.languageId) && name.startsWith(':style.-')) {
            yield new parts_1.Part(parts_1.PartType.CSSVariableAssignment, attrName.text.slice(7), attrName.start + 7);
        }
        // For normal class attribute, or for `JSX`, `lupos.html`, `Vue.js`,
        // or for `:class`, `v-bind:class`, `x-bind:class`
        else if (name === 'class' || name === 'className' || name === ':class' || name.endsWith('-bind:class')) {
            if (attrValue) {
                // Probably expression, and within template interpolation `${...}` or `{...}`.
                // `className={expression}` for React like.
                // `x-bind:class="expression"` for Alpine.js.
                // `:class="expression"` always contain expression in vue.
                // `class={...}` for Solid.js.
                // Exclude template literal `class="${...}"`
                // Which supports `"{className: boolean}"` syntax.
                let alreadyAnExpression = name.endsWith('-bind:class')
                    || this.languageId === 'vue' && name === ':class';
                let text = attrValue.text;
                let start = attrValue.start;
                if (alreadyAnExpression && (0, utils_1.hasQuotes)(text)) {
                    text = unQuotedAttrValue.text;
                    start = unQuotedAttrValue.start;
                }
                yield* this.parseExpressionLike(text, start, alreadyAnExpression);
            }
        }
        // onClick={() => ...}
        // onClick=${() => ...}
        else if (attrValue && name.startsWith('on') && (0, utils_1.isExpressionLike)(attrValue.text)) {
            // Start a white list HTML tree to parse for React Elements.
            let tokens = new scanners_1.WhiteListHTMLTokenScanner(attrValue.text, attrValue.start, this.languageId).parseToTokens();
            let htmlTree = HTMLTokenTree.fromTokens(tokens, this.languageId);
            yield* htmlTree.walkParts();
        }
        // https://github.com/gajus/babel-plugin-react-css-modules and issue #60.
        // import 'xx.css'
        // `styleName="class-name"`
        else if (language_ids_1.LanguageIds.isScriptSyntax(this.languageId) && name === 'styleName') {
            if (unQuotedAttrValue) {
                yield new parts_1.Part(parts_1.PartType.ReactDefaultImportedCSSModuleClass, unQuotedAttrValue.text, unQuotedAttrValue.start);
            }
        }
        // `var xxxClassNameXXX = `
        else if (attrValue && (0, utils_1.isExpressionLike)(attrValue.text)) {
            for (let part of class_names_in_js_1.ClassNamesInJS.walkParts(attrValue.text, attrValue.start)) {
                yield part;
            }
        }
        // `.enterClassName="..."`
        else if (name
            && attrValue
            && name.startsWith('.')
            && class_names_in_js_1.ClassNamesInJS.isWildName(name.slice(1))) {
            yield (new parts_1.Part(parts_1.PartType.Class, attrValue.text, attrValue.start)).unquote().trim();
        }
    }
    /** Parse expression like. */
    *parseExpressionLike(text, start, alreadyAnExpression) {
        let scanner = new scanners_1.CSSClassInExpressionTokenScanner(text, start, this.languageId, alreadyAnExpression);
        for (let token of scanner.parseToTokens()) {
            if (token.type === scanners_1.CSSClassInExpressionTokenType.ClassName) {
                yield new parts_1.Part(parts_1.PartType.Class, token.text, token.start);
            }
            else if (token.type === scanners_1.CSSClassInExpressionTokenType.PotentialClassName) {
                yield new parts_1.Part(parts_1.PartType.ClassPotential, token.text, token.start);
            }
            else if (token.type === scanners_1.CSSClassInExpressionTokenType.ReactModuleName) {
                yield new parts_1.Part(parts_1.PartType.ReactImportedCSSModuleName, token.text, token.start);
            }
            else if (token.type === scanners_1.CSSClassInExpressionTokenType.ReactModuleProperty) {
                yield new parts_1.Part(parts_1.PartType.ReactImportedCSSModuleProperty, token.text, token.start);
            }
        }
    }
    /** For import path, only for CSS imports. */
    *parseImportPart(node) {
        if (node.tagName === 'link') {
            if (node.getAttributeValue('rel') === 'stylesheet') {
                let href = node.getAttribute('href');
                if (href) {
                    yield new parts_1.Part(parts_1.PartType.CSSImportPath, href.text, href.start);
                }
            }
        }
        // Vue.js only.
        else if (node.tagName === 'style') {
            let src = node.getAttribute('src');
            if (src) {
                yield new parts_1.Part(parts_1.PartType.CSSImportPath, src.text, src.start);
            }
        }
    }
    /** For react css module. */
    *parseReactModulePart(attrValue) {
        let start = attrValue.start;
        // `class={...}`.
        if (!/^\s*\{[\s\S]*?\}\s*$/.test(attrValue.text)) {
            return;
        }
        // `style.className`.
        // `style['class-name']`.
        let matches = picker_1.Picker.locateAllMatchGroups(attrValue.text, /(?<moduleName>\w+)(?:\.(?<propertyName1>\w+)|\[\s*['"`](?<propertyName2>\w[\w-]*)['"`]\s*\])/g);
        for (let match of matches) {
            yield new parts_1.Part(parts_1.PartType.ReactImportedCSSModuleName, match.moduleName.text, match.moduleName.start + start);
            let propertyName = match.propertyName1 ?? match.propertyName2;
            yield new parts_1.Part(parts_1.PartType.ReactImportedCSSModuleProperty, propertyName.text, propertyName.start + start);
        }
    }
    /** Parse script tag for parts. */
    *parseScriptPart(node) {
        let textNode = node.firstTextNode;
        // Not process embedded js within embedded html.
        if (textNode && textNode.token.text && language_ids_1.LanguageIds.isHTMLSyntax(this.languageId)) {
            let jsTree = js_tree_1.JSTokenTree.fromString(textNode.token.text, textNode.token.start, 'js');
            yield* jsTree.walkParts();
        }
    }
    /** Parse style tag for parts. */
    *parseStylePart(node) {
        let textNode = node.firstTextNode;
        if (textNode) {
            let languageId = node.getAttributeValue('lang') ?? 'css';
            yield* this.parseStyleTextParts(textNode.token.text, textNode.token.start, languageId);
        }
    }
    /** Parse style content for parts. */
    *parseStyleTextParts(text, start, languageId) {
        let cssTree = css_tree_1.CSSTokenTree.fromString(text, start, languageId);
        yield* cssTree.walkParts();
    }
    /** Parse style property content for parts. */
    *parseStylePropertyParts(text, start) {
        let matches = picker_1.Picker.locateAllMatches(text, /([\w-]+)\s*:\s*(.+?)\s*(?:;|$)/g, [1, 2]);
        for (let match of matches) {
            let name = match[1];
            let value = match[2];
            yield* css_tree_1.CSSTokenTree.parsePropertyNamePart(name.text, name.start + start, undefined, value.text);
            yield* css_tree_1.CSSTokenTree.parsePropertyValuePart(value.text, value.start + start);
        }
    }
}
exports.HTMLTokenTree = HTMLTokenTree;
//# sourceMappingURL=html-tree.js.map