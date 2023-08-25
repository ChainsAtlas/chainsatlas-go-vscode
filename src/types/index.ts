import { WebviewView } from "vscode";
import { Bytes, ProviderAccounts } from "web3";
import {
  ExecutorModel,
  TransactionHistoryModel,
  VirtualizationUnitModel,
  WalletModel,
} from "../models";

/**
 * Types and Enums
 */

/**
 * Represents the authentication status.
 */
type AuthStatus = "authenticated" | "authenticating";

/**
 * Represents the argument for bytecode.
 */
type BytecodeArg = number;

/**
 * Represents the structure of bytecode.
 */
type BytecodeStructure = {
  bytecode: string;
  key: string;
  nargs: number;
};

/**
 * Represents the status of the bytecode compiler.
 */
type BytecodeCompilerStatus = "compiling" | "done";

/**
 * Represents the status of contract transactions.
 */
type ContractTransactionStatus =
  | "confirmation"
  | "error"
  | "receipt"
  | "sending"
  | "sent"
  | "transactionHash";

/**
 * Enum representing various controller events.
 */
enum ControllerEvent {
  SYNC = "sync",
}

/**
 * Enum representing commands for the executor.
 */
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

/**
 * Represents a mapping of models for the executor controller.
 */
type ExecutorControllerModelMap = {
  executor: ExecutorModel;
  transactionHistory: TransactionHistoryModel;
  virtualizationUnit: VirtualizationUnitModel;
  wallet: WalletModel;
};

/**
 * Represents the state of the executor view.
 */
type ExecutorViewState = {
  compilerStatus?: BytecodeCompilerStatus;
  contractTransactionStatus?: ContractTransactionStatus;
  currentFile?: ExecutorFile;
  disabled: boolean;
  estimating: boolean;
  gasEstimate?: string;
  nargs?: number;
  userFile?: ExecutorFile;
};

/**
 * Represents a file used in the executor.
 */
type ExecutorFile = {
  content: string;
  extension: SupportedLanguage;
  path: string;
};

/**
 * Enum representing events for the executor model.
 */
enum ExecutorModelEvent {
  BYTECODE_STRUCTURE_RECEIVED = "bytecodeStructureReceived",
  GAS_RECEIVED = "gasReceived",
  SYNC = "sync",
  WAITING_BYTECODE_STRUCTURE = "waitingBytecodeStructure",
  WAITING_GAS = "waitingGas",
}

/**
 * Enum representing options for gas.
 */
enum GasOption {
  BUFFER = "buffer",
  CUSTOM = "custom",
  ESTIMATE = "estimate",
}

type SupportedChain = {
  id: number;
  blockExplorer: string;
  name: string;
  rpc: string;
};

/**
 * Enum representing commands for transaction history.
 */
enum TransactionHistoryCommand {
  READY = "ready",
}

/**
 * Represents the state of the transaction history view.
 */
type TransactionHistoryViewState = {
  disabled: boolean;
  rows: TransactionHistoryRow[];
};

/**
 * Represents a row in transaction history.
 */
type TransactionHistoryRow = {
  output: Bytes;
  transactionHash: Bytes;
  transactionUrl: string;
};

/**
 * Represents supported programming languages.
 */
type SupportedLanguage = "c";

/**
 * Represents a map of views.
 */
type ViewMap = Record<ViewType, WebviewView>;

/**
 * Represents a message for the view.
 */
type ViewMessage = { command: string; value?: string };

/**
 * Enum representing types of views.
 */
enum ViewType {
  EXECUTOR = "executor",
  TRANSACTION_HISTORY = "transactionHistory",
  VIRTUALIZATION_UNIT = "virtualizationUnit",
  WALLET = "wallet",
}

/**
 * Enum representing commands for the virtualization unit.
 */
enum VirtualizationUnitCommand {
  CLEAR_DEPLOYMENT = "clearDeployment",
  DEPLOY = "deploy",
  READY = "ready",
  SEND = "send",
  SET_CONTRACT = "setContract",
}

/**
 * Represents a mapping of models for the virtualization unit controller.
 */
type VirtualizationUnitControllerModelMap = {
  virtualizationUnit: VirtualizationUnitModel;
  wallet: WalletModel;
};

/**
 * Enum representing events for the virtualization unit model.
 */
enum VirtualizationUnitModelEvent {
  GAS_RECEIVED = "gasReceived",
  SYNC = "sync",
  WAITING_GAS = "waitingGas",
}

/**
 * Represents the state of the virtualization unit view.
 */
type VirtualizationUnitViewState = {
  contracts: string[];
  contractTransactionStatus?: ContractTransactionStatus;
  currentContract?: string;
  disabled: boolean;
  estimating: boolean;
  gasEstimate?: string;
};

/**
 * Represents the VS Code API for messaging.
 */
type VsCodeApi = {
  postMessage(message: ViewMessage): void;
};

/**
 * Enum representing commands for the wallet.
 */
enum WalletCommand {
  CHANGE_ACCOUNT = "changeAccount",
  CONNECT = "connect",
  DISCONNECT = "disconnect",
  LOGIN = "login",
  LOGOUT = "logout",
  READY = "ready",
}

type WalletControllerModelMap = {
  executor: ExecutorModel;
  transactionHistory: TransactionHistoryModel;
  virtualizationUnit: VirtualizationUnitModel;
  wallet: WalletModel;
};

/**
 * Represents the state of the wallet view.
 */
type WalletViewState = {
  accounts?: ProviderAccounts;
  authStatus?: AuthStatus;
  chain: SupportedChain;
  balance?: string;
  chains: SupportedChain[];
  currentAccount?: string;
  connected?: boolean;
  uri?: string;
};

export {
  AuthStatus,
  BytecodeArg,
  BytecodeCompilerStatus,
  BytecodeStructure,
  ContractTransactionStatus,
  ControllerEvent,
  ExecutorCommand,
  ExecutorControllerModelMap,
  ExecutorFile,
  ExecutorModelEvent,
  ExecutorViewState,
  GasOption,
  SupportedChain,
  SupportedLanguage,
  TransactionHistoryCommand,
  TransactionHistoryRow,
  TransactionHistoryViewState,
  ViewMap,
  ViewMessage,
  ViewType,
  VirtualizationUnitCommand,
  VirtualizationUnitControllerModelMap,
  VirtualizationUnitModelEvent,
  VirtualizationUnitViewState,
  VsCodeApi,
  WalletCommand,
  WalletControllerModelMap,
  WalletViewState,
};
