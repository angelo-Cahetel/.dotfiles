"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CSSTokenTree = void 0;
const scanners_1 = require("../scanners");
const css_node_1 = require("./css-node");
const parts_1 = require("../parts");
const parts_2 = require("../parts");
const picker_1 = require("./picker");
const utils_1 = require("./utils");
const utils_2 = require("../../utils");
class CSSTokenTree extends css_node_1.CSSTokenNode {
    /** Make a CSS token tree by string. */
    static fromString(string, scannerStart, languageId) {
        let tokens;
        if (languageId === 'sass') {
            tokens = new scanners_1.SassIndentedTokenScanner(string, scannerStart, languageId).parseToTokens();
        }
        else {
            tokens = new scanners_1.CSSTokenScanner(string, scannerStart, languageId).parseToTokens();
        }
        return CSSTokenTree.fromTokens(tokens, string, scannerStart, languageId);
    }
    /** Make a CSS token tree by tokens. */
    static fromTokens(tokens, string, tokenOffset, languageId) {
        let tree = new CSSTokenTree(string, tokenOffset, languageId);
        let current = tree;
        let latestComment = null;
        let notDetermined = [];
        function parseNotDetermined(mayBeSelector) {
            let joint = (0, utils_1.joinTokens)(notDetermined, string, tokenOffset);
            if (isCommandToken(joint)) {
                current.children.push(new css_node_1.CSSTokenNode(css_node_1.CSSTokenNodeType.Command, joint, current));
            }
            // Especially when inputting like `a{b|}`.
            else if (mayBeSelector) {
                // Content contains `:`, parse as property declaration.
                if (joint.text.includes(':')) {
                    parseAsPropertyDeclaration(joint);
                }
                // Not complete variable definition.
                else if (/^\s*-/.test(joint.text)) {
                    let nameToken = parsePropertyNameToken(joint);
                    current.children.push(new css_node_1.CSSTokenNode(css_node_1.CSSTokenNodeType.PropertyName, nameToken, current, latestComment));
                }
                // text may still have whitespaces on left, wait to be dropped in selector parser.
                else {
                    current.children.push(new css_node_1.CSSTokenNode(css_node_1.CSSTokenNodeType.Selector, joint, current, latestComment));
                }
            }
            // Otherwise parse as property.
            else {
                parseAsPropertyDeclaration(joint);
            }
            notDetermined = [];
            latestComment = null;
        }
        function parseAsPropertyDeclaration(token) {
            let o = splitPropertyTokens(token);
            if (o) {
                let [restNameToken, nameToken, valueToken] = o;
                let nameNode = new css_node_1.CSSTokenNode(css_node_1.CSSTokenNodeType.PropertyName, nameToken, current, restNameToken ? null : latestComment);
                let valueNode = new css_node_1.CSSTokenNode(css_node_1.CSSTokenNodeType.PropertyValue, valueToken, current);
                nameNode.defEnd = valueToken.end;
                if (restNameToken) {
                    let restNameNode = new css_node_1.CSSTokenNode(css_node_1.CSSTokenNodeType.PropertyName, restNameToken, current, latestComment);
                    current.children.push(restNameNode);
                }
                current.children.push(nameNode, valueNode);
            }
        }
        for (let token of tokens) {
            if (token.type === scanners_1.CSSTokenType.NotDetermined) {
                notDetermined.push(token);
            }
            else if (token.type === scanners_1.CSSTokenType.SassInterpolation) {
                notDetermined.push(token);
            }
            else if (token.type === scanners_1.CSSTokenType.SemiColon) {
                if (notDetermined.length > 0) {
                    parseNotDetermined(false);
                }
            }
            else if (token.type === scanners_1.CSSTokenType.ClosureStart) {
                if (notDetermined.length > 0) {
                    let joint = (0, utils_1.joinTokens)(notDetermined, string, tokenOffset);
                    let type = getSelectorLikeNodeType(joint, current);
                    let node = new css_node_1.CSSTokenNode(type, joint, current, latestComment);
                    current.children.push(node);
                    current = node;
                    notDetermined = [];
                    latestComment = null;
                }
            }
            else if (token.type === scanners_1.CSSTokenType.ClosureEnd) {
                if (notDetermined.length > 0) {
                    parseNotDetermined(true);
                }
                current.defEnd = token.end;
                current = current.parent ?? tree;
            }
            else if (token.type === scanners_1.CSSTokenType.CommentText) {
                // Normally use `/*!...*/` as global comment.
                if (notDetermined.length === 0 && !token.text.startsWith('!')) {
                    latestComment = token;
                }
            }
        }
        // Although has no `{` followed, still parse it as selector.
        if (notDetermined.length > 0) {
            parseNotDetermined(true);
        }
        return tree;
    }
    /**
     * For property name part.
     * Be static for the usage of parsing inline style.
     */
    static *parsePropertyNamePart(text, start, commentText, valueText) {
        if (text.startsWith('-')) {
            // Will not set defEnd to value end, because default vscode plugin will
            // also generate a definition, but end with property name end.
            if (valueText) {
                yield new parts_1.CSSVariableDefinitionPart(text, start, commentText, valueText);
            }
            // Not complete css variable definition, for completion.
            else {
                yield new parts_1.Part(parts_1.PartType.CSSVariableDefinitionNotComplete, text, start);
            }
        }
    }
    /**
     * For property value part.
     * Be static for the usage parsing inline style.
     */
    static *parsePropertyValuePart(text, start) {
        let varMatches = picker_1.Picker.locateAllMatches(text, /var\(\s*([\w-]*)\s*\)|^\s*(-[\w-]*)|(--[\w-]*)/g, [0, 1]);
        for (let match of varMatches) {
            // `var()`, can't find captured match.
            if (!match[1]) {
                yield new parts_1.Part(parts_1.PartType.CSSVariableReference, '', match[0].start + 4 + start);
            }
            else if (match[0].text.startsWith('var')) {
                yield new parts_1.Part(parts_1.PartType.CSSVariableReference, match[1].text, match[1].start + start);
            }
            // `color: --name`, only for completion.
            else {
                yield new parts_1.Part(parts_1.PartType.CSSVariableReferenceNoVar, match[1].text, match[1].start + start);
            }
        }
    }
    string;
    /** When as embedded css, is the offset in parent document. */
    tokenOffset;
    languageId;
    nodePartMap = new utils_2.ListMap();
    commandWrappedMap = new Map();
    constructor(string, tokenOffset, languageId) {
        super(css_node_1.CSSTokenNodeType.Root, {
            type: scanners_1.CSSTokenType.NotDetermined,
            text: '',
            start: -1,
            end: -1,
        }, null);
        this.string = string;
        this.tokenOffset = tokenOffset;
        this.languageId = languageId;
    }
    /**
     * Walk all the parts.
     * Note it ignores all non-primary selectors.
     */
    *walkParts() {
        for (let node of this.walk()) {
            yield* this.parseNodePart(node);
        }
    }
    *parseNodePart(node) {
        if (node.isRoot()) {
            return;
        }
        if (node.type === css_node_1.CSSTokenNodeType.Selector) {
            yield* this.parseSelectorPart(node);
        }
        else if (node.type === css_node_1.CSSTokenNodeType.PropertyName) {
            yield* this.parsePropertyNamePart(node);
        }
        else if (node.type === css_node_1.CSSTokenNodeType.PropertyValue) {
            yield* this.parsePropertyValuePart(node);
        }
        else if (node.type === css_node_1.CSSTokenNodeType.Command) {
            yield* this.parseCommandPart(node);
        }
    }
    /** Parse a selector string to parts. */
    *parseSelectorPart(node) {
        yield* this.parseSelectorString(node.token.text, node.token.start, node, false);
    }
    /** For property name part. */
    *parsePropertyNamePart(node) {
        let text = node.token.text;
        if (!text.startsWith('-')) {
            return;
        }
        let commentText = node.commentToken?.text;
        let nextNode = node.getNextSibling();
        // CSS Variable value.
        let cssVariableValue = nextNode && nextNode.type === css_node_1.CSSTokenNodeType.PropertyValue
            ? nextNode.token.text
            : undefined;
        // Will not set defEnd to value end, because default vscode plugin will
        // also generate a definition, but end with property name end.
        yield* CSSTokenTree.parsePropertyNamePart(text, node.token.start, commentText, cssVariableValue);
    }
    /** For property value part. */
    *parsePropertyValuePart(node) {
        yield* CSSTokenTree.parsePropertyValuePart(node.token.text, node.token.start);
    }
    /** Parse a selector content to parts. */
    *parseSelectorString(text, start, node, breaksSeparatorNesting) {
        let groups = new scanners_1.CSSSelectorTokenScanner(text, start, this.languageId).parseToSeparatedTokens();
        let parentParts = this.nodePartMap.get(node.parent);
        let commandWrapped = node.parent ? !!this.commandWrappedMap.get(node.parent) : false;
        for (let group of groups) {
            let joint = (0, utils_1.joinTokens)(group, this.string, this.tokenOffset);
            let part = parts_2.CSSSelectorWrapperPart.parseFrom(joint, group, parentParts, breaksSeparatorNesting, node.defEnd, commandWrapped, node.commentToken?.text);
            yield part;
            this.nodePartMap.add(node, part);
        }
        // Broadcast wrapped to children.
        this.commandWrappedMap.set(node, commandWrapped);
    }
    /** Parse a command string to parts. */
    *parseCommandPart(node) {
        let commandName = getCommandName(node.token.text);
        // For workspace symbol searching.
        if (commandName !== 'at-root') {
            yield (new parts_1.Part(parts_1.PartType.CSSCommand, node.token.text, node.token.start, node.defEnd)).trim();
        }
        // See https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_nesting/Nesting_at-rules
        if (commandName === 'media'
            || commandName === 'supports'
            || commandName === 'layer'
            || commandName === 'scope'
            || commandName === 'container') {
            let parentParts = this.nodePartMap.get(node.parent);
            if (parentParts) {
                this.nodePartMap.set(node, parentParts);
            }
        }
        if (commandName === 'import') {
            // `@import ''`.
            // `class={style['class-name']}`.
            let match = picker_1.Picker.locateMatches(node.token.text, /@import\s+['"](.+?)['"]/, [1]);
            if (match) {
                yield new parts_1.Part(parts_1.PartType.CSSImportPath, match[1].text, match[1].start + node.token.start);
            }
        }
        else if (commandName === 'at-root') {
            // `@at-root .class`.
            let selectorMatch = picker_1.Picker.locateMatches(node.token.text, /@at-root\s+(.+)/, [1]);
            if (selectorMatch) {
                yield* this.parseSelectorString(selectorMatch[1].text, selectorMatch[1].start + node.token.start, node, true);
            }
        }
        this.commandWrappedMap.set(node, true);
    }
}
exports.CSSTokenTree = CSSTokenTree;
function isCommandToken(token) {
    return /^\s*@/.test(token.text);
}
function getCommandName(text) {
    return text.match(/@([\w-]+)/)?.[1];
}
function isTemplateInterpolatorStart(token) {
    return /\$$/.test(token.text);
}
function getSelectorLikeNodeType(token, current) {
    if (current.type === css_node_1.CSSTokenNodeType.Command && getCommandName(current.token.text) === 'keyframes') {
        return css_node_1.CSSTokenNodeType.ClosureName;
    }
    else if (isCommandToken(token)) {
        return css_node_1.CSSTokenNodeType.Command;
    }
    // `xx${`
    else if (isTemplateInterpolatorStart(token)) {
        return css_node_1.CSSTokenNodeType.ClosureName;
    }
    else {
        return css_node_1.CSSTokenNodeType.Selector;
    }
}
function splitPropertyTokens(token) {
    // Here ignores comments.
    let match = picker_1.Picker.locateMatches(token.text, /([\w-]+)\s*:\s*(.+?)\s*$/, [1, 2]);
    if (!match) {
        return null;
    }
    // Name before property name.
    let restName = null;
    let restText = token.text.slice(0, match[1].start);
    let restNameMatch = picker_1.Picker.locateMatches(restText, /[\w-]+/, [0]);
    if (restNameMatch) {
        restName = {
            type: scanners_1.CSSTokenType.NotDetermined,
            text: restNameMatch[0].text,
            start: token.start + restNameMatch[0].start,
            end: token.start + restNameMatch[0].start + restNameMatch[0].text.length,
        };
    }
    let name = {
        type: scanners_1.CSSTokenType.NotDetermined,
        text: match[1].text,
        start: token.start + match[1].start,
        end: token.start + match[1].start + match[1].text.length,
    };
    let value = {
        type: scanners_1.CSSTokenType.NotDetermined,
        text: match[2].text,
        start: token.start + match[2].start,
        end: token.start + match[2].start + match[2].text.length,
    };
    return [restName, name, value];
}
function parsePropertyNameToken(token) {
    let match = picker_1.Picker.locateMatches(token.text, /[\w-_]+/, [0]);
    if (!match) {
        return null;
    }
    // Exclude whitespaces.
    let name = {
        type: scanners_1.CSSTokenType.NotDetermined,
        text: match[0].text,
        start: token.start + match[0].start,
        end: token.start + match[0].start + match[0].text.length,
    };
    return name;
}
//# sourceMappingURL=css-tree.js.map