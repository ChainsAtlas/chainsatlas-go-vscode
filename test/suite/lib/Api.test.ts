import { expect } from "chai";
import { SinonStub, restore, stub } from "sinon";
import type { ExtensionContext } from "vscode";
import { SupportedLanguage } from "../../../src/enums";
import { Api } from "../../../src/lib";
import type { BytecodeStructure, ExecutorFile } from "../../../src/types";

suite("Api", () => {
  let instance: Api;
  let fetchStub: SinonStub;
  let mockGlobalState: ExtensionContext["globalState"];
  const mockAuthToken = "mockAuthToken";
  const mockAuthBody = "mockAuthBody";
  const mockNargs = 0;
  const mockBytecode: BytecodeStructure = {
    bytecode: "mockBytecode",
    key: "mockKey",
    nargs: mockNargs,
  };
  const mockExecutorFile: ExecutorFile = {
    path: "mockPath",
    extension: SupportedLanguage.C,
    content: "mockContent",
  };
  const mockGenerateBody = {
    entrypoint_nargs: mockNargs,
    language: mockExecutorFile.extension,
    source_code: mockExecutorFile.content,
  };
  const mockHttpError = "Invalid username and/or password.";

  setup(() => {
    mockGlobalState = {
      get: stub().returns(""),
      update: stub(),
    } as unknown as ExtensionContext["globalState"];
    fetchStub = stub();
    instance = new Api(mockGlobalState, fetchStub);
  });

  teardown(() => {
    restore();
  });

  suite("constructor", () => {
    test("should get auth token from global state", () => {
      expect(instance.authStatus).to.be.undefined;

      mockGlobalState = {
        get: stub().returns("mock"),
        update: stub(),
      } as unknown as ExtensionContext["globalState"];
      instance = new Api(mockGlobalState, fetchStub);

      expect(instance.authStatus).to.equal("authenticated");
    });
  });

  suite("authenticate", () => {
    setup(() => {
      fetchStub.resolves({
        ok: true,
        json: async () => ({ token: mockAuthToken }),
      });
    });

    test("should send POST request correctly", async () => {
      await instance.authenticate(mockAuthBody);

      expect(fetchStub).to.have.been.calledOnceWithExactly(
        `${(Api as any)._URL}/login`,
        {
          method: "POST",
          body: mockAuthBody,
          headers: { "Content-Type": "application/json" },
        },
      );
    });

    test("should update auth status and store token successfully", async () => {
      await instance.authenticate(mockAuthBody);

      expect(instance.authStatus).to.equal("authenticated");

      fetchStub.resolves({
        ok: true,
        json: async () => ({ data: mockBytecode }),
      });

      await instance.generateBytecodeStructure(mockExecutorFile, mockNargs);

      expect(fetchStub.getCall(1).args).to.deep.equal([
        `${(Api as any)._URL}/build/generate`,
        {
          method: "POST",
          body: JSON.stringify(mockGenerateBody),
          headers: {
            "Content-Type": "application/json",
            "x-access-tokens": mockAuthToken,
          },
        },
      ]);
    });

    test("should handle authentication failure", async () => {
      fetchStub.resolves({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
      });

      try {
        await instance.authenticate(mockAuthBody);
        expect.fail(mockHttpError);
      } catch (error) {
        expect((error as Error).message).to.equal(mockHttpError);
        expect(instance.authStatus).to.be.undefined;
      }
    });
  });

  suite("generateBytecodeStructure", () => {
    setup(async () => {
      fetchStub.resolves({
        ok: true,
        json: async () => ({ token: mockAuthToken }),
      });

      await instance.authenticate(mockAuthBody);

      fetchStub.resolves({
        ok: true,
        json: async () => ({ data: mockBytecode }),
      });
    });

    test("should send POST request correctly", async () => {
      await instance.generateBytecodeStructure(mockExecutorFile, mockNargs);

      expect(fetchStub.getCall(1).args).to.deep.equal([
        `${(Api as any)._URL}/build/generate`,
        {
          method: "POST",
          body: JSON.stringify(mockGenerateBody),
          headers: {
            "Content-Type": "application/json",
            "x-access-tokens": mockAuthToken,
          },
        },
      ]);
    });

    test("should generate bytecode structure successfully", async () => {
      const result = await instance.generateBytecodeStructure(
        mockExecutorFile,
        mockNargs,
      );

      expect(result).to.deep.equal(mockBytecode);
    });

    test("should handle bytecode generation failure", async () => {
      fetchStub.resolves({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
      });

      try {
        await instance.generateBytecodeStructure(mockExecutorFile, mockNargs);
        expect.fail(mockHttpError);
      } catch (error) {
        expect((error as Error).message).to.equal(mockHttpError);
      }
    });
  });

  suite("logout", () => {
    test("should logout successfully", async () => {
      fetchStub.resolves({
        ok: true,
        json: async () => ({ token: mockAuthToken }),
      });

      await instance.authenticate(mockAuthBody);

      expect(instance.authStatus).to.equal("authenticated");

      fetchStub.resolves({
        ok: true,
        json: async () => ({ data: mockBytecode }),
      });

      await instance.generateBytecodeStructure(mockExecutorFile, mockNargs);

      expect(fetchStub.getCall(1).args).to.deep.equal([
        `${(Api as any)._URL}/build/generate`,
        {
          method: "POST",
          body: JSON.stringify(mockGenerateBody),
          headers: {
            "Content-Type": "application/json",
            "x-access-tokens": mockAuthToken,
          },
        },
      ]);

      instance.logout();

      expect(instance.authStatus).to.be.undefined;

      await instance.generateBytecodeStructure(mockExecutorFile, mockNargs);

      expect(fetchStub.getCall(2).args).to.deep.equal([
        `${(Api as any)._URL}/build/generate`,
        {
          method: "POST",
          body: JSON.stringify(mockGenerateBody),
          headers: {
            "Content-Type": "application/json",
            "x-access-tokens": "",
          },
        },
      ]);
    });
  });
});
