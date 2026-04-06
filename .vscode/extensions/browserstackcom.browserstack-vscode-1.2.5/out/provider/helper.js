"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateWebView = exports.getNonce = exports.getDisplayName = exports.getDisplayNamesJSON = void 0;
const vscode = require("vscode");
const axios_1 = require("axios");
const fs_1 = require("fs");
const constants_1 = require("../constants");
const instrumentation_1 = require("../instrumentation");
let displayNamesJSON = null;
const getDisplayNamesJSON = (component) => {
    return new Promise(async (resolve, reject) => {
        if (displayNamesJSON) {
            resolve(displayNamesJSON);
        }
        else {
            try {
                const response = await axios_1.default.get(`${constants_1.BASE_DOMAIN}/os-display-names?request_source=vscode`);
                displayNamesJSON = response.data;
                resolve(response.data);
            }
            catch (error) {
                (0, instrumentation_1.addComponentInstrumentationEvent)(component, "visibility", false, "Error endpoint: /os-display-names. " + error.message);
                resolve(null);
            }
        }
    });
};
exports.getDisplayNamesJSON = getDisplayNamesJSON;
const getDisplayName = async (sample, raw = false, component) => {
    let displayNamesJSON = (await (0, exports.getDisplayNamesJSON)(component));
    if (raw) {
        return (displayNamesJSON[sample.os] || displayNamesJSON[sample.operating_system]);
    }
    if (sample.combination_name) {
        if (sample.device_type === "desktop") {
            return `${displayNamesJSON[sample.operating_system]} - ${capitalize(sample.browser)} [v${sample.browser_version}]`;
        }
        return `${sample.combination_name} [v${sample.os_version}]`;
    }
    if (sample.os === "realios" || sample.os === "realdroid") {
        return `${sample.device.split("-")[0]} [v${sample.device.split("-")[1]}]`;
    }
    if (sample.os === "android" || sample.os === "ios") {
        let device, version;
        device = sample.device.split("-")[0];
        version = sample.device.split("-")[1];
        return `${device} [v${version}]`;
    }
    return `${displayNamesJSON[sample.os]} - ${capitalize(sample.browser)} [v${sample.browser_version}${sample.version_name ? ` ${capitalize(sample.version_name)}` : ""}]`;
};
exports.getDisplayName = getDisplayName;
const capitalize = (value) => {
    if (value.toLocaleLowerCase() === "ie") {
        return "IE";
    }
    const arr = value.split(" ");
    for (var i = 0; i < arr.length; i++) {
        arr[i] = arr[i].charAt(0).toUpperCase() + arr[i].slice(1);
    }
    return arr.join(" ");
};
// Required in vscode for adding script tag
const getNonce = () => {
    let text = "";
    const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
};
exports.getNonce = getNonce;
const generateWebView = async (webview, extensionUri, componentString) => {
    try {
        const htmlData = (0, fs_1.readFileSync)(webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, "resources", "html", `${componentString}.html`)).fsPath).toString();
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, "resources", "js", `${componentString}.js`));
        const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, "resources", "css", `${componentString}.css`));
        // returning html string that will be rendered in iframe
        return `<!DOCTYPE html>
          <html lang="en">
          <head>
              <meta charset="UTF-8">
              <meta http-equiv="X-UA-Compatible" content="IE=edge">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Document</title>
              <link rel="stylesheet" href="${styleUri}">
              </head>
              ${htmlData}
              <script nonce="${(0, exports.getNonce)()}" src="${scriptUri}"></script>
          </html>
  `;
    }
    catch (e) {
        return `Error occurred ${e}`;
    }
};
exports.generateWebView = generateWebView;
//# sourceMappingURL=helper.js.map