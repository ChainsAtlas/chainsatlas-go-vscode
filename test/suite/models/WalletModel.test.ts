import UniversalProvider from "@walletconnect/universal-provider/dist/types/UniversalProvider";
import { expect } from "chai";
import { SinonStub, restore, stub } from "sinon";
import * as chains from "../../../src/chains";
import {
  EIP155_EVENTS,
  EIP155_METHODS,
  ERROR_MESSAGE,
} from "../../../src/constants";
import { WalletModel } from "../../../src/models/WalletModel";
import { Chain, ChainNamespace } from "../../../src/types";
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
    test("should initialize with the correct chains list and default selected chain", () => {
      expect(walletModel.chains).to.deep.equal(Object.values(chains));
      expect(walletModel.chain).to.deep.equal(
        Object.values(chains).find((chain) => chain.id === defaultChainId),
      );
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

    test("should connect to a valid chain ID and set account information correctly", async () => {
      const validChain = Object.values(chains).find(
        (c) => c.id === defaultChainId,
      ) as Chain;
      const fakeAccounts = ["0x1234"];
      (mockProvider.enable as SinonStub).resolves(fakeAccounts);

      expect(validChain).to.exist;

      await walletModel.connect(validChain.id);

      expect(walletModel.disconnect).to.have.been.calledOnce;
      expect(mockProvider.connect).to.have.been.calledOnce;
      expect(mockProvider.connect).to.have.been.calledWithExactly({
        namespaces: {
          [validChain.namespace]: {
            methods:
              validChain.namespace === ChainNamespace.EIP155
                ? EIP155_METHODS
                : [],
            chains: [
              validChain.namespace === ChainNamespace.EIP155
                ? `${ChainNamespace.EIP155}:${validChain.id}`
                : validChain.id.toString(),
            ],
            events:
              validChain.namespace === ChainNamespace.EIP155
                ? EIP155_EVENTS
                : [],
            rpcMap: { [validChain.id]: validChain.httpRpcUrl },
          },
        },
      });
      expect(walletModel.accounts).to.equal(fakeAccounts);
      expect(walletModel.chain).to.be.equal(validChain);
      expect(walletModel.connected).to.be.true;
      expect(walletModel.uri).to.be.undefined;
      expect(walletModel.currentAccount).to.equal(fakeAccounts[0]);
    });
  });

  suite("disconnect", () => {
    test("should disconnect and reset the state correctly when a session exists", async () => {
      mockProvider = {
        ...mockProvider,
        session: true,
      } as unknown as UniversalProvider;
      walletModel = new WalletModel(mockProvider);

      await walletModel.disconnect();

      expect(mockProvider.disconnect).to.have.been.calledOnce;
      expect(walletModel.accounts).to.be.undefined;
      expect(walletModel.currentAccount).to.be.undefined;
      expect(walletModel.connected).to.be.false;
    });

    test("should reset the state correctly when no session exists", async () => {
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
