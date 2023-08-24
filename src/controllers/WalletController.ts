import UniversalProvider from "@walletconnect/universal-provider/dist/types/UniversalProvider";
import { Disposable, Webview } from "vscode";
import Web3 from "web3";
import { ERROR_MESSAGE } from "../constants";
import {
  ViewMessage,
  ViewType,
  WalletCommand,
  WalletControllerModelMap,
} from "../types";
import Controller from "./Controller.abstract";

class WalletController extends Controller {
  // ---------------------- Constructor ----------------------
  constructor(
    _webview: Webview,
    _disposables: Disposable[],
    private _modelMap: WalletControllerModelMap,
    private _provider: UniversalProvider,
  ) {
    super(_webview, _disposables);
    this._provider.on("display_uri", async (uri: string) => {
      this._modelMap.wallet.uri = uri;
      this.emit("sync", ViewType.WALLET);
    });
  }

  // ---------------------- Protected Method - Message Handler ----------------------
  protected _handler = async (message: ViewMessage): Promise<void> => {
    const { CHANGE_ACCOUNT, CONNECT, DISCONNECT, READY } = WalletCommand;
    const { command, value } = message;

    switch (command) {
      case CHANGE_ACCOUNT:
        this._changeAccount(value);
        break;
      case CONNECT:
        this._connect(value);
        break;
      case DISCONNECT:
        this._disconnect();
        break;
      case READY:
        this.emit("sync", ViewType.WALLET);
        break;
      default:
        break;
    }
  };

  // ---------------------- Private Methods - Command Handlers ----------------------
  private _changeAccount = (account?: string): void => {
    if (account && this._modelMap.wallet.accounts?.includes(account)) {
      this._modelMap.wallet.currentAccount = account;
      this._modelMap.transactionHistory.currentAccount = account;
      this._modelMap.transactionHistory.clear();
      this.emit(
        "sync",
        ViewType.WALLET,
        ViewType.VIRTUALIZATION_UNIT,
        ViewType.EXECUTOR,
        ViewType.TRANSACTION_HISTORY,
      );
    } else {
      throw new Error(ERROR_MESSAGE.INVALID_ACCOUNT);
    }
  };

  private _connect = async (chainId?: string): Promise<void> => {
    await this._modelMap.wallet.connect(Number(chainId));
    this._modelMap.wallet.web3 = new Web3(this._provider);
    this._modelMap.virtualizationUnit.clearDeployment();
    this._modelMap.virtualizationUnit.contracts = [];
    this._modelMap.virtualizationUnit.currentContract = undefined;
    this._modelMap.transactionHistory.clear();
    this._modelMap.transactionHistory.currentAccount =
      this._modelMap.wallet.currentAccount;
    this.emit(
      "sync",
      ViewType.WALLET,
      ViewType.VIRTUALIZATION_UNIT,
      ViewType.EXECUTOR,
      ViewType.TRANSACTION_HISTORY,
    );
  };

  private _disconnect = async (): Promise<void> => {
    await this._modelMap.wallet.disconnect();
    this._modelMap.virtualizationUnit.clearDeployment();
    this._modelMap.virtualizationUnit.contracts = [];
    this._modelMap.virtualizationUnit.currentContract = undefined;
    this._modelMap.transactionHistory.clear();
    this._modelMap.transactionHistory.currentAccount =
      this._modelMap.wallet.currentAccount;
    this.emit(
      "sync",
      ViewType.WALLET,
      ViewType.VIRTUALIZATION_UNIT,
      ViewType.EXECUTOR,
      ViewType.TRANSACTION_HISTORY,
    );
  };
}

export default WalletController;