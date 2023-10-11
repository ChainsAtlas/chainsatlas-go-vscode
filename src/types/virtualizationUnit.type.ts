import type { VirtualizationUnitView } from "../views";
import type { ContractTransactionStatus } from "./common.type";

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
