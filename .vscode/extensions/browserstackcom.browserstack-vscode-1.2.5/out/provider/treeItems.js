"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorItem = exports.Item = void 0;
const path = require("path");
const vscode = require("vscode");
const constants_1 = require("../constants");
class Item extends vscode.TreeItem {
    constructor(data, label, from, collapsibleState) {
        super(label, collapsibleState);
        this.data = data;
        this.label = label;
        this.from = from;
        this.collapsibleState = collapsibleState;
        this.contextValue = "item";
        this.data = data;
        if (data) {
            if (data.os === constants_1.DEVICE_CONSTANTS.os.realios ||
                data.operating_system?.toLowerCase() === constants_1.DEVICE_CONSTANTS.os.ios ||
                data.os === constants_1.DEVICE_CONSTANTS.os.ios) {
                this.iconPath = path.join(__filename, "..", "..", "..", "media", "icons", "ios.svg");
            }
            else if (data.os === constants_1.DEVICE_CONSTANTS.os.realdroid ||
                data.operating_system?.toLowerCase() === constants_1.DEVICE_CONSTANTS.os.android ||
                data.os === constants_1.DEVICE_CONSTANTS.os.android) {
                this.iconPath = path.join(__filename, "..", "..", "..", "media", "icons", "android.svg");
            }
            else if (Object.keys(constants_1.DEVICE_CONSTANTS.browser).includes(data.browser.toLowerCase())) {
                this.iconPath = path.join(__filename, "..", "..", "..", "media", "icons", data.browser.toLowerCase() + ".svg");
            }
        }
    }
}
exports.Item = Item;
class ErrorItem extends Item {
    constructor(label) {
        super(undefined, label, "", vscode.TreeItemCollapsibleState.None);
        this.label = label;
        this.tooltip = ``;
        this.iconPath = new vscode.ThemeIcon("warning", new vscode.ThemeColor("problemsWarningIcon.foreground"));
        this.contextValue = "error";
        this.command = {
            command: "browserstack.walkthrough-sign-in",
            title: "",
            tooltip: "SignIn to BrowserStack",
        };
    }
}
exports.ErrorItem = ErrorItem;
//# sourceMappingURL=treeItems.js.map