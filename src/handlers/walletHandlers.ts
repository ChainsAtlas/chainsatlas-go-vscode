import Web3 from "web3";
import { ERROR_MESSAGE } from "../constants";
import { ViewMessageHandler, ViewType } from "../types";
import { withErrorHandling } from "../utils";

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

    client.web3 = new Web3(client.provider);
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

    update(ViewType.WALLET);
  })();
};

export const logout: ViewMessageHandler = async (data, update, client, api) => {
  withErrorHandling(async () => {
    api.logout();
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
