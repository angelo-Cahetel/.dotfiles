"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stopLocalBinary = exports.startLocalBinary = void 0;
const constants_1 = require("./constants");
const vscode = require("vscode");
const instrumentation_1 = require("./instrumentation");
var childProcess = require('child_process');
const detect = require("detect-port");
const browserstack = require("browserstack-local");
const bsLocal = new browserstack.Local();
let checkInterval;
let retryInterval;
let timeout = 20;
let retryCount = 3;
const detectLocalBinary = async () => {
    let isBinaryRunning = "false";
    if (process.platform === "win32") {
        isBinaryRunning = await childProcess.execSync("tasklist /FI \"IMAGENAME eq BrowserStackLocal*\" | findstr /I \"BrowserStackLocal*\" > nul && echo true || echo false").toString().trim();
    }
    else {
        isBinaryRunning = await childProcess.execSync('pgrep BrowserStackLocal > /dev/null && echo true || echo false').toString().trim();
    }
    return (isBinaryRunning == "true");
};
const KillLocalBinary = async () => {
    let isBinaryRunning = await detectLocalBinary();
    if (isBinaryRunning) {
        if (process.platform === "win32") {
            await childProcess.execSync("taskkill /F /IM BrowserStackLocal*");
        }
        else {
            await childProcess.execSync("pkill -f BrowserStackLocal");
        }
    }
};
const clearIntervals = () => {
    if (checkInterval !== null) {
        clearInterval(checkInterval);
        checkInterval = null;
    }
    if (retryInterval !== null) {
        clearInterval(retryInterval);
        retryInterval = null;
    }
};
const bsLocalStartCallback = async () => {
    if (timeout === 0)
        return;
    checkInterval = setInterval(async () => {
        let islocalBinaryRunning = await detectLocalBinary();
        if (bsLocal.isRunning() || islocalBinaryRunning) {
            console.log(`[${retryCount}] Local binary running`);
            clearIntervals();
            startBinarySuccess();
            return;
        }
        else {
            timeout--;
        }
        if (timeout === 0) {
            clearIntervals();
        }
    }, 1000);
};
const spawnLocalbinary = async (localKey) => {
    let islocalBinaryRunning = await detectLocalBinary();
    if (retryCount === 0) {
        console.log(`Local binary failed to start`);
        timeout = 0;
        clearIntervals();
        startBinaryFailure(constants_1.TIMEOUT);
        return;
    }
    else {
        retryCount--;
    }
    if (islocalBinaryRunning) {
        console.log(`[${retryCount}] Local binary running`);
        clearIntervals();
        startBinarySuccess();
        return;
    }
    bsLocal.start({ key: localKey }, async () => {
        await bsLocalStartCallback();
    });
};
const startLocalBinary = async (localKey) => {
    let port = 45691;
    // for killing any existing binary instance
    if (bsLocal.isRunning()) {
        (0, exports.stopLocalBinary)();
    }
    else {
        try {
            await KillLocalBinary();
        }
        catch (error) {
            (0, instrumentation_1.addLocalInstrumentationEvent)(constants_1.LOCAL_STATES.failure, "Binary termination failed via childProcess for platform: " + process.platform + " and error: " + error.message);
        }
    }
    detect(port)
        .then((_port) => {
        if (port !== _port) {
            return startBinaryFailure(constants_1.PORT_OCCUPIED);
        }
    })
        .catch((err) => {
        console.log(err);
        return startBinaryFailure(constants_1.LOCAL_BINARY_PORT_EXCEPTION, err.message);
    });
    retryInterval = setInterval(async () => {
        if (checkInterval !== null) {
            clearInterval(checkInterval);
            checkInterval = null;
        }
        timeout = 20;
        spawnLocalbinary(localKey);
    }, 25000);
};
exports.startLocalBinary = startLocalBinary;
const stopLocalBinary = () => {
    return new Promise((resolve, reject) => {
        try {
            if (!bsLocal.isRunning()) {
                resolve(true);
            }
            else {
                bsLocal.stop(() => {
                    resolve(true);
                });
                KillLocalBinary();
            }
        }
        catch (error) {
            (0, instrumentation_1.addLocalInstrumentationEvent)(constants_1.LOCAL_STATES.failure, error.message);
            reject(error);
        }
    });
};
exports.stopLocalBinary = stopLocalBinary;
const startBinarySuccess = () => {
    (0, instrumentation_1.addLocalInstrumentationEvent)(constants_1.LOCAL_STATES.success);
};
const startBinaryFailure = (reason, message) => {
    switch (reason) {
        case constants_1.PORT_OCCUPIED:
            (0, instrumentation_1.addLocalInstrumentationEvent)(constants_1.LOCAL_STATES.usingUserLocalSetup, constants_1.PORT_OCCUPIED);
            break;
        case constants_1.TIMEOUT:
            (0, instrumentation_1.addLocalInstrumentationEvent)(constants_1.LOCAL_STATES.failure, constants_1.TIMEOUT);
            vscode.window.showInformationMessage(constants_1.STRING_CONSTANTS.localBinaryConnectionFailure);
            break;
        case constants_1.LOCAL_BINARY_PORT_EXCEPTION:
            (0, instrumentation_1.addLocalInstrumentationEvent)(constants_1.LOCAL_STATES.failure, message);
            vscode.window.showInformationMessage(constants_1.STRING_CONSTANTS.localBinaryConnectionFailure);
            break;
    }
};
//# sourceMappingURL=localApp.js.map