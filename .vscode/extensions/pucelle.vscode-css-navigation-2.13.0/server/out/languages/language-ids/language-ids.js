"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LanguageIds = void 0;
var LanguageIds;
(function (LanguageIds) {
    function isCSSSyntax(languageId) {
        return languageId === 'css'
            || languageId === 'sass'
            || languageId === 'scss'
            || languageId === 'less';
    }
    LanguageIds.isCSSSyntax = isCSSSyntax;
    function isScssLessSyntax(languageId) {
        return languageId === 'sass'
            || languageId === 'scss'
            || languageId === 'less';
    }
    LanguageIds.isScssLessSyntax = isScssLessSyntax;
    function isScriptSyntax(languageId) {
        return languageId === 'jsx'
            || languageId === 'tsx'
            || languageId === 'js'
            || languageId === 'ts'
            || languageId === 'vue';
    }
    LanguageIds.isScriptSyntax = isScriptSyntax;
    function isHTMLSyntax(languageId) {
        return languageId === 'html'
            || languageId === 'vue';
    }
    LanguageIds.isHTMLSyntax = isHTMLSyntax;
    function isReactScriptSyntax(languageId) {
        return languageId === 'jsx' || languageId === 'tsx';
    }
    LanguageIds.isReactScriptSyntax = isReactScriptSyntax;
})(LanguageIds || (exports.LanguageIds = LanguageIds = {}));
//# sourceMappingURL=language-ids.js.map