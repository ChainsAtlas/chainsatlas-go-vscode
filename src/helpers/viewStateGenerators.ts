import { getBalance } from ".";
import { Api, Client } from "../lib";
import type {
  ExecutorViewState,
  TransactionHistoryViewState,
  VirtualizationUnitViewState,
  WalletViewState,
} from "../types";

export const generateExecutorViewState = (
  client: Client,
  _api: Api,
): ExecutorViewState => {
  const {
    compilerStatus,
    contractTransactionStatus,
    currentFile,
    estimating,
    gasEstimate,
    nargs,
    userFile,
  } = client.executor;
  const { currentContract } = client.virtualizationUnit;
  const { currentAccount } = client.wallet;

  return {
    compilerStatus,
    contractTransactionStatus,
    currentFile,
    disabled: !Boolean(currentAccount && currentContract),
    estimating,
    gasEstimate,
    nargs,
    userFile,
  };
};

export const generateTransactionHistoryViewState = (
  client: Client,
  _api: Api,
): TransactionHistoryViewState => {
  const { rows } = client.transactionHistory;
  const { currentAccount } = client.wallet;

  return {
    disabled: !Boolean(currentAccount),
    rows,
  };
};

export const generateVirtualizationUnitViewState = (
  client: Client,
  _api: Api,
): VirtualizationUnitViewState => {
  const {
    contracts,
    contractTransactionStatus,
    currentContract,
    estimating,
    gasEstimate,
  } = client.virtualizationUnit;
  const { currentAccount } = client.wallet;

  return {
    contracts,
    contractTransactionStatus,
    currentContract,
    disabled: !Boolean(currentAccount),
    estimating,
    gasEstimate,
  };
};

export const generateWalletViewState = async (
  client: Client,
  api: Api,
): Promise<WalletViewState> => {
  const {
    accounts,
    currentAccount,
    chain,
    chainUpdateStatus,
    chains,
    connected,
    uri,
  } = client.wallet;
  const { authStatus } = api;

  return {
    accounts,
    authStatus,
    balance:
      chain && currentAccount && client.web3
        ? await getBalance(currentAccount, chain.id, client.web3)
        : "0",
    chainUpdateStatus,
    chains,
    currentAccount,
    connected,
    uri,
  };
};
