import { Bytes } from "web3";
import { TransactionHistoryController } from "../controllers";
import { TransactionHistoryModel } from "../models";
import { TransactionHistoryView } from "../views";

/**
 * Enum representing possible commands sent from {@link TransactionHistoryView}
 * to the {@link TransactionHistoryController}
 */
export enum TransactionHistoryCommand {
  READY = "ready",
}

/**
 * Represents a row of the {@link TransactionHistoryModel}.
 */
export type TransactionHistoryRow = {
  output: Bytes;
  transactionHash: Bytes;
  transactionUrl: string;
};

/**
 * Represents the state of the {@link TransactionHistoryView}
 */
export type TransactionHistoryViewState = {
  disabled: boolean;
  rows: TransactionHistoryRow[];
};
