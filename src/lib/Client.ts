import UniversalProvider from "@walletconnect/universal-provider";
import EventEmitter from "events";
import { ExtensionContext } from "vscode";
import Web3 from "web3";
import {
  ExecutorModel,
  SettingsModel,
  TransactionHistoryModel,
  VirtualizationUnitModel,
  WalletModel,
} from "../models";

/**
 * `ChainsAtlasGO` is the primary class for the ChainsAtlas GO VS Code extension.
 *
 * This class manages the core functionalities of the extension, including:
 * - Models: Represents the application's state and logic for different components like the executor, transaction history, virtualization units, and the user's wallet.
 * - Controllers: Provides the logic to interact with the corresponding models, facilitating operations and user interactions.
 * - Views: Manages different views within the extension, including rendering and handling interactions.
 * - Provider: Facilitates blockchain interactions, transactions, and other related operations using the UniversalProvider.
 * - ViewStateGenerator: Utility for generating the state of views based on model data.
 *
 * The class also provides methods to initialize the components, add views, dispose of resources, and synchronize views. The constructor takes an extension context as its only argument, ensuring that the instance has the necessary context to operate within the VS Code environment.
 *
 * @class
 *
 * @example
 * const client = new ChainsAtlasGOClient(extensionContext);
 * await client.init();
 * client.addView(someView);
 */
export class Client extends EventEmitter {
  public executor: ExecutorModel;

  public settings: SettingsModel;

  public transactionHistory: TransactionHistoryModel;

  public virtualizationUnit: VirtualizationUnitModel;

  public wallet: WalletModel;

  public web3?: Web3;

  constructor(
    context: ExtensionContext,
    public provider: UniversalProvider,
  ) {
    super();

    this.executor = new ExecutorModel();
    this.settings = new SettingsModel(context);
    this.transactionHistory = new TransactionHistoryModel();
    this.virtualizationUnit = new VirtualizationUnitModel();
    this.wallet = new WalletModel(provider);

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
