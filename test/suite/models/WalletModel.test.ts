// eslint-disable-next-line max-len
import UniversalProvider from "@walletconnect/universal-provider/dist/types/UniversalProvider";
import { expect } from "chai";
import { SinonStub, restore, stub } from "sinon";
import * as chains from "../../../src/chains";
import {
  EIP155_EVENTS,
  EIP155_METHODS,
  ERROR_MESSAGE,
} from "../../../src/constants";
import { ChainNamespace } from "../../../src/enums";
import { WalletModel } from "../../../src/models/WalletModel";
import type { ValidChain } from "../../../src/types";
import "../../testSetup";

suite("WalletModel", () => {
  let walletModel: WalletModel;
  let mockProvider: UniversalProvider;
  const defaultChainId = 11155111;

  setup(() => {
    mockProvider = {
      connect: stub(),
      enable: stub(),
      disconnect: stub(),
      abortPairingAttempt: stub(),
      cleanupPendingPairings: stub(),
      session: stub(),
    } as unknown as UniversalProvider;

    walletModel = new WalletModel(mockProvider);
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

    test("should throw an error for an invalid chain RPC", async () => {
      try {
        await walletModel.connect(defaultChainId);
        expect.fail(ERROR_MESSAGE.INVALID_CHAIN_ID);
      } catch (error) {
        expect((error as Error).message).to.equal(
          ERROR_MESSAGE.INVALID_CHAIN_RPC,
        );
      }
    });

    test("should connect and set account information correctly", async () => {
      const fakeAccounts = ["0x1234"];
      (mockProvider.enable as SinonStub).resolves(fakeAccounts);

      walletModel.chains = walletModel.chains.map((chain) =>
        chain.id === defaultChainId
          ? { ...chain, httpRpcUrl: "https://ethereum-sepolia.publicnode.com" }
          : chain,
      );

      const selectedChain = walletModel.chains.find(
        (c) => c.id === defaultChainId,
      ) as ValidChain;

      expect(selectedChain).to.exist;

      await walletModel.connect(selectedChain.id);

      expect(mockProvider.connect).to.have.been.calledOnce;
      expect(mockProvider.connect).to.have.been.calledWithExactly({
        namespaces: {
          [selectedChain.namespace]: {
            methods:
              selectedChain.namespace === ChainNamespace.EIP155
                ? EIP155_METHODS
                : [],
            chains: [
              selectedChain.namespace === ChainNamespace.EIP155
                ? `${ChainNamespace.EIP155}:${selectedChain.id}`
                : selectedChain.id.toString(),
            ],
            events:
              selectedChain.namespace === ChainNamespace.EIP155
                ? EIP155_EVENTS
                : [],
            rpcMap: { [selectedChain.id]: selectedChain.httpRpcUrl },
          },
        },
      });
      expect(walletModel.accounts).to.equal(fakeAccounts);
      expect(walletModel.chain).to.be.equal(selectedChain);
      expect(walletModel.connected).to.be.true;
      expect(walletModel.uri).to.be.undefined;
      expect(walletModel.currentAccount).to.equal(fakeAccounts[0]);
    });
  });

  suite("disconnect", () => {
    test("should disconnect and reset if session exists", async () => {
      mockProvider = {
        ...mockProvider,
        session: { topic: "mockTopic" },
      } as unknown as UniversalProvider;
      walletModel = new WalletModel(mockProvider);

      await walletModel.disconnect();

      expect(mockProvider.disconnect).to.have.been.calledOnce;
      expect(walletModel.accounts).to.be.undefined;
      expect(walletModel.currentAccount).to.be.undefined;
      expect(walletModel.connected).to.be.false;
    });

    test("should reset when no session exists", async () => {
      mockProvider = {
        ...mockProvider,
        session: undefined,
      } as unknown as UniversalProvider;
      walletModel = new WalletModel(mockProvider);

      await walletModel.disconnect();

      expect(mockProvider.disconnect).to.not.have.been.called;
      expect(walletModel.accounts).to.be.undefined;
      expect(walletModel.currentAccount).to.be.undefined;
      expect(walletModel.connected).to.be.false;
    });
  });
});
