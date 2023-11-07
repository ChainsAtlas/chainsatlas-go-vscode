// eslint-disable-next-line max-len
import UniversalProvider from "@walletconnect/universal-provider/dist/types/UniversalProvider";
import { expect } from "chai";
import { SinonStub, restore, stub } from "sinon";
import { ExtensionContext } from "vscode";
import * as chains from "../../../src/chains";
import {
  EIP155_EVENTS,
  EIP155_METHODS,
  ERROR_MESSAGE,
} from "../../../src/constants";
import { ChainNamespace } from "../../../src/enums";
import { WalletModel } from "../../../src/models";
import "../../testSetup";
suite("WalletModel", () => {
  let mockGlobalState: ExtensionContext["globalState"];
  let mockProvider: UniversalProvider;
  let walletModel: WalletModel;

  setup(() => {
    mockGlobalState = {
      get: stub().returns([]),
    } as unknown as ExtensionContext["globalState"];
    mockProvider = {
      connect: stub(),
      enable: stub(),
      disconnect: stub(),
      abortPairingAttempt: stub(),
      cleanupPendingPairings: stub(),
      session: stub(),
    } as unknown as UniversalProvider;
    walletModel = new WalletModel(mockProvider, mockGlobalState);
  });

  teardown(() => {
    restore();
  });

  suite("constructor", () => {
    test("should initialize 'chains' correctly", () => {
      expect(walletModel.chains).to.deep.equal(Object.values(chains));
    });
  });

  suite("connect", () => {
    setup(() => {
      stub(walletModel, "disconnect").resolves();
    });

    test("should throw an error for an invalid chain ID", async () => {
      const invalidChainId = 12345;

      try {
        await walletModel.connect(invalidChainId);

        expect.fail(ERROR_MESSAGE.INVALID_CHAIN_ID);
      } catch (error) {
        expect((error as Error).message).to.equal(
          ERROR_MESSAGE.INVALID_CHAIN_ID,
        );
      }
    });

    test("should connect to wallet provider correctly", async () => {
      const fakeAccounts = ["0x1234"];
      (mockProvider.enable as SinonStub).resolves(fakeAccounts);

      await walletModel.connect(chains.ethereumSepolia.id);

      expect(mockProvider.connect).to.have.been.calledOnce;
      expect(mockProvider.connect).to.have.been.calledWithExactly({
        namespaces: {
          [chains.ethereumSepolia.namespace]: {
            methods:
              chains.ethereumSepolia.namespace === ChainNamespace.EIP155
                ? EIP155_METHODS
                : [],
            chains: [
              chains.ethereumSepolia.namespace === ChainNamespace.EIP155
                ? `${ChainNamespace.EIP155}:${chains.ethereumSepolia.id}`
                : chains.ethereumSepolia.id.toString(),
            ],
            events:
              chains.ethereumSepolia.namespace === ChainNamespace.EIP155
                ? EIP155_EVENTS
                : [],
            rpcMap: {
              [chains.ethereumSepolia.id]: chains.ethereumSepolia.httpRpcUrl,
            },
          },
        },
      });
      expect(walletModel.chain).to.be.equal(chains.ethereumSepolia);
      expect(walletModel.connected).to.be.true;
      expect(walletModel.uri).to.be.undefined;
    });
  });

  suite("disconnect", () => {
    test("should disconnect and reset if session exists", async () => {
      mockProvider = {
        ...mockProvider,
        session: { topic: "mockTopic" },
      } as unknown as UniversalProvider;
      walletModel = new WalletModel(mockProvider, mockGlobalState);

      await walletModel.disconnect();

      expect(mockProvider.disconnect).to.have.been.calledOnce;
      expect(walletModel.account).to.be.undefined;
      expect(walletModel.connected).to.be.false;
    });

    test("should reset when no session exists", async () => {
      mockProvider = {
        ...mockProvider,
        session: undefined,
      } as unknown as UniversalProvider;
      walletModel = new WalletModel(mockProvider, mockGlobalState);

      await walletModel.disconnect();

      expect(mockProvider.disconnect).to.not.have.been.called;
      expect(walletModel.account).to.be.undefined;
      expect(walletModel.connected).to.be.false;
    });
  });
});
