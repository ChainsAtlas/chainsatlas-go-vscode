import UniversalProvider from "@walletconnect/universal-provider/dist/types/UniversalProvider";
import { Disposable, Webview } from "vscode";
import Web3 from "web3";
import { ERROR_MESSAGE } from "../constants";
import { ChainsAtlasGOApi } from "../lib";
import {
  ControllerEvent,
  ViewMessage,
  ViewType,
  WalletCommand,
  WalletControllerModelMap,
} from "../types";
import Controller from "./Controller.abstract";

/**
 * Represents a controller for wallet functionalities.
 */
class WalletController extends Controller {
  // ---------------------- Constructor ----------------------
  /**
   * Initializes a new instance of the `WalletController` class.
   *
   * @param _webview The webview used to communicate with the UI.
   * @param _disposables A collection of disposables to be disposed when the controller is disposed.
   * @param _modelMap The model map containing all the related models for this controller.
   * @param _provider The wallet provider.
   * @param _api The API instance for handling authentication and other operations.
   */
  constructor(
    _webview: Webview,
    _disposables: Disposable[],
    private _modelMap: WalletControllerModelMap,
    private _provider: UniversalProvider,
    private _api: ChainsAtlasGOApi,
  ) {
    super(_webview, _disposables);
    this._provider.on("display_uri", async (uri: string) => {
      this._modelMap.wallet.uri = uri;
      this.emit(ControllerEvent.SYNC, ViewType.WALLET);
    });
  }

  // ---------------------- Protected Method - Message Handler ----------------------
  /**
   * Handles incoming messages from the webview and dispatches them to appropriate handler methods.
   *
   * @param message The incoming message from the webview.
   */
  protected _handler = async (message: ViewMessage): Promise<void> => {
    const { CHANGE_ACCOUNT, CONNECT, DISCONNECT, LOGIN, LOGOUT, READY } =
      WalletCommand;
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
      case LOGIN:
        this._login(value);
        break;
      case LOGOUT:
        this._logout();
        break;
      case READY:
        this.emit(ControllerEvent.SYNC, ViewType.WALLET);
        break;
      default:
        break;
    }
  };

  // ---------------------- Private Methods - Command Handlers ----------------------
  /**
   * Changes the active account to the specified account.
   *
   * @param account The account to be set as the active account.
   * @throws {Error} Throws an error if the provided account is invalid.
   */
  private _changeAccount = (account?: string): void => {
    if (account && this._modelMap.wallet.accounts?.includes(account)) {
      this._modelMap.wallet.currentAccount = account;
      this._modelMap.transactionHistory.currentAccount = account;
      this._modelMap.transactionHistory.clear();
      this.emit(
        ControllerEvent.SYNC,
        ViewType.WALLET,
        ViewType.VIRTUALIZATION_UNIT,
        ViewType.EXECUTOR,
        ViewType.TRANSACTION_HISTORY,
      );
    } else {
      throw new Error(ERROR_MESSAGE.INVALID_ACCOUNT);
    }
  };

  /**
   * Connects the wallet to the specified chain.
   *
   * @param chainId The ID of the chain to connect to.
   * @throws {Error} Throws an error if the provided chainId is invalid.
   */
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
      ControllerEvent.SYNC,
      ViewType.WALLET,
      ViewType.VIRTUALIZATION_UNIT,
      ViewType.EXECUTOR,
      ViewType.TRANSACTION_HISTORY,
    );
  };

  /**
   * Disconnects the wallet from the current chain and clears related data.
   */
  private _disconnect = async (): Promise<void> => {
    await this._modelMap.wallet.disconnect();
    this._modelMap.virtualizationUnit.clearDeployment();
    this._modelMap.virtualizationUnit.contracts = [];
    this._modelMap.virtualizationUnit.currentContract = undefined;
    this._modelMap.transactionHistory.clear();
    this._modelMap.transactionHistory.currentAccount =
      this._modelMap.wallet.currentAccount;
    this.emit(
      ControllerEvent.SYNC,
      ViewType.WALLET,
      ViewType.VIRTUALIZATION_UNIT,
      ViewType.EXECUTOR,
      ViewType.TRANSACTION_HISTORY,
    );
  };

  /**
   * Logs into the API using the provided credentials.
   *
   * @param data The stringified credentials {username: string, password: string}
   * to be used for logging in.
   * @throws {Error} Throws an error if the provided credentials are invalid.
   */
  private _login = async (data?: string): Promise<void> => {
    if (!data) {
      throw new Error(ERROR_MESSAGE.INVALID_CREDENTIALS);
    }

    this._api.authStatus = "authenticating";
    this.emit(ControllerEvent.SYNC, ViewType.WALLET);
    await this._api.authenticate(data);
    this.emit(ControllerEvent.SYNC, ViewType.WALLET);
  };

  /**
   * Logs out from the API and disconnects the wallet.
   */
  private _logout = (): void => {
    this._api.logout();
    this._disconnect();
  };
}

export default WalletController;
