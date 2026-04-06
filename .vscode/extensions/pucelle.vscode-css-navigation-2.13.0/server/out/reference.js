"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findReferences = findReferences;
const languages_1 = require("./languages");
const utils_1 = require("./utils");
/** Provide finding references service. */
async function findReferences(document, offset, htmlServiceMap, cssServiceMap, configuration, pureReference) {
    let documentExtension = (0, utils_1.getPathExtension)(document.uri);
    let isHTMLFile = configuration.activeHTMLFileExtensions.includes(documentExtension);
    let isCSSFile = configuration.activeCSSFileExtensions.includes(documentExtension);
    let locations = null;
    if (isHTMLFile) {
        let currentHTMLService = await htmlServiceMap.forceGetServiceByDocument(document);
        if (!currentHTMLService) {
            return null;
        }
        let fromPart = currentHTMLService.findDetailedPartAt(offset);
        if (!fromPart) {
            return null;
        }
        // No reference.
        if (fromPart.type === languages_1.PartType.ClassPotential) {
            return null;
        }
        locations = await findReferencesInHTML(fromPart, currentHTMLService, htmlServiceMap, cssServiceMap, configuration, pureReference);
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
        locations = await findReferencesInCSS(fromPart, currentCSSService, htmlServiceMap, cssServiceMap, pureReference);
    }
    return locations;
}
/** In HTML files, or files that can include HTML codes. */
async function findReferencesInHTML(fromPart, currentService, htmlServiceMap, cssServiceMap, configuration, pureReference) {
    let matchPart = languages_1.PartConvertor.toDefinitionMode(fromPart);
    let locations = [];
    if (pureReference) {
        if (fromPart.isDefinitionType()) {
            if (configuration.enableGlobalEmbeddedCSS) {
                locations.push(...await htmlServiceMap.findReferences(matchPart, fromPart));
            }
            else {
                locations.push(...currentService.findReferences(matchPart, fromPart));
            }
        }
    }
    // Find for both definition and reference parts by default.
    else {
        if (fromPart.isDefinitionType() || fromPart.isReferenceType()) {
            locations.push(...await cssServiceMap.findReferences(matchPart, fromPart));
            if (configuration.enableGlobalEmbeddedCSS) {
                locations.push(...await htmlServiceMap.findReferences(matchPart, fromPart));
            }
            else {
                locations.push(...currentService.findReferences(matchPart, fromPart));
            }
        }
    }
    return locations;
}
/** In CSS files, or a sass file. */
async function findReferencesInCSS(fromPart, _currentService, htmlServiceMap, cssServiceMap, pureReference) {
    let matchPart = languages_1.PartConvertor.toDefinitionMode(fromPart);
    let locations = [];
    if (pureReference) {
        if (fromPart.isDefinitionType()) {
            locations.push(...await htmlServiceMap.findReferences(matchPart, fromPart));
        }
    }
    // Find for both definition and reference parts by default.
    else if (fromPart.isDefinitionType() || fromPart.isReferenceType()) {
        locations.push(...await cssServiceMap.findReferences(matchPart, fromPart));
        locations.push(...await htmlServiceMap.findReferences(matchPart, fromPart));
    }
    return locations;
}
//# sourceMappingURL=reference.js.map