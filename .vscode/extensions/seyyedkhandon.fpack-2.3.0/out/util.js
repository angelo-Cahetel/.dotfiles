"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extensionDeactivation = exports.firstTimeActivation = exports.extensionActivation = void 0;
const vscode = require("vscode");
const defaultSettings_1 = require("./defaultSettings");
const showDialog = vscode.window.showInformationMessage;
const updateUserSettings = (settings, remove = false) => Object.entries(settings).forEach(([key, value]) => vscode.workspace
    .getConfiguration()
    .update(key, remove ? undefined : value, vscode.ConfigurationTarget.Global));
function extensionActivation(context) {
    updateUserSettings(defaultSettings_1.defaultSettings);
    showDialog(`${context.extension.packageJSON.displayName} is activated!`);
}
exports.extensionActivation = extensionActivation;
function firstTimeActivation(context) {
    var _a;
    const version = (_a = context.extension.packageJSON.version) !== null && _a !== void 0 ? _a : "1.0.0";
    const previousVersion = context.globalState.get(context.extension.id);
    if (previousVersion === version)
        return;
    extensionActivation(context);
    context.globalState.update(context.extension.id, version);
}
exports.firstTimeActivation = firstTimeActivation;
function extensionDeactivation(context) {
    // context.globalState.update(context.extension.id, undefined);
    updateUserSettings(defaultSettings_1.defaultSettings, true);
    showDialog(`${context.extension.packageJSON.displayName} is deactivated!`);
}
exports.extensionDeactivation = extensionDeactivation;
//# sourceMappingURL=util.js.map