import { expect } from "chai";
import { restore, stub } from "sinon";
import { ExtensionContext, Uri } from "vscode";
import { activate } from "../../src/extension";
import * as Utils from "../../src/utils";
import "../testSetup";

suite("Extension", () => {
  let mockContext: ExtensionContext;

  setup(() => {
    mockContext = {
      subscriptions: [],
      extensionPath: "",
      storagePath: undefined,
      globalStoragePath: "",
      logPath: "",
      asAbsolutePath: stub(),
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
  });

  teardown(() => {
    restore();
  });

  test("should call withErrorHandling", async () => {
    const withErrorHandlingStub = stub(Utils, "withErrorHandling").returns(
      (() => {}) as unknown as (...args: any[]) => Promise<any>,
    );

    await activate(mockContext);

    expect(withErrorHandlingStub).to.have.been.calledOnce;
  });
});
