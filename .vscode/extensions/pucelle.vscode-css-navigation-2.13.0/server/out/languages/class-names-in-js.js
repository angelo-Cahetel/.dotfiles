"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClassNamesInJS = void 0;
const parts_1 = require("./parts");
const trees_1 = require("./trees");
/**
 * Handle class name expressions in JS like:
 * `let xxxClassName = '...'`
 * `{xxxClassName: ''}`
 * `.xxxClassName="..."`
 */
var ClassNamesInJS;
(function (ClassNamesInJS) {
    let nameMatchRegExp = null;
    let expressionMathRegExp = null;
    /** Set variable names wild match expressions. */
    function initWildNames(wildNames) {
        let nameSource = wildNames.map(n => n.replace(/\*/g, '\\w*?')).join('|');
        try {
            nameMatchRegExp = new RegExp('^' + nameSource + '$', '');
            let wrappedNameSource = '(?:' + nameSource + ')';
            expressionMathRegExp = new RegExp(`\\b(?:let|var|const)\\s+${wrappedNameSource}\\s*=\\s*["'\`]([\\w-]*?)["'\`]|\\.${wrappedNameSource}\\s*=\\s*["'\`]([\\w-]*?)["'\`]|[{,]\\s*${wrappedNameSource}\\s*:\\s*["'\`]([\\w-]*?)["'\`]`, 'gi');
        }
        catch (err) { }
    }
    ClassNamesInJS.initWildNames = initWildNames;
    /** Test whether be wild name, and start and end positions both match. */
    function isWildName(name) {
        return nameMatchRegExp?.test(name) ?? false;
    }
    ClassNamesInJS.isWildName = isWildName;
    /** Walk for variable parts of `var xxxClassNameXXX = `... */
    function* walkParts(text, start = 0) {
        if (!expressionMathRegExp) {
            return;
        }
        let matches = trees_1.Picker.locateAllMatches(text, expressionMathRegExp, [1, 2, 3]);
        for (let match of matches) {
            let subMatch = match[1] ?? match[2] ?? match[3];
            if (subMatch) {
                yield (new parts_1.Part(parts_1.PartType.Class, subMatch.text, subMatch.start + start)).trim();
            }
        }
    }
    ClassNamesInJS.walkParts = walkParts;
})(ClassNamesInJS || (exports.ClassNamesInJS = ClassNamesInJS = {}));
//# sourceMappingURL=class-names-in-js.js.map