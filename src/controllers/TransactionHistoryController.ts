import { Disposable, Webview } from "vscode";
import {
  ControllerEvent,
  TransactionHistoryCommand,
  ViewMessage,
  ViewType,
} from "../types";
import { Controller } from "./Controller.abstract";

/**
 * The TransactionHistoryController class is responsible for managing the transaction history view.
 * It extends the abstract Controller class and handles specific messages related to transaction history.
 */
export class TransactionHistoryController extends Controller {
  /**
   * Constructor initializes the webview and disposable resources.
   *
   * @param _webview - The webview interface through which the controller interacts.
   * @param _disposables - Array of resources that should be disposed of when no longer needed.
   */
  constructor(_webview: Webview, _disposables: Disposable[]) {
    super(_webview, _disposables);
  }

  /**
   * Message handler for transaction history view.
   * Currently, it only handles the "READY" command to synchronize with the transaction history view.
   *
   * @param message - The message received from the view.
   */
  protected _handler = async (message: ViewMessage): Promise<void> => {
    const { READY } = TransactionHistoryCommand;
    const { command } = message;

    switch (command) {
      case READY:
        this.emit(ControllerEvent.SYNC, ViewType.TRANSACTION_HISTORY);
        break;
      default:
        break;
    }
  };
}
