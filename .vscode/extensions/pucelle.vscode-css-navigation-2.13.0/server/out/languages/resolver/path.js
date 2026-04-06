"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PathResolver = void 0;
const vscode_languageserver_1 = require("vscode-languageserver");
const vscode_uri_1 = require("vscode-uri");
const path = require("path");
const fs = require("fs-extra");
const utils_1 = require("../../utils");
const parts_1 = require("../parts");
const url = require("node:url");
var PathResolver;
(function (PathResolver) {
    /** Resolve relative path, will search `node_modules` directory to find final import path. */
    async function resolveModulePath(fromPath, toPath) {
        let isModulePath = toPath.startsWith('~');
        let fromDir = path.dirname(fromPath);
        let beModuleImport = false;
        // `~modulename/...`
        if (isModulePath) {
            toPath = toPath.slice(1);
            toPath = fixPathExtension(toPath, fromPath);
            toPath = 'node_modules/' + toPath;
            beModuleImport = true;
        }
        else {
            toPath = fixPathExtension(toPath, fromPath);
            // Import relative path.
            let filePath = path.resolve(fromDir, toPath);
            if (await fs.pathExists(filePath) && (await fs.stat(filePath)).isFile()) {
                return filePath;
            }
            // .xxx or ../xxx is not module import.
            if (!/^\./.test(toPath)) {
                toPath = 'node_modules/' + toPath;
                beModuleImport = true;
            }
        }
        if (beModuleImport) {
            while (fromDir) {
                let filePath = path.resolve(fromDir, toPath);
                if (await fs.pathExists(filePath) && (await fs.stat(filePath)).isFile()) {
                    return filePath;
                }
                let dir = path.dirname(fromDir);
                if (dir === fromDir) {
                    break;
                }
                fromDir = dir;
            }
        }
        return null;
    }
    PathResolver.resolveModulePath = resolveModulePath;
    /** Fix imported path with extension. */
    function fixPathExtension(toPath, fromPath) {
        let fromPathExtension = (0, utils_1.getPathExtension)(fromPath);
        if (fromPathExtension === 'scss') {
            // @import `b` -> `b.scss`
            if (path.extname(toPath) === '') {
                toPath += '.scss';
            }
        }
        // One issue here:
        //   If we rename `b.scss` to `_b.scss` in `node_modules`,
        //   we can't get file changing notification from VSCode,
        //   and we can't reload it from path because nothing changes in it.
        // So we may need to validate if imported paths exist after we got definition results,
        // although we still can't get new contents in `_b.scss`.
        return toPath;
    }
    /**
     * Make a link which lick to current import location.
     * `part` must be in `Import` type.
     */
    async function resolveImportLocationLink(part, fromDocument) {
        let uri = await resolveImportURI(part.escapedText, fromDocument);
        if (!uri) {
            return null;
        }
        let targetRange = vscode_languageserver_1.Range.create(0, 0, 0, 0);
        let selectionRange = targetRange;
        let fromRange = parts_1.PartConvertor.toRange(part, fromDocument);
        return vscode_languageserver_1.LocationLink.create(uri, targetRange, selectionRange, fromRange);
    }
    PathResolver.resolveImportLocationLink = resolveImportLocationLink;
    /** Resolve import path to full uri. */
    async function resolveImportURI(importPath, fromDocument) {
        let importProtocol = (0, utils_1.isRelativePath)(importPath) ? '' : vscode_uri_1.URI.parse(importPath).scheme;
        if (importProtocol) {
            return importPath;
        }
        // File relative, try handle module path.
        let fromURI = vscode_uri_1.URI.parse(fromDocument.uri);
        if (fromURI.scheme === 'file') {
            let fullPath = await resolveModulePath(fromURI.fsPath, importPath);
            if (!fullPath) {
                return null;
            }
            return vscode_uri_1.URI.file(fullPath).toString();
        }
        // HTTP relative.
        else {
            return new url.URL(importPath, fromDocument.uri).toString();
        }
    }
    PathResolver.resolveImportURI = resolveImportURI;
})(PathResolver || (exports.PathResolver = PathResolver = {}));
//# sourceMappingURL=path.js.map