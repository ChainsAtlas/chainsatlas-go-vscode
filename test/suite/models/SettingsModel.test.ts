import { expect } from "chai";
import { SinonStub, restore, stub } from "sinon";
import { ExtensionContext, Uri } from "vscode";
import { SettingsModel } from "../../../src/models";

suite("SettingsModel", () => {
  let mockContext: ExtensionContext;
  let mockGlobalState: {
    get: SinonStub;
    update: SinonStub;
    setKeysForSync: SinonStub;
  };
  let instance: SettingsModel;

  setup(() => {
    mockGlobalState = {
      get: stub(),
      update: stub(),
      setKeysForSync: stub(),
    };

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
      globalState: mockGlobalState as any,
      secrets: {} as any,
      extension: {} as any,
    };

    instance = new SettingsModel(mockContext);
  });

  teardown(() => {
    restore();
  });

  suite("constructor", () => {
    test("should call setKeysForSync with correct keys", () => {
      expect(mockGlobalState.setKeysForSync).to.have.been.calledOnceWithExactly(
        ["telemetry"],
      );
    });
  });

  suite("telemetry getter", () => {
    test("should retrieve telemetry setting from globalState", () => {
      const mockValue = false;
      mockGlobalState.get.returns(mockValue);

      const telemetryValue = instance.telemetry;

      expect(telemetryValue).to.equal(mockValue);
      expect(mockGlobalState.get).to.have.been.calledOnceWithExactly(
        "telemetry",
        true,
      );
    });
  });

  suite("telemetry setter", () => {
    test("should update telemetry setting in globalState", () => {
      const mockValue = false;

      instance.telemetry = mockValue;

      expect(mockGlobalState.update).to.have.been.calledOnceWithExactly(
        "telemetry",
        mockValue,
      );
    });
  });
});
