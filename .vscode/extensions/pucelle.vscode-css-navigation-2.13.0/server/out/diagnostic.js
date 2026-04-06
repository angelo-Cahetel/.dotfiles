"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDiagnostics = getDiagnostics;
const vscode_languageserver_1 = require("vscode-languageserver");
const languages_1 = require("./languages");
const utils_1 = require("./utils");
/** Provide class name diagnostics service. */
async function getDiagnostics(document, htmlServiceMap, cssServiceMap, configuration) {
    let documentExtension = (0, utils_1.getPathExtension)(document.uri);
    let isHTMLFile = configuration.activeHTMLFileExtensions.includes(documentExtension);
    let isCSSFile = configuration.activeCSSFileExtensions.includes(documentExtension);
    let shouldProvideDefDiag = isHTMLFile && configuration.enableClassNameDefinitionDiagnostic;
    let shouldProvideRefDiag = (isHTMLFile || isCSSFile) && configuration.enableClassNameReferenceDiagnostic;
    if (!shouldProvideDefDiag && !shouldProvideRefDiag) {
        return null;
    }
    let diagnostics = [];
    if (shouldProvideDefDiag) {
        let diags = await getDefinitionDiagnostics(document, htmlServiceMap, cssServiceMap, configuration);
        if (diags) {
            diagnostics.push(...diags);
        }
    }
    if (shouldProvideRefDiag) {
        let diags = await getReferencedDiagnostics(document, htmlServiceMap, cssServiceMap, configuration);
        if (diags) {
            diagnostics.push(...diags);
        }
    }
    return diagnostics;
}
/** Provide defined class name diagnostics service. */
async function getDefinitionDiagnostics(document, htmlServiceMap, cssServiceMap, configuration) {
    let currentHTMLService = await htmlServiceMap.forceGetServiceByDocument(document);
    if (!currentHTMLService) {
        return null;
    }
    let diagnostics = [];
    let classNameParts = currentHTMLService.getPartsByType(languages_1.PartType.Class);
    if (!classNameParts || classNameParts.length === 0) {
        return diagnostics;
    }
    await cssServiceMap.beFresh();
    if (configuration.enableGlobalEmbeddedCSS) {
        await htmlServiceMap.beFresh();
    }
    for (let part of classNameParts) {
        // Without identifier.
        let className = part.escapedText;
        if (currentHTMLService.hasDefinedClassName(className)) {
            continue;
        }
        if (cssServiceMap.hasDefinedClassName(className)) {
            continue;
        }
        if (configuration.enableGlobalEmbeddedCSS) {
            if (htmlServiceMap.hasDefinedClassName(className)) {
                continue;
            }
        }
        diagnostics.push({
            severity: vscode_languageserver_1.DiagnosticSeverity.Warning,
            range: { start: document.positionAt(part.start), end: document.positionAt(part.end) },
            message: `Can't find definition for ".${className}".`,
            source: 'CSS Navigation',
        });
    }
    return diagnostics;
}
/** Provide referenced class name diagnostics service. */
async function getReferencedDiagnostics(document, htmlServiceMap, cssServiceMap, configuration) {
    let documentExtension = (0, utils_1.getPathExtension)(document.uri);
    let isHTMLFile = configuration.activeHTMLFileExtensions.includes(documentExtension);
    let isCSSFile = configuration.activeCSSFileExtensions.includes(documentExtension);
    let diagnostics = [];
    if (isHTMLFile) {
        let currentHTMLService = await htmlServiceMap.forceGetServiceByDocument(document);
        if (!currentHTMLService) {
            return null;
        }
        let classNameParts = currentHTMLService.getPartsByType(languages_1.PartType.CSSSelectorClass);
        if (!classNameParts || classNameParts.length === 0) {
            return diagnostics;
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
            for (let className of classNames) {
                // Without identifier.
                let nonIdentifierClassName = className.slice(1);
                // Find only within current document.
                // Any one of formatted exist, break.
                if (currentHTMLService.hasReferencedClassName(nonIdentifierClassName)) {
                    break;
                }
                // Query across all js files.
                if (configuration.enableGlobalEmbeddedCSS) {
                    if (htmlServiceMap.hasReferencedClassName(nonIdentifierClassName)) {
                        break;
                    }
                }
                // Has `@css-ignore` comment.
                let wrapper = part.getWrapper(currentHTMLService);
                if (wrapper && wrapper.comment?.includes('@css-ignore')) {
                    break;
                }
                diagnostics.push({
                    severity: vscode_languageserver_1.DiagnosticSeverity.Warning,
                    range: { start: document.positionAt(part.start), end: document.positionAt(part.end) },
                    message: `Can't find reference for "${className}".`,
                    source: 'CSS Navigation',
                });
                break;
            }
        }
        return diagnostics;
    }
    else if (isCSSFile) {
        let currentCSSService = await cssServiceMap.forceGetServiceByDocument(document);
        if (!currentCSSService) {
            return null;
        }
        let classNameParts = currentCSSService.getPartsByType(languages_1.PartType.CSSSelectorClass);
        if (!classNameParts || classNameParts.length === 0) {
            return diagnostics;
        }
        await htmlServiceMap.beFresh();
        for (let part of classNameParts) {
            // Totally reference parent, no need to diagnose.
            if (part.escapedText === '&') {
                continue;
            }
            let classNames = part.formatted;
            for (let className of classNames) {
                // Without identifier.
                let nonIdentifierClassName = className.slice(1);
                // Any one of formatted exist, break.
                if (htmlServiceMap.hasReferencedClassName(nonIdentifierClassName)) {
                    break;
                }
                // Has `@css-ignore` comment.
                let wrapper = part.getWrapper(currentCSSService);
                if (wrapper && wrapper.comment?.includes('@css-ignore')) {
                    break;
                }
                diagnostics.push({
                    severity: vscode_languageserver_1.DiagnosticSeverity.Warning,
                    range: { start: document.positionAt(part.start), end: document.positionAt(part.end) },
                    message: `Can't find reference for "${className}".`,
                    source: 'CSS Navigation',
                });
                break;
            }
        }
        return diagnostics;
    }
    return null;
}
//# sourceMappingURL=diagnostic.js.map