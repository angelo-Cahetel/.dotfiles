"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GlobPathSharer = void 0;
const glob_1 = require("glob");
const util_1 = require("util");
const minimatch = require("minimatch");
/** Just for sharing glob query result. */
class GlobPathSharer {
    pattern;
    fromPath;
    cachedResult = null;
    matcher;
    constructor(pattern, fromPath) {
        this.pattern = pattern;
        this.fromPath = fromPath;
        this.matcher = new minimatch.Minimatch(this.pattern);
    }
    match(fsPath) {
        return this.matcher.match(fsPath);
    }
    async get() {
        if (this.cachedResult) {
            return this.cachedResult;
        }
        this.cachedResult = await (0, util_1.promisify)(glob_1.glob)(this.pattern, {
            cwd: this.fromPath || undefined,
            absolute: true,
        });
        return this.cachedResult;
    }
}
exports.GlobPathSharer = GlobPathSharer;
//# sourceMappingURL=glob-path-sharer.js.map