import type { Controller } from "../lib";
import type { VirtualizationUnitModel } from "../models";
/**
 * Enum representing possible commands sent from the Virtualization Unit View
 * to the {@link Controller}
 */
export enum VirtualizationUnitCommand {
  CHANGE_CONTRACT = "changeContract",
  CLEAR_DEPLOYMENT = "clearDeployment",
  DEPLOY = "deploy",
  ESTIMATE_GAS = "estimateGas",
  READY = "virtualizationUnitReady",
}

/**
 * Enum representing events emitted from the {@link VirtualizationUnitModel}
 * to the {@link Controller} to manage state synchronization with the
 * Virtualization Unit View.
 */
export enum VirtualizationUnitModelEvent {
  TRANSACTION_CONFIRMED = "transactionConfirmed",
  TRANSACTION_ERROR = "transactionError",
  UPDATE = "update",
}
