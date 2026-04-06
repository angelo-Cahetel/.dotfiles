"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportIssueHandler = exports.viewDocumentationHandler = exports.updateStatusBarItem = exports.startSessionHandler = exports.getApiHelper = exports.getStateHelper = exports.getRegisterCommandHelper = void 0;
const vscode = require("vscode");
const axios_1 = require("axios");
const helper_1 = require("./provider/helper");
const constants_1 = require("./constants");
const instrumentation_1 = require("./instrumentation");
const getRegisterCommandHelper = (context) => {
    return (identifier, callback) => {
        identifier = `${constants_1.APP_IDENTIFIER}.${identifier}`;
        context.subscriptions.push(vscode.commands.registerCommand(identifier, callback));
    };
};
exports.getRegisterCommandHelper = getRegisterCommandHelper;
const getStateHelper = (context) => {
    return {
        updateState: (key, value) => {
            return context.globalState.update(key, value);
        },
        getState: (key) => {
            return context.globalState.get(key);
        },
    };
};
exports.getStateHelper = getStateHelper;
const getApiHelper = () => {
    return axios_1.default.create({
        baseURL: `${constants_1.BASE_DOMAIN}/extensions`,
    });
};
exports.getApiHelper = getApiHelper;
const startSessionHandler = async (element, stateHelper, statusBarItem) => {
    try {
        if (!element) {
            element = stateHelper.getState(constants_1.LAST_TESTED_DEVICE);
            if (!element) {
                return;
            }
        }
        let item = await element;
        // https://live.browserstack.com/dashboard#os=OS+X&os_version=Ventura&browser=Edge&browser_version=113.0&device_browser=chrome&zoom_to_fit=true&full_screen=true&url=https%3A%2F%2Fwww.browserstack.com%2F%3Futm_source%3Dgoogle098098098&speed=1
        const data = item.data;
        const url = encodeURI((await stateHelper.getState(constants_1.USER_URL)) || "www.google.com");
        let os, osVersion, browser, browserVersion, device;
        // TODO: find a better way to generate integration url, avoid if-else-if
        if (data.combination_name) {
            if (data.device_type === "desktop") {
                let displayName = await (0, helper_1.getDisplayName)(data, true, constants_1.START_SESSION);
                if (/OS X/.test(displayName)) {
                    os = "OS X";
                    osVersion = displayName.split("OS X")[1].trim();
                    browserVersion = data.browser_version;
                    browser = data.browser;
                }
                else if (/Win/.test(displayName)) {
                    os = "Windows";
                    osVersion = displayName.split("Windows")[1].trim();
                    browserVersion = data.browser_version;
                    browser = data.browser;
                }
            }
            else {
                os = data.operating_system;
                osVersion = data.os_version;
                browser = "safari";
                device = data.combination_name;
                if (data.operating_system === "Android") {
                    browser = "chrome";
                }
            }
        }
        else {
            if (data.os === "realios" || data.os === "ios") {
                os = "iOS";
                device = data.device.split("-")[0].trim();
                osVersion = data.device.split("-")[1].trim();
                browser = "safari";
            }
            else if (data.os === "realdroid" || data.os === "android") {
                os = "android";
                device = data.device.split("-")[0].trim();
                osVersion = data.device.split("-")[1].trim();
                browser = "chrome";
            }
            else {
                let displayName = await (0, helper_1.getDisplayName)(data, true, constants_1.START_SESSION);
                if (/OS X/.test(displayName)) {
                    os = "OS X";
                    osVersion = displayName.split("OS X")[1].trim();
                    browserVersion = data.browser_version;
                    browser = data.browser;
                }
                else if (/Win/.test(displayName)) {
                    os = "Windows";
                    osVersion = displayName.split("Windows")[1].trim();
                    browserVersion = data.browser_version;
                    browser = data.browser;
                }
            }
        }
        if (data.version_name && data.version_name.toLowerCase() !== "latest") {
            browserVersion += `+${data.version_name}`;
        }
        stateHelper.updateState(constants_1.LAST_TESTED_DEVICE, item);
        (0, exports.updateStatusBarItem)(statusBarItem, data);
        vscode.env.openExternal(vscode.Uri.parse(`${constants_1.BASE_DOMAIN}/dashboard#os=${os}&os_version=${osVersion}&browser=${browser}&device_browser=${browser}&device=${device}&browser_version=${browserVersion}&zoom_to_fit=true&full_screen=true&url=${url}&start_element=vscode_extension&speed=1&start=true`));
        (0, instrumentation_1.addStartSessionEvent)(device, os.toLowerCase(), browser, data.from);
    }
    catch (error) {
        (0, instrumentation_1.addStartSessionEvent)("", "", "", "", error.message);
    }
};
exports.startSessionHandler = startSessionHandler;
const updateStatusBarItem = async (statusBarItem, statusBarItemDevice) => {
    statusBarItem.command = {
        command: `${constants_1.APP_IDENTIFIER}.${constants_1.START_SESSION}`,
        title: constants_1.STRING_CONSTANTS.statusBarTitle,
        arguments: [{ data: statusBarItemDevice }],
    };
    statusBarItem.text =
        "$(browserstack-icon)  " + (await (0, helper_1.getDisplayName)(statusBarItemDevice, false, constants_1.COMPONENTS.statusBar));
    statusBarItem.tooltip = constants_1.STRING_CONSTANTS.statusBarTitle;
    statusBarItem.show();
};
exports.updateStatusBarItem = updateStatusBarItem;
const viewDocumentationHandler = () => {
    vscode.env.openExternal(vscode.Uri.parse("https://www.browserstack.com/docs/live/vscode-integration?utm_source=chrome&utm_medium=extension&utm_campaign=vscode"));
    (0, instrumentation_1.addActionInstrumentationEvent)(constants_1.OTHER_OPTIONS.viewDocumentation);
};
exports.viewDocumentationHandler = viewDocumentationHandler;
const reportIssueHandler = () => {
    vscode.env.openExternal(vscode.Uri.parse(`${constants_1.BASE_DOMAIN}/contact?utm_source=chrome&utm_medium=extension&utm_campaign=vscode`));
    (0, instrumentation_1.addActionInstrumentationEvent)(constants_1.OTHER_OPTIONS.reportAnIssue);
};
exports.reportIssueHandler = reportIssueHandler;
//# sourceMappingURL=helper.js.map