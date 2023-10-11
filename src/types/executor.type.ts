import type { SupportedLanguage } from "../enums";
import type { Api } from "../lib";
import type { ExecutorModel } from "../models";
import type { ExecutorView } from "../views/ExecutorView";
import type {
  BytecodeCompilerStatus,
  BytecodeStructure,
} from "./bytecode.type";
import type { ContractTransactionStatus } from "./common.type";

/**
 * Represents the processed user input file stored by the {@link ExecutorModel}
 * to update the {@link ExecutorViewState} and generate a
 * {@link BytecodeStructure} through the {@link Api}.
 */
export type ExecutorFile = {
  content: string;
  extension: SupportedLanguage;
  path: string;
};

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
