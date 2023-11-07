import { BrowserProvider } from "ethers";
import { ERROR_MESSAGE } from "../constants";
import { TelemetryEventName, ViewType } from "../enums";
import { reporter } from "../extension";
import { isChain } from "../typeguards";
import type { Chain, ViewMessageHandler } from "../types";
import { withErrorHandling } from "../utils";

export const addChain: ViewMessageHandler = async (
  data,
  update,
  client,
  _api,
) => {
  withErrorHandling(async () => {
    client.wallet.chainUpdateStatus = "updating";

    await update(ViewType.WALLET);

    if (!data) {
      client.wallet.chainUpdateStatus = undefined;

      await update(ViewType.WALLET);

      throw new Error(ERROR_MESSAGE.INVALID_CHAIN);
    }

    const addedChain = JSON.parse(data) as Chain;

    if (!isChain(addedChain)) {
      client.wallet.chainUpdateStatus = undefined;

      await update(ViewType.WALLET);

      throw new Error(ERROR_MESSAGE.INVALID_CHAIN);
    }

    client.wallet.addChain(addedChain);

    reporter.sendTelemetryEvent(TelemetryEventName.ADD_CHAIN, {
      name: addedChain.name,
      namespace: addedChain.namespace,
      id: addedChain.id.toString(),
    });

    await update(ViewType.WALLET);

    client.wallet.chainUpdateStatus = undefined;

    update(ViewType.WALLET);
  })();
};

export const connect: ViewMessageHandler = async (
  data,
  update,
  client,
  _api,
) => {
  withErrorHandling(async () => {
    if (!data) {
      throw new Error(ERROR_MESSAGE.INVALID_CHAIN);
    }

    const chainId = Number(data);

    await client.wallet.connect(chainId);

    if (!client.wallet.chain) {
      throw new Error(ERROR_MESSAGE.INVALID_CHAIN);
    }

    if (!client.wallet.connected) {
      throw new Error(ERROR_MESSAGE.ERROR_CONNECTING_WALLET);
    }

    client.provider = new BrowserProvider(client.walletConnectProvider);
    client.wallet.account = (await client.provider.getSigner()).address;
    client.virtualizationUnit.contractTransactionStatus = undefined;
    client.virtualizationUnit.contracts = [];
    client.virtualizationUnit.currentContract = undefined;
    client.virtualizationUnit.gasEstimate = undefined;
    client.transactionHistory.rows = [];

    reporter.sendTelemetryEvent(TelemetryEventName.CONNECT, {
      name: client.wallet.chain.name,
      namespace: client.wallet.chain.namespace,
      id: client.wallet.chain.id.toString(),
    });

    update(
      ViewType.WALLET,
      ViewType.VIRTUALIZATION_UNIT,
      ViewType.EXECUTOR,
      ViewType.TRANSACTION_HISTORY,
    );
  })();
};

export const disconnect: ViewMessageHandler = async (
  _data,
  update,
  client,
  _api,
) => {
  withErrorHandling(async () => {
    if (client.provider) {
      client.provider.destroy();
    }

    if (client.wallet.connected) {
      await client.wallet.disconnect();
    }

    client.virtualizationUnit.contractTransactionStatus = undefined;
    client.virtualizationUnit.contracts = [];
    client.virtualizationUnit.currentContract = undefined;
    client.virtualizationUnit.gasEstimate = undefined;
    client.transactionHistory.rows = [];

    update(
      ViewType.WALLET,
      ViewType.VIRTUALIZATION_UNIT,
      ViewType.EXECUTOR,
      ViewType.TRANSACTION_HISTORY,
    );
  })();
};

export const editChain: ViewMessageHandler = async (
  data,
  update,
  client,
  _api,
) => {
  withErrorHandling(async () => {
    client.wallet.chainUpdateStatus = "updating";

    await update(ViewType.WALLET);

    if (!data) {
      client.wallet.chainUpdateStatus = undefined;

      await update(ViewType.WALLET);

      throw new Error(ERROR_MESSAGE.INVALID_CHAIN);
    }

    const updatedChain = JSON.parse(data) as Chain;

    if (!isChain(updatedChain)) {
      client.wallet.chainUpdateStatus = undefined;

      await update(ViewType.WALLET);

      throw new Error(ERROR_MESSAGE.INVALID_CHAIN);
    }

    const chainIndex = client.wallet.chains.findIndex(
      (chain) => chain.id === updatedChain.id,
    );

    if (chainIndex === -1) {
      client.wallet.chainUpdateStatus = undefined;

      await update(ViewType.WALLET);

      throw new Error(ERROR_MESSAGE.CHAIN_NOT_FOUND);
    }

    client.wallet.editChain(updatedChain, chainIndex);

    reporter.sendTelemetryEvent(TelemetryEventName.EDIT_CHAIN, {
      name: updatedChain.name,
      namespace: updatedChain.namespace,
      id: updatedChain.id.toString(),
    });

    await update(ViewType.WALLET);

    client.wallet.chainUpdateStatus = undefined;

    update(ViewType.WALLET);
  })();
};

export const login: ViewMessageHandler = async (data, update, _client, api) => {
  withErrorHandling(async () => {
    if (!data) {
      throw new Error(ERROR_MESSAGE.INVALID_CREDENTIALS);
    }

    api.authStatus = "authenticating";

    await update(ViewType.WALLET);

    try {
      await api.authenticate(data);
    } catch (error) {
      update(ViewType.WALLET);
      throw error;
    }

    reporter.sendTelemetryEvent(TelemetryEventName.LOGIN);

    update(ViewType.WALLET);
  })();
};

export const logout: ViewMessageHandler = async (data, update, client, api) => {
  withErrorHandling(async () => {
    api.logout();
    reporter.sendTelemetryEvent(TelemetryEventName.LOGOUT);
    disconnect(data, update, client, api);
  })();
};

export const walletReady: ViewMessageHandler = (
  _data,
  update,
  _client,
  _api,
) => {
  withErrorHandling(() => {
    update(ViewType.WALLET);
  })();
};
