"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startTestingWalkthroughHandler = exports.signInWalkThroughHandler = void 0;
const vscode = require("vscode");
const auth_1 = require("./auth");
const instrumentation_1 = require("./instrumentation");
const constants_1 = require("./constants");
const signInWalkThroughHandler = () => {
    (0, auth_1.promptUserSignIn)();
    (0, instrumentation_1.userClickEvent)("sign-in");
    (0, instrumentation_1.addActionInstrumentationEvent)(constants_1.WALKTHROUGH.signIn);
};
exports.signInWalkThroughHandler = signInWalkThroughHandler;
const startTestingWalkthroughHandler = (element) => {
    try {
        vscode.commands.executeCommand("workbench.view.extension.browserstack-view-container");
        (0, instrumentation_1.addActionInstrumentationEvent)(constants_1.WALKTHROUGH.startTesting);
    }
    catch (error) {
        (0, instrumentation_1.addActionInstrumentationEvent)(constants_1.WALKTHROUGH.startTesting, error.message);
    }
};
exports.startTestingWalkthroughHandler = startTestingWalkthroughHandler;
//# sourceMappingURL=walkthrough.js.map