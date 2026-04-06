"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileTracker = void 0;
const path = require("path");
const fs = require("fs-extra");
const vscode_languageserver_1 = require("vscode-languageserver");
const vscode_languageserver_textdocument_1 = require("vscode-languageserver-textdocument");
const logger_1 = require("../logger");
const vscode_uri_1 = require("vscode-uri");
const file_walker_1 = require("./file-walker");
const tracking_map_1 = require("./tracking-map");
const tracking_test_1 = require("./tracking-test");
const utils_1 = require("../../utils");
/** Clean long-unused imported only or no reason sources every 5 mins. */
const CheckUnUsedTimeInterval = 5 * 60 * 1000;
/** Class to track one type of files in a directory. */
class FileTracker {
    documents;
    window;
    startPath;
    alwaysIncludeGlobSharer;
    ignoreFilesBy;
    maxFileCount;
    releaseTimeoutMs;
    trackingMap = new tracking_map_1.TrackingMap();
    test;
    startDataLoaded = true;
    updating = null;
    releaseTimeout = null;
    releaseImportedTimeout = null;
    /**
     * update request may come from track, or beFresh, we cant make sure they will have no conflict
     * so we need a promise to lock it to avoid two update task are executed simultaneously.
     */
    updatePromiseMap = new Map();
    constructor(documents, window, options) {
        this.documents = documents;
        this.window = window;
        this.startPath = options.startPath || null;
        this.alwaysIncludeGlobSharer = options.alwaysIncludeGlobSharer || null;
        this.ignoreFilesBy = options.ignoreFilesBy || [];
        this.maxFileCount = options.maxFileCount ?? Infinity;
        this.releaseTimeoutMs = options.releaseTimeoutMs ?? Infinity;
        this.test = new tracking_test_1.TrackingTest(options);
        if (this.startPath) {
            this.startDataLoaded = false;
        }
        // Clean long-unused imported only sources every 5mins.
        setInterval(this.clearImportedOnlyResources.bind(this), CheckUnUsedTimeInterval);
    }
    /** When document opened or content changed from vscode editor. */
    onDocumentOpenOrContentChanged(document) {
        // No need to handle file opening because we have preloaded all the files.
        // Open and changed event will be distinguished by document version later.
        if (this.trackingMap.has(document.uri) || this.test.shouldTrackURI(document.uri)) {
            this.trackOpenedDocument(document);
        }
    }
    /** After document saved. */
    onDocumentSaved(document) {
        let fresh = this.trackingMap.isFresh(document.uri);
        // Since `onDidChangeWatchedFiles` event was triggered so frequently, we only do updating after saved.
        if (!fresh && this.updating) {
            this.updateURI(document.uri);
        }
    }
    /** After document closed. */
    onDocumentClosed(document) {
        if (this.trackingMap.has(document.uri)) {
            this.afterFileClosed(document.uri);
        }
    }
    /** After changes of files or folders. */
    async onWatchedFileOrFolderChanged(params) {
        for (let change of params.changes) {
            let uri = change.uri;
            let fsPath = vscode_uri_1.URI.parse(uri).fsPath;
            // New file or folder.
            if (change.type === vscode_languageserver_1.FileChangeType.Created) {
                // If haven't loaded whole workspace, no need to load newly created.
                // An issue for `@import ...` resources:
                // It's common that we import resources inside `node_modules`,
                // but we can't get notifications when those files changed outside of vscode.
                if (!this.startDataLoaded) {
                    return;
                }
                this.tryTrackFileOrFolder(fsPath, tracking_map_1.TrackingReasonMask.Included);
            }
            // File or folder that content changed.
            else if (change.type === vscode_languageserver_1.FileChangeType.Changed) {
                if (await fs.pathExists(fsPath)) {
                    let stat = await fs.stat(fsPath);
                    if (stat && stat.isFile()) {
                        if (this.test.shouldTrackPath(fsPath)) {
                            this.trackPath(fsPath, tracking_map_1.TrackingReasonMask.Included);
                        }
                    }
                }
            }
            // Deleted file or folder.
            else if (change.type === vscode_languageserver_1.FileChangeType.Deleted) {
                this.afterDirDeleted(uri);
            }
        }
    }
    /** Track file or folder. */
    async tryTrackFileOrFolder(fsPath, reason) {
        if (this.test.shouldExcludePath(fsPath)) {
            return;
        }
        if (!await fs.pathExists(fsPath)) {
            return;
        }
        let stat = await fs.stat(fsPath);
        if (stat.isDirectory()) {
            await this.tryTrackFolder(fsPath, reason);
        }
        else if (stat.isFile()) {
            let filePath = fsPath;
            if (this.test.shouldTrackPath(filePath)) {
                this.trackPath(filePath, reason);
            }
        }
    }
    /** Track folder. */
    async tryTrackFolder(folderPath, reason) {
        let filePathsGenerator = (0, file_walker_1.walkDirectoryToMatchFiles)(folderPath, this.ignoreFilesBy);
        let count = 0;
        for await (let absPath of filePathsGenerator) {
            if (this.test.shouldTrackPath(absPath)) {
                this.trackPath(absPath, reason);
                count++;
                if (count >= this.maxFileCount) {
                    this.window.showWarningMessage(`CSS Navigation limits scanning at most "${this.maxFileCount}" files for performance reason!`);
                    break;
                }
            }
        }
    }
    /** Track more uri, normally imported uri. */
    trackMoreURI(uri, reason = 0) {
        this.trackURI(uri, reason);
    }
    /** Track or re-track file by file path, not validate whether should track here. */
    trackPath(filePath, reason) {
        let uri = vscode_uri_1.URI.file(filePath).toString();
        this.trackURI(uri, reason);
    }
    /** Track or re-track by uri, not validate whether should track here. */
    trackURI(uri, reason) {
        let hasTracked = this.trackingMap.has(uri);
        this.trackingMap.trackByReason(uri, reason);
        if (!hasTracked) {
            this.afterNewFileTracked(uri);
        }
    }
    /** Untrack a file by uri. */
    untrackURI(uri) {
        this.trackingMap.delete(uri);
        this.afterFileUntracked(uri);
    }
    /** Track or re-track opened file from document, or update tracking, no matter files inside or outside workspace. */
    trackOpenedDocument(document) {
        let uri = document.uri;
        let hasTracked = this.trackingMap.has(uri);
        let freshBefore = this.trackingMap.isFresh(uri);
        this.trackingMap.trackByDocument(document);
        let freshAfter = this.trackingMap.isFresh(uri);
        let expired = freshBefore && !freshAfter;
        if (expired) {
            this.afterFileExpired(uri);
        }
        else if (!hasTracked) {
            this.afterNewFileTracked(uri);
        }
    }
    /** After tracked a new file, will check if it's fresh. */
    afterNewFileTracked(uri) {
        this.onFileTracked(uri);
        if (this.updating) {
            this.updateURI(uri);
        }
    }
    /** After file or folder deleted from disk. */
    afterDirDeleted(deletedURI) {
        for (let uri of this.trackingMap.getURIs()) {
            if (uri.startsWith(deletedURI)) {
                this.untrackURI(uri);
            }
        }
    }
    /** After knows that file get expired. */
    afterFileExpired(uri) {
        logger_1.Logger.log(`✏️ ${decodeURIComponent(uri)} expired`);
        this.onFileExpired(uri);
        if (this.updating) {
            this.updateURI(uri);
        }
    }
    /** After file get closed, decide whether untrack it. */
    afterFileClosed(uri) {
        this.trackingMap.removeReason(uri, tracking_map_1.TrackingReasonMask.Opened);
        if (!this.trackingMap.has(uri)) {
            this.afterFileUntracked(uri);
        }
    }
    /** After removed file from tracking. */
    afterFileUntracked(uri) {
        logger_1.Logger.log(`🗑️ ${decodeURIComponent(uri)} removed`);
        this.onFileUntracked(uri);
    }
    /** After file tracked. */
    onFileTracked(_uri) { }
    /** After file expired. */
    onFileExpired(_uri) { }
    /** After file untracked. */
    onFileUntracked(_uri) { }
    /** Ensure all the content be fresh. */
    async beFresh() {
        if (this.trackingMap.allFresh) {
            return;
        }
        if (this.updating) {
            await this.updating;
        }
        else {
            this.updating = this.doUpdating();
            await this.updating;
            this.updating = null;
            this.trackingMap.setAllFresh(true);
        }
        this.resetReleaseTimeout();
    }
    /**
     * Ensure specified content be fresh, if it has been included.
     * Normally use this only for imported sources.
     */
    async uriBeFresh(uri) {
        if (!this.trackingMap.has(uri)) {
            return;
        }
        if (!this.trackingMap.isFresh(uri)) {
            await this.updateURI(uri);
        }
    }
    /** Update all the contents that need to be updated. */
    async doUpdating() {
        if (!this.startDataLoaded) {
            await this.loadStartData();
        }
        logger_1.Logger.timeStart(this.identifier + '-update');
        for (let uri of this.trackingMap.getURIs()) {
            if (!this.trackingMap.isFresh(uri)) {
                // Note here not wait it.
                this.updateURI(uri);
            }
        }
        let loopCount = 0;
        let updatedFileCount = 0;
        // May track more files and push more promises when updating.
        while (this.updatePromiseMap.size > 0 && loopCount++ < 10) {
            let allPromises = [...this.updatePromiseMap.values()];
            for (let promise of allPromises) {
                await promise;
            }
            updatedFileCount += allPromises.length;
            await Promise.resolve();
        }
        this.onAfterUpdated();
        logger_1.Logger.timeEnd(this.identifier + '-update', updatedFileCount > 0 ? `${updatedFileCount} files loaded` : null);
    }
    /** Do more after updated. */
    onAfterUpdated() { }
    /** Load all files inside `startPath` and `alwaysIncludeGlobPattern`, and also all opened documents. */
    async loadStartData() {
        logger_1.Logger.timeStart(this.identifier + '-track');
        for (let document of this.documents.all()) {
            if (this.test.shouldTrackURI(document.uri)) {
                this.trackOpenedDocument(document);
            }
        }
        if (this.alwaysIncludeGlobSharer) {
            let alwaysIncludePaths = await this.alwaysIncludeGlobSharer.get();
            for (let filePath of alwaysIncludePaths) {
                // Normalize it.
                filePath = vscode_uri_1.URI.file(filePath).fsPath;
                if (this.test.shouldIncludePath(filePath)) {
                    this.trackPath(filePath, tracking_map_1.TrackingReasonMask.Included);
                }
            }
        }
        await this.tryTrackFileOrFolder(this.startPath, tracking_map_1.TrackingReasonMask.Included);
        logger_1.Logger.timeEnd(this.identifier + '-track', `${this.trackingMap.size()} files tracked`);
        this.startDataLoaded = true;
    }
    /** Update one file, returns whether updated. */
    async updateURI(uri) {
        let promise = this.updatePromiseMap.get(uri);
        if (promise) {
            await promise;
        }
        else {
            promise = this.doingUpdateURI(uri);
            this.updatePromiseMap.set(uri, promise);
            await promise;
            this.updatePromiseMap.delete(uri);
        }
        return true;
    }
    /** Doing update and returns a promise. */
    async doingUpdateURI(uri) {
        if (!this.trackingMap.has(uri)) {
            return;
        }
        let document = this.trackingMap.getDocument(uri);
        if (!document) {
            document = await this.loadDocument(uri);
            this.trackingMap.setDocument(uri, document);
        }
        if (document) {
            await this.parseDocument(uri, document);
            this.trackingMap.setFresh(uri, true);
            logger_1.Logger.log(`📃 ${decodeURIComponent(uri)} loaded`);
        }
    }
    /** Load text content and create one document. */
    async loadDocument(uri) {
        let languageId = path.extname(uri).slice(1).toLowerCase();
        let document = null;
        let protocol = vscode_uri_1.URI.parse(uri).scheme;
        if (protocol === 'http' || protocol === 'https') {
            try {
                // Use private uri protocol to open remote files.
                let myURI = 'css-nav-uri:' + uri;
                let text = await (0, utils_1.fetchAsText)(uri);
                document = vscode_languageserver_textdocument_1.TextDocument.create(myURI, languageId, 1, text);
            }
            catch (err) {
                console.error(err);
            }
        }
        else if (protocol === 'file') {
            try {
                let text = (await fs.readFile(vscode_uri_1.URI.parse(uri).fsPath)).toString('utf8');
                document = vscode_languageserver_textdocument_1.TextDocument.create(uri, languageId, 1, text);
            }
            catch (err) {
                console.error(err);
            }
        }
        return document;
    }
    /** Parsed document by the way you need. */
    async parseDocument(_uri, _document) { }
    /** Reset release timeout if needed. */
    resetReleaseTimeout() {
        if (this.releaseTimeout) {
            clearTimeout(this.releaseTimeout);
        }
        if (isFinite(this.releaseTimeoutMs)) {
            this.releaseTimeout = setTimeout(this.releaseResources.bind(this), this.releaseTimeoutMs);
        }
    }
    /** Release all resources. */
    releaseResources() {
        let size = this.trackingMap.size();
        if (size === 0) {
            return;
        }
        this.startDataLoaded = false;
        this.trackingMap.clear();
        logger_1.Logger.log(`⏰ All ${size} long-unused resources released`);
        this.onReleaseResources();
    }
    onReleaseResources() { }
    /** Clean imported only resource. */
    clearImportedOnlyResources() {
        let timestamp = logger_1.Logger.getTimestamp() - CheckUnUsedTimeInterval;
        let uris = [...this.trackingMap.walkInActiveAndExpiredURIs(timestamp)];
        if (uris.length === 0) {
            return;
        }
        for (let uri of uris) {
            this.untrackURI(uri);
        }
        logger_1.Logger.log(`⏰ ${uris.length} long-unused imported only resources released`);
    }
}
exports.FileTracker = FileTracker;
//# sourceMappingURL=file-tracker.js.map