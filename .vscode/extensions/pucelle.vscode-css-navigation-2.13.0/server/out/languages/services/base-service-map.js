"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseServiceMap = void 0;
const core_1 = require("../../core");
/** Gives HTML/CSS service for multiple files. */
class BaseServiceMap extends core_1.FileTracker {
    config;
    /** HTML or CSS Service map by uri. */
    serviceMap = new Map();
    /** The timestamp when last time using service. */
    timestamp = 0;
    constructor(documents, window, options, config) {
        super(documents, window, options);
        this.config = config;
    }
    /** Update timestamp. */
    updateTimestamp(time) {
        this.timestamp = time;
    }
    onFileExpired(uri) {
        this.serviceMap.delete(uri);
    }
    onFileUntracked(uri) {
        this.serviceMap.delete(uri);
    }
    onReleaseResources() {
        this.serviceMap.clear();
    }
    async parseDocument(uri, document) {
        try {
            let service = this.createService(document);
            this.serviceMap.set(uri, service);
        }
        catch (err) {
            core_1.Logger.error(`Failed to parse ${uri}, please contact me on github`);
            core_1.Logger.error(err);
        }
    }
    *walkAvailableServices() {
        for (let uri of this.trackingMap.walkActiveURIs()) {
            if (this.serviceMap.has(uri)) {
                this.trackingMap.setUseTime(uri, this.timestamp);
                yield this.serviceMap.get(uri);
            }
        }
    }
    /**
     * Get CSS service by uri after becoming fresh.
     * Get undefined if not in cache.
     */
    async getFreshly(uri) {
        await this.uriBeFresh(uri);
        this.trackingMap.setUseTime(uri, this.timestamp);
        return this.serviceMap.get(uri);
    }
    /** Force get a service by document, create it and cache as opened document. */
    async forceGetServiceByDocument(document) {
        let uri = document.uri;
        if (!this.trackingMap.has(uri)) {
            this.trackOpenedDocument(document);
        }
        return this.getFreshly(uri);
    }
    /** Force get a service by uri, create it but not cache. */
    async forceGetServiceByURI(uri) {
        // Cache it in map.
        if (!this.trackingMap.has(uri)) {
            this.trackMoreURI(uri);
        }
        // Already included.
        return this.getFreshly(uri);
    }
    async findDefinitions(matchPart, fromPart, fromDocument) {
        await this.beFresh();
        let locations = [];
        for (let service of this.walkAvailableServices()) {
            locations.push(...service.findDefinitions(matchPart, fromPart, fromDocument));
        }
        return locations;
    }
    async findSymbols(query) {
        await this.beFresh();
        let symbols = [];
        for (let service of this.walkAvailableServices()) {
            symbols.push(...service.findSymbols(query));
        }
        return symbols;
    }
    async getCompletionLabels(matchPart, fromPart, maxHoverStylePropertyCount) {
        await this.beFresh();
        let labelMap = new Map();
        for (let service of this.walkAvailableServices()) {
            for (let [label, item] of service.getCompletionLabels(matchPart, fromPart, maxHoverStylePropertyCount)) {
                labelMap.set(label, item);
            }
        }
        return labelMap;
    }
    /**
     * Find completion labels match part.
     * The difference with `getCompletionItems` is that
     * `matchPart` is a definition part,
     * but current parts are a reference type of parts.
     */
    async getReferencedCompletionLabels(fromPart) {
        await this.beFresh();
        let labelMap = new Map();
        for (let service of this.walkAvailableServices()) {
            for (let [label, detail] of service.getReferencedCompletionLabels(fromPart)) {
                labelMap.set(label, detail);
            }
        }
        return labelMap;
    }
    async findReferences(matchDefPart, fromPart) {
        await this.beFresh();
        let locations = [];
        for (let htmlService of this.serviceMap.values()) {
            locations.push(...htmlService.findReferences(matchDefPart, fromPart));
        }
        return locations;
    }
    async findHover(matchPart, fromPart, fromDocument, maxStylePropertyCount) {
        await this.beFresh();
        for (let service of this.walkAvailableServices()) {
            let hover = service.findHover(matchPart, fromPart, fromDocument, maxStylePropertyCount);
            if (hover) {
                return hover;
            }
        }
        return null;
    }
    /** Find all css variable values. */
    async getCSSVariables(names) {
        await this.beFresh();
        let map = new Map();
        for (let service of this.walkAvailableServices()) {
            for (let [name, value] of service.getCSSVariables(names)) {
                map.set(name, value);
            }
        }
        return map;
    }
}
exports.BaseServiceMap = BaseServiceMap;
//# sourceMappingURL=base-service-map.js.map