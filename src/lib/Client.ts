import UniversalProvider from "@walletconnect/universal-provider";
import EventEmitter from "events";
import { ExtensionContext } from "vscode";
import type Web3 from "web3";
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
 * const provider = await UniversalProvider.init(PROVIDER_OPTIONS);
 * const client = new Client(provider, extensionContext.globalState);
 */
export class Client extends EventEmitter {
  public executor: ExecutorModel;

  public transactionHistory: TransactionHistoryModel;

  public virtualizationUnit: VirtualizationUnitModel;

  public wallet: WalletModel;

  public web3?: Web3;

  constructor(
    public provider: UniversalProvider,
    private readonly _globalState: ExtensionContext["globalState"],
  ) {
    super();

    this.executor = new ExecutorModel();
    this.transactionHistory = new TransactionHistoryModel();
    this.virtualizationUnit = new VirtualizationUnitModel();
    this.wallet = new WalletModel(provider, this._globalState);

    provider.on("display_uri", (uri: string) => {
      this.wallet.uri = uri;
      this.emit("uriChange");
    });
  }

  public async dispose(): Promise<void> {
    this.executor.removeAllListeners();
    this.virtualizationUnit.removeAllListeners();
    this.provider.events.removeAllListeners();
    this.web3?.provider?.disconnect();
    this.removeAllListeners();
  }
}
