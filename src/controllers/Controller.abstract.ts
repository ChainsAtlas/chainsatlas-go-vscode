import EventEmitter from "events";
import { Disposable, Webview } from "vscode";
import { ViewMessage } from "../types";
import { withErrorHandling } from "../utils";

abstract class Controller extends EventEmitter {
  constructor(_webview: Webview, _disposables: Disposable[]) {
    super();
    _webview.onDidReceiveMessage(this.handle, this, _disposables);
  }

  public handle = withErrorHandling(
    (message: ViewMessage): Promise<void> | void => {
      this._handler(message);
    },
  );

  protected abstract _handler: (message: ViewMessage) => void | Promise<void>;
}

export default Controller;
