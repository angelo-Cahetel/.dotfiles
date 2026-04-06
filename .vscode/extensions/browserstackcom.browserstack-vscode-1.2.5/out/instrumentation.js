"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userClickEvent = exports.userLoginEvent = exports.addStartSessionEvent = exports.addLocalInstrumentationEvent = exports.addActionInstrumentationEvent = exports.addComponentInstrumentationEvent = exports.InstrumentationManager = void 0;
const axios_1 = require("axios");
const constants_1 = require("./constants");
const extension_1 = require("./extension");
const auth_1 = require("./auth");
class InstrumentationManager {
    constructor() { }
    static getInstance(context, stateHelper, userData) {
        if (!InstrumentationManager.instance) {
            InstrumentationManager.instance = new InstrumentationManager();
            InstrumentationManager.context = context;
            InstrumentationManager.stateHelper = stateHelper;
            InstrumentationManager.userData = userData;
            setInterval(() => {
                this.processLogs();
            }, constants_1.INSTRUMENTATION_INTERVAL);
        }
        return InstrumentationManager.instance;
    }
    static async processLogs() {
        const logs = InstrumentationManager.logs;
        const userData = InstrumentationManager.stateHelper.getState(constants_1.LOCAL_HASH);
        if (logs && logs.length && userData) {
            InstrumentationManager.logs = [];
            try {
                const response = await axios_1.default.post(constants_1.INSTRUMENTATION_URL, {
                    extension: "vscode",
                    logs,
                    // eslint-disable-next-line @typescript-eslint/naming-convention
                    extension_hash: Buffer.from(JSON.stringify(userData)).toString("base64"),
                });
            }
            catch (error) {
                console.error(error);
                if (axios_1.default.isAxiosError(error) && error.response && error.response.status === 400) {
                    console.error("User data mismatch, logging user out");
                    (0, extension_1.logOut)(InstrumentationManager.stateHelper);
                    (0, auth_1.promptUserSignIn)();
                }
            }
        }
    }
    addEvent(event) {
        event.ts = Date.now();
        InstrumentationManager.logs.push(event);
    }
}
exports.InstrumentationManager = InstrumentationManager;
InstrumentationManager.logs = [];
const addComponentInstrumentationEvent = (component, property, value, reason) => {
    let event = {
        component,
        property,
        value,
        reason,
        instrumentationType: "components",
    };
    InstrumentationManager.getInstance().addEvent(event);
};
exports.addComponentInstrumentationEvent = addComponentInstrumentationEvent;
const addActionInstrumentationEvent = (action, reason) => {
    let event = {
        action: action,
        reason: reason,
        instrumentationType: "actions",
    };
    InstrumentationManager.getInstance().addEvent(event);
};
exports.addActionInstrumentationEvent = addActionInstrumentationEvent;
const addLocalInstrumentationEvent = (state, reason) => {
    let event = {
        state: state,
        reason: reason,
        instrumentationType: "local",
    };
    InstrumentationManager.getInstance().addEvent(event);
};
exports.addLocalInstrumentationEvent = addLocalInstrumentationEvent;
const addStartSessionEvent = (device, os, browser, from, reason) => {
    let event = {
        device: device,
        os: os,
        browser: browser,
        from: from,
        instrumentationType: "session-start",
        reason: reason,
    };
    InstrumentationManager.getInstance().addEvent(event);
};
exports.addStartSessionEvent = addStartSessionEvent;
const userLoginEvent = async (userHash) => {
    try {
        let response = await axios_1.default.post(constants_1.INSTRUMENTATION_URL, {
            extension: "vscode",
            // eslint-disable-next-line @typescript-eslint/naming-convention
            user_login: true,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            extension_hash: userHash,
        });
    }
    catch (error) {
        console.error(error);
    }
};
exports.userLoginEvent = userLoginEvent;
const userClickEvent = async (event) => {
    try {
        await axios_1.default.post(constants_1.INSTRUMENTATION_CLICK_EVENTS_URL, {
            extension: "vscode",
            // eslint-disable-next-line @typescript-eslint/naming-convention
            user_click_event: event,
        });
    }
    catch (error) {
        console.error(error);
    }
};
exports.userClickEvent = userClickEvent;
//# sourceMappingURL=instrumentation.js.map