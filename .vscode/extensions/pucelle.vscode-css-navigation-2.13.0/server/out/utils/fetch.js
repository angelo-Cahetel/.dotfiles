"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchAsText = fetchAsText;
const https = require("node:https");
const http = require("node:http");
const vscode_uri_1 = require("vscode-uri");
const promise_1 = require("./promise");
function fetchAsText(url) {
    let protocol = vscode_uri_1.URI.parse(url).scheme;
    let { promise, resolve, reject } = (0, promise_1.promiseWithResolves)();
    let req = (protocol === 'https' ? https : http).get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => {
            data += chunk;
        });
        res.on('end', () => {
            resolve(data);
        });
    });
    req.on('error', (error) => {
        reject(error);
    });
    return promise;
}
//# sourceMappingURL=fetch.js.map