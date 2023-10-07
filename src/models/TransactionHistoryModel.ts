import { TransactionHistoryRow } from "../types";

/**
 * Represents the model for managing the transaction history associated with a
 * particular account.
 *
 * This class provides functionalities to maintain a list of transaction history
 * rows and manage operations such as adding a new row or clearing the existing
 * history.
 *
 * @example
 * const historyModel = new TransactionHistoryModel();
 * historyModel.addRow({
 *  transactionHash: '0x123...',
 *  transactionUrl: 'http://example.com/tx/0x123...'
 * });
 */
export class TransactionHistoryModel {
  /**
   * An array containing rows of transaction history associated with the
   * `currentAccount`. Each row provides details about a particular transaction,
   * such as the transaction hash and URL.
   */
  public rows: TransactionHistoryRow[] = [];

  /**
   * Initializes a new instance of the `TransactionHistoryModel` class.
   *
   * Upon instantiation, the `rows` property is initialized as an empty array.
   */
  constructor() {}
}
