import { extname } from "path";
import { window, workspace } from "vscode";
import { ERROR_MESSAGE } from "../constants";
import {
  ExecutorModelEvent,
  SupportedLanguage,
  TelemetryEventName,
  ViewType,
} from "../enums";
import { reporter } from "../extension";
import { composeInput } from "../helpers";
import type { BytecodeArg, ViewMessageHandler } from "../types";
import { withErrorHandling } from "../utils";

export const cancelCompile: ViewMessageHandler = (
  _data,
  update,
  client,
  _api,
) => {
  withErrorHandling(() => {
    client.executor.userFile = undefined;

    update(ViewType.EXECUTOR);
  })();
};

export const cancelExecution: ViewMessageHandler = (
  _data,
  update,
  client,
  _api,
) => {
  withErrorHandling(() => {
    client.executor.compilerStatus = undefined;
    client.executor.contractTransactionStatus = undefined;
    client.executor.currentContractInstance = undefined;
    client.executor.bytecodeInput = undefined;
    client.executor.gasEstimate = undefined;

    update(ViewType.EXECUTOR);
  })();
};

export const clearFile: ViewMessageHandler = (_data, update, client, _api) => {
  withErrorHandling(() => {
    client.executor.currentFile = undefined;
    client.executor.nargs = undefined;

    update(ViewType.EXECUTOR);
  })();
};

export const compileBytecode: ViewMessageHandler = async (
  data,
  update,
  client,
  api,
) => {
  withErrorHandling(async () => {
    if (!client.executor.userFile) {
      throw new Error(ERROR_MESSAGE.INVALID_FILE);
    }

    if (!data) {
      throw new Error(ERROR_MESSAGE.INVALID_NARGS);
    }

    const nargs = Number(data);

    client.executor.bytecodeStructure = undefined;
    client.executor.compilerStatus = "compiling";
    client.executor.currentFile = undefined;
    client.executor.nargs = undefined;

    await update(ViewType.EXECUTOR);

    const bytecodeStructure = await api.generateBytecodeStructure(
      client.executor.userFile,
      nargs,
    );

    if (!bytecodeStructure) {
      client.executor.bytecodeStructure = undefined;
      client.executor.compilerStatus = undefined;
      client.executor.currentFile = undefined;
      client.executor.nargs = undefined;

      await update(ViewType.EXECUTOR);

      throw new Error(ERROR_MESSAGE.INVALID_BYTECODE_STRUCTURE);
    }

    client.executor.bytecodeStructure = bytecodeStructure;
    client.executor.compilerStatus = "done";
    client.executor.currentFile = client.executor.userFile;
    client.executor.nargs = nargs;

    reporter.sendTelemetryEvent(
      TelemetryEventName.COMPILE_BYTECODE,
      { language: client.executor.currentFile.extension },
      { nargs },
    );

    update(ViewType.EXECUTOR);
  })();
};

export const estimateGas: ViewMessageHandler = async (
  data,
  update,
  client,
  _api,
) => {
  withErrorHandling(async () => {
    if (!data) {
      throw new Error(ERROR_MESSAGE.INVALID_ARGUMENTS);
    }

    if (!client.executor.bytecodeStructure) {
      throw new Error(ERROR_MESSAGE.INVALID_BYTECODE_STRUCTURE);
    }

    if (!client.virtualizationUnit.currentContract) {
      throw new Error(ERROR_MESSAGE.INVALID_VIRTUALIZATION_UNIT_CONTRACT);
    }

    if (!client.provider) {
      throw new Error(ERROR_MESSAGE.INVALID_PROVIDER);
    }

    const args = JSON.parse(data) as BytecodeArg[];

    client.executor.estimating = true;

    await update(ViewType.EXECUTOR);

    const input = composeInput(client.executor.bytecodeStructure, args);

    await client.executor.estimateGas(
      input,
      client.virtualizationUnit.currentContract,
      client.provider,
    );

    client.executor.estimating = false;

    update(ViewType.EXECUTOR);
  })();
};

export const executeBytecode: ViewMessageHandler = async (
  data,
  update,
  client,
  _api,
) => {
  withErrorHandling(async () => {
    if (!client.wallet.chain) {
      throw new Error(ERROR_MESSAGE.INVALID_CHAIN);
    }

    if (!data) {
      throw new Error(ERROR_MESSAGE.INVALID_GAS);
    }

    const gasLimit = data;

    reporter.sendTelemetryEvent(TelemetryEventName.EXECUTE_BYTECODE, {
      name: client.wallet.chain.name,
      namespace: client.wallet.chain.namespace,
      id: client.wallet.chain.id.toString(),
      status: "pending",
    });

    client.executor.once(
      ExecutorModelEvent.TRANSACTION_OUTPUT,
      async (output: string, txHash: string) => {
        if (!client.wallet.chain) {
          throw new Error(ERROR_MESSAGE.INVALID_CHAIN);
        }

        reporter.sendTelemetryEvent(TelemetryEventName.EXECUTE_BYTECODE, {
          name: client.wallet.chain.name,
          namespace: client.wallet.chain.namespace,
          id: client.wallet.chain.id.toString(),
          status: "success",
        });

        if (client.wallet.chain) {
          client.transactionHistory.rows.unshift({
            output,
            txHash,
            txUrl: `${client.wallet.chain.blockExplorerUrl}/tx/${txHash}`,
          });

          update(
            ViewType.WALLET,
            ViewType.EXECUTOR,
            ViewType.TRANSACTION_HISTORY,
          );
        } else {
          throw new Error(ERROR_MESSAGE.INVALID_CHAIN);
        }

        client.executor.removeAllListeners();
      },
    );

    client.executor.once(
      ExecutorModelEvent.TRANSACTION_ERROR,
      async (error) => {
        withErrorHandling(async () => {
          client.executor.removeAllListeners();

          await update(ViewType.EXECUTOR);

          const parsedError = JSON.parse(JSON.stringify(error));

          if (parsedError instanceof Error) {
            throw error;
          } else if (parsedError.error.message) {
            throw new Error(parsedError.error.message);
          } else {
            throw new Error(JSON.stringify(error));
          }
        })();
      },
    );

    client.executor.on(ExecutorModelEvent.UPDATE, () =>
      update(ViewType.EXECUTOR),
    );

    client.executor.runBytecode(gasLimit);
  })();
};

export const executorReady: ViewMessageHandler = (
  _data,
  update,
  _client,
  _api,
) => {
  withErrorHandling(() => {
    update(ViewType.EXECUTOR);
  })();
};

export const getActiveFile: ViewMessageHandler = async (
  _data,
  update,
  client,
  _api,
) => {
  withErrorHandling(async () => {
    const activeEditor = window.activeTextEditor;
    if (activeEditor) {
      const uri = activeEditor.document.uri;

      const extension = extname(uri.fsPath).slice(1);

      if (
        Object.values(SupportedLanguage).includes(
          extension as SupportedLanguage,
        )
      ) {
        client.executor.userFile = {
          content: (await workspace.fs.readFile(uri)).toString(),
          extension: extension as SupportedLanguage,
          path: uri.fsPath,
        };
      }

      update(ViewType.EXECUTOR);
    }
  })();
};

export const selectFile: ViewMessageHandler = async (
  _data,
  update,
  client,
  _api,
) => {
  withErrorHandling(async () => {
    const uris = await window.showOpenDialog({
      canSelectMany: false,
      openLabel: "Open",
      filters: { "Supported files": Object.values(SupportedLanguage) },
    });

    if (uris && uris.length > 0) {
      const selectedFileUri = uris[0];

      client.executor.userFile = {
        content: (await workspace.fs.readFile(selectedFileUri)).toString(),
        extension: extname(selectedFileUri.fsPath).slice(
          1,
        ) as SupportedLanguage,
        path: selectedFileUri.fsPath,
      };

      update(ViewType.EXECUTOR);
    } else {
      window.showWarningMessage(ERROR_MESSAGE.NO_FILE_SELECTED);
    }
  })();
};
