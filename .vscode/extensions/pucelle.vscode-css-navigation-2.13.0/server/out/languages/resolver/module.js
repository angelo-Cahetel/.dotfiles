"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModuleResolver = void 0;
const utils_1 = require("../../utils");
const path_1 = require("./path");
/** Resolve module path or  */
var ModuleResolver;
(function (ModuleResolver) {
    /**
     * Scan imported CSS module.
     * By a `ReactImportedCSSModuleName` type of part.
     */
    async function resolveReactCSSModuleURIByName(moduleName, document) {
        let text = document.getText();
        let modulePath = resolveDefaultImportedPathByVariableName(moduleName, text);
        if (!modulePath) {
            return null;
        }
        let uri = await path_1.PathResolver.resolveImportURI(modulePath, document);
        return uri;
    }
    ModuleResolver.resolveReactCSSModuleURIByName = resolveReactCSSModuleURIByName;
    /** Try resolve `path` by matching `import name from path` after known `name`. */
    function resolveDefaultImportedPathByVariableName(variableName, text) {
        let re = /import\s+(?=\*\s+as\s+)?(\w+)\s+from\s+['"`](.+?)['"`]/g;
        let match;
        while (match = re.exec(text)) {
            let name = match[1];
            if (name === variableName) {
                return match[2];
            }
        }
        return null;
    }
    /**
     * Scan imported CSS module uris.
     * By a `ReactDefaultCSSModule` type of part.
     */
    async function resolveReactDefaultCSSModuleURIs(document) {
        let text = document.getText();
        let uris = [];
        for (let modulePath of resolveNonNamedImportedPaths(text)) {
            let uri = await path_1.PathResolver.resolveImportURI(modulePath, document);
            if (uri) {
                uris.push(uri);
            }
        }
        return uris;
    }
    ModuleResolver.resolveReactDefaultCSSModuleURIs = resolveReactDefaultCSSModuleURIs;
    /** Resolve `import '....css'`. */
    function* resolveNonNamedImportedPaths(text) {
        let re = /import\s+['"`](.+?)['"`]/g;
        let match;
        while (match = re.exec(text)) {
            let path = match[1];
            if ((0, utils_1.isCSSLikePath)(path)) {
                yield path;
            }
        }
    }
})(ModuleResolver || (exports.ModuleResolver = ModuleResolver = {}));
//# sourceMappingURL=module.js.map