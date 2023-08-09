import { EventEmitter } from "events";
import vscode from "vscode";
import { ViewType } from "../types/types";

class CustomViewProvider implements vscode.WebviewViewProvider {
  private _disposable?: vscode.Disposable;
  private _eventEmitter = new EventEmitter();
  private _view!: vscode.WebviewView;

  constructor(
    private readonly _extensionUri: vscode.Uri,
    private readonly _viewType: ViewType,
  ) {}

  public dispose(): void {
    this._disposable?.dispose();
  }

  public on(
    event: "viewResolved",
    listener: (view: vscode.WebviewView) => void,
  ): void {
    this._eventEmitter.on(event, listener);
  }

  public register(): void {
    this._disposable = vscode.window.registerWebviewViewProvider(
      this._viewType,
      this,
    );
  }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken,
  ): void {
    this._view = webviewView;

    this._view.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this._extensionUri, "assets"),
        vscode.Uri.joinPath(this._extensionUri, "dist"),
      ],
    };

    this._view.webview.html = this._getHtmlForWebview(this._view);

    this._eventEmitter.emit("viewResolved", this._view);
  }

  private _getHtmlForWebview(view: vscode.WebviewView): string {
    const styleUri = view.webview.asWebviewUri(
      vscode.Uri.joinPath(
        this._extensionUri,
        "assets",
        "style",
        `${this._viewType}.css`,
      ),
    );

    const scriptUri = view.webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "dist", `${this._viewType}.js`),
    );

    const nonce = this._getNonce();

    return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">

				<!--
					Use a content security policy to only allow loading styles from our extension directory,
					and only allow scripts that have a specific nonce.
					(See the 'webview-sample' extension sample for img-src content security policy examples)
				-->
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src * 'unsafe-inline'; script-src 'nonce-${nonce}'; img-src ${view.webview.cspSource}">

				<meta name="viewport" content="width=device-width, initial-scale=1.0">

				<link href="${styleUri}" rel="stylesheet">

				<title>ChainsAtlas GO</title>
			</head>
			<body>
				<div id="root" />
				<script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`;
  }

  private _getNonce(): string {
    let text = "";
    const possible =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (let i = 0; i < 32; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }
}

export default CustomViewProvider;
