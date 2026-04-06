const vscode = acquireVsCodeApi();
const signIn = () => {
  vscode.postMessage({ type: "request", value: "signIn" });
};
