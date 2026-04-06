"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOutmostWorkspaceURI = getOutmostWorkspaceURI;
exports.getPathExtension = getPathExtension;
exports.generateGlobPatternFromExtensions = generateGlobPatternFromExtensions;
const path = require("path");
/** If a workspace folder contains another, what we need is to return the outmost one. */
function getOutmostWorkspaceURI(folderURI, allFolderURIs) {
    let parentURIs = allFolderURIs.filter(parentURI => folderURI.startsWith(parentURI + '/'));
    parentURIs.sort((a, b) => a.length - b.length);
    return parentURIs[0] || folderURI;
}
/** Get path extension in lowercase, without dot. */
function getPathExtension(filePath) {
    return path.extname(filePath).slice(1).toLowerCase();
}
/** Generate a glob pattern from file extension list. */
function generateGlobPatternFromExtensions(extensions) {
    if (extensions.length > 1) {
        return '**/*.{' + extensions.join(',') + '}';
    }
    else if (extensions.length === 1) {
        return '**/*.' + extensions[0];
    }
    return undefined;
}
//# sourceMappingURL=path.js.map