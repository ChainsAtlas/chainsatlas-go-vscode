import dotenv from "dotenv";

dotenv.config();

import fs from "fs";
import path from "path";
import vscode from "vscode";

const activate = (context: vscode.ExtensionContext) => {
  let disposable = vscode.commands.registerCommand(
    "chainsatlas-go.helloWorld",
    () => {
      const panel = vscode.window.createWebviewPanel(
        "chainsAtlasGO",
        "ChainsAtlas GO",
        vscode.ViewColumn.One,
        { enableScripts: true },
      );

      panel.webview.html = getWebviewContent(context);
    },
  );

  context.subscriptions.push(disposable);
};

const getWebviewContent = (context: vscode.ExtensionContext): string => {
  const templatePath = path.join(context.extensionPath, "src", "webview2.html");

  return fs.readFileSync(templatePath, "utf8");
};

const deactivate = () => {};

export { activate, deactivate };
