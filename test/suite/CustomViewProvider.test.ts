import { expect } from "chai";
import { EventEmitter } from "events";
import { SinonSandbox, SinonSpy, SinonStub, createSandbox } from "sinon";
import {
  CancellationToken,
  Uri,
  WebviewView,
  WebviewViewResolveContext,
  window,
} from "vscode";
import { CustomViewProvider } from "../../src/lib";
import { ViewType } from "../../src/types";

suite("CustomViewProvider", () => {
  let sandbox: SinonSandbox;
  let instance: CustomViewProvider;

  const mockUri = Uri.parse("mock:extensionUri");
  const mockViewType = ViewType.EXECUTOR;

  setup(() => {
    sandbox = createSandbox();
    sandbox.stub(window, "registerWebviewViewProvider");

    instance = new CustomViewProvider(mockUri, mockViewType);
  });

  teardown(() => {
    sandbox.restore();
  });

  suite("constructor", () => {
    test("should instantiate without errors", () => {
      expect(instance).to.be.an.instanceOf(CustomViewProvider);
      expect(instance).to.be.an.instanceOf(EventEmitter);
    });
  });

  suite("dispose", () => {
    test("should call _disposable.dispose when _disposable is set", () => {
      const mockDisposable = { dispose: sandbox.stub() };

      (instance as any)._disposable = mockDisposable;

      instance.dispose();

      expect(mockDisposable.dispose).to.have.been.calledOnce;
    });

    test("should not throw error when _disposable is not set", () => {
      (instance as any)._disposable = undefined;

      expect(() => {
        instance.dispose();
      }).to.not.throw();
    });
  });

  suite("register", () => {
    let instance: CustomViewProvider;

    setup(() => {
      instance = new CustomViewProvider(mockUri, mockViewType);
    });

    test("should call window.registerWebviewViewProvider with appropriate arguments", () => {
      instance.register();

      expect(window.registerWebviewViewProvider).to.have.been.calledWith(
        mockViewType,
        instance,
      );
    });
  });

  suite("resolveWebviewView", () => {
    let _getNonceStub: SinonStub;
    let emitSpy: SinonSpy;
    let mockAsWebviewUri: SinonStub;
    let mockWebviewView: WebviewView;
    let mockUriMap: { vendors: Uri; style: Uri; view: Uri };
    let mockHtml: string;

    setup(() => {
      const mockNonce = "mockNonce";
      _getNonceStub = sandbox
        .stub(instance as any, "_getNonce")
        .returns(mockNonce);
      emitSpy = sandbox.spy(instance, "emit");
      mockAsWebviewUri = sandbox.stub().returnsArg(0);
      mockWebviewView = {
        webview: {
          asWebviewUri: mockAsWebviewUri,
          cspSource: "mockCspSource",
          html: "",
          options: {},
        },
      } as unknown as WebviewView;
      mockUriMap = {
        vendors: Uri.joinPath(mockUri, "dist", "vendors.js"),
        style: Uri.joinPath(mockUri, "assets", "style", `${mockViewType}.css`),
        view: Uri.joinPath(mockUri, "dist", `${mockViewType}.js`),
      };
      mockHtml = `<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <!--
          Use a content security policy to only allow loading styles from our extension directory,
          and only allow scripts that have a specific nonce.
          (See the 'webview-sample' extension sample for img-src content security policy examples)
        -->
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; font-src ${mockWebviewView.webview.cspSource}; img-src ${mockWebviewView.webview.cspSource}; script-src 'nonce-${mockNonce}'; style-src * 'unsafe-inline'">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="${mockUriMap.style}" rel="stylesheet">        
        <title>ChainsAtlas GO</title>
      </head>
      <body>
        <div id="root"></div>
        <script nonce="${mockNonce}" src="${mockUriMap.vendors}"></script>
        <script nonce="${mockNonce}" src="${mockUriMap.view}" /></script>
      </body>
    </html>`
        .replace(/\s+/g, " ") // To match test mock
        .trim();
    });

    test("should resolve the view and emit it", () => {
      instance.resolveWebviewView(
        mockWebviewView,
        {} as WebviewViewResolveContext,
        {} as CancellationToken,
      );

      const resolvedView = {
        webview: {
          ...mockWebviewView.webview,
          html: mockHtml,
          options: {
            enableScripts: true,
            localResourceRoots: [
              Uri.joinPath(mockUri, "assets"),
              Uri.joinPath(mockUri, "dist"),
            ],
          },
        },
      };

      expect(emitSpy).to.have.been.calledOnceWithExactly(
        "viewResolved",
        resolvedView,
      );
    });
  });
});
