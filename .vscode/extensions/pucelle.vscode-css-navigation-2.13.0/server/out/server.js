"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const vscode_languageserver_1 = require("vscode-languageserver");
const vscode_languageserver_textdocument_1 = require("vscode-languageserver-textdocument");
const languages_1 = require("./languages");
const utils_1 = require("./utils");
const core_1 = require("./core");
const definition_1 = require("./definition");
const completion_1 = require("./completion");
const reference_1 = require("./reference");
const hover_1 = require("./hover");
const css_variable_color_1 = require("./css-variable-color");
const diagnostic_1 = require("./diagnostic");
const code_lens_1 = require("./code-lens");
require("../../client/out/types");
const glob_path_sharer_1 = require("./core/file-tracker/glob-path-sharer");
let connection = (0, vscode_languageserver_1.createConnection)(vscode_languageserver_1.ProposedFeatures.all);
let configuration;
let documents = new vscode_languageserver_1.TextDocuments(vscode_languageserver_textdocument_1.TextDocument);
let server;
//////// Debug Help
// 1. How to inspect textmate tokens: Ctrl + Shift + P, then choose `Inspect Editor Tokens and Scopes`
// 2. How to inspect completion details: Ctrl + /
// Server side request handlers.
connection.onRequest('definitions', async ({ uri, position }) => {
    let document = documents.get(uri);
    if (!document) {
        return {
            success: false,
            data: null,
        };
    }
    return {
        success: true,
        data: await server.getDefinitions(document, position),
    };
});
// Server side request handlers.
connection.onRequest('references', async ({ uri, position }) => {
    let document = documents.get(uri);
    if (!document) {
        return {
            success: false,
            data: null,
        };
    }
    return {
        success: true,
        data: await server.getReferences(document, position)
    };
});
// Do initializing.
connection.onInitialize((params) => {
    let options = params.initializationOptions;
    configuration = options.configuration;
    server = new CSSNavigationServer(options);
    // Initialize console channel and log level.
    core_1.Logger.setLogEnabled(configuration.enableLogLevelMessage);
    core_1.Logger.pipeTo(connection);
    // Print error messages after unhandled rejection promise.
    process.on('unhandledRejection', function (reason) {
        core_1.Logger.warn("Unhandled Rejection: " + reason);
    });
    return {
        capabilities: {
            textDocumentSync: {
                openClose: true,
                change: vscode_languageserver_1.TextDocumentSyncKind.Full
            },
            completionProvider: configuration.enableCompletions ? {
                resolveProvider: false
            } : undefined,
            definitionProvider: configuration.enableGoToDefinition,
            referencesProvider: configuration.enableFindAllReferences,
            workspaceSymbolProvider: configuration.enableWorkspaceSymbols,
            hoverProvider: configuration.enableHover,
            codeLensProvider: configuration.enableDefinitionCodeLens || configuration.enableReferenceCodeLens ? { resolveProvider: true } : undefined,
            colorProvider: configuration.enableCSSVariableColorPreview,
        }
    };
});
// Listening events.
connection.onInitialized(async () => {
    if (configuration.enableGoToDefinition) {
        connection.onDefinition(core_1.Logger.logQuerierExecutedTime(server.provideDefinitions.bind(server), 'definition'));
    }
    if (configuration.enableWorkspaceSymbols) {
        connection.onWorkspaceSymbol(core_1.Logger.logQuerierExecutedTime(server.provideSymbols.bind(server), 'workspace symbol'));
    }
    if (configuration.enableCompletions) {
        connection.onCompletion(core_1.Logger.logQuerierExecutedTime(server.provideCompletionItems.bind(server), 'completion'));
    }
    if (configuration.enableFindAllReferences) {
        connection.onReferences(core_1.Logger.logQuerierExecutedTime(server.provideReferences.bind(server), 'reference'));
    }
    if (configuration.enableHover) {
        connection.onHover(core_1.Logger.logQuerierExecutedTime(server.provideHover.bind(server), 'hover'));
    }
    if (configuration.enableDefinitionCodeLens || configuration.enableReferenceCodeLens) {
        connection.onCodeLens(core_1.Logger.logQuerierExecutedTime(server.provideCodeLens.bind(server), 'codeLens'));
    }
    if (configuration.enableCSSVariableColorPreview) {
        connection.onDocumentColor(core_1.Logger.logQuerierExecutedTime(server.provideDocumentCSSVariableColors.bind(server), 'hover'));
        // Just ensure no error happens.
        connection.onColorPresentation(() => null);
    }
});
documents.listen(connection);
connection.listen();
class CSSNavigationServer {
    options;
    cssServiceMap;
    htmlServiceMap;
    diagnosedVersionMap = new Map();
    constructor(options) {
        this.options = options;
        languages_1.ClassNamesInJS.initWildNames(configuration.jsClassNameReferenceNames);
        let startPath = options.workspaceFolderPath;
        let alwaysIncludeGlobPattern = configuration.alwaysIncludeGlobPatterns
            ? (0, utils_1.generateGlobPatternByPatterns)(configuration.alwaysIncludeGlobPatterns)
            : undefined;
        // Shared glob querying.
        let alwaysIncludeGlobSharer = alwaysIncludeGlobPattern ? new glob_path_sharer_1.GlobPathSharer(alwaysIncludeGlobPattern, startPath) : undefined;
        const maxFileCount = configuration.maxFileCount;
        this.htmlServiceMap = new languages_1.HTMLServiceMap(documents, connection.window, {
            includeFileGlobPattern: (0, utils_1.generateGlobPatternByExtensions)(configuration.activeHTMLFileExtensions),
            excludeGlobPattern: (0, utils_1.generateGlobPatternByPatterns)(configuration.excludeGlobPatterns) || undefined,
            alwaysIncludeGlobSharer,
            startPath,
            ignoreFilesBy: configuration.ignoreFilesBy,
            // By default track at most 1000 html like files.
            maxFileCount: maxFileCount,
            // Release resources if has not been used for 30 mins.
            releaseTimeoutMs: 30 * 60 * 1000,
        }, configuration);
        this.cssServiceMap = new languages_1.CSSServiceMap(documents, connection.window, {
            includeFileGlobPattern: (0, utils_1.generateGlobPatternByExtensions)(configuration.activeCSSFileExtensions),
            excludeGlobPattern: (0, utils_1.generateGlobPatternByPatterns)(configuration.excludeGlobPatterns) || undefined,
            alwaysIncludeGlobSharer,
            startPath,
            ignoreFilesBy: configuration.ignoreFilesBy,
            // By default track at most 1000 css files.
            maxFileCount: maxFileCount,
        }, configuration);
        this.htmlServiceMap.bindCSSServiceMap(this.cssServiceMap);
        // All these events can't register for twice, or the first one will not work.
        documents.onDidChangeContent(async (event) => {
            let map = this.pickServiceMap(event.document);
            map?.onDocumentOpenOrContentChanged(event.document);
            // Update class name diagnostic results.
            if (configuration.enableClassNameDefinitionDiagnostic || configuration.enableClassNameReferenceDiagnostic) {
                await server.diagnoseOpenedOrChanged(event.document);
            }
        });
        documents.onDidSave((event) => {
            let map = this.pickServiceMap(event.document);
            map?.onDocumentSaved(event.document);
        });
        documents.onDidClose((event) => {
            let map = this.pickServiceMap(event.document);
            map?.onDocumentClosed(event.document);
            this.diagnosedVersionMap.delete(event.document.uri);
        });
        connection.onDidChangeWatchedFiles((params) => {
            this.htmlServiceMap.onWatchedFileOrFolderChanged(params);
            this.cssServiceMap.onWatchedFileOrFolderChanged(params);
        });
        core_1.Logger.log(`📁 Server for workspace "${path.basename(this.options.workspaceFolderPath)}" started.`);
    }
    pickServiceMap(document) {
        let uri = document.uri;
        let documentExtension = (0, utils_1.getPathExtension)(uri);
        let isHTMLFile = configuration.activeHTMLFileExtensions.includes(documentExtension);
        let isCSSFile = configuration.activeCSSFileExtensions.includes(documentExtension);
        if (isHTMLFile) {
            return this.htmlServiceMap;
        }
        else if (isCSSFile) {
            return this.cssServiceMap;
        }
        else {
            return null;
        }
    }
    /** Get definitions by document and position. */
    async getDefinitions(document, position) {
        let offset = document.offsetAt(position);
        return (0, definition_1.findDefinitions)(document, offset, this.htmlServiceMap, this.cssServiceMap, configuration);
    }
    /** Get references by document and position. */
    async getReferences(document, position) {
        let offset = document.offsetAt(position);
        return (0, reference_1.findReferences)(document, offset, this.htmlServiceMap, this.cssServiceMap, configuration, true);
    }
    updateTimestamp(time) {
        this.htmlServiceMap.updateTimestamp(time);
        this.cssServiceMap.updateTimestamp(time);
    }
    /** Provide finding definitions service. */
    async provideDefinitions(params, time) {
        this.updateTimestamp(time);
        let documentIdentifier = params.textDocument;
        let document = documents.get(documentIdentifier.uri);
        if (!document) {
            return null;
        }
        let position = params.position;
        let offset = document.offsetAt(position);
        return (0, definition_1.findDefinitions)(document, offset, this.htmlServiceMap, this.cssServiceMap, configuration);
    }
    /** Provide finding symbol service. */
    async provideSymbols(symbol, time) {
        this.updateTimestamp(time);
        let query = symbol.query;
        // Returns nothing if haven't inputted.
        if (!query) {
            return null;
        }
        let symbols = [];
        symbols.push(...await this.cssServiceMap.findSymbols(query));
        if (configuration.enableGlobalEmbeddedCSS) {
            symbols.push(...await this.htmlServiceMap.findSymbols(query));
        }
        return symbols;
    }
    /** Provide auto completion service for HTML or CSS document. */
    async provideCompletionItems(params, time) {
        this.updateTimestamp(time);
        let documentIdentifier = params.textDocument;
        let document = documents.get(documentIdentifier.uri);
        if (!document) {
            return null;
        }
        // HTML or CSS file.
        let position = params.position;
        let offset = document.offsetAt(position);
        return (0, completion_1.getCompletionItems)(document, offset, this.htmlServiceMap, this.cssServiceMap, configuration);
    }
    /** Provide finding reference service. */
    async provideReferences(params, time) {
        this.updateTimestamp(time);
        let documentIdentifier = params.textDocument;
        let document = documents.get(documentIdentifier.uri);
        if (!document) {
            return null;
        }
        let position = params.position;
        let offset = document.offsetAt(position);
        return (0, reference_1.findReferences)(document, offset, this.htmlServiceMap, this.cssServiceMap, configuration, false);
    }
    /** Provide finding hover service. */
    async provideHover(params, time) {
        this.updateTimestamp(time);
        let documentIdentifier = params.textDocument;
        let document = documents.get(documentIdentifier.uri);
        if (!document) {
            return null;
        }
        let position = params.position;
        let offset = document.offsetAt(position);
        return (0, hover_1.findHover)(document, offset, this.htmlServiceMap, this.cssServiceMap, configuration);
    }
    /** Provide finding code lens service. */
    async provideCodeLens(params, time) {
        this.updateTimestamp(time);
        let documentIdentifier = params.textDocument;
        let document = documents.get(documentIdentifier.uri);
        if (!document) {
            return null;
        }
        return (0, code_lens_1.getCodeLens)(document, this.htmlServiceMap, this.cssServiceMap, configuration);
    }
    /** Provide document css variable color service. */
    async provideDocumentCSSVariableColors(params, time) {
        this.updateTimestamp(time);
        let documentIdentifier = params.textDocument;
        let document = documents.get(documentIdentifier.uri);
        if (!document) {
            return null;
        }
        return (0, css_variable_color_1.getCSSVariableColors)(document, this.htmlServiceMap, this.cssServiceMap, configuration);
    }
    /** Diagnose class names for a changed document. */
    async diagnoseOpenedOrChanged(document) {
        let documentExtension = (0, utils_1.getPathExtension)(document.uri);
        let isHTMLFile = configuration.activeHTMLFileExtensions.includes(documentExtension);
        let isCSSFile = configuration.activeCSSFileExtensions.includes(documentExtension);
        if (!isHTMLFile && !isCSSFile) {
            return;
        }
        let previousVersion = this.diagnosedVersionMap.get(document.uri);
        let isChanged = previousVersion !== undefined && document.version > previousVersion;
        let fileCount = 0;
        let sharedCSSFragments = configuration.enableGlobalEmbeddedCSS;
        core_1.Logger.timeStart('diagnostic-of-' + document.uri);
        try {
            let diagnostics = await this.getClassNameDiagnostics(document);
            if (diagnostics) {
                connection.sendDiagnostics({ uri: document.uri, diagnostics });
                fileCount++;
            }
            // Only when document content changed.
            if (isChanged) {
                if (isHTMLFile && configuration.enableClassNameReferenceDiagnostic) {
                    fileCount += await this.diagnoseMoreOfType(sharedCSSFragments ? 'any' : 'css');
                }
                else if (isCSSFile && configuration.enableClassNameDefinitionDiagnostic) {
                    fileCount += await this.diagnoseMoreOfType(sharedCSSFragments ? 'any' : 'html');
                }
            }
        }
        catch (err) {
            core_1.Logger.error(String(err));
        }
        core_1.Logger.timeEnd('diagnostic-of-' + document.uri, fileCount > 0 ? `${fileCount} files get diagnosed` : null);
    }
    /** After a css file changed, you may need to re-diagnostic all html files. */
    async diagnoseMoreOfType(type) {
        let fileCount = 0;
        for (let document of documents.all()) {
            let documentExtension = (0, utils_1.getPathExtension)(document.uri);
            let isHTMLFile = configuration.activeHTMLFileExtensions.includes(documentExtension);
            let isCSSFile = configuration.activeCSSFileExtensions.includes(documentExtension);
            if (type === 'html' && !isHTMLFile || type === 'css' && !isCSSFile) {
                continue;
            }
            let diagnostics = await this.getClassNameDiagnostics(document);
            if (diagnostics) {
                connection.sendDiagnostics({ uri: document.uri, diagnostics });
                fileCount++;
            }
        }
        return fileCount;
    }
    /** Get all class name diagnostics of a document. */
    async getClassNameDiagnostics(document) {
        this.diagnosedVersionMap.set(document.uri, document.version);
        return (0, diagnostic_1.getDiagnostics)(document, this.htmlServiceMap, this.cssServiceMap, configuration);
    }
}
//# sourceMappingURL=server.js.map