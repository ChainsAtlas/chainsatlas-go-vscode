import { Chain } from "@wagmi/chains";
import { ProviderAccounts } from "@walletconnect/universal-provider";
import { WebviewView } from "vscode";
import { Bytes } from "web3";

type BytecodeStructure = {
  bytecode: string;
  key: string;
  nargs: number;
};

type ContractTransactionStatus =
  | "confirmation"
  | "error"
  | "receipt"
  | "sending"
  | "sent"
  | "transactionHash";

type ExecutorData = {
  compiling: boolean;
  contractTransactionStatus?: ContractTransactionStatus;
  currentFile?: ExecutorFile;
  disabled: boolean;
  estimating: boolean;
  gasEstimate?: string;
  nargs?: number;
  userFile?: ExecutorFile;
};

type ExecutorFile = {
  content: string;
  extension: SupportedLanguage;
  path: string;
};

type TransactionHistoryData = {
  disabled: boolean;
  rows: TransactionHistoryRow[];
};

type TransactionHistoryRow = {
  output: Bytes;
  transactionHash: Bytes;
  transactionUrl: string;
};

type SupportedLanguage = "c";

type ViewMap = Record<ViewType, WebviewView>;

type ViewType =
  | "executor"
  | "transactionHistory"
  | "virtualizationUnit"
  | "wallet";

type VirtualizationUnitData = {
  contracts: string[];
  contractTransactionStatus?: ContractTransactionStatus;
  currentContract?: string;
  disabled: boolean;
  estimating: boolean;
  gasEstimate?: string;
};

type VsCodeApi = {
  postMessage(message: { type: string; value?: any }): void;
};

type WalletData = {
  accounts?: ProviderAccounts;
  chain: Chain;
  balance?: string;
  chains: Chain[];
  currentAccount?: string;
  isConnected?: boolean;
  uri?: string;
};

export {
  BytecodeStructure,
  ContractTransactionStatus,
  ExecutorData,
  ExecutorFile,
  SupportedLanguage,
  TransactionHistoryData,
  TransactionHistoryRow,
  ViewMap,
  ViewType,
  VirtualizationUnitData,
  VsCodeApi,
  WalletData,
};
