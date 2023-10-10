/**
 * Enum representing possible commands sent from {@link VirtualizationUnitView}
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
 * to the {@linkController} to manage state synchronization with the
 * {@link VirtualizationUnitView}.
 */
export enum VirtualizationUnitModelEvent {
  TRANSACTION_CONFIRMED = "transactionConfirmed",
  TRANSACTION_ERROR = "transactionError",
  UPDATE = "update",
}
