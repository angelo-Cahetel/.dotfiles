"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.promiseWithResolves = promiseWithResolves;
/** Returns a promise, with it's resolve and reject. */
function promiseWithResolves() {
    let resolve;
    let reject;
    let promise = new Promise((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return {
        promise,
        resolve: resolve,
        reject: reject,
    };
}
//# sourceMappingURL=promise.js.map