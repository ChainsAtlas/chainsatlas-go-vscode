import UniversalProvider from "@walletconnect/universal-provider";
import { BrowserProvider } from "ethers";
import EventEmitter from "events";
import { ExtensionContext } from "vscode";
// import type {Web3} from 'web3'
import {
  ExecutorModel,
  TransactionHistoryModel,
  VirtualizationUnitModel,
  WalletModel,
} from "../models";
/**
 * `Client` is the high order class that initializes all models and disposes
 * of them correctly on deactivation.
 *
 * @class
 *
 * @example
 * const walletConnectProvider = await UniversalProvider.init(PROVIDER_OPTIONS);
 * const client = new Client(walletConnectProvider, context.globalState);
 */
export class Client extends EventEmitter {
  public executor: ExecutorModel;

  public transactionHistory: TransactionHistoryModel;

  public virtualizationUnit: VirtualizationUnitModel;

  public wallet: WalletModel;

  public provider?: BrowserProvider;

  constructor(
    public walletConnectProvider: UniversalProvider,
    private readonly _globalState: ExtensionContext["globalState"],
  ) {
    super();

    this.executor = new ExecutorModel();
    this.transactionHistory = new TransactionHistoryModel();
    this.virtualizationUnit = new VirtualizationUnitModel();
    this.wallet = new WalletModel(walletConnectProvider, this._globalState);

    walletConnectProvider.on("display_uri", (uri: string) => {
      this.wallet.uri = uri;
      this.emit("uriChange");
    });
  }

  public async dispose(): Promise<void> {
    this.executor.removeAllListeners();
    this.virtualizationUnit.removeAllListeners();
    this.walletConnectProvider.events.removeAllListeners();
    this.removeAllListeners();
    this.provider?.destroy();
  }
}
