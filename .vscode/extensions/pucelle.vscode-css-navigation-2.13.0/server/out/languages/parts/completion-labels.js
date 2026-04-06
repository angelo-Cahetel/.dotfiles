"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompletionLabels = exports.CompletionLabelType = void 0;
const part_1 = require("./part");
const vscode_languageserver_1 = require("vscode-languageserver");
const part_convertor_1 = require("./part-convertor");
const utils_1 = require("../../utils");
var CompletionLabelType;
(function (CompletionLabelType) {
    CompletionLabelType[CompletionLabelType["CSSVariable"] = 0] = "CSSVariable";
    CompletionLabelType[CompletionLabelType["Definition"] = 1] = "Definition";
    CompletionLabelType[CompletionLabelType["Reference"] = 2] = "Reference";
})(CompletionLabelType || (exports.CompletionLabelType = CompletionLabelType = {}));
/** Merge several groups of completion labels. */
class CompletionLabels {
    typeMap = new Map();
    detailMap = new Map();
    add(type, labelMap) {
        for (let [label, detail] of labelMap) {
            if (!this.typeMap.has(label) || this.typeMap.get(label) < type) {
                this.typeMap.set(label, type);
                this.detailMap.set(label, detail);
            }
        }
    }
    remove(labels) {
        for (let label of labels) {
            this.typeMap.delete(label);
            // No need to delete details, wait them to be GC.
        }
    }
    /** If `forceForOffset` specified, reset text edit to this offset. */
    output(fromPart, document, forceEditCollapseToOffset = undefined) {
        let items = [];
        let collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base', ignorePunctuation: true });
        let sortedTexts = [...this.typeMap.keys()].sort(collator.compare);
        for (let i = 0; i < sortedTexts.length; i++) {
            let kind;
            let text = sortedTexts[i];
            let type = this.typeMap.get(text);
            if (type === CompletionLabelType.CSSVariable) {
                kind = vscode_languageserver_1.CompletionItemKind.Variable;
            }
            else if (type === CompletionLabelType.Definition) {
                kind = vscode_languageserver_1.CompletionItemKind.Class;
            }
            else {
                kind = vscode_languageserver_1.CompletionItemKind.Value;
            }
            let label = this.detailMap.get(text);
            let detail = label?.text;
            // Completion supports only HEX color type.
            if (type === CompletionLabelType.CSSVariable && detail) {
                let color = utils_1.Color.fromString(detail);
                if (color) {
                    kind = vscode_languageserver_1.CompletionItemKind.Color;
                    detail = color.toHEX();
                }
            }
            // Before completion items expanded, shows detail,
            // After expanded, shows documentation.
            // If both provided, shows detail + documentation after expanded.
            let documentation = label?.markdown;
            // Use space because it's char code is 32, lower than any other visible characters.
            let sortText = ' ' + String(i).padStart(3, '0');
            let insertText = text;
            let command;
            // `--name` -> `var(--name)`
            if (fromPart.type === part_1.PartType.CSSVariableReferenceNoVar) {
                insertText = `var(${text})`;
            }
            // Reset text edit collapse to the specified offset.
            let range = part_convertor_1.PartConvertor.toRange(fromPart, document);
            if (forceEditCollapseToOffset !== undefined) {
                range.start = range.end = document.positionAt(forceEditCollapseToOffset);
            }
            // `--` -> `--name: |;`
            if (fromPart.type === part_1.PartType.CSSVariableDefinitionNotComplete) {
                insertText = text + ': ;';
                command = vscode_languageserver_1.Command.create('Move cursor forward for one character', 'CSSNavigation.moveCursorForward');
            }
            let textEdit = vscode_languageserver_1.TextEdit.replace(part_convertor_1.PartConvertor.toRange(fromPart, document), insertText);
            let item = {
                kind,
                label: text,
                detail,
                sortText,
                textEdit,
                command,
                documentation: documentation ? { kind: 'markdown', value: documentation } : undefined
            };
            items.push(item);
        }
        return items;
    }
}
exports.CompletionLabels = CompletionLabels;
//# sourceMappingURL=completion-labels.js.map