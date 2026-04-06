"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findHover = findHover;
const languages_1 = require("./languages");
const utils_1 = require("./utils");
/** Provide finding hover service. */
async function findHover(document, offset, htmlServiceMap, cssServiceMap, configuration) {
    let documentExtension = (0, utils_1.getPathExtension)(document.uri);
    let isHTMLFile = configuration.activeHTMLFileExtensions.includes(documentExtension);
    let isCSSFile = configuration.activeCSSFileExtensions.includes(documentExtension);
    if (isHTMLFile) {
        let currentHTMLService = await htmlServiceMap.forceGetServiceByDocument(document);
        if (!currentHTMLService) {
            return null;
        }
        let fromPart = currentHTMLService.findDetailedPartAt(offset);
        if (!fromPart) {
            return null;
        }
        // No hover.
        if (fromPart.type === languages_1.PartType.ClassPotential) {
            return null;
        }
        return await findHoverInHTML(fromPart, currentHTMLService, document, htmlServiceMap, cssServiceMap, configuration);
    }
    else if (isCSSFile) {
        let currentCSSService = await cssServiceMap.forceGetServiceByDocument(document);
        if (!currentCSSService) {
            return null;
        }
        let fromPart = currentCSSService.findDetailedPartAt(offset);
        if (!fromPart) {
            return null;
        }
        return await findHoverInCSS(fromPart, currentCSSService, document, cssServiceMap, configuration);
    }
    return null;
}
/** Find hover in HTML or CSS files. */
async function findHoverInHTML(fromPart, currentService, document, htmlServiceMap, cssServiceMap, configuration) {
    if (!fromPart.isReferenceType()) {
        return null;
    }
    let hover = null;
    let matchPart = languages_1.PartConvertor.toDefinitionMode(fromPart);
    if (fromPart.isSelectorType() || fromPart.isCSSVariableType()) {
        // Find within current document.
        hover = await findEmbeddedOrImported(matchPart, fromPart, currentService, document, cssServiceMap, configuration);
        if (hover) {
            return hover;
        }
        // Find across all css documents.
        hover = await cssServiceMap.findHover(matchPart, fromPart, document, configuration.maxHoverStylePropertyCount);
        if (hover) {
            return hover;
        }
        // Find across all html documents.
        if (configuration.enableGlobalEmbeddedCSS) {
            hover = await htmlServiceMap.findHover(matchPart, fromPart, document, configuration.maxHoverStylePropertyCount);
            if (hover) {
                return hover;
            }
        }
    }
    return null;
}
/** Find hover in HTML or CSS files. */
async function findHoverInCSS(fromPart, currentService, document, cssServiceMap, configuration) {
    if (!fromPart.isReferenceType()) {
        return null;
    }
    let hover = null;
    let matchPart = languages_1.PartConvertor.toDefinitionMode(fromPart);
    if (fromPart.isCSSVariableType()) {
        // Find within current document.
        hover = await findEmbeddedOrImported(matchPart, fromPart, currentService, document, cssServiceMap, configuration);
        if (hover) {
            return hover;
        }
        // Find across all css documents.
        hover = await cssServiceMap.findHover(matchPart, fromPart, document, configuration.maxHoverStylePropertyCount);
        if (hover) {
            return hover;
        }
    }
    return null;
}
async function findEmbeddedOrImported(matchPart, fromPart, currentService, document, cssServiceMap, configuration) {
    // Find embedded hover.
    let hover = currentService.findHover(matchPart, fromPart, document, configuration.maxHoverStylePropertyCount);
    if (hover) {
        return hover;
    }
    // Having CSS files imported, firstly search within these files, if found, not searching more.
    let cssURIs = await currentService.getImportedCSSURIs();
    let cssURIChain = cssServiceMap.trackingMap.resolveChainedImportedURIs(cssURIs);
    for (let cssURI of cssURIChain) {
        let cssService = await cssServiceMap.forceGetServiceByURI(cssURI);
        if (!cssService) {
            continue;
        }
        let hover = cssService.findHover(matchPart, fromPart, document, configuration.maxHoverStylePropertyCount);
        if (hover) {
            return hover;
        }
    }
    return null;
}
//# sourceMappingURL=hover.js.map