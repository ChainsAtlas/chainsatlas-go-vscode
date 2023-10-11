import type { Controller } from "../lib";

/**
 * Enum representing common {@link Controller} subclasses events.
 */
export enum ControllerEvent {
  SYNC = "sync",
}

/**
 * Enum representing gas options for the Virtualization Unit View and
 * Executor View transaction forms.
 */
export enum GasOption {
  BUFFER = "buffer",
  CUSTOM = "custom",
  ESTIMATE = "estimate",
}

/**
 * Enum representing possible telemetry event names.
 */
export enum TelemetryEventName {
  ADD_CHAIN = "addChain",
  COMPILE_BYTECODE = "compileBytecode",
  CONNECT = "connect",
  DEPLOY_V_UNIT = "deployVirtualizationUnit",
  EDIT_CHAIN = "editChain",
  EXECUTE_BYTECODE = "executeByecode",
  LOGIN = "login",
  LOGOUT = "logout",
}

/**
 * Enum representing types of views to avoid hardcoded string values when
 * managing view's initialization, state and communication.
 */
export enum ViewType {
  EXECUTOR = "executor",
  TRANSACTION_HISTORY = "transactionHistory",
  VIRTUALIZATION_UNIT = "virtualizationUnit",
  WALLET = "wallet",
}
