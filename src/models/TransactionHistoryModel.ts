import { TransactionHistoryRow } from "../types";

/**
 * Represents the model for managing the transaction history associated with a particular account.
 *
 * This class provides functionalities to maintain a list of transaction history rows
 * and manage operations such as adding a new row or clearing the existing history.
 *
 * @example
 * const historyModel = new TransactionHistoryModel();
 * historyModel.addRow({ transactionHash: '0x123...', transactionUrl: 'http://example.com/tx/0x123...' });
 */
class TransactionHistoryModel {
  /**
   * The Ethereum address of the current account associated with the transaction history.
   * This address is expected to be a valid Ethereum address string.
   */
  public currentAccount?: string;

  /**
   * An array containing rows of transaction history associated with the `currentAccount`.
   * Each row provides details about a particular transaction, such as the transaction hash and URL.
   */
  public rows: TransactionHistoryRow[] = [];

  /**
   * Initializes a new instance of the `TransactionHistoryModel` class.
   *
   * Upon instantiation, the `rows` property is initialized as an empty array.
   */
  constructor() {}

  /**
   * Adds a new transaction history row to the `rows` array.
   * The new row is added to the beginning of the array, making it the most recent transaction.
   *
   * @param row - The transaction history row to be added. This row should contain details
   *              about the transaction such as its hash and the URL where it can be viewed.
   */
  public addRow = (row: TransactionHistoryRow): void => {
    this.rows.unshift(row);
  };

  /**
   * Clears the transaction history by resetting the `rows` array to an empty array.
   * This method is useful when there's a need to remove all transaction history associated
   * with the current account, for instance, when logging out or switching accounts.
   */
  public clear = () => {
    this.rows = [];
  };
}

export default TransactionHistoryModel;
