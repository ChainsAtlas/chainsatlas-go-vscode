import { Bytes } from "web3";
import { Controller } from "../lib";
import { TransactionHistoryModel } from "../models";
import { TransactionHistoryView } from "../views";

/**
 * Enum representing possible commands sent from {@link TransactionHistoryView}
 * to the {@link Controller}
 */
export enum TransactionHistoryCommand {
  READY = "transactionHistoryReady",
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
