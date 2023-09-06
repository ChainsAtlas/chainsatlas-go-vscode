import { expect } from "chai";
import { SinonStub, stub } from "sinon";
import { window } from "vscode";
import * as Utils from "../../src/utils";
import "../testSetup";

suite("Utils", () => {
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
