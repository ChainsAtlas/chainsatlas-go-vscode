import { Chain } from "@wagmi/chains";
import { ProviderAccounts } from "@walletconnect/universal-provider";
import { WebviewView } from "vscode";
import { Bytes } from "web3";
import {
  ExecutorModel,
  TransactionHistoryModel,
  VirtualizationUnitModel,
  WalletModel,
} from "../models";

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

enum ControllerEvent {
  SYNC = "sync",
}

enum ExecutorCommand {
  CANCEL_COMPILE = "cancelCompile",
  CANCEL_EXECUTION = "cancelExecution",
  CLEAR_FILE = "clearFile",
  COMPILE = "compile",
  ESTIMATE = "estimate",
  EXECUTE = "execute",
  GET_ACTIVE_FILE = "getActiveFile",
  READY = "ready",
  SELECT_FILE = "selectFile",
}

type ExecutorControllerModelMap = {
  executor: ExecutorModel;
  transactionHistory: TransactionHistoryModel;
  virtualizationUnit: VirtualizationUnitModel;
  wallet: WalletModel;
};

type ExecutorViewState = {
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

enum GasOption {
  BUFFER = "buffer",
  CUSTOM = "custom",
  ESTIMATE = "estimate",
}

enum TransactionHistoryCommand {
  READY = "ready",
}

type TransactionHistoryViewState = {
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

type ViewMessage = { command: string; value?: string };

enum ViewType {
  EXECUTOR = "executor",
  TRANSACTION_HISTORY = "transactionHistory",
  VIRTUALIZATION_UNIT = "virtualizationUnit",
  WALLET = "wallet",
}

enum VirtualizationUnitCommand {
  CLEAR_DEPLOYMENT = "clearDeployment",
  DEPLOY = "deploy",
  READY = "ready",
  SEND = "send",
  SET_CONTRACT = "setContract",
}

type VirtualizationUnitControllerModelMap = {
  virtualizationUnit: VirtualizationUnitModel;
  wallet: WalletModel;
};

type VirtualizationUnitViewState = {
  contracts: string[];
  contractTransactionStatus?: ContractTransactionStatus;
  currentContract?: string;
  disabled: boolean;
  estimating: boolean;
  gasEstimate?: string;
};

type VsCodeApi = {
  postMessage(message: ViewMessage): void;
};

enum WalletCommand {
  CHANGE_ACCOUNT = "changeAccount",
  CONNECT = "connect",
  DISCONNECT = "disconnect",
  READY = "ready",
}

type WalletControllerModelMap = {
  executor: ExecutorModel;
  transactionHistory: TransactionHistoryModel;
  virtualizationUnit: VirtualizationUnitModel;
  wallet: WalletModel;
};

type WalletViewState = {
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
  ControllerEvent,
  ExecutorCommand,
  ExecutorControllerModelMap,
  ExecutorFile,
  ExecutorViewState,
  GasOption,
  SupportedLanguage,
  TransactionHistoryCommand,
  TransactionHistoryRow,
  TransactionHistoryViewState,
  ViewMap,
  ViewMessage,
  ViewType,
  VirtualizationUnitCommand,
  VirtualizationUnitControllerModelMap,
  VirtualizationUnitViewState,
  VsCodeApi,
  WalletCommand,
  WalletControllerModelMap,
  WalletViewState,
};
