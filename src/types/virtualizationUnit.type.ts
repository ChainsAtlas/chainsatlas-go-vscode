import { Controller } from "../lib";
import { VirtualizationUnitModel } from "../models";
import { VirtualizationUnitView } from "../views";
import { ContractTransactionStatus } from "./common.type";

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
 * to the {@linkController} to manage state synchronization
 * with the {@link VirtualizationUnitView}.
 */
export enum VirtualizationUnitModelEvent {
  TRANSACTION_CONFIRMED = "transactionConfirmed",
  TRANSACTION_ERROR = "transactionError",
  UPDATE = "update",
}

/**
 * Represents the state of the {@link VirtualizationUnitView}
 */
export type VirtualizationUnitViewState = {
  contracts: string[];
  contractTransactionStatus?: ContractTransactionStatus;
  currentContract?: string;
  disabled: boolean;
  estimating: boolean;
  gasEstimate?: string;
};
