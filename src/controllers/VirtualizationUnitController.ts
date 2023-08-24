import { Disposable, Webview } from "vscode";
import { ERROR_MESSAGE } from "../constants";
import { VirtualizationUnitModel } from "../models";
import {
  ViewMessage,
  ViewType,
  VirtualizationUnitCommand,
  VirtualizationUnitControllerModelMap,
} from "../types";
import Controller from "./Controller.abstract";

class VirtualizationUnitController extends Controller {
  // ---------------------- Private Helper Variables ----------------------
  private _gasResolver?: (value: string | PromiseLike<string>) => void;

  // ---------------------- Constructor ----------------------
  constructor(
    _webview: Webview,
    _disposables: Disposable[],
    private _modelMap: VirtualizationUnitControllerModelMap,
  ) {
    super(_webview, _disposables);
  }

  // ---------------------- Protected Method - Message Handler ----------------------
  protected _handler = async (message: ViewMessage): Promise<void> => {
    const { CLEAR_DEPLOYMENT, DEPLOY, READY, SEND, SET_CONTRACT } =
      VirtualizationUnitCommand;
    const { command, value } = message;

    switch (command) {
      case CLEAR_DEPLOYMENT:
        this._clearDeployment();
        break;
      case DEPLOY:
        this._deploy();
        break;
      case READY:
        this.emit("sync", ViewType.VIRTUALIZATION_UNIT);
        break;
      case SEND:
        this._send(value);
        break;
      case SET_CONTRACT:
        this._setContract(value);
        break;
      default:
        break;
    }
  };

  // ---------------------- Private Methods - Command Handlers ----------------------
  private _clearDeployment = (): void => {
    this._modelMap.virtualizationUnit.clearDeployment();
    this.emit("sync", ViewType.VIRTUALIZATION_UNIT);
  };

  private _deploy = async (): Promise<void> => {
    if (!this._modelMap.wallet?.currentAccount) {
      throw new Error(ERROR_MESSAGE.INVALID_ACCOUNT);
    }

    if (!this._modelMap.wallet.web3) {
      throw new Error(ERROR_MESSAGE.INVALID_WEB3);
    }

    this._modelMap.virtualizationUnit.once("gasEstimated", () => {
      this.emit("sync", ViewType.VIRTUALIZATION_UNIT);
      this._getGas();
    });

    const manageSyncEvents = async (
      virtualizationUnit: VirtualizationUnitModel,
    ): Promise<void> => {
      const expectedEvents = 4;

      let eventsReceived = 0;

      const sync = () => {
        this.emit(
          "sync",
          ViewType.WALLET,
          ViewType.VIRTUALIZATION_UNIT,
          ViewType.EXECUTOR,
        );
        eventsReceived++;
        if (eventsReceived === expectedEvents) {
          virtualizationUnit.off("sync", sync);
        }
      };

      virtualizationUnit.on("sync", sync);
    };

    manageSyncEvents(this._modelMap.virtualizationUnit);
    await this._modelMap.virtualizationUnit?.deploy(
      this._modelMap.wallet.currentAccount,
      this._modelMap.wallet.web3,
    );
  };

  private _send = (gas?: string): void => {
    if (!gas) {
      throw new Error(ERROR_MESSAGE.INVALID_GAS);
    }
    this._handleGas(gas);
  };

  private _setContract = (contractAddress?: string): void => {
    if (
      contractAddress &&
      this._modelMap.virtualizationUnit.contracts?.includes(contractAddress)
    ) {
      this._modelMap.virtualizationUnit.currentContract = contractAddress;
      this.emit("sync", ViewType.VIRTUALIZATION_UNIT, ViewType.EXECUTOR);
    } else {
      throw new Error(ERROR_MESSAGE.INVALID_CONTRACT_ADDRESS);
    }
  };

  // ---------------------- Private Methods - Utilities ----------------------
  private _getGas = async (): Promise<void> => {
    const gas = await new Promise((resolve) => (this._gasResolver = resolve));

    this._modelMap.virtualizationUnit.emit("gasReceived", gas);
  };

  private _handleGas = (gas: string): void => {
    if (this._gasResolver) {
      this._gasResolver(gas);
      this._gasResolver = undefined;
    }
  };
}

export default VirtualizationUnitController;
