import * as path from "path";
import * as vscode from "vscode";

// Create a new webview and set its HTML content.
const createWebview = (context: vscode.ExtensionContext): void => {
  const panel = vscode.window.createWebviewPanel(
    "ChainsAtlasGO",
    "ChainsAtlas GO",
    vscode.ViewColumn.Two,
    {
      enableScripts: true,
      retainContextWhenHidden: true,
      localResourceRoots: [
        vscode.Uri.joinPath(context.extensionUri, "asset"),
        vscode.Uri.file(path.join(context.extensionPath, "dist")),
      ],
    },
  );

  const scriptUri = panel.webview.asWebviewUri(
    vscode.Uri.file(path.join(context.extensionPath, "dist", "app.js")),
  );

  const styleUris = {
    main: panel.webview.asWebviewUri(
      vscode.Uri.joinPath(context.extensionUri, "asset", "style", "main.css"),
    ),
    reset: panel.webview.asWebviewUri(
      vscode.Uri.joinPath(context.extensionUri, "asset", "style", "reset.css"),
    ),
    vscode: panel.webview.asWebviewUri(
      vscode.Uri.joinPath(context.extensionUri, "asset", "style", "vscode.css"),
    ),
  };

  panel.webview.html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="${styleUris.reset}" rel="stylesheet">
        <link href="${styleUris.vscode}" rel="stylesheet">
        <link href="${styleUris.main}" rel="stylesheet">
        <title>ChainsAtlas GO</title>
    </head>
    <body>
        <div id="root" />
        <script src="${scriptUri}"></script>
    </body>
    </html>`;
};

// This method is called when your extension is activated.
const activate = (context: vscode.ExtensionContext): void => {
  const disposable = vscode.commands.registerCommand(
    "chainsatlas-go.activate",
    () => {
      createWebview(context);
    },
  );

  context.subscriptions.push(disposable);
};

export { activate };
