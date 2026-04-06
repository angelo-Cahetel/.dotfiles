const vscode = acquireVsCodeApi();
const showPrices = () => {
  vscode.postMessage({ type: "request", value: "showPrices" });
};
