"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.escapedCSSSelector = escapedCSSSelector;
/** Escape like `.xl\:w` -> `.xl:w`. */
function escapedCSSSelector(text) {
    if (text.includes('\\')) {
        text = text.replace(/\\(.)/g, '$1');
    }
    return text;
}
//# sourceMappingURL=utils.js.map