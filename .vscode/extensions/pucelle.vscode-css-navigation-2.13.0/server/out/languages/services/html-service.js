"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HTMLService = void 0;
const parts_1 = require("../parts");
const trees_1 = require("../trees");
const base_service_1 = require("./base-service");
const path = require("node:path");
const language_ids_1 = require("../language-ids");
/** If document opened. */
const HTMLLanguageIdMap = {
    'javascriptreact': 'jsx',
    'typescriptreact': 'tsx',
    'javascript': 'js',
    'typescript': 'ts',
};
/** If document closed, or language plugin not installed. */
const HTMLLanguageExtensionMap = {
    'jsx': 'jsx',
    'js': 'js',
    'tsx': 'tsx',
    'ts': 'ts',
    'vue': 'vue',
};
/** Scan html code pieces in files that can include HTML codes, like html, js, jsx, ts, tsx. */
class HTMLService extends base_service_1.BaseService {
    /** All class names references and their count for diagnostic, names excluded identifier `.`. */
    classNamesReferenceSet = new Map();
    constructor(document, config) {
        super(document, config);
        this.initClassNamesReferenceSet();
    }
    initClassNamesReferenceSet() {
        if (!this.config.enableClassNameReferenceDiagnostic) {
            return;
        }
        let classTexts = [
            ...this.partMap.get(parts_1.PartType.Class)?.map(p => p.escapedText) || [],
            ...this.partMap.get(parts_1.PartType.ReactImportedCSSModuleProperty)?.map(p => p.escapedText) || [],
            ...this.partMap.get(parts_1.PartType.CSSSelectorQueryClass)?.map(p => p.escapedText.slice(1)) || [],
            ...this.partMap.get(parts_1.PartType.ReactDefaultImportedCSSModuleClass)?.map(p => p.escapedText) || [],
        ];
        for (let text of classTexts) {
            this.classNamesReferenceSet.set(text, (this.classNamesReferenceSet.get(text) ?? 0) + 1);
        }
    }
    /** Get all referenced class names and their count. */
    getReferencedClassNamesSet() {
        return this.classNamesReferenceSet;
    }
    /**
     * Test whether referenced class name existing.
     * `className` must not have identifier `.`.
     */
    hasReferencedClassName(className) {
        return this.classNamesReferenceSet.has(className);
    }
    /** Get referenced class name count. */
    getReferencedClassNameCount(className) {
        return this.classNamesReferenceSet.get(className) ?? 0;
    }
    makeTree() {
        let extension = path.extname(this.document.uri).slice(1).toLowerCase();
        let languageId = HTMLLanguageIdMap[this.document.languageId] ?? HTMLLanguageExtensionMap[extension] ?? 'html';
        if (language_ids_1.LanguageIds.isHTMLSyntax(languageId)) {
            return trees_1.HTMLTokenTree.fromString(this.document.getText(), 0, languageId);
        }
        else {
            return trees_1.JSTokenTree.fromString(this.document.getText(), 0, languageId);
        }
    }
}
exports.HTMLService = HTMLService;
//# sourceMappingURL=html-service.js.map