import { expect } from "chai";
import { SinonSandbox, SinonStub, createSandbox } from "sinon";
import { ExtensionContext, Uri, window } from "vscode";
import { activate } from "../../src/extension";
import { ChainsAtlasGOClient, CustomViewProvider } from "../../src/lib";
import { ViewType } from "../../src/types";
import * as utils from "../../src/utils";
import "../testSetup";

type ClientStub = { addView: SinonStub<any[], any> };
type ViewProvidersStub = Record<
  ViewType,
  { register: SinonStub<any[], any>; on: SinonStub<any[], any> }
>;

suite("Extension Activation", () => {
  let sandbox: SinonSandbox;
  let mockContext: ExtensionContext;
  let clientStub: ClientStub;
  let viewProvidersStub: ViewProvidersStub;

  setup(() => {
    sandbox = createSandbox();

    mockContext = {
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

    clientStub = { addView: sandbox.stub() };
    viewProvidersStub = Object.values(ViewType).reduce((map, type) => {
      map[type] = { register: sandbox.stub(), on: sandbox.stub() };
      return map;
    }, {} as ViewProvidersStub);

    sandbox
      .stub(utils, "initializeClient")
      .resolves(clientStub as unknown as ChainsAtlasGOClient);
    sandbox
      .stub(utils, "setupViewProviders")
      .returns(
        viewProvidersStub as unknown as Record<ViewType, CustomViewProvider>,
      );
    sandbox.stub(window, "showInformationMessage");
    sandbox.stub(window, "showErrorMessage");
  });

  teardown(() => {
    sandbox.restore();
  });

  test("should initialize ChainsAtlasGO and set up view providers", async () => {
    await activate(mockContext);

    expect(utils.initializeClient).to.have.been.calledOnceWith(mockContext);
    expect(utils.setupViewProviders).to.have.been.calledOnceWith(
      mockContext.extensionUri,
    );
  });

  test("should register view providers and set event listeners", async () => {
    await activate(mockContext);

    Object.values(viewProvidersStub).forEach(
      (provider: ViewProvidersStub[ViewType]) => {
        expect(provider.register).to.have.been.calledOnce;
        expect(provider.on).to.have.been.calledOnceWith(
          "viewResolved",
          sandbox.match.func,
        );
      },
    );
  });

  test("should add views when 'viewResolved' event is fired", async () => {
    await activate(mockContext);

    const views = Object.keys(viewProvidersStub) as ViewType[];

    views.forEach((view) => {
      const eventCallback = viewProvidersStub[view].on.getCall(0).args[1];
      eventCallback(view);
    });

    views.forEach((viewType, index) => {
      expect(clientStub.addView.getCall(index)).to.have.been.calledWith(
        viewType,
      );
    });
    expect(clientStub.addView).to.have.callCount(views.length);
  });

  test("should add providers and ChainsAtlasGO to context subscriptions", async () => {
    await activate(mockContext);

    const providers = Object.values(viewProvidersStub);

    expect(mockContext.subscriptions).to.include(clientStub);
    providers.forEach((provider) => {
      expect(mockContext.subscriptions).to.include(provider);
    });
    expect(mockContext.subscriptions.length).to.be.equal(1 + providers.length);
  });

  test("should show the beta version disclaimer", async () => {
    await activate(mockContext);

    const expectedMessage = `Disclaimer: By using the beta version of ChainsAtlas GO, you acknowledge and 
  understand the potential risks and the unfinished state of the product. While we 
  strive to offer a seamless experience, unexpected issues might occur. We highly 
  recommend not using the beta version for critical tasks and always maintaining 
  backups of your data.`;

    expect(window.showInformationMessage).to.have.been.calledOnceWith(
      expectedMessage,
    );
  });

  test("should handle errors and display an error message", async () => {
    (utils.initializeClient as SinonStub).rejects(new Error("Mocked Error"));

    await activate(mockContext);
    expect(window.showErrorMessage).to.have.been.calledOnceWith(
      "Extension activation failed.",
    );
  });
});
