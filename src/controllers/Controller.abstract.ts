import EventEmitter from "events";
import { Disposable, Webview } from "vscode";
import { ViewMessage } from "../types";
import { withErrorHandling } from "../utils";

/**
 * Represents the abstract base class for controllers in the application.
 *
 * Controllers handle interactions between views and underlying logic.
 * Each controller is associated with a specific webview and listens to messages from that webview.
 * When a message is received from the webview, the abstract `_handler` method is called to process the message.
 *
 * This class extends `EventEmitter` allowing subclasses to emit and listen to events for more complex interactions.
 *
 * @abstract
 * @class
 */
abstract class Controller extends EventEmitter {
  /**
   * Constructs a new Controller instance.
   *
   * Sets up the event listener for the given webview to handle incoming messages.
   *
   * @param _webview - The webview associated with this controller.
   * @param _disposables - An array of disposables to manage the lifecycle of event listeners and other resources.
   */
  constructor(_webview: Webview, _disposables: Disposable[]) {
    super();
    _webview.onDidReceiveMessage(this.handle, this, _disposables);
  }

  /**
   * Handles incoming messages from the associated webview.
   *
   * This method serves as a wrapper around the abstract `_handler` method, providing error handling.
   * Subclasses should implement the `_handler` method to provide specific logic for processing messages.
   *
   * @param message - The message received from the webview.
   * @returns Can return a Promise if asynchronous operations are performed; otherwise, returns void.
   */
  public handle = withErrorHandling(
    (message: ViewMessage): Promise<void> | void => {
      this._handler(message);
    },
  );

  /**
   * Abstract method that processes incoming messages from the webview.
   *
   * Subclasses must provide an implementation for this method, detailing how different types of messages should be handled.
   *
   * @abstract
   * @param message - The message received from the webview.
   * @returns Can return a Promise if asynchronous operations are performed; otherwise, returns void.
   */
  protected abstract _handler: (message: ViewMessage) => void | Promise<void>;
}

export default Controller;
