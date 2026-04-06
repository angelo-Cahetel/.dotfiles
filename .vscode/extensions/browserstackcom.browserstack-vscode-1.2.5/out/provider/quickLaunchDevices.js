"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuickLaunchDevicesProvider = void 0;
const axios_1 = require("axios");
const vscode = require("vscode");
const auth_1 = require("../auth");
const constants_1 = require("../constants");
const extension_1 = require("../extension");
const helper_1 = require("../helper");
const instrumentation_1 = require("../instrumentation");
const helper_2 = require("./helper");
const treeItems_1 = require("./treeItems");
class QuickLaunchDevicesProvider {
    constructor(userData, context, statusBarItem, stateHelper, completionHandler) {
        this.statusBarItem = statusBarItem;
        this.stateHelper = stateHelper;
        this.completionHandler = completionHandler;
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.userData = userData;
        this.context = context;
        this.apiHelper = (0, helper_1.getApiHelper)();
    }
    refresh() {
        this._onDidChangeTreeData.fire();
        (0, instrumentation_1.addActionInstrumentationEvent)(constants_1.VIEW_PROVIDER.quickLaunch.refreshQL);
    }
    getTreeItem(element) {
        return element;
    }
    getParent(element) {
        return null;
    }
    getChildren() {
        return new Promise(async (resolve, reject) => {
            const stateHelper = (0, helper_1.getStateHelper)(this.context);
            this.userData = await stateHelper.getState(constants_1.LOCAL_HASH);
            const userHash = Buffer.from(JSON.stringify(this.userData)).toString("base64");
            try {
                const response = await this.apiHelper.get(`/quick_launch_devices?extension_hash=${userHash}`);
                const items = await response.data.map(async (sample) => new treeItems_1.Item(sample, await (0, helper_2.getDisplayName)(sample, false, constants_1.COMPONENTS.quickLaunchPanel), "quick-launch", vscode.TreeItemCollapsibleState.None));
                await this.setStatusBarItem(response.data);
                resolve(items);
                this.completionHandler();
            }
            catch (error) {
                if (axios_1.default.isAxiosError(error)) {
                    if (error.response && error.response.status === 400) {
                        console.error("User data mismatch, logging user out");
                        (0, extension_1.logOut)(stateHelper);
                        (0, auth_1.promptUserSignIn)();
                    }
                    (0, instrumentation_1.addActionInstrumentationEvent)(constants_1.COMPONENTS.quickLaunchPanel, error?.config?.url + " : " + error.message);
                    if (error.response?.status) {
                        resolve([new treeItems_1.ErrorItem(constants_1.STRING_CONSTANTS.treeViewErrorItem)]);
                    }
                }
                else {
                    console.error(error);
                    (0, instrumentation_1.addActionInstrumentationEvent)(constants_1.COMPONENTS.quickLaunchPanel, error?.config?.url + " : " + error.message);
                }
            }
        });
    }
    async setStatusBarItem(data) {
        const lastTestedDevice = await this.stateHelper.getState(constants_1.LAST_TESTED_DEVICE);
        let statusBarItemDevice;
        if (lastTestedDevice) {
            statusBarItemDevice = lastTestedDevice.data;
        }
        else if (data.length > 0) {
            statusBarItemDevice = data[0];
        }
        if (statusBarItemDevice) {
            (0, helper_1.updateStatusBarItem)(this.statusBarItem, statusBarItemDevice);
        }
    }
}
exports.QuickLaunchDevicesProvider = QuickLaunchDevicesProvider;
//# sourceMappingURL=quickLaunchDevices.js.map