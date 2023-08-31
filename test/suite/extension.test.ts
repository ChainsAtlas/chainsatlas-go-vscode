import { expect } from "chai";
import sinon from "sinon";
import * as vscode from "vscode";
import { activate } from "../../src/extension";
import * as utils from "../../src/utils";

describe("Extension Activation", () => {
  let sandbox: sinon.SinonSandbox;
  let mockContext: vscode.ExtensionContext;

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    mockContext = {
      subscriptions: [],
      extensionPath: "",
      storagePath: undefined,
      globalStoragePath: "",
      logPath: "",
      asAbsolutePath: sandbox.stub(),
      storageUri: undefined,
      globalStorageUri: vscode.Uri.parse("mock:globalStorageUri"),
      extensionUri: vscode.Uri.parse("mock:extensionUri"),
      environmentVariableCollection: {} as any,
      extensionMode: {} as any,
      logUri: vscode.Uri.parse("mock:logUri"),
      workspaceState: {} as any,
      globalState: {} as any,
      secrets: {} as any,
      extension: {} as any,
    };

    // Mock the initializeChainsAtlasGO, setupViewProviders methods and vscode.window object
    sandbox.stub(utils, "initializeChainsAtlasGO");
    sandbox.stub(utils, "setupViewProviders");
    sandbox.stub(vscode.window, "showInformationMessage");
    sandbox.stub(vscode.window, "showErrorMessage");
  });

  afterEach(() => {
    sandbox.restore();
  });

  it("should activate the extension successfully", async () => {
    const mockChainsAtlasGO = {
      addView: sandbox.stub(),
      dispose: sandbox.stub(),
    };
    const mockViewProvider = { register: sandbox.stub(), on: sandbox.stub() };

    (utils.initializeChainsAtlasGO as sinon.SinonStub).resolves(
      mockChainsAtlasGO,
    );
    (utils.setupViewProviders as sinon.SinonStub).returns({
      default: mockViewProvider,
    });

    await activate(mockContext);

    expect(mockViewProvider.register).to.have.been.called;
    expect(mockViewProvider.on).to.have.been.calledWith(
      "viewResolved",
      sinon.match.func,
    );
    expect(vscode.window.showInformationMessage).to.have.been.calledOnce;
    expect(vscode.window.showErrorMessage).to.not.have.been.called;
  });

  it("should handle viewResolved event and call addView", async () => {
    const mockChainsAtlasGO = {
      addView: sandbox.stub(),
      dispose: sandbox.stub(),
    };
    const mockViewProvider = { register: sandbox.stub(), on: sandbox.stub() };

    (utils.initializeChainsAtlasGO as sinon.SinonStub).resolves(
      mockChainsAtlasGO,
    );
    (utils.setupViewProviders as sinon.SinonStub).returns({
      default: mockViewProvider,
    });

    await activate(mockContext);

    const eventCallback = mockViewProvider.on.getCall(0).args[1];
    eventCallback("mockView");

    expect(mockChainsAtlasGO.addView).to.have.been.calledWith("mockView");
  });

  it("should show error message on activation failure", async () => {
    (utils.initializeChainsAtlasGO as sinon.SinonStub).rejects(
      new Error("Initialization failed"),
    );

    await activate(mockContext);

    expect(vscode.window.showErrorMessage).to.have.been.calledWith(
      "Extension activation failed.",
    );
    expect(vscode.window.showInformationMessage).to.not.have.been.called;
  });
});
