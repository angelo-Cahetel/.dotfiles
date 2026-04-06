"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HTMLServiceMap = void 0;
const html_service_1 = require("./html-service");
const base_service_map_1 = require("./base-service-map");
const utils_1 = require("../../utils");
const core_1 = require("../../core");
class HTMLServiceMap extends base_service_map_1.BaseServiceMap {
    identifier = 'html';
    cssServiceMap;
    /** All the defined class names and their count of whole service. */
    definedClassNamesSet = new Map();
    /** All the referenced class names and their count of whole service. */
    referencedClassNamesSet = new Map();
    /** URI <-> CSS Imported URI. */
    cssImportMap = new utils_1.TwoWayListMap();
    constructor(documents, window, options, config) {
        super(documents, window, options, config);
    }
    bindCSSServiceMap(cssServiceMap) {
        this.cssServiceMap = cssServiceMap;
    }
    untrackURI(uri) {
        super.untrackURI(uri);
        if (this.config.enableGlobalEmbeddedCSS) {
            let oldImportURIs = this.cssImportMap.getByLeft(uri);
            this.cssImportMap.deleteLeft(uri);
            if (oldImportURIs) {
                this.checkImportURIsImported(oldImportURIs);
            }
        }
    }
    checkImportURIsImported(importURIs) {
        for (let importURI of importURIs) {
            // Have no import to it from any html file.
            if (this.cssImportMap.countOfRight(importURI) === 0) {
                this.cssServiceMap.trackingMap.removeReason(importURI, core_1.TrackingReasonMask.ForceImported);
            }
        }
    }
    onReleaseResources() {
        super.onReleaseResources();
        this.cssImportMap.clear();
    }
    onAfterUpdated() {
        // Make definition class name set.
        if (this.config.enableClassNameDefinitionDiagnostic
            && this.config.enableGlobalEmbeddedCSS) {
            this.definedClassNamesSet.clear();
            for (let service of this.walkAvailableServices()) {
                for (let [className, count] of service.getDefinedClassNames()) {
                    this.definedClassNamesSet.set(className, (this.definedClassNamesSet.get(className) ?? 0) + count);
                }
            }
        }
        if (this.config.enableClassNameReferenceDiagnostic) {
            this.referencedClassNamesSet.clear();
            for (let service of this.walkAvailableServices()) {
                for (let [className, count] of service.getReferencedClassNamesSet()) {
                    this.referencedClassNamesSet.set(className, (this.referencedClassNamesSet.get(className) ?? 0) + count);
                }
            }
        }
    }
    /** Test whether defined class name existing. */
    hasDefinedClassName(className) {
        return this.definedClassNamesSet.has(className);
    }
    /** Test whether referenced class name existing. */
    hasReferencedClassName(className) {
        return this.referencedClassNamesSet.has(className);
    }
    /** Get defined class name count. */
    getDefinedClassName(className) {
        return this.definedClassNamesSet.get(className) ?? 0;
    }
    /** Get referenced class name count. */
    getReferencedClassNameCount(className) {
        return this.referencedClassNamesSet.get(className) ?? 0;
    }
    createService(document) {
        return new html_service_1.HTMLService(document, this.config);
    }
    /** Parse document to HTML service, and analyze imported. */
    async parseDocument(uri, document) {
        await super.parseDocument(uri, document);
        if (this.config.enableGlobalEmbeddedCSS) {
            let htmlService = this.serviceMap.get(uri);
            if (!htmlService) {
                return;
            }
            let oldImportURIs = [...this.cssImportMap.getByLeft(uri) ?? []];
            // If having `@import ...`, load it.
            let importURIs = await htmlService.getImportedCSSURIs();
            // Force import css uris.
            for (let importURI of importURIs) {
                this.cssServiceMap.trackMoreURI(importURI, core_1.TrackingReasonMask.ForceImported);
            }
            this.cssImportMap.replaceLeft(uri, importURIs);
            this.checkImportURIsImported(oldImportURIs);
        }
    }
}
exports.HTMLServiceMap = HTMLServiceMap;
//# sourceMappingURL=html-service-map.js.map