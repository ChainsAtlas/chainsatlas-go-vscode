import { ERROR_MESSAGE } from "../constants";
import {
  TelemetryType,
  ViewMessageHandler,
  ViewType,
  VirtualizationUnitModelEvent,
} from "../types";
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
    if (!client.wallet.currentAccount) {
      throw new Error(ERROR_MESSAGE.INVALID_ACCOUNT);
    }

    if (!client.web3) {
      throw new Error(ERROR_MESSAGE.INVALID_WEB3);
    }

    client.virtualizationUnit.estimating = true;

    await update(ViewType.VIRTUALIZATION_UNIT);

    await client.virtualizationUnit.estimateGas(
      client.wallet.currentAccount,
      client.web3,
    );

    client.virtualizationUnit.estimating = false;

    update(ViewType.VIRTUALIZATION_UNIT);
  })();
};

export const deploy: ViewMessageHandler = async (data, update, client, api) => {
  withErrorHandling(async () => {
    if (!client.wallet.currentAccount) {
      throw new Error(ERROR_MESSAGE.INVALID_ACCOUNT);
    }

    if (!client.web3) {
      throw new Error(ERROR_MESSAGE.INVALID_WEB3);
    }

    if (!data) {
      throw new Error(ERROR_MESSAGE.INVALID_GAS);
    }

    const gas = data;

    if (client.settings.telemetry) {
      const telemetryData = JSON.stringify({
        type: TelemetryType.V_UNIT_DEPLOYMENT_ATTEMPT,
        data: {
          chain: {
            id: client.wallet.chain?.id,
            name: client.wallet.chain?.name,
          },
        },
      });

      await api.sendTelemetry(telemetryData);
    }

    client.virtualizationUnit.once(
      VirtualizationUnitModelEvent.TRANSACTION_CONFIRMED,
      () => {
        if (client.settings.telemetry) {
          const telemetryData = JSON.stringify({
            type: TelemetryType.V_UNIT_DEPLOYMENT_CONFIRMATION,
            data: {
              chain: {
                id: client.wallet.chain?.id,
                name: client.wallet.chain?.name,
              },
            },
          });

          api.sendTelemetry(telemetryData);
        }

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
        client.virtualizationUnit.removeAllListeners();

        await update(ViewType.VIRTUALIZATION_UNIT);

        if (error instanceof Error) {
          throw error;
        } else {
          throw new Error(JSON.stringify(error));
        }
      },
    );

    client.virtualizationUnit.on(VirtualizationUnitModelEvent.UPDATE, () =>
      update(ViewType.VIRTUALIZATION_UNIT),
    );

    client.virtualizationUnit.deploy(
      client.wallet.currentAccount,
      gas,
      client.web3,
    );
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
