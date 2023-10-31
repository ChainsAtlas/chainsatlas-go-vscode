// eslint-disable-next-line max-len
import "../../testSetup";

suite("WalletModel", () => {
  // let walletModel: WalletModel;
  // let mockProvider: UniversalProvider;
  // const mockGlobalState: ExtensionContext["globalState"] =
  //   {} as ExtensionContext["globalState"];
  // const defaultChainId = 11155111;
  // setup(() => {
  //   mockProvider = {
  //     connect: stub(),
  //     enable: stub(),
  //     disconnect: stub(),
  //     abortPairingAttempt: stub(),
  //     cleanupPendingPairings: stub(),
  //     session: stub(),
  //   } as unknown as UniversalProvider;
  //   walletModel = new WalletModel(mockProvider, mockGlobalState);
  // });
  // teardown(() => {
  //   restore();
  // });
  // suite("constructor", () => {
  //   test("should initialize 'chains' correctly", () => {
  //     expect(walletModel.chains).to.deep.equal(Object.values(chains));
  //   });
  // });
  // suite("connect", () => {
  //   setup(() => {
  //     stub(walletModel, "disconnect").resolves();
  //   });
  //   test("should throw an error for an invalid chain ID", async () => {
  //     const invalidChainId = 12345;
  //     try {
  //       await walletModel.connect(invalidChainId);
  //       expect.fail(ERROR_MESSAGE.INVALID_CHAIN_ID);
  //     } catch (error) {
  //       expect((error as Error).message).to.equal(
  //         ERROR_MESSAGE.INVALID_CHAIN_ID,
  //       );
  //     }
  //   });
  //  test("should connect and set account information correctly", async () => {
  //     const fakeAccounts = ["0x1234"];
  //     (mockProvider.enable as SinonStub).resolves(fakeAccounts);
  //     const selectedChain = walletModel.chains.find(
  //       (c) => c.id === defaultChainId,
  //     ) as Chain;
  //     expect(selectedChain).to.exist;
  //     await walletModel.connect(selectedChain.id);
  //     expect(mockProvider.connect).to.have.been.calledOnce;
  //     expect(mockProvider.connect).to.have.been.calledWithExactly({
  //       namespaces: {
  //         [selectedChain.namespace]: {
  //           methods:
  //             selectedChain.namespace === ChainNamespace.EIP155
  //               ? EIP155_METHODS
  //               : [],
  //           chains: [
  //             selectedChain.namespace === ChainNamespace.EIP155
  //               ? `${ChainNamespace.EIP155}:${selectedChain.id}`
  //               : selectedChain.id.toString(),
  //           ],
  //           events:
  //             selectedChain.namespace === ChainNamespace.EIP155
  //               ? EIP155_EVENTS
  //               : [],
  //           rpcMap: { [selectedChain.id]: selectedChain.httpRpcUrl },
  //         },
  //       },
  //     });
  //     expect(walletModel.accounts).to.equal(fakeAccounts);
  //     expect(walletModel.chain).to.be.equal(selectedChain);
  //     expect(walletModel.connected).to.be.true;
  //     expect(walletModel.uri).to.be.undefined;
  //     expect(walletModel.currentAccount).to.equal(fakeAccounts[0]);
  //   });
  // });
  // suite("disconnect", () => {
  //   test("should disconnect and reset if session exists", async () => {
  //     mockProvider = {
  //       ...mockProvider,
  //       session: { topic: "mockTopic" },
  //     } as unknown as UniversalProvider;
  //     walletModel = new WalletModel(mockProvider, mockGlobalState);
  //     await walletModel.disconnect();
  //     expect(mockProvider.disconnect).to.have.been.calledOnce;
  //     expect(walletModel.accounts).to.be.undefined;
  //     expect(walletModel.currentAccount).to.be.undefined;
  //     expect(walletModel.connected).to.be.false;
  //   });
  //   test("should reset when no session exists", async () => {
  //     mockProvider = {
  //       ...mockProvider,
  //       session: undefined,
  //     } as unknown as UniversalProvider;
  //     walletModel = new WalletModel(mockProvider, mockGlobalState);
  //     await walletModel.disconnect();
  //     expect(mockProvider.disconnect).to.not.have.been.called;
  //     expect(walletModel.accounts).to.be.undefined;
  //     expect(walletModel.currentAccount).to.be.undefined;
  //     expect(walletModel.connected).to.be.false;
  //   });
  // });
});
