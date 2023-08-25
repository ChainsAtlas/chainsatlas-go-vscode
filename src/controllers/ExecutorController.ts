import { extname } from "path";
import { Disposable, Webview, window, workspace } from "vscode";
import { ERROR_MESSAGE, SUPPORTED_LANGUAGES } from "../constants";
import { ChainsAtlasGOApi } from "../lib";
import { ExecutorModel } from "../models";
import {
  ControllerEvent,
  ExecutorCommand,
  ExecutorControllerModelMap,
  ExecutorFile,
  ExecutorModelEvent,
  SupportedLanguage,
  ViewMessage,
  ViewType,
} from "../types";
import Controller from "./Controller.abstract";

/**
 * Enum representing the possible sources of a file.
 * - ACTIVE: Indicates the file is currently active in the editor.
 * - INPUT: Indicates the file is fetched through user input or selection.
 */
export enum FileSource {
  ACTIVE = "active",
  INPUT = "input",
}

/**
 * `ExecutorController` manages interactions related to the execution of the code.
 * It deals with compiling, estimating, executing, and other related operations.
 *
 * This class extends the `Controller` abstract base class, inheriting its core functionality.
 * It also adds specific handling logic for the executor-related commands.
 *
 * @class
 */
class ExecutorController extends Controller {
  // ---------------------- Private Helper Variables ----------------------
  // Utility to resolve the promise when gas value is received
  private _gasResolver?: (value: string | PromiseLike<string>) => void;

  // ---------------------- Constructor ----------------------
  /**
   * Constructs an instance of the ExecutorController.
   *
   * @param _webview - The webview associated with this controller.
   * @param _disposables - An array of disposables for cleanup.
   * @param _modelMap - Mapping of all models required by this controller.
   * @param _api - Instance of the ChainsAtlasGOApi to interact with the backend.
   */
  constructor(
    _webview: Webview,
    _disposables: Disposable[],
    private _modelMap: ExecutorControllerModelMap,
    private _api: ChainsAtlasGOApi,
  ) {
    super(_webview, _disposables);
  }

  // ---------------------- Protected Method - Message Handler ----------------------
  /**
   * Handler function to process messages received from the view.
   * This method contains logic to handle various executor-related commands.
   *
   * @param message - The message received from the view.
   */
  protected _handler = async (message: ViewMessage): Promise<void> => {
    const {
      CANCEL_COMPILE,
      CANCEL_EXECUTION,
      CLEAR_FILE,
      COMPILE,
      ESTIMATE,
      EXECUTE,
      GET_ACTIVE_FILE,
      READY,
      SELECT_FILE,
    } = ExecutorCommand;
    const { command, value } = message;

    switch (command) {
      case CANCEL_COMPILE:
        this._cancelCompile();
        break;
      case CANCEL_EXECUTION:
        this._cancelExecution();
        break;
      case CLEAR_FILE:
        this._clearFile();
        break;
      case COMPILE:
        this._compile(value);
        break;
      case ESTIMATE:
        this._estimate(value);
        break;
      case EXECUTE:
        this._execute(value);
        break;
      case GET_ACTIVE_FILE:
        this._getFile(FileSource.ACTIVE);
        break;
      case READY:
        this.emit(ControllerEvent.SYNC, ViewType.EXECUTOR);
        break;
      case SELECT_FILE:
        this._getFile(FileSource.INPUT);
        break;
      default:
        break;
    }
  };

  // ---------------------- Private Methods - Command Handlers ----------------------
  /**
   * Cancels the compilation process.
   * Resets the user file and synchronizes with the executor view.
   */
  private _cancelCompile = (): void => {
    this._modelMap.executor.userFile = undefined;
    this.emit(ControllerEvent.SYNC, ViewType.EXECUTOR);
  };

  /**
   * Cancels the execution process.
   * Invokes the model's cancelExecution method and synchronizes with the executor view.
   */
  private _cancelExecution = (): void => {
    this._modelMap.executor.cancelExecution();
    this.emit(ControllerEvent.SYNC, ViewType.EXECUTOR);
  };

  /**
   * Clears the currently selected file.
   * Resets the current file and nargs in the model and synchronizes with the executor view.
   */
  private _clearFile = (): void => {
    this._modelMap.executor.currentFile = undefined;
    this._modelMap.executor.nargs = undefined;
    this.emit(ControllerEvent.SYNC, ViewType.EXECUTOR);
  };

  /**
   * Compiles the bytecode.
   * Throws an error if nargs is not provided.
   * Sets up listeners for bytecode structure and synchronization.
   * Initiates the compileBytecode process in the model.
   *
   * @param nargs - Number of arguments for the compilation process.
   */
  private _compile = async (nargs?: string): Promise<void> => {
    if (!nargs) {
      throw new Error(ERROR_MESSAGE.INVALID_NARGS);
    }

    const sync = () => this.emit(ControllerEvent.SYNC, ViewType.EXECUTOR);
    this._modelMap.executor.once(
      ExecutorModelEvent.WAITING_BYTECODE_STRUCTURE,
      this._getBytecodeStructure,
    );
    this._modelMap.executor.once(ExecutorModelEvent.SYNC, sync);
    await this._modelMap.executor.compileBytecode(Number(nargs));
  };

  /**
   * Estimates the execution.
   * Validates required parameters and sets up listeners for waiting gas.
   * Initiates the runBytecode process in the model.
   *
   * @param args - Arguments for the estimation process.
   */
  private _estimate = async (args?: string): Promise<void> => {
    if (!args) {
      throw new Error(ERROR_MESSAGE.INVALID_ARGUMENTS);
    }

    if (!this._modelMap.virtualizationUnit?.currentContract) {
      throw new Error(ERROR_MESSAGE.INVALID_VIRTUALIZATION_UNIT_CONTRACT);
    }

    if (!this._modelMap.wallet?.currentAccount) {
      throw new Error(ERROR_MESSAGE.INVALID_ACCOUNT);
    }

    if (!this._modelMap.wallet.web3) {
      throw new Error(ERROR_MESSAGE.INVALID_WEB3);
    }

    this._modelMap.executor.once(ExecutorModelEvent.WAITING_GAS, () => {
      this.emit(ControllerEvent.SYNC, ViewType.EXECUTOR);
      this._getGas();
    });

    const manageSyncEvents = async (executor: ExecutorModel): Promise<void> => {
      const expectedEvents = 4;
      let eventsReceived = 0;

      const sync = () => {
        this.emit(ControllerEvent.SYNC, ViewType.EXECUTOR);
        eventsReceived++;

        if (eventsReceived === expectedEvents) {
          this._addTxHistoryEntry();
          executor.off(ExecutorModelEvent.SYNC, sync);
        }
      };

      executor.on(ExecutorModelEvent.SYNC, sync);
    };

    manageSyncEvents(this._modelMap.executor);
    await this._modelMap.executor.runBytecode(
      JSON.parse(args),
      this._modelMap.wallet?.currentAccount,
      this._modelMap.virtualizationUnit?.currentContract,
      this._modelMap.wallet.web3,
    );
  };

  /**
   * Executes the bytecode with the provided gas.
   * Throws an error if gas is not provided.
   * Resolves the gas promise.
   *
   * @param gas - The gas value for the execution.
   */
  private _execute = (gas?: string): void => {
    if (!gas) {
      throw new Error(ERROR_MESSAGE.INVALID_GAS);
    }
    this._handleGas(gas);
  };

  /**
   * Fetches the file based on the specified source (active editor or user input).
   * Resets the compiler status in the model.
   * Depending on the source, fetches the active file or prompts the user to select a file.
   * Synchronizes with the executor view after fetching the file.
   *
   * @param src - The source of the file (active editor or user input).
   */
  private _getFile = async (src: FileSource): Promise<void> => {
    this._modelMap.executor.compilerStatus = undefined;
    if (src === FileSource.ACTIVE) {
      await this._getActiveFile();
    } else {
      await this._getInputFile();
    }

    this.emit(ControllerEvent.SYNC, ViewType.EXECUTOR);
  };

  // ---------------------- Private Methods - Utilities ----------------------
  /**
   * Adds a transaction history entry.
   * Constructs a new row for the transaction history based on the model's state.
   * Resets the model's output and transaction hash.
   * Synchronizes with the wallet, executor, and transaction history views.
   */
  private _addTxHistoryEntry = async (): Promise<void> => {
    const { output, transactionHash } = this._modelMap.executor;
    const { chain } = this._modelMap.wallet;

    if (chain && output && transactionHash) {
      this._modelMap.transactionHistory.addRow({
        output,
        transactionHash,
        transactionUrl: `${chain.blockExplorers?.default.url}/tx/${transactionHash}`,
      });

      this._modelMap.executor.output = undefined;
      this._modelMap.executor.transactionHash = undefined;

      this.emit(
        "sync",
        ViewType.WALLET,
        ViewType.EXECUTOR,
        ViewType.TRANSACTION_HISTORY,
      );
    } else {
      throw new Error(ERROR_MESSAGE.INVALID_TRANSACTION_DATA);
    }
  };

  /**
   * Fetches the currently active file in the editor.
   * Checks the file's extension against supported languages.
   * If the file is supported, reads its content and updates the model.
   */
  private _getActiveFile = async (): Promise<void> => {
    const activeEditor = window.activeTextEditor;
    if (activeEditor) {
      const uri = activeEditor.document.uri;

      const extension = extname(uri.fsPath).slice(1);

      if (SUPPORTED_LANGUAGES.includes(extension as SupportedLanguage)) {
        this._modelMap.executor.userFile = {
          content: (await workspace.fs.readFile(uri)).toString(),
          extension: extension as SupportedLanguage,
          path: uri.fsPath,
        };
      }
    }
  };

  /**
   * Prompts the user to select a file for input.
   * Filters the selection to only allow supported files.
   * Reads the selected file's content and updates the model.
   */
  private _getInputFile = async (): Promise<void> => {
    const uris = await window.showOpenDialog({
      canSelectMany: false,
      openLabel: "Open",
      filters: { "Supported files": SUPPORTED_LANGUAGES },
    });

    if (uris && uris.length > 0) {
      const selectedFileUri = uris[0];

      this._modelMap.executor.userFile = {
        content: (await workspace.fs.readFile(selectedFileUri)).toString(),
        extension: extname(selectedFileUri.fsPath).slice(
          1,
        ) as SupportedLanguage,
        path: selectedFileUri.fsPath,
      };
    } else {
      window.showWarningMessage(ERROR_MESSAGE.NO_FILE_SELECTED);
    }
  };

  /**
   * Fetches the bytecode structure for a given file and nargs.
   * Makes an API call to generate the bytecode structure.
   * Updates the model with the received bytecode structure.
   *
   * @param file - The file for which the bytecode structure is required.
   * @param nargs - Number of arguments for the bytecode.
   */
  private _getBytecodeStructure = async (
    file: ExecutorFile,
    nargs: number,
  ): Promise<void> => {
    this.emit(ControllerEvent.SYNC, ViewType.EXECUTOR);
    const bytecodeStructure = await this._api.generateBytecodeStructure(
      file,
      nargs,
    );
    this._modelMap.executor.emit(
      ExecutorModelEvent.BYTECODE_STRUCTURE_RECEIVED,
      bytecodeStructure,
    );
  };

  /**
   * Waits for the gas value using a promise.
   * Once the gas value is received, updates the model.
   */
  private _getGas = async (): Promise<void> => {
    const gas = await new Promise((resolve) => (this._gasResolver = resolve));
    this._modelMap.executor.emit(ExecutorModelEvent.GAS_RECEIVED, gas);
  };

  /**
   * Resolves the gas promise with the provided gas value.
   * Resets the gas resolver function.
   *
   * @param gas - The gas value to resolve the promise with.
   */
  private _handleGas = (gas: string): void => {
    if (this._gasResolver) {
      this._gasResolver(gas);
      this._gasResolver = undefined;
    }
  };
}

export default ExecutorController;
