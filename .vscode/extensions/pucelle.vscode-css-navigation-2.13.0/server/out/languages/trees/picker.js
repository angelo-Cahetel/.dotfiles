"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Picker = void 0;
var Picker;
(function (Picker) {
    /**
     * Match string, add start offset to each match.
     * Note it may not 100% get correct result.
     * Note it will skip not captured matches, means `/(1)|(2)/` will always fill match[1].
     * `re` must not be global.
     */
    function locateMatches(text, re, matchIndices) {
        let match = text.match(re);
        if (!match) {
            return null;
        }
        return addOffsetToMatches(match, matchIndices);
    }
    Picker.locateMatches = locateMatches;
    /**
     * Match string, add start offset to each match.
     * Note it may not 100% get correct result.
     * Note it will skip not captured matches, means `/(1)|(2)/` will always fill match[1].
     * Beware, captured group must capture at least one character.
     * `re` must be global.
     */
    function* locateAllMatches(text, re, matchIndices) {
        let match;
        while (match = re.exec(text)) {
            yield addOffsetToMatches(match, matchIndices);
        }
    }
    Picker.locateAllMatches = locateAllMatches;
    /**
     * Match string to get match groups, add start offset to each grouped match.
     * Note it may not 100% get correct result.
     * `re` must not be global.
     */
    function locateMatchGroups(text, re) {
        let match = text.match(re);
        if (!match) {
            return null;
        }
        return addOffsetToMatchGroup(match);
    }
    Picker.locateMatchGroups = locateMatchGroups;
    /**
     * Match string to get match groups, add start offset to each grouped match.
     * Note it may not 100% get correct result.
     * `re` must be global.
     */
    function* locateAllMatchGroups(text, re) {
        let match;
        while (match = re.exec(text)) {
            yield addOffsetToMatchGroup(match);
        }
    }
    Picker.locateAllMatchGroups = locateAllMatchGroups;
    /**
     * Add start offset to each match item.
     * Note it may not 100% get correct result.
     */
    function addOffsetToMatches(match, matchIndices) {
        let o = {};
        let lastIndex = 0;
        for (let matchIndex of matchIndices) {
            let m = match[matchIndex];
            if (!m) {
                continue;
            }
            let start = matchIndex === 0 ? 0 : match[0].indexOf(m, lastIndex);
            o[matchIndex] = {
                text: m,
                start: match.index + start,
            };
            if (matchIndex > 0) {
                lastIndex = start + m.length;
            }
        }
        return o;
    }
    /**
     * Add start offset to each grouped match item.
     * Note it may not 100% get correct result.
     * `re` must not be global.
     */
    function addOffsetToMatchGroup(match) {
        let o = {};
        let groups = match.groups;
        if (!groups) {
            return o;
        }
        let lastIndex = 0;
        for (let [k, m] of Object.entries(groups)) {
            if (!m) {
                continue;
            }
            let start = match[0].indexOf(m, lastIndex);
            o[k] = {
                text: m,
                start: match.index + start,
            };
            lastIndex = start + m.length;
        }
        return o;
    }
})(Picker || (exports.Picker = Picker = {}));
//# sourceMappingURL=picker.js.map