"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.promptFreeUserPricingPage = exports.promptUserSignIn = void 0;
const vscode = require("vscode");
const constants_1 = require("./constants");
const promptUserSignIn = (authDomain = constants_1.BASE_DOMAIN) => {
    vscode.env.openExternal(vscode.Uri.parse(`${authDomain}/extensions/vscode?utm_source=chrome&utm_medium=extension&utm_campaign=vscode`));
};
exports.promptUserSignIn = promptUserSignIn;
const promptFreeUserPricingPage = () => {
    vscode.env.openExternal(vscode.Uri.parse(constants_1.PRICING_PAGE_URL));
};
exports.promptFreeUserPricingPage = promptFreeUserPricingPage;
//# sourceMappingURL=auth.js.map