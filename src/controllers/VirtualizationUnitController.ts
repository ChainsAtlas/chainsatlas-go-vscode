import { Disposable, Webview } from "vscode";
import { ERROR_MESSAGE } from "../constants";
import { VirtualizationUnitModel } from "../models";
import {
  ControllerEvent,
  ViewMessage,
  ViewType,
  VirtualizationUnitCommand,
  VirtualizationUnitControllerModelMap,
  VirtualizationUnitModelEvent,
} from "../types";
import Controller from "./Controller.abstract";

/**
 * The VirtualizationUnitController class manages interactions and commands related to the virtualization unit view.
 * It extends the abstract Controller class and handles specific messages for the virtualization unit.
 */
class VirtualizationUnitController extends Controller {
  // ---------------------- Private Helper Variables ----------------------
  /**
   * A helper variable to manage gas-related promises.
   */
  private _gasResolver?: (value: string | PromiseLike<string>) => void;

  // ---------------------- Constructor ----------------------
  /**
   * Constructor initializes the webview, disposable resources, and the model map for the virtualization unit.
   *
   * @param _webview - The webview interface for interacting with the view.
   * @param _disposables - Array of resources to be disposed when no longer needed.
   * @param _modelMap - A map of models related to the virtualization unit.
   */
  constructor(
    _webview: Webview,
    _disposables: Disposable[],
    private _modelMap: VirtualizationUnitControllerModelMap,
  ) {
    super(_webview, _disposables);
  }

  // ---------------------- Protected Method - Message Handler ----------------------
  /**
   * Message handler for the virtualization unit view.
   * It processes commands like CLEAR_DEPLOYMENT, DEPLOY, READY, SEND, and SET_CONTRACT.
   *
   * @param message - The message received from the view.
   */
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
        this.emit(ControllerEvent.SYNC, ViewType.VIRTUALIZATION_UNIT);
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
  /**
   * Clears the current deployment data.
   */
  private _clearDeployment = (): void => {
    this._modelMap.virtualizationUnit.clearDeployment();
    this.emit(ControllerEvent.SYNC, ViewType.VIRTUALIZATION_UNIT);
  };

  /**
   * Deploys the current configuration.
   * This method validates the necessary conditions for deployment,
   * sets up event listeners, and triggers the actual deployment.
   */
  private _deploy = async (): Promise<void> => {
    if (!this._modelMap.wallet?.currentAccount) {
      throw new Error(ERROR_MESSAGE.INVALID_ACCOUNT);
    }

    if (!this._modelMap.wallet.web3) {
      throw new Error(ERROR_MESSAGE.INVALID_WEB3);
    }

    this._modelMap.settings.logDeploymentAttempt();

    this._modelMap.virtualizationUnit.once(
      VirtualizationUnitModelEvent.WAITING_GAS,
      () => {
        this.emit(ControllerEvent.SYNC, ViewType.VIRTUALIZATION_UNIT);
        this._getGas();
      },
    );

    this._modelMap.virtualizationUnit.once(
      VirtualizationUnitModelEvent.DEPLOYMENT_CONFIRMED,
      () => {
        this._modelMap.settings.logDeploymentConfirmation();
      },
    );

    /**
     * Manages sync events for the virtualization unit during deployment.
     * This ensures that the deployment process is synchronized across various stages.
     *
     * @param virtualizationUnit - The virtualization unit model.
     */
    const manageSyncEvents = async (
      virtualizationUnit: VirtualizationUnitModel,
    ): Promise<void> => {
      const expectedEvents = 4;

      let eventsReceived = 0;

      const sync = () => {
        this.emit(
          ControllerEvent.SYNC,
          ViewType.WALLET,
          ViewType.VIRTUALIZATION_UNIT,
          ViewType.EXECUTOR,
        );
        eventsReceived++;
        if (eventsReceived === expectedEvents) {
          virtualizationUnit.off(VirtualizationUnitModelEvent.SYNC, sync);
        }
      };

      virtualizationUnit.on(VirtualizationUnitModelEvent.SYNC, sync);
    };

    manageSyncEvents(this._modelMap.virtualizationUnit);
    await this._modelMap.virtualizationUnit?.deploy(
      this._modelMap.wallet.currentAccount,
      this._modelMap.wallet.web3,
    );
  };

  /**
   * Sends the transaction with the specified amount of gas.
   *
   * @param gas - The amount of gas to send.
   */
  private _send = (gas?: string): void => {
    if (!gas) {
      throw new Error(ERROR_MESSAGE.INVALID_GAS);
    }
    this._handleGas(gas);
  };

  /**
   * Sets the contract to the specified address.
   *
   * @param contractAddress - The address of the contract to set.
   */
  private _setContract = (contractAddress?: string): void => {
    if (
      contractAddress &&
      this._modelMap.virtualizationUnit.contracts?.includes(contractAddress)
    ) {
      this._modelMap.virtualizationUnit.currentContract = contractAddress;
      this.emit(
        ControllerEvent.SYNC,
        ViewType.VIRTUALIZATION_UNIT,
        ViewType.EXECUTOR,
      );
    } else {
      throw new Error(ERROR_MESSAGE.INVALID_CONTRACT_ADDRESS);
    }
  };

  // ---------------------- Private Methods - Utilities ----------------------
  /**
   * Fetches user gas input.
   */
  private _getGas = async (): Promise<void> => {
    const gas = await new Promise((resolve) => (this._gasResolver = resolve));

    this._modelMap.virtualizationUnit.emit(
      VirtualizationUnitModelEvent.GAS_RECEIVED,
      gas,
    );
  };

  /**
   * Handles the specified amount of gas.
   *
   * @param gas - The amount of gas to handle.
   */
  private _handleGas = (gas: string): void => {
    if (this._gasResolver) {
      this._gasResolver(gas);
      this._gasResolver = undefined;
    }
  };
}

export default VirtualizationUnitController;
