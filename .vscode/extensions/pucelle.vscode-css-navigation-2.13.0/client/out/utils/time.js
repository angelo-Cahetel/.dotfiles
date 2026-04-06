"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTimeMarker = getTimeMarker;
/** Generate current time marker in `h:MM:ss` format. */
function getTimeMarker() {
    let date = new Date();
    return '['
        + String(date.getHours())
        + ':'
        + String(date.getMinutes()).padStart(2, '0')
        + ':'
        + String(date.getSeconds()).padStart(2, '0')
        + '] ';
}
//# sourceMappingURL=time.js.map