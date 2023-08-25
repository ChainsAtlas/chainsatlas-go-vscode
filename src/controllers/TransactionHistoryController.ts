import { Disposable, Webview } from "vscode";
import {
  ControllerEvent,
  TransactionHistoryCommand,
  ViewMessage,
  ViewType,
} from "../types";
import Controller from "./Controller.abstract";

class TransactionHistoryController extends Controller {
  // ---------------------- Constructor ----------------------
  constructor(_webview: Webview, _disposables: Disposable[]) {
    super(_webview, _disposables);
  }

  // ---------------------- Protected Method - Message Handler ----------------------
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

export default TransactionHistoryController;
