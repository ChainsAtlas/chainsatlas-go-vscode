import { BrowserProvider, Contract } from "ethers";
import EventEmitter from "events";
import { ERROR_MESSAGE, V_UNIT_ABI } from "../constants";
import { ExecutorModelEvent } from "../enums";
import type {
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
 * This model primarily interacts with Ethereum-based operations using ethers.js
 * and emits events to signal different stages or statuses of these operations.
 *
 * @emits
 * {ExecutorModelEvent.UPDATE} Emitted to synchronize or update any listeners of
 * state changes.
 *
 * @emits
 * {ExecutorModelEvent.TRANSACTION_OUTPUT} Emitted when bytecode execution
 * output is received.
 *
 * @emits
 * {ExecutorModelEvent.TRANSACTION_ERROR} Emitted when bytecode
 * execution throws an error.
 *
 * @example
 * const executor = new ExecutorModel();
 * executor.on(ExecutorModelEvent.UPDATE, () => {
 *     // state synchronization logic
 * });
 */
export class ExecutorModel extends EventEmitter {
  /**
   * Bytecode input to be passed to the virtualization unit
   */
  public bytecodeInput?: string;

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

  /**
   * Represents the current virtualization unit contract instance.
   *
   * - `undefined` indicates that there is no contract instance.
   * - Otherwise the value will be a {@link Contract} object.
   */
  public currentContractInstance?: Contract;

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
   * Constructs a new instance of the ExecutorModel class.
   *
   * Initializes the base EventEmitter class.
   */
  constructor() {
    super();
  }

  /**
   * Estimates the gas required for executing the bytecode with the provided
   * input.
   *
   * This method calculates the estimated gas required to execute the bytecode
   * on the current blockchain using the specified input data and virtualization
   * unit contract.
   *
   * @param {string} input
   * The input data representing the bytecode.
   *
   * @param {string} vUnitAddress
   * The address of the virtualization unit contract.
   *
   * @param {BrowserProvider} provider
   * The ethers.js provider for interacting with the current blockchain.
   *
   * @returns {Promise<void>}
   * A Promise that resolves when the gas estimation is complete.
   *
   * @emits {@link ExecutorModelEvent.UPDATE}
   * Emitted to synchronize or update any listeners of state changes.
   */
  public async estimateGas(
    input: string,
    vUnitAddress: string,
    provider: BrowserProvider,
  ): Promise<void> {
    this.currentContractInstance = new Contract(
      vUnitAddress,
      V_UNIT_ABI,
      await provider.getSigner(),
    );
    this.gasEstimate = (
      await this.currentContractInstance.runBytecode.estimateGas(input)
    ).toString();
    this.bytecodeInput = input;
  }

  /**
   * Runs the bytecode by invoking the appropriate contract method.
   *
   * After validating the bytecode structure, it composes the input for the
   * bytecode, estimates the gas required for the transaction, and sends the
   * transaction. It also handles various transaction events like sending,
   * confirmation, and errors.
   *
   * @param gasLimit
   * The gas limit in wei to be used to deploy the contract transaction.
   *
   * @returns
   * A promise that resolves once the bytecode has been executed.
   *
   * @throws {Error}
   * - Throws an error if the bytecode structure is invalid or not set.
   * - Throws an error if there is any issue with the transaction or the
   *   returned data is invalid.
   *
   * @emits {@link ExecutorModelEvent.UPDATE}
   * Emitted to indicate synchronization with the current state.
   *
   * @emits {@link ExecutorModelEvent.TRANSACTION_OUTPUT}
   * Emitted when the bytecode execution output is received.
   *
   * @emits {@link ExecutorModelEvent.TRANSACTION_ERROR}
   * Emitted when there is an error with the contract transaction.
   *
   * @example
   * executorModel.runBytecode(gasLimit);
   */
  public async runBytecode(gasLimit: string): Promise<void> {
    if (!this.bytecodeInput) {
      throw new Error(ERROR_MESSAGE.INVALID_ARGUMENTS);
    }

    if (!this.currentContractInstance) {
      throw new Error(ERROR_MESSAGE.INVALID_VIRTUALIZATION_UNIT_CONTRACT);
    }

    try {
      this.contractTransactionStatus = "sending";
      this.emit(ExecutorModelEvent.UPDATE);

      const txResponse = await this.currentContractInstance.runBytecode(
        this.bytecodeInput,
        { gasLimit },
      );

      this.contractTransactionStatus = "sent";
      this.emit(ExecutorModelEvent.UPDATE);

      const receipt = await txResponse.wait();

      this.contractTransactionStatus = undefined;
      this.emit(ExecutorModelEvent.UPDATE);

      const eventFilter =
        this.currentContractInstance.filters.ContractDeployed();
      const eventTopicArray = await eventFilter.getTopicFilter();

      if (!eventTopicArray || !eventTopicArray.length) {
        throw Error("Could not find event topic.");
      }

      const logs = receipt.logs.filter((log: any) =>
        log.topics.includes(eventTopicArray[0]),
      );

      const decodedLogs = logs.map(
        (log: any) => this.currentContractInstance?.interface.parseLog(log),
      );

      const bytecodeAddress = decodedLogs[0]?.args?.bytecodeAddress;

      if (!bytecodeAddress) {
        throw new Error("bytecodeAddress is null or undefined");
      }

      const output = await this.currentContractInstance.getRuntimeReturn(
        bytecodeAddress,
      );

      if (output && receipt.hash) {
        this.emit(ExecutorModelEvent.TRANSACTION_OUTPUT, output, receipt.hash);
      } else {
        throw new Error(ERROR_MESSAGE.INVALID_TRANSACTION_DATA);
      }
    } catch (error) {
      this.contractTransactionStatus = "error";
      this.emit(ExecutorModelEvent.TRANSACTION_ERROR, error);
    }
  }
}
