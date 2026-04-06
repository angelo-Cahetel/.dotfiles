"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FreeTrialProvider = void 0;
const auth_1 = require("../auth");
const instrumentation_1 = require("../instrumentation");
const constants_1 = require("../constants");
const helper_1 = require("./helper");
class FreeTrialProvider {
    constructor(_extensionUri) {
        this._extensionUri = _extensionUri;
    }
    async resolveWebviewView(webviewView, context, _token) {
        this._view = webviewView;
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri],
        };
        webviewView.webview.html = await (0, helper_1.generateWebView)(webviewView.webview, this._extensionUri, "free-trial");
        webviewView.onDidChangeVisibility(() => {
            (0, instrumentation_1.addComponentInstrumentationEvent)(constants_1.COMPONENTS.freeTrial, "visibility", webviewView.visible);
        });
        (0, instrumentation_1.addComponentInstrumentationEvent)(constants_1.COMPONENTS.freeTrial, "visibility", webviewView.visible);
        webviewView.webview.onDidReceiveMessage((message) => {
            switch (message.type) {
                case "request":
                    (0, auth_1.promptFreeUserPricingPage)();
                    (0, instrumentation_1.addActionInstrumentationEvent)(constants_1.COMPONENTS.freeTrial);
                    break;
            }
        });
    }
}
exports.FreeTrialProvider = FreeTrialProvider;
//# sourceMappingURL=freeTrialProvider.js.map