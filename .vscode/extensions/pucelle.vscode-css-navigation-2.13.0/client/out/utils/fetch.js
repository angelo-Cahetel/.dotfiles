"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchAsText = fetchAsText;
const https = require("node:https");
const http = require("node:http");
const node_url_1 = require("node:url");
const promise_1 = require("./promise");
function fetchAsText(uri) {
    // Node URL protocol has `:` in end.
    let protocol = node_url_1.URL.parse(uri)?.protocol;
    let { promise, resolve, reject } = (0, promise_1.promiseWithResolves)();
    let req = (protocol === 'https:' ? https : http).get(uri, (res) => {
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