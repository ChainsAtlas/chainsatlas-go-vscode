import { Disposable, Webview } from "vscode";
import { ERROR_MESSAGE } from "../constants";
import { Api } from "../lib";
import {
  ControllerEvent,
  SettingsCommand,
  SettingsControllerModelMap,
  ViewMessage,
  ViewType,
} from "../types";
import { Controller } from "./Controller.abstract";

/**
 * The SettingsController class is responsible for managing the settings view.
 * It extends the abstract Controller class and handles specific messages related to user settings.
 */
export class SettingsController extends Controller {
  /**
   * Constructor initializes the webview and disposable resources.
   *
   * @param _webview - The webview interface through which the controller interacts.
   * @param _disposables - Array of resources that should be disposed of when no longer needed.
   */
  constructor(
    _webview: Webview,
    _disposables: Disposable[],
    private _modelMap: SettingsControllerModelMap,
    private _api: Api,
  ) {
    super(_webview, _disposables);
  }

  /**
   * Message handler for settings view.
   * Currently, it only handles the "READY" command to synchronize with the settings view.
   *
   * @param message - The message received from the view.
   */
  protected _handler = async (message: ViewMessage): Promise<void> => {
    const { READY, SWITCH_TELEMETRY } = SettingsCommand;
    const { command, value } = message;

    switch (command) {
      case READY:
        this.emit(ControllerEvent.SYNC, ViewType.SETTINGS);
        break;
      case SWITCH_TELEMETRY:
        this._switchTelemetry(value);
        break;
      default:
        break;
    }
  };

  private _switchTelemetry = (value?: string): void => {
    if (!value) {
      throw new Error(ERROR_MESSAGE.INVALID_VALUE);
    }

    this._modelMap.settings.telemetry = JSON.parse(value);
    this.emit(ControllerEvent.SYNC, ViewType.SETTINGS);
  };
}
