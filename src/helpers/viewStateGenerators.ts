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
  const { account } = client.wallet;

  return {
    compilerStatus,
    contractTransactionStatus,
    currentFile,
    disabled: !Boolean(account && currentContract),
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
  const { account } = client.wallet;

  return {
    disabled: !Boolean(account),
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
  const { account } = client.wallet;

  return {
    contracts,
    contractTransactionStatus,
    currentContract,
    disabled: !Boolean(account),
    estimating,
    gasEstimate,
  };
};

export const generateWalletViewState = async (
  client: Client,
  api: Api,
): Promise<WalletViewState> => {
  const { account, chain, chainUpdateStatus, chains, connectionStatus, uri } =
    client.wallet;
  const { authStatus } = api;

  return {
    account,
    authStatus,
    balance:
      account && client.provider
        ? await getBalance(account, client.provider)
        : "Loading...",
    chain,
    chainUpdateStatus,
    chains,
    connectionStatus,
    uri,
  };
};
