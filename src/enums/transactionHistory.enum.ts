import type { Controller } from "../lib";

/**
 * Enum representing possible commands sent from  Transaction History View
 * to the {@link Controller}
 */
export enum TransactionHistoryCommand {
  READY = "transactionHistoryReady",
}
