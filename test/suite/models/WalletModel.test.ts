// eslint-disable-next-line max-len
import UniversalProvider from "@walletconnect/universal-provider/dist/types/UniversalProvider";
import { expect } from "chai";
import { SinonStub, restore, stub } from "sinon";
import type { ExtensionContext } from "vscode";
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
  let mockWalletConnectProvider: UniversalProvider;
  let walletModel: WalletModel;

  setup(() => {
    mockGlobalState = {
      get: stub().returns([]),
      update: stub(),
    } as unknown as ExtensionContext["globalState"];
    mockWalletConnectProvider = {
      connect: stub(),
      enable: stub(),
      disconnect: stub(),
      abortPairingAttempt: stub(),
      cleanupPendingPairings: stub(),
      session: stub(),
    } as unknown as UniversalProvider;
    walletModel = new WalletModel(mockWalletConnectProvider, mockGlobalState);
  });

  teardown(() => {
    restore();
  });

  suite("constructor", () => {
    test("should initialize 'chains' correctly", () => {
      expect(walletModel.chains).to.deep.equal(Object.values(chains));
      expect(walletModel.chain).to.deep.equal(chains.ethereumSepolia);
      expect(walletModel.connectionStatus).to.be.equal("disconnected");
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
      (mockWalletConnectProvider.enable as SinonStub).resolves(fakeAccounts);

      await walletModel.connect(chains.ethereumSepolia.id);

      expect(walletModel.chain).to.be.equal(chains.ethereumSepolia);
      expect(mockWalletConnectProvider.connect).to.have.been.calledOnce;
      expect(mockWalletConnectProvider.connect).to.have.been.calledWithExactly({
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
      expect(mockWalletConnectProvider.enable).to.have.been.calledOnce;
      expect(walletModel.connectionStatus).to.be.equal("connected");
      expect(walletModel.uri).to.be.undefined;
    });
  });

  suite("disconnect", () => {
    test("should disconnect and reset if session exists", async () => {
      mockWalletConnectProvider = {
        ...mockWalletConnectProvider,
        session: { topic: "mockTopic" },
      } as unknown as UniversalProvider;
      walletModel = new WalletModel(mockWalletConnectProvider, mockGlobalState);

      await walletModel.disconnect();

      expect(mockWalletConnectProvider.abortPairingAttempt).to.have.been
        .calledOnce;
      expect(mockWalletConnectProvider.disconnect).to.have.been.calledOnce;
      expect(mockWalletConnectProvider.cleanupPendingPairings).to.not.have.been
        .called;
      expect(walletModel.account).to.be.undefined;
      expect(walletModel.connectionStatus).to.be.equal("disconnected");
      expect(walletModel.uri).to.be.undefined;
    });

    test("should reset when no session exists", async () => {
      mockWalletConnectProvider = {
        ...mockWalletConnectProvider,
        session: undefined,
      } as unknown as UniversalProvider;
      walletModel = new WalletModel(mockWalletConnectProvider, mockGlobalState);

      await walletModel.disconnect();

      expect(mockWalletConnectProvider.abortPairingAttempt).to.have.been
        .calledOnce;
      expect(mockWalletConnectProvider.disconnect).to.not.have.been.calledOnce;
      expect(mockWalletConnectProvider.cleanupPendingPairings).to.have.been
        .calledOnce;
      expect(walletModel.account).to.be.undefined;
      expect(walletModel.connectionStatus).to.be.equal("disconnected");
    });
  });

  suite("addChain", () => {
    test("should add the new chain correctly", () => {
      const newChain = {
        ...chains.ethereumSepolia,
        name: "ZZZ Ethereum Sepolia ",
      };

      walletModel.addChain(newChain);

      expect(walletModel.chain).to.deep.equal(newChain);
      expect(walletModel.chains[walletModel.chains.length - 1]).to.deep.equal(
        newChain,
      );
      expect(walletModel.chainUpdateStatus).to.be.equal("done");
      expect(walletModel.uri).to.be.undefined;
      expect(mockGlobalState.update).to.have.been.calledOnceWithExactly(
        "chains",
        walletModel.chains,
      );
    });
  });

  suite("editChain", () => {
    test("should update the edited chain correctly", () => {
      const updatedChain = {
        ...chains.ethereumSepolia,
        name: "Ethereum Sepolia Updated ",
      };
      const updatedChainIndex = 7;

      walletModel.editChain(updatedChain, updatedChainIndex);

      expect(walletModel.chain).to.deep.equal(updatedChain);
      expect(walletModel.chains[updatedChainIndex]).to.deep.equal(updatedChain);
      expect(walletModel.chainUpdateStatus).to.be.equal("done");
      expect(walletModel.uri).to.be.undefined;
      expect(mockGlobalState.update).to.have.been.calledOnceWithExactly(
        "chains",
        walletModel.chains,
      );
    });
  });
});
