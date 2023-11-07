import type { TransactionHistoryModel } from "../models";
import type { TransactionHistoryView } from "../views";

/**
 * Represents a row of the {@link TransactionHistoryModel}.
 */
export type TransactionHistoryRow = {
  output: string;
  txHash: string;
  txUrl: string;
};

/**
 * Represents the state of the {@link TransactionHistoryView}
 */
export type TransactionHistoryViewState = {
  disabled: boolean;
  rows: TransactionHistoryRow[];
};
