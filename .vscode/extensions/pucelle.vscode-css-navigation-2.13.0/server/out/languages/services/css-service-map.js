"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CSSServiceMap = void 0;
const css_service_1 = require("./css-service");
const base_service_map_1 = require("./base-service-map");
/** Gives CSS service for multiple files. */
class CSSServiceMap extends base_service_map_1.BaseServiceMap {
    identifier = 'css';
    /** Class map to contains all the class names and their count of whole service. */
    definedClassNamesSet = new Map();
    onAfterUpdated() {
        // Make class name set.
        if (this.config.enableClassNameDefinitionDiagnostic) {
            this.definedClassNamesSet.clear();
            for (let service of this.walkAvailableServices()) {
                for (let [className, count] of service.getDefinedClassNames()) {
                    this.definedClassNamesSet.set(className, (this.definedClassNamesSet.get(className) ?? 0) + count);
                }
            }
        }
    }
    /** Test whether defined class name existing. */
    hasDefinedClassName(className) {
        return this.definedClassNamesSet.has(className);
    }
    /** Get defined class name count. */
    getDefinedClassNameCount(className) {
        return this.definedClassNamesSet.get(className) ?? 0;
    }
    createService(document) {
        return new css_service_1.CSSService(document, this.config);
    }
    /** Parse document to CSS service, and analyze imported. */
    async parseDocument(uri, document) {
        await super.parseDocument(uri, document);
        let cssService = this.serviceMap.get(uri);
        if (!cssService) {
            return;
        }
        // If having `@import ...`, load it.
        let importURIs = await cssService.getImportedCSSURIs();
        for (let importURI of importURIs) {
            this.trackMoreURI(importURI);
        }
        this.trackingMap.setImported(importURIs, uri);
    }
}
exports.CSSServiceMap = CSSServiceMap;
//# sourceMappingURL=css-service-map.js.map