"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggedOutProvider = void 0;
const auth_1 = require("../auth");
const instrumentation_1 = require("../instrumentation");
const constants_1 = require("../constants");
const helper_1 = require("./helper");
class LoggedOutProvider {
    constructor(_extensionUri) {
        this._extensionUri = _extensionUri;
    }
    async resolveWebviewView(webviewView, context, _token) {
        this._view = webviewView;
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri],
        };
        webviewView.onDidChangeVisibility(() => {
            (0, instrumentation_1.addComponentInstrumentationEvent)(constants_1.COMPONENTS.loggedOut, "visibility", webviewView.visible);
        });
        (0, instrumentation_1.addComponentInstrumentationEvent)(constants_1.COMPONENTS.loggedOut, "visibility", webviewView.visible);
        webviewView.webview.html = await (0, helper_1.generateWebView)(webviewView.webview, this._extensionUri, "logged-out");
        webviewView.webview.onDidReceiveMessage((message) => {
            switch (message.type) {
                case "request":
                    (0, auth_1.promptUserSignIn)();
                    (0, instrumentation_1.userClickEvent)("sign-in");
                    (0, instrumentation_1.addActionInstrumentationEvent)("sign-in");
                    break;
            }
        });
    }
}
exports.LoggedOutProvider = LoggedOutProvider;
//# sourceMappingURL=loggedOutProvider.js.map