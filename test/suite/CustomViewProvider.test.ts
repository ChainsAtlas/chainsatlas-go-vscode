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
import * as Utils from "../../src/Utils";
import { CustomViewProvider } from "../../src/lib";
import { ViewType } from "../../src/types";

suite("CustomViewProvider", () => {
  let sandbox: SinonSandbox;
  let mockUri: Uri;
  let mockWebviewView: WebviewView;
  let mockAsWebviewUri: SinonStub;
  let instance: CustomViewProvider;

  const mockViewType = ViewType.EXECUTOR;

  setup(() => {
    sandbox = createSandbox();
    sandbox.stub(window, "registerWebviewViewProvider");

    mockUri = Uri.parse("mock:extensionUri");
    mockAsWebviewUri = sandbox.stub().returnsArg(0);
    mockWebviewView = {
      webview: {
        asWebviewUri: mockAsWebviewUri,
        cspSource: "mockCspSource",
        html: "",
        options: {},
      },
    } as unknown as WebviewView;
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

  suite("withErrorHandling in public methods", () => {
    let withErrorHandlingStub: SinonStub;

    setup(() => {
      withErrorHandlingStub = sandbox
        .stub(Utils, "withErrorHandling")
        .returns((() => {}) as unknown as (...args: any[]) => Promise<any>);
    });

    test("dispose", () => {
      instance.dispose();

      expect(withErrorHandlingStub).to.have.been.calledOnce;
    });

    test("register", () => {
      instance.register();

      expect(withErrorHandlingStub).to.have.been.calledOnce;
    });

    test("ressolveWebviewView", () => {
      instance.resolveWebviewView(
        { webview: { options: {}, html: "" } } as WebviewView,
        {} as any,
        {} as any,
      );

      expect(withErrorHandlingStub).to.have.been.calledOnce;
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
    let _getHtmlForWebviewStub: SinonStub;
    let emitSpy: SinonSpy;

    const mockHtml = "<!DOCTYPE html></html>";

    setup(() => {
      _getHtmlForWebviewStub = sandbox
        .stub(instance as any, "_getHtmlForWebview")
        .returns(mockHtml);
      emitSpy = sandbox.spy(instance, "emit");
    });

    test("should set _view and emit 'viewResolved'", () => {
      instance.resolveWebviewView(
        mockWebviewView,
        {} as WebviewViewResolveContext,
        {} as CancellationToken,
      );

      const expectedView = {
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

      expect((instance as any)._view).to.deep.equal(expectedView);
      expect(emitSpy).to.have.been.calledOnceWithExactly(
        "viewResolved",
        expectedView,
      );
    });
  });

  suite("_getHtmlForWebview", () => {
    let _getNonceStub: SinonStub;
    const mockNonce = "mockNonce";
    const stripWhitespace = (str: string) => {
      return str.replace(/\s+/g, "");
    };

    setup(() => {
      _getNonceStub = sandbox
        .stub(instance as any, "_getNonce")
        .returns(mockNonce);
    });

    test("should generate the correct HTML for the webview", () => {
      const resultHtml = (instance as any)._getHtmlForWebview(mockWebviewView);
      const mockUriMap = {
        vendors: Uri.joinPath(mockUri, "dist", "vendors.js"),
        style: Uri.joinPath(mockUri, "assets", "style", `${mockViewType}.css`),
        view: Uri.joinPath(mockUri, "dist", `${mockViewType}.js`),
      };

      expect(mockAsWebviewUri).to.have.been.calledThrice;
      expect((instance as any)._getNonce).to.have.been.calledOnce;
      expect(stripWhitespace(resultHtml)).to.be.equal(
        stripWhitespace(`<!DOCTYPE html>
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
        </html>`),
      );
    });
  });

  suite("_getNonce", () => {
    test("should return a string of length 32", () => {
      const nonce = (instance as any)._getNonce();
      expect(nonce).to.have.lengthOf(32);
    });

    test("should only contain characters from the defined set", () => {
      const nonce = (instance as any)._getNonce();
      const possible =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

      for (let char of nonce) {
        expect(possible).to.include(char);
      }
    });

    test("should likely return unique values on subsequent calls", () => {
      const nonces = new Set();

      // Generate a number of nonces and store them in a Set (which only stores unique values)
      for (let i = 0; i < 1000; i++) {
        nonces.add((instance as any)._getNonce());
      }

      // The likelihood of two nonces being the same in 1000 iterations should be very low,
      // so the size of the Set (number of unique nonces) should be close to 1000.
      expect(nonces.size).to.be.closeTo(1000, 5); // allowing a difference of 5 just in case
    });

    test("should not throw any exceptions", () => {
      expect(() => (instance as any)._getNonce()).to.not.throw();
    });
  });
});
