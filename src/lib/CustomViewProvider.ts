import { EventEmitter } from "events";
import {
  CancellationToken,
  Disposable,
  Uri,
  WebviewView,
  WebviewViewProvider,
  WebviewViewResolveContext,
  window,
} from "vscode";
import { ViewType } from "../types";

class CustomViewProvider extends EventEmitter implements WebviewViewProvider {
  private _disposable?: Disposable;
  private _view!: WebviewView;

  constructor(
    private readonly _extensionUri: Uri,
    private readonly _viewType: ViewType,
  ) {
    super();
  }

  public dispose(): void {
    this._disposable?.dispose();
  }

  public register(): void {
    this._disposable = window.registerWebviewViewProvider(this._viewType, this);
  }

  public resolveWebviewView(
    webviewView: WebviewView,
    _context: WebviewViewResolveContext,
    _token: CancellationToken,
  ): void {
    this._view = webviewView;

    this._view.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        Uri.joinPath(this._extensionUri, "assets"),
        Uri.joinPath(this._extensionUri, "dist"),
      ],
    };

    this._view.webview.html = this._getHtmlForWebview(this._view);

    this.emit("viewResolved", this._view);
  }

  private _getHtmlForWebview(view: WebviewView): string {
    const styleUri = view.webview.asWebviewUri(
      Uri.joinPath(
        this._extensionUri,
        "assets",
        "style",
        `${this._viewType}.css`,
      ),
    );

    const scriptUri = view.webview.asWebviewUri(
      Uri.joinPath(this._extensionUri, "dist", `${this._viewType}.js`),
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
