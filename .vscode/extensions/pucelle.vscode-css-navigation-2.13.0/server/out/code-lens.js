"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCodeLens = getCodeLens;
const languages_1 = require("./languages");
const utils_1 = require("./utils");
const vscode_uri_1 = require("vscode-uri");
/** Provide class name CodeLens service. */
async function getCodeLens(document, htmlServiceMap, cssServiceMap, configuration) {
    // No code lens for remote source.
    if (vscode_uri_1.URI.parse(document.uri).scheme !== 'file') {
        return null;
    }
    let documentExtension = (0, utils_1.getPathExtension)(document.uri);
    let isHTMLFile = configuration.activeHTMLFileExtensions.includes(documentExtension);
    let isCSSFile = configuration.activeCSSFileExtensions.includes(documentExtension);
    let codeLens = [];
    if (isHTMLFile && configuration.enableDefinitionCodeLens) {
        let diags = await getDefinitionCodeLens(document, htmlServiceMap, cssServiceMap, configuration);
        if (diags) {
            codeLens.push(...diags);
        }
    }
    if ((isHTMLFile || isCSSFile) && configuration.enableReferenceCodeLens) {
        let diags = await getReferencedCodeLens(document, htmlServiceMap, cssServiceMap, configuration);
        if (diags) {
            codeLens.push(...diags);
        }
    }
    return codeLens;
}
/** Provide defined class name code lens service. */
async function getDefinitionCodeLens(document, htmlServiceMap, cssServiceMap, configuration) {
    let currentHTMLService = await htmlServiceMap.forceGetServiceByDocument(document);
    if (!currentHTMLService) {
        return null;
    }
    let codeLens = [];
    let classNameParts = [
        ...currentHTMLService.getPartsByType(languages_1.PartType.Class),
        ...currentHTMLService.getPartsByType(languages_1.PartType.ReactDefaultImportedCSSModuleClass),
        ...currentHTMLService.getPartsByType(languages_1.PartType.ReactImportedCSSModuleProperty),
    ];
    if (!classNameParts || classNameParts.length === 0) {
        return codeLens;
    }
    await cssServiceMap.beFresh();
    if (configuration.enableGlobalEmbeddedCSS) {
        await htmlServiceMap.beFresh();
    }
    for (let part of classNameParts) {
        // Without identifier.
        let className = part.escapedText;
        let count = 0;
        count += cssServiceMap.getDefinedClassNameCount(className);
        if (configuration.enableGlobalEmbeddedCSS) {
            count += htmlServiceMap.getDefinedClassName(className);
        }
        else {
            count += currentHTMLService.getDefinedClassNameCount(className);
        }
        if (count > 0) {
            codeLens.push({
                range: { start: document.positionAt(part.start), end: document.positionAt(part.end) },
                command: {
                    title: count > 1 ? `${count} definitions` : `${count} definition`,
                    command: `CSSNavigation.peekDefinitions`,
                    arguments: [document.uri, document.positionAt(part.start)],
                },
            });
        }
    }
    return codeLens;
}
/** Provide referenced class name CodeLens service. */
async function getReferencedCodeLens(document, htmlServiceMap, cssServiceMap, configuration) {
    let documentExtension = (0, utils_1.getPathExtension)(document.uri);
    let isHTMLFile = configuration.activeHTMLFileExtensions.includes(documentExtension);
    let isCSSFile = configuration.activeCSSFileExtensions.includes(documentExtension);
    let codeLens = [];
    if (isHTMLFile) {
        let currentHTMLService = await htmlServiceMap.forceGetServiceByDocument(document);
        if (!currentHTMLService) {
            return null;
        }
        let classNameParts = currentHTMLService.getPartsByType(languages_1.PartType.CSSSelectorClass);
        if (!classNameParts || classNameParts.length === 0) {
            return codeLens;
        }
        if (configuration.enableGlobalEmbeddedCSS) {
            await htmlServiceMap.beFresh();
        }
        for (let part of classNameParts) {
            // Totally reference parent, no need to diagnose.
            if (part.escapedText === '&') {
                continue;
            }
            let classNames = part.formatted;
            let count = 0;
            for (let className of classNames) {
                // Without identifier.
                let nonIdentifierClassName = className.slice(1);
                if (configuration.enableGlobalEmbeddedCSS) {
                    count += htmlServiceMap.getReferencedClassNameCount(nonIdentifierClassName);
                }
                else {
                    count += currentHTMLService.getReferencedClassNameCount(nonIdentifierClassName);
                }
            }
            if (count > 0) {
                codeLens.push({
                    range: { start: document.positionAt(part.start), end: document.positionAt(part.end) },
                    command: {
                        title: count > 1 ? `${count} references` : `${count} reference`,
                        command: `CSSNavigation.peekReferences`,
                        arguments: [document.uri, document.positionAt(part.start)],
                    },
                });
            }
        }
        return codeLens;
    }
    else if (isCSSFile) {
        let currentCSSService = await cssServiceMap.forceGetServiceByDocument(document);
        if (!currentCSSService) {
            return null;
        }
        let classNameParts = currentCSSService.getPartsByType(languages_1.PartType.CSSSelectorClass);
        if (!classNameParts || classNameParts.length === 0) {
            return codeLens;
        }
        await htmlServiceMap.beFresh();
        for (let part of classNameParts) {
            // Totally reference parent, no need to diagnose.
            if (part.escapedText === '&') {
                continue;
            }
            let classNames = part.formatted;
            let count = 0;
            for (let className of classNames) {
                // Without identifier.
                let nonIdentifierClassName = className.slice(1);
                // Any one of formatted exist, break.
                count += htmlServiceMap.getReferencedClassNameCount(nonIdentifierClassName);
            }
            if (count > 0) {
                codeLens.push({
                    range: { start: document.positionAt(part.start), end: document.positionAt(part.end) },
                    command: {
                        title: count > 1 ? `${count} references` : `${count} reference`,
                        command: `CSSNavigation.peekReferences`,
                        arguments: [document.uri, document.positionAt(part.start)],
                    },
                });
            }
        }
        return codeLens;
    }
    return null;
}
//# sourceMappingURL=code-lens.js.map