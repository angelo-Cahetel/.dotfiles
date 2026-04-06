"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeQuotesFromToken = removeQuotesFromToken;
exports.removeQuotes = removeQuotes;
exports.hasQuotes = hasQuotes;
exports.isExpressionLike = isExpressionLike;
exports.joinTokens = joinTokens;
exports.escapeAsRegExpSource = escapeAsRegExpSource;
/** Remove quotes from token. */
function removeQuotesFromToken(token) {
    let text = token.text;
    if (hasQuotes(text)) {
        text = text.slice(1, -1);
        return {
            type: token.type,
            text,
            start: token.start + 1,
            end: token.end - 1,
        };
    }
    else {
        return token;
    }
}
/** `"ab"` => `ab`. */
function removeQuotes(text) {
    if (/^['"]/.test(text)) {
        text = text.slice(1);
    }
    if (/['"]$/.test(text)) {
        text = text.slice(0, -1);
    }
    return text;
}
/** Returns whether has been quoted. */
function hasQuotes(text) {
    return /^['"]/.test(text) && /['"]$/.test(text);
}
/** Test whether attribute value like an expression. */
function isExpressionLike(value) {
    return /^\$?\{[\s\S]*\}$/.test(value);
}
/** Join several tokens to one. */
function joinTokens(tokens, string, tokenOffset) {
    if (tokens.length === 1) {
        return tokens[0];
    }
    else {
        let type = tokens[0].type;
        let start = tokens[0].start;
        let end = tokens[tokens.length - 1].end;
        let text = string.slice(start - tokenOffset, end - tokenOffset);
        return {
            type,
            text,
            start,
            end,
        };
    }
}
/** Escape as regexp source text.`\.` -> `\\.` */
function escapeAsRegExpSource(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
//# sourceMappingURL=utils.js.map