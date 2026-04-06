"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEVICE_CONSTANTS = exports.STRING_CONSTANTS = exports.LOCAL_STATES = exports.OTHER_OPTIONS = exports.COMPONENTS = exports.VIEW_PROVIDER = exports.WALKTHROUGH = exports.INSTRUMENTATION_CLICK_EVENTS_URL = exports.INSTRUMENTATION_URL = exports.INSTRUMENTATION_INTERVAL = exports.LOCAL_BINARY_PORT_EXCEPTION = exports.PORT_OCCUPIED = exports.TIMEOUT = exports.LAST_TESTED_DEVICE = exports.PRICING_PAGE_URL = exports.QUICK_LAUNCH_EDIT_URL = exports.USER_URL = exports.START_SESSION = exports.BASE_DOMAIN = exports.LOCAL_HASH = exports.APP_IDENTIFIER = void 0;
exports.APP_IDENTIFIER = "browserstack";
exports.LOCAL_HASH = "local_hash";
exports.BASE_DOMAIN = "https://live.browserstack.com";
exports.START_SESSION = "start-session";
exports.USER_URL = "user_url";
exports.QUICK_LAUNCH_EDIT_URL = `${exports.BASE_DOMAIN}/dashboard?utm_source=chrome&utm_medium=extension&utm_campaign=vscode&quickLaunch=1`;
exports.PRICING_PAGE_URL = `https://www.browserstack.com/pricing?product=live&utm_source=chrome&utm_medium=extension&utm_campaign=vscode`;
exports.LAST_TESTED_DEVICE = "last_tested_device";
exports.TIMEOUT = "time_out";
exports.PORT_OCCUPIED = "port_occupied";
exports.LOCAL_BINARY_PORT_EXCEPTION = "local_binary_port_exception";
exports.INSTRUMENTATION_INTERVAL = 30000; // 30 seconds
exports.INSTRUMENTATION_URL = `${exports.BASE_DOMAIN}/extensions/instrumentation`;
exports.INSTRUMENTATION_CLICK_EVENTS_URL = `${exports.BASE_DOMAIN}/extensions/instrumentation_click_events`;
exports.WALKTHROUGH = {
    signIn: "walkthrough-sign-in",
    startTesting: "walkthrough-start-testing",
};
exports.VIEW_PROVIDER = {
    quickLaunch: {
        refreshQL: "refresh-QL",
        editQL: "edit-QL",
    },
    trendingView: {
        refreshQL: "refresh-trending-view"
    }
};
exports.COMPONENTS = {
    quickLaunchPanel: "quick-launch-panel",
    trendingViewPanel: "trending-view-panel",
    urlBarPanel: "url-bar-panel",
    freeTrial: "free-trial-panel",
    loggedOut: "logged-out-pane",
    statusBar: "status-bar",
};
exports.OTHER_OPTIONS = {
    viewDocumentation: "view-documentation",
    reportAnIssue: "report-issue",
    logout: "logout",
};
exports.LOCAL_STATES = {
    success: "success",
    failure: "failure",
    usingUserLocalSetup: "using-user-local-setup",
};
exports.STRING_CONSTANTS = {
    statusBarTitle: "This will start a BrowserStack Live Session \nwith the last tested URL on this device",
    localBinaryConnectionFailure: "Local Binary Failed to connect with BrowserStack",
    treeViewErrorItem: "Looks like your token got expired, please login again to continue",
};
exports.DEVICE_CONSTANTS = {
    os: {
        android: "android",
        ios: "ios",
        realios: "realios",
        realdroid: "realdroid",
    },
    browser: {
        chrome: "chrome",
        safari: "safari",
        ie: "ie",
        yandex: "yandex",
        opera: "opera",
        edge: "edge",
        firefox: "firefox",
    },
};
//# sourceMappingURL=constants.js.map