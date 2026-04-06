"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logOut = exports.deactivate = exports.activate = void 0;
const vscode = require("vscode");
const walkthrough_1 = require("./walkthrough");
const helper_1 = require("./helper");
const constants_1 = require("./constants");
const localApp_1 = require("./localApp");
const quickLaunchDevices_1 = require("./provider/quickLaunchDevices");
const trendingDevices_1 = require("./provider/trendingDevices");
const urlBarProvider_1 = require("./provider/urlBarProvider");
const loggedOutProvider_1 = require("./provider/loggedOutProvider");
const freeTrialProvider_1 = require("./provider/freeTrialProvider");
const instrumentation_1 = require("./instrumentation");
let quickLaunchDevicesProvider, trendingDevicesProvider, statusBarItem, quickLaunchTreeView, trendingDevicesTreeView;
async function activate(context) {
    const registerCommand = (0, helper_1.getRegisterCommandHelper)(context);
    const stateHelper = (0, helper_1.getStateHelper)(context);
    let userData = stateHelper.getState(constants_1.LOCAL_HASH);
    instrumentation_1.InstrumentationManager.getInstance(context, stateHelper, userData);
    registerCommand(constants_1.WALKTHROUGH.signIn, walkthrough_1.signInWalkThroughHandler);
    registerCommand(constants_1.WALKTHROUGH.startTesting, walkthrough_1.startTestingWalkthroughHandler);
    registerCommand(constants_1.START_SESSION, (element) => {
        (0, helper_1.startSessionHandler)(element, stateHelper, statusBarItem);
    });
    registerCommand(constants_1.OTHER_OPTIONS.reportAnIssue, helper_1.reportIssueHandler);
    registerCommand(constants_1.OTHER_OPTIONS.viewDocumentation, helper_1.viewDocumentationHandler);
    registerCommand(constants_1.OTHER_OPTIONS.logout, () => {
        (0, exports.logOut)(stateHelper);
    });
    registerURIHandler(context, stateHelper, registerCommand);
    addStatusBarItem(context, stateHelper);
    addViewProviders(context, stateHelper);
    if (userData && userData["local_key"]) {
        startUserFlow(context, userData, registerCommand, stateHelper);
    }
}
exports.activate = activate;
async function deactivate() {
    await instrumentation_1.InstrumentationManager.processLogs();
    await (0, localApp_1.stopLocalBinary)();
}
exports.deactivate = deactivate;
const registerURIHandler = (context, stateHelper, registerCommand) => {
    const handleUri = async (uri) => {
        const queryParams = new URLSearchParams(uri.query);
        if (queryParams.has("hash")) {
            let queryHash = queryParams.get("hash");
            let hash = Buffer.from(queryHash, "base64").toString();
            hash = JSON.parse(hash);
            if (hash["local_key"] && hash["email"] && hash["user_id"]) {
                await stateHelper.updateState(constants_1.LOCAL_HASH, hash);
                (0, instrumentation_1.userLoginEvent)(queryHash);
                startUserFlow(context, hash, registerCommand, stateHelper);
            }
        }
    };
    context.subscriptions.push(vscode.window.registerUriHandler({ handleUri }));
};
const startUserFlow = async (context, userData, registerCommand, stateHelper) => {
    (0, localApp_1.startLocalBinary)(userData["local_key"]);
    vscode.commands.executeCommand("setContext", "browserstack.isUserAuthenticated", true);
    vscode.commands.executeCommand("setContext", "browserstack.isFreeTrialUser", userData["free_user"]);
    const lastTestedDevice = await stateHelper.getState(constants_1.LAST_TESTED_DEVICE);
    if (quickLaunchDevicesProvider) {
        quickLaunchDevicesProvider.refresh();
    }
    else {
        quickLaunchDevicesProvider = new quickLaunchDevices_1.QuickLaunchDevicesProvider(userData, context, statusBarItem, stateHelper, () => {
            if (lastTestedDevice && lastTestedDevice.from === "quick-launch") {
                quickLaunchTreeView
                    .reveal(lastTestedDevice)
                    .then(undefined, (err) => { });
            }
        });
        registerCommand(constants_1.VIEW_PROVIDER.quickLaunch.refreshQL, () => {
            quickLaunchDevicesProvider.refresh();
        });
        registerCommand(constants_1.VIEW_PROVIDER.quickLaunch.editQL, () => {
            vscode.env.openExternal(vscode.Uri.parse(constants_1.QUICK_LAUNCH_EDIT_URL));
            (0, instrumentation_1.addActionInstrumentationEvent)(constants_1.VIEW_PROVIDER.quickLaunch.editQL);
        });
        quickLaunchTreeView = vscode.window.createTreeView("quick-launch-devices", {
            treeDataProvider: quickLaunchDevicesProvider,
        });
        quickLaunchTreeView.onDidChangeVisibility(({ visible }) => {
            (0, instrumentation_1.addComponentInstrumentationEvent)(constants_1.COMPONENTS.quickLaunchPanel, "visibility", visible);
        });
    }
    if (trendingDevicesProvider) {
        trendingDevicesProvider.refresh();
    }
    else {
        trendingDevicesProvider = new trendingDevices_1.TrendingDevicesProvider(userData, context, () => {
            if (lastTestedDevice && lastTestedDevice.from === "trending-devices") {
                trendingDevicesTreeView
                    .reveal(lastTestedDevice)
                    .then(undefined, (err) => {
                    console.log(err);
                });
            }
        });
        trendingDevicesTreeView = vscode.window.createTreeView("trending-devices", {
            treeDataProvider: trendingDevicesProvider,
        });
        trendingDevicesTreeView.onDidChangeVisibility(({ visible }) => {
            (0, instrumentation_1.addComponentInstrumentationEvent)(constants_1.COMPONENTS.trendingViewPanel, "visibility", visible);
        });
    }
};
const logOut = async (stateHelper) => {
    await (0, localApp_1.stopLocalBinary)();
    await stateHelper.updateState(constants_1.LOCAL_HASH, undefined);
    await stateHelper.updateState(constants_1.USER_URL, undefined);
    await stateHelper.updateState(constants_1.LAST_TESTED_DEVICE, undefined);
    statusBarItem.hide();
    vscode.commands.executeCommand("setContext", "browserstack.isUserAuthenticated", false);
    vscode.window.showInformationMessage("Logout Successful");
    (0, instrumentation_1.addActionInstrumentationEvent)(constants_1.OTHER_OPTIONS.logout);
};
exports.logOut = logOut;
const addViewProviders = (context, stateHelper) => {
    context.subscriptions.push(vscode.window.registerWebviewViewProvider("url-bar", new urlBarProvider_1.UrlBarProvider(context.extensionUri, stateHelper)));
    context.subscriptions.push(vscode.window.registerWebviewViewProvider("logged-out-view", new loggedOutProvider_1.LoggedOutProvider(context.extensionUri)));
    context.subscriptions.push(vscode.window.registerWebviewViewProvider("free-trial-view", new freeTrialProvider_1.FreeTrialProvider(context.extensionUri)));
};
const addStatusBarItem = async (context, stateHelper) => {
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    context.subscriptions.push(statusBarItem);
    const lastTestedDevice = await stateHelper.getState(constants_1.LAST_TESTED_DEVICE);
    if (lastTestedDevice) {
        (0, helper_1.updateStatusBarItem)(statusBarItem, lastTestedDevice.data);
    }
};
//# sourceMappingURL=extension.js.map