"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CSSNavigationExtension = void 0;
exports.activate = activate;
exports.deactivate = deactivate;
const path = require("path");
const vscode = require("vscode");
const vscode_languageclient_1 = require("vscode-languageclient");
const utils_1 = require("./utils");
process.on('unhandledRejection', function (reason) {
    console.log('Unhandled Rejection: ', reason);
});
let extension;
/** Output interface to activate plugin. */
function activate(context) {
    extension = new CSSNavigationExtension(context);
    // Register command.
    let moveCursorForwardCommand = vscode.commands.registerCommand('CSSNavigation.moveCursorForward', () => {
        let editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }
        let currentPosition = editor.selection.active;
        let newPosition = currentPosition.with(currentPosition.line, Math.max(0, currentPosition.character - 1));
        editor.selection = new vscode.Selection(newPosition, newPosition);
    });
    context.subscriptions.push(moveCursorForwardCommand);
    // Register command.
    let peekDefinitionsCommand = vscode.commands.registerCommand('CSSNavigation.peekDefinitions', async (uri, position) => {
        let theURI = vscode.Uri.parse(uri);
        let client = extension.ensureClientForOpenedURI(theURI);
        if (!client) {
            return;
        }
        let tokenSource = new vscode.CancellationTokenSource();
        let result = await client.sendRequest('definitions', { uri, position }, tokenSource.token);
        let definitions = result.data;
        if (definitions && definitions.length > 0) {
            await vscode.commands.executeCommand('editor.action.peekLocations', vscode.Uri.parse(uri), new vscode.Position(position.line, position.character), definitions.map(d => {
                return new vscode.Location(vscode.Uri.parse(d.uri.toString()), new vscode.Range(new vscode.Position(d.range.start.line, d.range.start.character), new vscode.Position(d.range.end.line, d.range.end.character)));
            }), 'peek');
        }
    });
    let peekReferencesCommand = vscode.commands.registerCommand('CSSNavigation.peekReferences', async (uri, position) => {
        let theURI = vscode.Uri.parse(uri);
        let client = extension.ensureClientForOpenedURI(theURI);
        if (!client) {
            return;
        }
        let tokenSource = new vscode.CancellationTokenSource();
        let result = await client.sendRequest('references', { uri, position }, tokenSource.token);
        let references = result.data;
        if (references && references.length > 0) {
            await vscode.commands.executeCommand('editor.action.peekLocations', vscode.Uri.parse(uri), new vscode.Position(position.line, position.character), references.map(d => {
                return new vscode.Location(vscode.Uri.parse(d.uri.toString()), new vscode.Range(new vscode.Position(d.range.start.line, d.range.start.character), new vscode.Position(d.range.end.line, d.range.end.character)));
            }), 'peek');
        }
    });
    context.subscriptions.push(peekDefinitionsCommand, peekReferencesCommand);
    // Register a content provider to open remote URI.
    const httpProvider = new class {
        provideTextDocumentContent(myURI) {
            let uri = myURI.path;
            return (0, utils_1.fetchAsText)(uri);
        }
    };
    context.subscriptions.push(vscode.workspace.registerTextDocumentContentProvider('css-nav-uri', httpProvider));
    // Register language server.
    context.subscriptions.push(vscode.workspace.onDidChangeConfiguration((event) => {
        if (event.affectsConfiguration('CSSNavigation')) {
            extension.loadConfig();
            extension.restartAllClients();
        }
    }), vscode.workspace.onDidOpenTextDocument((document) => {
        extension.ensureClientForOpenedURI(document.uri);
    }), vscode.workspace.onDidChangeWorkspaceFolders(event => {
        for (let folder of event.removed) {
            extension.stopClient(folder);
        }
        // Even only removes a folder, we may still need to restart all servers for every folder,
        // because some client folder may be contained in removed folders.
        extension.ensureClients();
    }));
    return extension;
}
/** Output interface to deactivate plugin. */
function deactivate() {
    return extension.stopAllClients();
}
class CSSNavigationExtension {
    /** Channel public for testing. */
    channel = vscode.window.createOutputChannel('CSS Navigation');
    context;
    config;
    clients = new Map();
    gitIgnoreWatchers = new Map();
    constructor(context) {
        this.context = context;
        this.loadConfig();
        this.ensureClients();
    }
    /** Load or reload configuration. */
    loadConfig() {
        this.config = vscode.workspace.getConfiguration('CSSNavigation');
    }
    /** Get configuration object. */
    getConfigObject() {
        let config = this.config;
        return {
            enableGoToDefinition: config.get('enableGoToDefinition', true),
            enableCompletions: config.get('enableCompletions', true),
            enableCustomTagCompletion: config.get('enableCustomTagCompletion', true),
            enableWorkspaceSymbols: config.get('enableWorkspaceSymbols', true),
            enableFindAllReferences: config.get('enableFindAllReferences', true),
            enableHover: config.get('enableHover', true),
            enableCSSVariableColorPreview: config.get('enableCSSVariableColorPreview', true),
            enableClassNameDefinitionDiagnostic: config.get('enableClassNameDefinitionDiagnostic', true),
            enableClassNameReferenceDiagnostic: config.get('enableClassNameReferenceDiagnostic', false),
            enableDefinitionCodeLens: config.get('enableDefinitionCodeLens', false),
            enableReferenceCodeLens: config.get('enableReferenceCodeLens', false),
            disableOwnCSSVariableCompletion: config.get('disableOwnCSSVariableCompletion', false),
            enableLogLevelMessage: config.get('enableLogLevelMessage', false),
            activeHTMLFileExtensions: config.get('activeHTMLFileExtensions', []),
            activeCSSFileExtensions: config.get('activeCSSFileExtensions', []),
            excludeGlobPatterns: config.get('excludeGlobPatterns') || [],
            alwaysIncludeGlobPatterns: config.get('alwaysIncludeGlobPatterns', []),
            jsClassNameReferenceNames: config.get('jsClassNameReferenceNames', []),
            ignoreCustomAndComponentTagDefinition: config.get('ignoreCustomAndComponentTagDefinition', false),
            ignoreFilesBy: config.get('ignoreFilesBy', []),
            maxHoverStylePropertyCount: config.get('maxHoverStylePropertyCount', 0),
            enableGlobalEmbeddedCSS: config.get('enableGlobalEmbeddedCSS', false),
            maxFileCount: config.get('maxFileCount', 1000),
        };
    }
    /** Sync server with workspace folders. */
    ensureClients() {
        let searchAcrossWorkspaceFolders = this.config.get('searchAcrossWorkspaceFolders', false);
        if (searchAcrossWorkspaceFolders) {
            for (let workspaceFolder of vscode.workspace.workspaceFolders || []) {
                this.ensureClientForWorkspace(workspaceFolder);
            }
        }
        else {
            for (let document of vscode.workspace.textDocuments) {
                this.ensureClientForOpenedURI(document.uri);
            }
        }
    }
    /** Make sure client to be started for workspace folder. */
    ensureClientForWorkspace(workspaceFolder) {
        let workspaceURI = workspaceFolder.uri.toString();
        let workspaceURIs = (vscode.workspace.workspaceFolders || []).map(folder => folder.uri.toString());
        let outmostWorkspaceURI = (0, utils_1.getOutmostWorkspaceURI)(workspaceURI, workspaceURIs);
        //was covered by another folder, stop it
        if (outmostWorkspaceURI && workspaceURI !== outmostWorkspaceURI && this.clients.has(workspaceURI)) {
            this.stopClient(workspaceFolder);
        }
        if (outmostWorkspaceURI && !this.clients.has(outmostWorkspaceURI)) {
            let workspaceFolder = vscode.workspace.getWorkspaceFolder(vscode.Uri.parse(outmostWorkspaceURI));
            if (workspaceFolder) {
                this.startClientFor(workspaceFolder);
            }
        }
        if (outmostWorkspaceURI) {
            return this.clients.get(outmostWorkspaceURI);
        }
        else {
            return null;
        }
    }
    /** If client and server is not exist for workspace, start it. */
    ensureClientForOpenedURI(uri) {
        if (uri.scheme !== 'file') {
            return null;
        }
        let activeHTMLFileExtensions = this.config.get('activeHTMLFileExtensions', []);
        let activeCSSFileExtensions = this.config.get('activeCSSFileExtensions', []);
        let extension = (0, utils_1.getPathExtension)(uri.fsPath);
        if (!activeHTMLFileExtensions.includes(extension) && !activeCSSFileExtensions.includes(extension)) {
            return null;
        }
        // Not in any workspace.
        let workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
        if (!workspaceFolder) {
            return null;
        }
        return this.ensureClientForWorkspace(workspaceFolder);
    }
    /** Start client & server for workspace folder. */
    async startClientFor(workspaceFolder) {
        let workspaceFolderPath = workspaceFolder.uri.fsPath;
        let activeHTMLFileExtensions = this.config.get('activeHTMLFileExtensions', []);
        let activeCSSFileExtensions = this.config.get('activeCSSFileExtensions', []);
        let searchAcrossWorkspaceFolders = this.config.get('searchAcrossWorkspaceFolders', false);
        let serverModule = this.context.asAbsolutePath(path.join('server', 'out', 'server.js'));
        // One port for only one server to debug should be ok.
        let debugOptions = { execArgv: ["--nolazy", '--inspect=6009'] };
        let serverOptions = {
            run: { module: serverModule, transport: vscode_languageclient_1.TransportKind.ipc },
            debug: { module: serverModule, transport: vscode_languageclient_1.TransportKind.ipc, options: debugOptions },
        };
        // To notify open / close / content changed for html & css files in specified range, and provide language service.
        let htmlCSSPattern = (0, utils_1.generateGlobPatternFromExtensions)([...activeHTMLFileExtensions, ...activeCSSFileExtensions]);
        let configuration = this.getConfigObject();
        let clientOptions = {
            documentSelector: [{
                    scheme: 'file',
                    //language: 'plaintext', //plaintext is not work, just ignore it if match all plaintext files
                    pattern: searchAcrossWorkspaceFolders ? htmlCSSPattern : `${workspaceFolderPath}/${htmlCSSPattern}`
                }],
            // `connection.console` will use this channel as output channel.
            outputChannel: this.channel,
            synchronize: {
                // Same as client.register(DidChangeConfigurationNotification.type),
                // config section changes will be captured by `onDidChangeConfiguration` in server.
                //configurationSection: 'CSSNavigation',
                // To notify the server workspace file or folder changes,
                // no matter changes come from vscode or outside, and trigger `onDidChangeWatchedFiles`.
                fileEvents: vscode.workspace.createFileSystemWatcher(new vscode.RelativePattern(workspaceFolderPath, `**`))
            },
            initializationOptions: {
                workspaceFolderPath,
                configuration,
            },
        };
        let client = new vscode_languageclient_1.LanguageClient('css-navigation', 'CSS Navigation', serverOptions, clientOptions);
        client.start();
        this.clients.set(workspaceFolder.uri.toString(), client);
        this.showChannelMessage((0, utils_1.getTimeMarker)()
            + `📁 Client for workspace "${workspaceFolder.name}" started`
            + (searchAcrossWorkspaceFolders ? ', and search across all workspace folders.' : ''));
        this.watchGitIgnoreFile(workspaceFolder);
    }
    async restartClient(workspaceFolder) {
        await this.stopClient(workspaceFolder);
        this.ensureClients();
    }
    /** Stop one client and matched server. */
    async stopClient(workspaceFolder) {
        this.unwatchLastWatchedGitIgnoreFile(workspaceFolder);
        let uri = workspaceFolder.uri.toString();
        let client = this.clients.get(uri);
        if (client) {
            this.clients.delete(uri);
            await client.stop();
            this.showChannelMessage((0, utils_1.getTimeMarker)() + `Client for workspace folder "${workspaceFolder.name}" stopped`);
        }
    }
    /** Push message to output channel. */
    showChannelMessage(message) {
        this.channel.appendLine(message);
    }
    /** Restart all clients and servers. */
    async restartAllClients() {
        await this.stopAllClients();
        this.ensureClients();
    }
    /** Stop all clients and servers. */
    async stopAllClients() {
        let promises = [];
        for (let uri of this.clients.keys()) {
            let workspaceFolder = vscode.workspace.getWorkspaceFolder(vscode.Uri.parse(uri));
            if (workspaceFolder) {
                this.stopClient(workspaceFolder);
            }
        }
        await Promise.all(promises);
        this.clients.clear();
    }
    /** Only watch `.gitignore` in root directory. */
    watchGitIgnoreFile(workspaceFolder) {
        this.unwatchLastWatchedGitIgnoreFile(workspaceFolder);
        let watcher = vscode.workspace.createFileSystemWatcher(new vscode.RelativePattern(workspaceFolder.uri.fsPath, `.gitignore`));
        let onGitIgnoreChange = () => {
            this.restartClient(workspaceFolder);
        };
        watcher.onDidCreate(onGitIgnoreChange);
        watcher.onDidDelete(onGitIgnoreChange);
        watcher.onDidChange(onGitIgnoreChange);
        this.gitIgnoreWatchers.set(workspaceFolder.uri.fsPath, watcher);
    }
    /** unwatch `.gitignore`. */
    unwatchLastWatchedGitIgnoreFile(workspaceFolder) {
        let watcher = this.gitIgnoreWatchers.get(workspaceFolder.uri.fsPath);
        if (watcher) {
            watcher.dispose();
        }
    }
}
exports.CSSNavigationExtension = CSSNavigationExtension;
//# sourceMappingURL=extension.js.map