import { extname } from "path";
import { window, workspace } from "vscode";
import { Bytes } from "web3";
import { ERROR_MESSAGE } from "../constants";
import { composeInput } from "../helpers";
import {
  BytecodeArg,
  ExecutorModelEvent,
  SupportedLanguage,
  TelemetryType,
  ViewMessageHandler,
  ViewType,
} from "../types";
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
    client.executor.currentTransaction = undefined;
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

    if (!client.wallet.currentAccount) {
      throw new Error(ERROR_MESSAGE.INVALID_ACCOUNT);
    }

    if (!client.web3) {
      throw new Error(ERROR_MESSAGE.INVALID_WEB3);
    }

    const args = JSON.parse(data) as BytecodeArg[];

    client.executor.estimating = true;

    await update(ViewType.EXECUTOR);

    const input = composeInput(client.executor.bytecodeStructure, args);

    await client.executor.estimateGas(
      input,
      client.wallet.currentAccount,
      client.virtualizationUnit.currentContract,
      client.web3,
    );

    client.executor.estimating = false;

    update(ViewType.EXECUTOR);
  })();
};

export const executeBytecode: ViewMessageHandler = async (
  data,
  update,
  client,
  api,
) => {
  withErrorHandling(async () => {
    if (!data) {
      throw new Error(ERROR_MESSAGE.INVALID_GAS);
    }

    if (!client.web3) {
      throw new Error(ERROR_MESSAGE.INVALID_WEB3);
    }

    const gas = data;

    if (client.settings.telemetry) {
      const telemetryData = JSON.stringify({
        type: TelemetryType.BYTECODE_EXECUTION_ATTEMP,
        data: {
          chain: {
            id: client.wallet.chain?.id,
            name: client.wallet.chain?.name,
          },
        },
      });

      await api.sendTelemetry(telemetryData);
    }

    client.executor.once(
      ExecutorModelEvent.TRANSACTION_OUTPUT,
      async (output: Bytes, transactionHash: Bytes) => {
        if (client.settings.telemetry) {
          const telemetryData = JSON.stringify({
            type: TelemetryType.BYTECODE_EXECUTION_CONFIRMATION,
            data: {
              chain: {
                id: client.wallet.chain?.id,
                name: client.wallet.chain?.name,
              },
            },
          });

          api.sendTelemetry(telemetryData);
        }

        if (client.wallet.chain) {
          client.transactionHistory.rows.unshift({
            output,
            transactionHash,
            transactionUrl: client.wallet.chain.transactionExplorerUrl.replace(
              "{txHash}",
              transactionHash.toString(),
            ),
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
        client.executor.removeAllListeners();

        await update(ViewType.EXECUTOR);

        if (error instanceof Error) {
          throw error;
        } else {
          throw new Error(JSON.stringify(error));
        }
      },
    );

    client.executor.on(ExecutorModelEvent.UPDATE, () =>
      update(ViewType.EXECUTOR),
    );

    client.executor.runBytecode(gas, client.web3);
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
