"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UrlBarProvider = void 0;
const constants_1 = require("../constants");
const instrumentation_1 = require("../instrumentation");
const helper_1 = require("./helper");
class UrlBarProvider {
    constructor(_extensionUri, stateHelper) {
        this._extensionUri = _extensionUri;
        this.stateHelper = stateHelper;
    }
    async resolveWebviewView(webviewView, context, _token) {
        this._view = webviewView;
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri],
        };
        webviewView.onDidChangeVisibility(() => {
            (0, instrumentation_1.addComponentInstrumentationEvent)(constants_1.COMPONENTS.urlBarPanel, "visibility", webviewView.visible);
        });
        (0, instrumentation_1.addComponentInstrumentationEvent)(constants_1.COMPONENTS.urlBarPanel, "visibility", webviewView.visible);
        webviewView.webview.html = await (0, helper_1.generateWebView)(webviewView.webview, this._extensionUri, "url-bar");
        webviewView.webview.onDidReceiveMessage(async (message) => {
            switch (message.type) {
                case "request":
                    this._view?.webview.postMessage({
                        url: (await this.stateHelper.getState(constants_1.USER_URL)) || "www.google.com",
                    });
                    break;
                case "data":
                    this.stateHelper.updateState(constants_1.USER_URL, message.value);
                    break;
                case "event":
                    (0, instrumentation_1.addComponentInstrumentationEvent)(constants_1.COMPONENTS.urlBarPanel, "urlBar", "selected");
                    break;
            }
        });
    }
}
exports.UrlBarProvider = UrlBarProvider;
//# sourceMappingURL=urlBarProvider.js.map