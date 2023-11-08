import { ERROR_MESSAGE } from "../constants";
import {
  TelemetryEventName,
  ViewType,
  VirtualizationUnitModelEvent,
} from "../enums";
import { reporter } from "../extension";
import type { ViewMessageHandler } from "../types";
import { withErrorHandling } from "../utils";

export const changeContract: ViewMessageHandler = async (
  data,
  update,
  client,
  _api,
) => {
  withErrorHandling(async () => {
    const contractAddress = data;

    if (
      contractAddress &&
      client.virtualizationUnit.contracts?.includes(contractAddress)
    ) {
      client.virtualizationUnit.currentContract = contractAddress;

      update(ViewType.VIRTUALIZATION_UNIT, ViewType.EXECUTOR);
    } else {
      throw new Error(ERROR_MESSAGE.INVALID_CONTRACT_ADDRESS);
    }
  })();
};

export const clearDeployment: ViewMessageHandler = (
  _data,
  update,
  client,
  _api,
) => {
  withErrorHandling(() => {
    client.virtualizationUnit.gasEstimate = undefined;
    client.virtualizationUnit.contractTransactionStatus = undefined;

    update(ViewType.VIRTUALIZATION_UNIT);
  })();
};

export const estimateGas: ViewMessageHandler = async (
  _data,
  update,
  client,
  _api,
) => {
  withErrorHandling(async () => {
    if (!client.provider) {
      throw new Error(ERROR_MESSAGE.INVALID_PROVIDER);
    }

    client.virtualizationUnit.estimating = true;

    await update(ViewType.VIRTUALIZATION_UNIT);

    await client.virtualizationUnit.estimateGas(client.provider);

    client.virtualizationUnit.estimating = false;

    update(ViewType.VIRTUALIZATION_UNIT);
  })();
};

export const deploy: ViewMessageHandler = async (
  data,
  update,
  client,
  _api,
) => {
  withErrorHandling(async () => {
    if (!client.wallet.chain) {
      throw new Error(ERROR_MESSAGE.INVALID_CHAIN);
    }

    if (!client.provider) {
      throw new Error(ERROR_MESSAGE.INVALID_PROVIDER);
    }

    if (!data) {
      throw new Error(ERROR_MESSAGE.INVALID_GAS);
    }

    const gasLimit = data;

    reporter.sendTelemetryEvent(TelemetryEventName.DEPLOY_V_UNIT, {
      name: client.wallet.chain.name,
      namespace: client.wallet.chain.namespace,
      id: client.wallet.chain.id.toString(),
      status: "pending",
    });

    client.virtualizationUnit.once(
      VirtualizationUnitModelEvent.TRANSACTION_CONFIRMED,
      () => {
        if (!client.wallet.chain) {
          throw new Error(ERROR_MESSAGE.INVALID_CHAIN);
        }

        reporter.sendTelemetryEvent(TelemetryEventName.DEPLOY_V_UNIT, {
          name: client.wallet.chain.name,
          namespace: client.wallet.chain.namespace,
          id: client.wallet.chain.id.toString(),
          status: "success",
        });

        client.virtualizationUnit.removeAllListeners();
        update(
          ViewType.WALLET,
          ViewType.VIRTUALIZATION_UNIT,
          ViewType.EXECUTOR,
        );
      },
    );

    client.virtualizationUnit.once(
      VirtualizationUnitModelEvent.TRANSACTION_ERROR,
      async (error) => {
        withErrorHandling(async () => {
          client.virtualizationUnit.removeAllListeners();

          await update(ViewType.VIRTUALIZATION_UNIT);

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

    client.virtualizationUnit.on(VirtualizationUnitModelEvent.UPDATE, () =>
      update(ViewType.VIRTUALIZATION_UNIT),
    );

    client.virtualizationUnit.deploy(gasLimit, client.provider);
  })();
};

export const virtualizationUnitReady: ViewMessageHandler = (
  _data,
  update,
  _client,
  _api,
) => {
  withErrorHandling(async () => {
    update(ViewType.VIRTUALIZATION_UNIT);
  })();
};
