import EventEmitter from "events";
import type Web3 from "web3";
import type { AbiFragment, AbiParameter, Contract, Transaction } from "web3";
import { ERROR_MESSAGE, V_UNIT_ABI } from "../constants";
import { ExecutorModelEvent } from "../enums";
import {
  BytecodeCompilerStatus,
  BytecodeStructure,
  ContractTransactionStatus,
  ExecutorFile,
} from "../types";

/**
 * The `ExecutorModel` class provides a comprehensive model to manage and
 * execute bytecode contracts. It encapsulates the logic to handle bytecode
 * compilation, gas estimation, and contract execution.
 *
 * This model primarily interacts with Ethereum-based operations using Web3.js
 * and emits events to signal different stages or statuses of these operations.
 *
 * @emits
 * {ExecutorModelEvent.WAITING_BYTECODE_STRUCTURE} Emitted when waiting for a
 * bytecode structure.
 *
 * @emits
 * {ExecutorModelEvent.SYNC} Emitted to synchronize or update any listeners of
 * state changes.
 *
 * @emits
 * {ExecutorModelEvent.WAITING_GAS} Emitted when waiting for gas estimation.
 *
 * @emits
 * {ExecutorModelEvent.BYTECODE_STRUCTURE_RECEIVED} Emitted when a bytecode
 * structure is received.
 *
 * @emits
 * {ExecutorModelEvent.GAS_RECEIVED} Emitted when gas amount is received.
 *
 * @property {BytecodeCompilerStatus | undefined} compilerStatus
 * Status of the bytecode compiler.
 *
 * @property {ContractTransactionStatus | undefined} contractTransactionStatus
 * Status of the contract transaction.
 *
 * @property {ExecutorFile | undefined} currentFile
 * Current file being processed.
 *
 * @property {boolean} estimating
 * Flag indicating if gas estimation is in progress.
 *
 * @property {string | undefined} gasEstimate
 * Estimated gas required for execution.
 *
 * @property {number | undefined} nargs
 * Number of arguments expected by the bytecode.
 *
 * @property {Bytes | undefined} output
 * The output data after executing the bytecode.
 *
 * @property {Bytes | undefined} transactionHash
 * Hash of the transaction on the Ethereum network.
 *
 * @property {ExecutorFile | undefined} userFile
 * User provided file for execution.
 *
 * @property {BytecodeStructure | undefined} _bytecodeStructure
 * Internal representation of the bytecode structure.
 *
 * @example
 * const executor = new ExecutorModel();
 * executor.on(ExecutorModelEvent.SYNC, () => {
 *     // state synchronization logic
 * });
 */
export class ExecutorModel extends EventEmitter {
  /**
   * Represents the current status of the bytecode compiler.
   *
   * - `undefined` indicates that no compilation process has started.
   * - Other possible values are based on the {@link BytecodeCompilerStatus}
   *   enum, which may include statuses like "compiling", "failed", or
   *   "completed".
   */
  public compilerStatus?: BytecodeCompilerStatus;

  /**
   * Represents the current status of the contract transaction.
   *
   * - `undefined` indicates that no transaction process has started.
   * - Other possible values are based on the {@link ContractTransactionStatus}
   *   enum, which may include statuses like "sending", "sent", or "error".
   */
  public contractTransactionStatus?: ContractTransactionStatus;

  public currentContractInstance?: Contract<typeof V_UNIT_ABI>;

  /**
   * Holds the current file being processed for bytecode compilation and
   * execution.
   *
   * - `undefined` indicates that there's no file currently selected or being
   *   processed.
   * - Otherwise, the value will be an object representation of the file, based
   *   on the {@link ExecutorFile} type.
   */
  public currentFile?: ExecutorFile;

  public currentTransaction?: Transaction;

  /**
   * A boolean flag indicating if the gas estimation process is ongoing.
   *
   * - `true` means the gas estimation is in progress.
   * - `false` means no estimation is currently happening.
   */
  public estimating = false;

  /**
   * Represents the estimated amount of gas required to execute the bytecode.
   *
   * - `undefined` indicates that no gas estimation has been computed yet.
   * - Otherwise, it's a string representation of the estimated gas in wei.
   */
  public gasEstimate?: string;

  /**
   * Specifies the number of arguments expected by the bytecode.
   *
   * - `undefined` means the number of arguments has not been determined yet.
   * - Otherwise, it indicates the exact number of arguments required.
   */
  public nargs?: number;

  /**
   * Represents the user-provided file for bytecode execution.
   *
   * - `undefined` indicates that the user hasn't provided any file yet.
   * - Otherwise, the value will be an object representation of the user's file,
   *   based on the {@link ExecutorFile} type.
   */
  public userFile?: ExecutorFile;

  /**
   * Holds the structure of the bytecode to be executed.
   *
   * The structure includes information required to correctly compile and
   * execute the bytecode.
   *
   * - `undefined` means the bytecode structure has not been determined yet.
   * - Otherwise, it's based on the {@link BytecodeStructure} type, which may
   *   include fields like `key`, `nargs`, and the actual `bytecode`.
   */
  public bytecodeStructure?: BytecodeStructure;

  /**
   * Constructs a new instance of the ExecutorModel class.
   *
   * Initializes the base EventEmitter class.
   */
  constructor() {
    super();
  }

  public async estimateGas(
    input: string,
    from: string,
    vUnitAddress: string,
    web3: Web3,
  ): Promise<void> {
    this.currentContractInstance = new web3.eth.Contract(
      V_UNIT_ABI,
      vUnitAddress,
    );

    const call = this.currentContractInstance.methods.runBytecode(input);

    this.gasEstimate = (await call.estimateGas({ from })).toString();

    this.currentTransaction = {
      from,
      to: this.currentContractInstance.options.address,
      data: call.encodeABI(),
    };
  }

  /**
   * Runs the bytecode by invoking the appropriate contract method.
   *
   * After validating the bytecode structure, it composes the input for the
   * bytecode, estimates the gas required for the transaction, and sends the
   * transaction. It also handles various transaction events like sending,
   * confirmation, and errors.
   *
   * @param args
   * An array of arguments required by the bytecode.
   *
   * @param from
   * The Ethereum address from which the transaction is sent.
   *
   * @param vUnitAddress
   * The Ethereum address of the virtual unit contract.
   *
   * @param web3
   * An instance of the Web3 library to interact with the Ethereum blockchain.
   *
   * @returns
   * A promise that resolves once the bytecode has been executed.
   *
   * @throws {Error}
   * - Throws an error if the bytecode structure is invalid or not set.
   * - Throws an error if there is any issue with the transaction or the
   *   returned data is invalid.
   *
   * @emits ExecutorModelEvent.SYNC
   * Emitted to indicate synchronization with the current state.
   *
   * @emits ExecutorModelEvent.WAITING_GAS
   * Emitted when the system is waiting for the gas estimate.
   *
   * @example
   * executorModel.runBytecode(
   *  args,
   *  fromAddress,
   *  contractAddress,
   *  web3Instance
   * );
   */
  public async runBytecode(gas: string, web3: Web3): Promise<void> {
    if (!this.currentTransaction) {
      throw new Error(ERROR_MESSAGE.INVALID_ARGUMENTS);
    }

    if (!this.currentContractInstance) {
      throw new Error(ERROR_MESSAGE.INVALID_VIRTUALIZATION_UNIT_CONTRACT);
    }

    await web3.eth
      .sendTransaction({ ...this.currentTransaction, gas })
      .on("sending", () => {
        this.contractTransactionStatus = "sending";
        this.emit(ExecutorModelEvent.UPDATE);
      })
      .on("sent", () => {
        this.contractTransactionStatus = "sent";
        this.emit(ExecutorModelEvent.UPDATE);
      })
      .on("confirmation", async ({ receipt }) => {
        this.contractTransactionStatus = undefined;
        this.emit(ExecutorModelEvent.UPDATE);

        const { logs, transactionHash } = receipt;

        const eventAbi =
          this.currentContractInstance?.options.jsonInterface.find(
            (jsonInterface) =>
              jsonInterface.type === "event" &&
              (
                jsonInterface as AbiFragment & {
                  name: string;
                  signature: string;
                }
              ).name === "ContractDeployed",
          );

        const decodedLogs = logs.map((log) => {
          if (eventAbi && eventAbi.inputs && log.topics) {
            const decodedLog = web3.eth.abi.decodeLog(
              eventAbi.inputs as AbiParameter[],
              log.data as string,
              log.topics.slice(1) as string | string[],
            );
            return decodedLog;
          }
          return undefined;
        });

        const bytecodeAddress = decodedLogs[0]?.bytecodeAddress;

        const output = await this.currentContractInstance?.methods
          .getRuntimeReturn(bytecodeAddress as string)
          .call();

        if (output && transactionHash) {
          this.emit(
            ExecutorModelEvent.TRANSACTION_OUTPUT,
            output,
            transactionHash,
          );
        } else {
          throw new Error(ERROR_MESSAGE.INVALID_TRANSACTION_DATA);
        }
      })
      .on("error", (error) => {
        this.contractTransactionStatus = "error";
        this.emit(ExecutorModelEvent.TRANSACTION_ERROR, error);
      });
  }
}
