import { ExecutorController } from "../controllers";
import { Api } from "../lib";
import {
  ExecutorModel,
  SettingsModel,
  TransactionHistoryModel,
  VirtualizationUnitModel,
  WalletModel,
} from "../models";
import { ExecutorView } from "../views/ExecutorView";
import { BytecodeCompilerStatus, BytecodeStructure } from "./bytecode.type";
import { ContractTransactionStatus } from "./common.type";

/**
 * Enum representing possible commands sent from {@link ExecutorView}
 * to the {@link ExecutorController}
 */
export enum ExecutorCommand {
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
 * Represents a mapping of models required
 * for the {@link ExecutorController} constructor.
 */
export type ExecutorControllerModelMap = {
  executor: ExecutorModel;
  settings: SettingsModel;
  transactionHistory: TransactionHistoryModel;
  virtualizationUnit: VirtualizationUnitModel;
  wallet: WalletModel;
};

/**
 * Represents the processed user input file stored by the
 * {@link ExecutorModel} to update the {@link ExecutorViewState}
 * and generate a {@link BytecodeStructure} through the {@link Api}.
 */
export type ExecutorFile = {
  content: string;
  extension: SupportedLanguage;
  path: string;
};

/**
 * Enum representing events emitted from the {@link ExecutorModel}
 * to the {@link ExecutorController} to manage state synchronization
 * with the {@link ExecutorView}.
 */
export enum ExecutorModelEvent {
  BYTECODE_STRUCTURE_RECEIVED = "bytecodeStructureReceived",
  EXECUTION_CONFIRMED = "executionConfirmed",
  GAS_RECEIVED = "gasReceived",
  SYNC = "sync",
  WAITING_BYTECODE_STRUCTURE = "waitingBytecodeStructure",
  WAITING_GAS = "waitingGas",
}

/**
 * Represents the state of the {@link ExecutorView}
 */
export type ExecutorViewState = {
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
 * Enum representing the possible sources of a file for appropriate handling
 * by the {@link ExecutorController}.
 *
 * - `ACTIVE`: Indicates the file is currently active in the editor.
 * - `INPUT`: Indicates the file is fetched through user input or selection.
 */
export enum FileSource {
  ACTIVE = "active",
  INPUT = "input",
}

/**
 * Enum representing the supported programming languages of the ChainsAtlas' VirtualizationUnit.
 *
 * It is used by the {@link ExecutorController} to filter user's file input.
 */
export enum SupportedLanguage {
  C = "c",
}
