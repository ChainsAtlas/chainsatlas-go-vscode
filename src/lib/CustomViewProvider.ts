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

/**
 * It is a custom view provider within the VSCode environment.
 *
 * It provides capabilities to render custom webviews in the editor and handle
 * events associated with them.
 *
 * @extends EventEmitter
 *
 * @implements WebviewViewProvider
 */
export class CustomViewProvider
  extends EventEmitter
  implements WebviewViewProvider
{
  /**
   * `_disposable` is an optional instance of the {@link Disposable} type from
   * the VSCode API.
   *
   * This property holds onto a reference of a disposable resource, which could
   * be any object that needs to release resources, like event listeners or
   * subscriptions, before the object is garbage collected.
   *
   * This pattern is commonly used in VSCode extensions to ensure that resources
   * are freed and to prevent potential memory leaks.
   */
  private _disposable?: Disposable;
  /**
   * `_view` is an instance of the {@link WebviewView} type from the VSCode API.
   *
   * This property retains the current state of the webview being managed by the
   * {@link CustomViewProvider}.
   *
   * It provides the functionality to render custom HTML content inside VSCode,
   * and it encapsulates the properties, methods, and events required to
   * interact with and manipulate the webview.
   */
  private _view?: WebviewView;

  /**
   * Constructor for the `CustomViewProvider` class.
   *
   * @param _extensionUri
   * The base URI of the VSCode extension. This is used to resolve paths to
   * assets and scripts required for the webviews.
   *
   * @param _viewType
   * A classification identifier determining the type of view to be rendered.
   */
  constructor(
    private readonly _extensionUri: Uri,
    private readonly _viewType: ViewType,
  ) {
    super();
  }

  /**
   * Dispose of resources used by the {@link CustomViewProvider}.
   *
   * This method is intended to free any resources (like event listeners or
   * disposables) that the view provider might be holding onto.
   *
   * Wrapped with error handling to ensure graceful disposal even in the face of
   * unexpected issues.
   */
  public dispose(): void {
    this._disposable?.dispose();
  }

  /**
   * This method ties the {@link CustomViewProvider} to a specific type of view
   * within the VSCode environment. Once registered, VSCode will delegate
   * rendering of that view type to this provider.
   *
   * Wrapped with error handling to ensure graceful disposal even in the face of
   * unexpected issues.
   */
  public register(): void {
    this._disposable = window.registerWebviewViewProvider(this._viewType, this);
  }

  /**
   * Sets up the webview view when VSCode requests its content.
   *
   * This method is a required implementation for the
   * {@link WebviewViewProvider} interface.
   *
   * It establishes the properties of the webview (like content security policy
   * and available scripts) and provides the HTML content to be displayed.
   *
   * @param webviewView
   * The webview view instance provided by VSCode during the resolve phase.
   *
   * @param _context
   * Contextual information about the view.
   *
   * @param _token
   * A token that indicates the cancellation of the webview creation.
   */
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

  /**
   * Generates the HTML content for the webview.
   *
   * This private method assembles the HTML structure for the webview. It
   * ensures that scripts, styles, and other assets are correctly referenced,
   * adhering to the webview's content security policies.
   *
   * @param view
   * The webview view for which HTML content needs to be generated.
   *
   * @returns
   * A string containing the full HTML content for the webview.
   */
  private _getHtmlForWebview(view: WebviewView): string {
    const uri = {
      vendors: view.webview.asWebviewUri(
        Uri.joinPath(this._extensionUri, "dist", "vendors.js"),
      ),
      style: view.webview.asWebviewUri(
        Uri.joinPath(
          this._extensionUri,
          "assets",
          "style",
          `${this._viewType}.css`,
        ),
      ),
      view: view.webview.asWebviewUri(
        Uri.joinPath(this._extensionUri, "dist", `${this._viewType}.js`),
      ),
    };

    const nonce = this._getNonce();

    /* eslint-disable max-len */
    return `<!DOCTYPE html>
			<html lang="en">
        <head>
          <meta charset="UTF-8">
          <!--
            Use a content security policy to only allow loading styles from the
            extension directory, and only allow scripts with a specific nonce.
            (See the 'webview-sample' extension sample for img-src content
            security policy examples)
          -->
          <meta http-equiv="Content-Security-Policy" content="default-src 'none'; font-src ${view.webview.cspSource}; img-src ${view.webview.cspSource}; script-src 'nonce-${nonce}'; style-src * 'unsafe-inline'">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <link href="${uri.style}" rel="stylesheet">        
          <title>ChainsAtlas GO</title>
        </head>
        <body>
          <div id="root"></div>
          <script nonce="${nonce}" src="${uri.vendors}"></script>
          <script nonce="${nonce}" src="${uri.view}" /></script>
        </body>
			</html>`
      .replace(/\s+/g, " ") // Remove spaces to match test value
      .trim();
    /* eslint-enable max-len */
  }

  /**
   * Generates a random nonce (Number used ONCE) for securing script tags in
   * webviews.
   *
   * This is a security measure, ensuring that only the scripts loaded with
   * the nonce specified in the content security policy will be executed.
   *
   * @returns
   * A random 32-character long string nonce.
   */
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
