import Web3 from "web3";
import { ERROR_MESSAGE } from "../constants";
import { TelemetryEventName, ViewType } from "../enums";
import { reporter } from "../extension";
import { isValidChain } from "../typeguards";
import type { ValidChain, ViewMessageHandler } from "../types";
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

    const addedChain = JSON.parse(data) as ValidChain;

    if (!isValidChain(addedChain)) {
      client.wallet.chainUpdateStatus = undefined;

      await update(ViewType.WALLET);

      throw new Error(ERROR_MESSAGE.INVALID_CHAIN);
    }

    client.wallet.chain = addedChain;
    client.wallet.chains.push(addedChain);
    client.wallet.chains.sort((a, b) => a.name.localeCompare(b.name));
    client.wallet.chainUpdateStatus = "done";
    client.wallet.uri = undefined;

    reporter.sendTelemetryEvent(TelemetryEventName.ADD_CHAIN, {
      name: client.wallet.chain.name,
      namespace: client.wallet.chain.namespace,
      id: client.wallet.chain.id.toString(),
    });

    await update(ViewType.WALLET);

    client.wallet.chainUpdateStatus = undefined;

    update(ViewType.WALLET);
  })();
};

export const changeAccount: ViewMessageHandler = (
  data,
  update,
  client,
  _api,
) => {
  withErrorHandling(() => {
    if (!data) {
      throw new Error(ERROR_MESSAGE.INVALID_ACCOUNT);
    }

    const account = data;

    if (account && client.wallet.accounts?.includes(account)) {
      client.wallet.currentAccount = account;
      client.transactionHistory.rows = [];

      update(
        ViewType.WALLET,
        ViewType.VIRTUALIZATION_UNIT,
        ViewType.EXECUTOR,
        ViewType.TRANSACTION_HISTORY,
      );
    } else {
      throw new Error(ERROR_MESSAGE.INVALID_ACCOUNT);
    }
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

    client.web3 = new Web3(client.provider);
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
    if (client.web3) {
      client.web3.currentProvider?.disconnect();
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

    const updatedChain = JSON.parse(data) as ValidChain;

    if (!isValidChain(updatedChain)) {
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

    client.wallet.chain = updatedChain;
    client.wallet.chains[chainIndex] = updatedChain;
    client.wallet.chainUpdateStatus = "done";
    client.wallet.uri = undefined;

    reporter.sendTelemetryEvent(TelemetryEventName.EDIT_CHAIN, {
      name: client.wallet.chain.name,
      namespace: client.wallet.chain.namespace,
      id: client.wallet.chain.id.toString(),
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
