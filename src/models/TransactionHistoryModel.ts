import { TransactionHistoryRow } from "../types";

class TransactionHistoryModel {
  public currentAccount?: string;
  public rows: TransactionHistoryRow[] = [];

  constructor() {}

  public addRow = (row: TransactionHistoryRow): void => {
    this.rows.unshift(row);
  };

  public clear = () => {
    this.rows = [];
  };
}

export default TransactionHistoryModel;
