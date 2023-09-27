import Web3 from "web3";
import { ERROR_MESSAGE } from "../constants";
import { isChain } from "../typeguards";
import { Chain, ViewMessageHandler, ViewType } from "../types";
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

    const newChain = JSON.parse(data) as Chain;

    if (!isChain(newChain)) {
      client.wallet.chainUpdateStatus = undefined;

      await update(ViewType.WALLET);

      throw new Error(ERROR_MESSAGE.INVALID_CHAIN);
    }

    client.wallet.chain = newChain;
    client.wallet.chains.push(newChain);
    client.wallet.chains.sort((a, b) => a.name.localeCompare(b.name));
    client.wallet.chainUpdateStatus = "done";
    client.wallet.uri = undefined;

    await update(ViewType.WALLET);

    connect(newChain.id.toString(), update, client, _api);
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

    client.wallet.chain = updatedChain;
    client.wallet.chains[chainIndex] = updatedChain;
    client.wallet.chainUpdateStatus = "done";
    client.wallet.uri = undefined;

    await update(ViewType.WALLET);

    connect(updatedChain.id.toString(), update, client, _api);
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
