/**
 * Enum representing possible commands sent from {@link ExecutorView} to the
 * {@link Controller}
 */
export enum ExecutorCommand {
  CANCEL_COMPILE = "cancelCompile",
  CANCEL_EXECUTION = "cancelExecution",
  CLEAR_FILE = "clearFile",
  COMPILE_BYTECODE = "compileBytecode",
  ESTIMATE_GAS = "estimateGas",
  EXECUTE_BYTECODE = "executeBytecode",
  GET_ACTIVE_FILE = "getActiveFile",
  READY = "executorReady",
  SELECT_FILE = "selectFile",
}

/**
 * Enum representing events emitted from the {@link ExecutorModel} to the
 * {@link Controller} to manage state synchronization with the
 * {@link ExecutorView}.
 */
export enum ExecutorModelEvent {
  TRANSACTION_ERROR = "transactionError",
  TRANSACTION_OUTPUT = "transactionOutput",
  UPDATE = "update",
}

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
 * Enum representing the supported programming languages of the ChainsAtlas'
 * VirtualizationUnit.
 *
 * It is used by the {@link ExecutorController} to filter user's file input.
 */
export enum SupportedLanguage {
  C = "c",
}
