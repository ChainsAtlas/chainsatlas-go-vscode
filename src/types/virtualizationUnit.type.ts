import { VirtualizationUnitController } from "../controllers";
import { SettingsModel, VirtualizationUnitModel, WalletModel } from "../models";
import { VirtualizationUnitView } from "../views";
import { ContractTransactionStatus } from "./common.type";

/**
 * Enum representing possible commands sent from {@link VirtualizationUnitView}
 * to the {@link VirtualizationUnitController}
 */
export enum VirtualizationUnitCommand {
  CLEAR_DEPLOYMENT = "clearDeployment",
  DEPLOY = "deploy",
  READY = "ready",
  SEND = "send",
  SET_CONTRACT = "setContract",
}

/**
 * Represents a mapping of models required
 * for the {@link VirtualizationUnitController} constructor.
 */
export type VirtualizationUnitControllerModelMap = {
  settings: SettingsModel;
  virtualizationUnit: VirtualizationUnitModel;
  wallet: WalletModel;
};

/**
 * Enum representing events emitted from the {@link VirtualizationUnitModel}
 * to the {@link VirtualizationUnitController} to manage state synchronization
 * with the {@link VirtualizationUnitView}.
 */
export enum VirtualizationUnitModelEvent {
  DEPLOYMENT_CONFIRMED = "deploymentConfirmed",
  GAS_RECEIVED = "gasReceived",
  SYNC = "sync",
  WAITING_GAS = "waitingGas",
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
