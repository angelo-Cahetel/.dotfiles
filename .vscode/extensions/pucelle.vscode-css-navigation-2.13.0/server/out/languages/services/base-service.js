"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseService = void 0;
const resolver_1 = require("../resolver");
const parts_1 = require("../parts");
const utils_1 = require("../utils");
const vscode_uri_1 = require("vscode-uri");
const utils_2 = require("../../utils");
/** Base of HTML or CSS service for one file. */
class BaseService {
    document;
    config;
    parts;
    /** Contains primary selector part, bot not all details. */
    partMap;
    /** URIs of imported css. */
    resolvedImportedCSSURIs = undefined;
    /** All class names for diagnostic, names excluded identifier `.`. */
    definedClassNames = new Map();
    constructor(document, config) {
        this.document = document;
        this.config = config;
        let tree = this.makeTree();
        this.parts = [...tree.walkParts()];
        this.partMap = (0, utils_1.groupBy)(this.parts, part => [part.type, part]);
        this.initAdditionalParts();
        this.initDefinedClassNames();
    }
    initAdditionalParts() {
        let selectorParts = this.partMap.get(parts_1.PartType.CSSSelectorWrapper);
        if (!selectorParts) {
            return;
        }
        // Distinguish selector details.
        this.partMap.set(parts_1.PartType.CSSSelectorTag, []);
        this.partMap.set(parts_1.PartType.CSSSelectorClass, []);
        this.partMap.set(parts_1.PartType.CSSSelectorId, []);
        for (let part of selectorParts) {
            for (let detail of part.details) {
                this.partMap.get(detail.type).push(detail);
            }
        }
    }
    initDefinedClassNames() {
        if (!this.config.enableClassNameDefinitionDiagnostic) {
            return;
        }
        let classSelectorParts = this.partMap.get(parts_1.PartType.CSSSelectorClass);
        if (classSelectorParts) {
            for (let part of classSelectorParts) {
                if (part.escapedText === '&') {
                    continue;
                }
                for (let formatted of part.formatted) {
                    let className = formatted.slice(1);
                    this.definedClassNames.set(className, (this.definedClassNames.get(className) ?? 0) + 1);
                }
            }
        }
    }
    /** Get part list by part type. */
    getPartsByType(type) {
        return this.partMap.get(type) || [];
    }
    /** Get resolved import CSS uris. */
    async getImportedCSSURIs() {
        // Have low rate to resolving for twice, no matter.
        if (this.resolvedImportedCSSURIs) {
            return this.resolvedImportedCSSURIs;
        }
        let uris = [];
        for (let part of this.getPartsByType(parts_1.PartType.CSSImportPath)) {
            let protocol = (0, utils_2.isRelativePath)(part.escapedText) ? '' : vscode_uri_1.URI.parse(part.escapedText).scheme;
            // Relative path, or file, http or https.
            if (protocol !== '' && protocol !== 'file' && protocol !== 'http' && protocol !== 'https') {
                continue;
            }
            let uri = await resolver_1.PathResolver.resolveImportURI(part.escapedText, this.document);
            if (uri) {
                uris.push(uri);
            }
        }
        return this.resolvedImportedCSSURIs = uris;
    }
    /** Get defined class names as a set. */
    getDefinedClassNames() {
        return this.definedClassNames;
    }
    /** Test whether defined class name existing. */
    hasDefinedClassName(className) {
        return this.definedClassNames.has(className);
    }
    /** Test count of defined class name. */
    getDefinedClassNameCount(className) {
        return this.definedClassNames.get(className) ?? 0;
    }
    /**
     * Find a part at specified offset.
     * Note it never get detailed part.
     */
    findPartAt(offset) {
        let part = (0, utils_1.quickBinaryFindUpper)(this.parts, (part) => {
            if (part.start > offset) {
                return 1;
            }
            else if (part.end < offset) {
                return -1;
            }
            else {
                return 0;
            }
        });
        return part;
    }
    /**
     * Find a part at specified offset.
     * Note if match a css selector part, it may return a selector detail part.
     */
    findDetailedPartAt(offset) {
        let part = this.findPartAt(offset);
        // Returns detail if in range.
        if (part && part.type === parts_1.PartType.CSSSelectorWrapper) {
            let details = part.details;
            for (let detail of details) {
                if (detail
                    && detail.start <= offset
                    && detail.end >= offset) {
                    return detail;
                }
            }
            return undefined;
        }
        return part;
    }
    /**
     * Find previous sibling part before current.
     * Not it will not look up detailed parts.
     */
    findPreviousPart(part) {
        let partIndex = (0, utils_1.quickBinaryFindIndex)(this.parts, p => {
            return p.start - part.start;
        });
        if (partIndex <= 0) {
            return null;
        }
        return this.parts[partIndex - 1];
    }
    /**
     * Find definitions match part.
     * `matchDefPart` must have been converted to definition type.
     */
    findDefinitions(matchDefPart, fromPart, fromDocument) {
        let locations = [];
        for (let part of this.getPartsByType(matchDefPart.type)) {
            if (!parts_1.PartComparer.isMayFormattedListMatch(part, matchDefPart)) {
                continue;
            }
            // Not match non-primary detailed.
            if (part.isSelectorDetailedType() && !part.primary) {
                continue;
            }
            // `.a{&:hover}`, `&` not match `.a` because it reference parent completely.
            if (part.escapedText === '&') {
                continue;
            }
            locations.push(parts_1.PartConvertor.toLocationLink(part, this.document, fromPart, fromDocument));
        }
        return locations;
    }
    /**
     * Query symbols from a wild match part.
     *
     * Query string 'p' will match:
     *	p* as tag name
     *	.p* as class name
     *	#p* as id
     * and may have more decorated selectors followed.
     */
    findSymbols(query) {
        let symbols = [];
        let re = parts_1.PartConvertor.makeWordStartsMatchExp(query);
        for (let part of this.parts) {
            // Match text list with regexp, not match type.
            if (!parts_1.PartComparer.isMayFormattedListExpMatch(part, re)) {
                continue;
            }
            symbols.push(...parts_1.PartConvertor.toSymbolInformationList(part, this.document));
        }
        return symbols;
    }
    /**
     * Get completion labels match part.
     * `matchDefPart` must have been converted to definition type.
     */
    getCompletionLabels(matchPart, fromPart, maxStylePropertyCount) {
        let labelMap = new Map();
        let re = parts_1.PartConvertor.makeStartsMatchExp(matchPart.escapedText);
        for (let part of this.getPartsByType(matchPart.type)) {
            // Now allow to complete itself.
            if (part === fromPart) {
                continue;
            }
            if (!parts_1.PartComparer.isMayFormattedListExpMatch(part, re)) {
                continue;
            }
            // Show variable details.
            if (part.type === parts_1.PartType.CSSVariableDefinition) {
                let labelText = part.value;
                labelMap.set(part.escapedText, labelText ? { text: labelText, markdown: undefined } : null);
            }
            else {
                let label = null;
                if (part.isSelectorDetailedType()) {
                    let wrapperPart = part.getWrapper(this);
                    if (wrapperPart) {
                        label = {
                            text: wrapperPart.comment,
                            markdown: parts_1.PartConvertor.getSelectorStyleContent(wrapperPart, this.document, maxStylePropertyCount),
                        };
                    }
                }
                // Convert text from current type to original type of text.
                for (let text of parts_1.PartComparer.mayFormatted(part)) {
                    let originalTypeOfText = parts_1.PartConvertor.textToType(text, matchPart.type, fromPart.type);
                    labelMap.set(originalTypeOfText, label);
                }
            }
        }
        return labelMap;
    }
    /**
     * Get completion labels match part.
     * The difference with `getCompletionLabels` is that
     * `fromPart` is a definition part like class name selector,
     * but current parts are reference types of parts.
     */
    getReferencedCompletionLabels(fromPart) {
        let labelMap = new Map();
        let re = parts_1.PartConvertor.makeIdentifiedStartsMatchExp(parts_1.PartComparer.mayFormatted(fromPart), fromPart.type);
        let matchDefPart = parts_1.PartConvertor.toDefinitionMode(fromPart);
        for (let type of this.partMap.keys()) {
            // Filter by type.
            if (!parts_1.PartComparer.isReferenceTypeMatch(type, matchDefPart.type)) {
                continue;
            }
            for (let part of this.getPartsByType(type)) {
                // Now allow to complete itself.
                if (part === fromPart) {
                    continue;
                }
                // Filter by text.
                if (!parts_1.PartComparer.isMayFormattedListExpMatch(part, re)) {
                    continue;
                }
                for (let text of parts_1.PartComparer.mayFormatted(part)) {
                    // Replace back from `a-b` to `&-b`.
                    let mayNestedText = parts_1.PartConvertor.textToType(text, part.type, fromPart.type).replace(re, fromPart.escapedText);
                    if (mayNestedText === text) {
                        labelMap.set(mayNestedText, null);
                    }
                    else {
                        labelMap.set(mayNestedText, { text, markdown: undefined });
                    }
                }
            }
        }
        return labelMap;
    }
    /**
     * Find the reference locations in the HTML document from a class or id selector.
     * `matchDefPart` must have been converted to definition type.
     */
    findReferences(matchDefPart, fromPart) {
        let locations = [];
        // Important, use may formatted text, and also must use definition text.
        let texts = fromPart.hasFormattedList() ? parts_1.PartComparer.mayFormatted(fromPart) : [matchDefPart.escapedText];
        for (let type of this.partMap.keys()) {
            // Filter by type.
            if (!parts_1.PartComparer.isReferenceTypeMatch(type, matchDefPart.type)) {
                continue;
            }
            for (let part of this.getPartsByType(type)) {
                // No include from part.
                // Beware this will cause some reference tests can't pass because of the build-in reference.
                // if (part === fromPart) {
                // 	continue
                // }
                // Filter by text.
                if (!parts_1.PartComparer.isReferenceTextMatch(part, matchDefPart.type, texts)) {
                    continue;
                }
                locations.push(parts_1.PartConvertor.toLocation(part, this.document));
            }
        }
        return locations;
    }
    /** Find hover from CSS document for providing class or id name hover for a HTML document. */
    findHover(matchDefPart, fromPart, fromDocument, maxStylePropertyCount) {
        let parts = [];
        for (let part of this.getPartsByType(matchDefPart.type)) {
            // Not match non-primary detailed.
            if (part.isSelectorDetailedType() && !part.primary) {
                continue;
            }
            if (!parts_1.PartComparer.isMayFormattedListMatch(part, matchDefPart)) {
                continue;
            }
            parts.push(part);
        }
        // Find independent part, if not found, use first part.
        let part = parts.find(part => part.isSelectorDetailedType() && part.independent);
        if (!part && parts.length > 0) {
            part = parts[0];
        }
        if (!part) {
            return null;
        }
        if (part.isSelectorDetailedType()) {
            let wrapperPart = part.getWrapper(this);
            if (!wrapperPart) {
                return null;
            }
            return parts_1.PartConvertor.toHoverOfSelectorWrapper(wrapperPart, fromPart, this.document, fromDocument, maxStylePropertyCount);
        }
        else if (part.isCSSVariableDefinitionType()) {
            return parts_1.PartConvertor.toHoverOfCSSVariableDefinition(part, fromPart, fromDocument);
        }
        return null;
    }
    /** Find all css variable values. */
    getCSSVariables(names) {
        let map = new Map();
        for (let part of this.getPartsByType(parts_1.PartType.CSSVariableDefinition)) {
            if (!names.has(part.escapedText)) {
                continue;
            }
            if (!part.value) {
                continue;
            }
            map.set(part.escapedText, part.value);
        }
        return map;
    }
}
exports.BaseService = BaseService;
//# sourceMappingURL=base-service.js.map