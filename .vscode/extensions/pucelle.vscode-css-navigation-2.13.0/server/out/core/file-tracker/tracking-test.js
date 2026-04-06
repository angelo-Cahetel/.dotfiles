"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrackingTest = void 0;
const minimatch = require("minimatch");
const vscode_uri_1 = require("vscode-uri");
class TrackingTest {
    includeFileMatcher;
    excludeMatcher;
    alwaysIncludeGlobSharer;
    constructor(options) {
        this.includeFileMatcher = new minimatch.Minimatch(options.includeFileGlobPattern);
        this.excludeMatcher = options.excludeGlobPattern ? new minimatch.Minimatch(options.excludeGlobPattern) : null;
        this.alwaysIncludeGlobSharer = options.alwaysIncludeGlobSharer || null;
    }
    /** Returns whether should include path, ignore exclude test. */
    shouldIncludePath(filePath) {
        return this.includeFileMatcher.match(filePath);
    }
    /** Returns whether should exclude file or folder path. */
    shouldExcludePath(fsPath) {
        // Not always include.
        if (this.alwaysIncludeGlobSharer?.match(fsPath)) {
            return false;
        }
        // Be exclude.
        if (this.excludeMatcher && this.excludeMatcher.match(fsPath)) {
            return true;
        }
        return false;
    }
    /** Returns whether should track uri. */
    shouldTrackURI(uri) {
        let parsed = vscode_uri_1.URI.parse(uri);
        if (parsed.scheme === 'file') {
            return this.shouldTrackPath(parsed.fsPath);
        }
        // Always should track http or https uris.
        if (parsed.scheme === 'http' || parsed.scheme === 'https') {
            return true;
        }
        return false;
    }
    /** Returns whether should track path. */
    shouldTrackPath(filePath) {
        if (!this.includeFileMatcher.match(filePath)) {
            return false;
        }
        if (this.shouldExcludePath(filePath)) {
            return false;
        }
        return true;
    }
}
exports.TrackingTest = TrackingTest;
//# sourceMappingURL=tracking-test.js.map