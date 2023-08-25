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

export enum FileSource {
  ACTIVE = "active",
  INPUT = "input",
}

class ExecutorController extends Controller {
  // ---------------------- Private Helper Variables ----------------------
  private _gasResolver?: (value: string | PromiseLike<string>) => void;

  // ---------------------- Constructor ----------------------
  constructor(
    _webview: Webview,
    _disposables: Disposable[],
    private _modelMap: ExecutorControllerModelMap,
    private _api: ChainsAtlasGOApi,
  ) {
    super(_webview, _disposables);
  }

  // ---------------------- Protected Method - Message Handler ----------------------
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
  private _cancelCompile = (): void => {
    this._modelMap.executor.userFile = undefined;
    this.emit(ControllerEvent.SYNC, ViewType.EXECUTOR);
  };

  private _cancelExecution = (): void => {
    this._modelMap.executor.cancelExecution();
    this.emit(ControllerEvent.SYNC, ViewType.EXECUTOR);
  };

  private _clearFile = (): void => {
    this._modelMap.executor.currentFile = undefined;
    this._modelMap.executor.nargs = undefined;
    this.emit(ControllerEvent.SYNC, ViewType.EXECUTOR);
  };

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

  private _execute = (gas?: string): void => {
    if (!gas) {
      throw new Error(ERROR_MESSAGE.INVALID_GAS);
    }
    this._handleGas(gas);
  };

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

  private _getGas = async (): Promise<void> => {
    const gas = await new Promise((resolve) => (this._gasResolver = resolve));
    this._modelMap.executor.emit(ExecutorModelEvent.GAS_RECEIVED, gas);
  };

  private _handleGas = (gas: string): void => {
    if (this._gasResolver) {
      this._gasResolver(gas);
      this._gasResolver = undefined;
    }
  };
}

export default ExecutorController;
