import { getBalance } from ".";
import { ERROR_MESSAGE } from "../constants";
import { Api, Client } from "../lib";
import { WalletModel } from "../models";
import {
  ExecutorViewState,
  SettingsViewState,
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

export const generateSettingsViewState = (
  client: Client,
  api: Api,
): SettingsViewState => {
  const { authStatus } = api;
  const { telemetry } = client.settings;

  return { telemetry, disabled: authStatus !== "authenticated" };
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
  const { accounts, currentAccount, chain, connected, uri } = client.wallet;
  const { authStatus } = api;

  if (!chain) {
    throw new Error(ERROR_MESSAGE.INVALID_CHAIN);
  }

  return {
    accounts,
    authStatus,
    balance: await getBalance(currentAccount, chain.id, client.web3),
    chain,
    chains: WalletModel.CHAINS,
    currentAccount,
    connected,
    uri,
  };
};
