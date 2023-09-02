import { expect } from "chai";
import { SinonSandbox, SinonStub, createSandbox, stub } from "sinon";
import { ExtensionContext, Uri, window } from "vscode";
import * as Utils from "../../src/Utils";
import { ChainsAtlasGOClient, CustomViewProvider } from "../../src/lib";
import { ViewType } from "../../src/types";
import "../testSetup";

suite("Utils", () => {
  suite("initClient", () => {
    let sandbox: SinonSandbox;
    let context: ExtensionContext;
    let initStub: SinonStub;

    setup(() => {
      sandbox = createSandbox();

      context = {
        subscriptions: [],
        extensionPath: "",
        storagePath: undefined,
        globalStoragePath: "",
        logPath: "",
        asAbsolutePath: sandbox.stub(),
        storageUri: undefined,
        globalStorageUri: Uri.parse("mock:globalStorageUri"),
        extensionUri: Uri.parse("mock:extensionUri"),
        environmentVariableCollection: {} as any,
        extensionMode: {} as any,
        logUri: Uri.parse("mock:logUri"),
        workspaceState: {} as any,
        globalState: {} as any,
        secrets: {} as any,
        extension: {} as any,
      };

      initStub = sandbox.stub(ChainsAtlasGOClient.prototype, "init");
    });

    teardown(() => {
      sandbox.restore();
    });

    test("should initialize the client and return it", async () => {
      const client = await Utils.initClient(context);
      expect(initStub).to.have.been.calledOnce;
      expect(client).to.be.an.instanceOf(ChainsAtlasGOClient);
    });
  });

  suite("initViewProviders", () => {
    test("should initialize and return view providers for each view type", () => {
      const uri = Uri.parse("mock:extensionUri");
      const viewProviders = Utils.initViewProviders(uri);
      const entries = Object.entries(viewProviders);

      for (const [view, provider] of entries) {
        expect(provider).to.be.an.instanceOf(CustomViewProvider);
        expect(Object.values(ViewType)).to.include(view);
      }
      expect(entries).to.have.length(Object.keys(ViewType).length);
    });
  });

  suite("withErrorHandling", () => {
    let errorMessageStub: SinonStub;

    setup(() => {
      errorMessageStub = stub(window, "showErrorMessage");
    });

    teardown(() => {
      errorMessageStub.restore();
    });

    test("should run the function successfully without error", async () => {
      const func = stub().resolves("success");
      const wrappedFunc = Utils.withErrorHandling(func);

      const result = await wrappedFunc();
      expect(func).to.have.been.calledOnce;
      expect(result).to.equal("success");
      expect(errorMessageStub).to.not.have.been.called;
    });

    test("should handle error and show error message", async () => {
      const error = new Error("test error");
      const func = stub().rejects(error);
      const wrappedFunc = Utils.withErrorHandling(func);

      const result = await wrappedFunc();
      expect(func).to.have.been.calledOnce;
      expect(result).to.be.undefined;
      expect(errorMessageStub).to.have.been.calledOnceWith(error.message);
    });
  });
});