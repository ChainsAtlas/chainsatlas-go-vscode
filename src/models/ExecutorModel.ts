import EventEmitter from "events";
import Web3, { AbiFragment, AbiParameter, Bytes } from "web3";
import { withErrorHandling } from "../Utils";
import { ERROR_MESSAGE, V_UNIT_ABI } from "../constants";
import {
  BytecodeArg,
  BytecodeCompilerStatus,
  BytecodeStructure,
  ContractTransactionStatus,
  ExecutorFile,
  ExecutorModelEvent,
} from "../types";

/**
 * The `ExecutorModel` class provides a comprehensive model to manage and execute bytecode contracts.
 * It encapsulates the logic to handle bytecode compilation, gas estimation, and contract execution.
 * This model primarily interacts with Ethereum-based operations using Web3.js and emits events to
 * signal different stages or statuses of these operations.
 *
 * @emits {ExecutorModelEvent.WAITING_BYTECODE_STRUCTURE} Emitted when waiting for a bytecode structure.
 * @emits {ExecutorModelEvent.SYNC} Emitted to synchronize or update any listeners of state changes.
 * @emits {ExecutorModelEvent.WAITING_GAS} Emitted when waiting for gas estimation.
 * @emits {ExecutorModelEvent.BYTECODE_STRUCTURE_RECEIVED} Emitted when a bytecode structure is received.
 * @emits {ExecutorModelEvent.GAS_RECEIVED} Emitted when gas amount is received.
 *
 * @property {BytecodeCompilerStatus | undefined} compilerStatus - Status of the bytecode compiler.
 * @property {ContractTransactionStatus | undefined} contractTransactionStatus - Status of the contract transaction.
 * @property {ExecutorFile | undefined} currentFile - Current file being processed.
 * @property {boolean} estimating - Flag indicating if gas estimation is in progress.
 * @property {string | undefined} gasEstimate - Estimated gas required for execution.
 * @property {number | undefined} nargs - Number of arguments expected by the bytecode.
 * @property {Bytes | undefined} output - The output data after executing the bytecode.
 * @property {Bytes | undefined} transactionHash - Hash of the transaction on the Ethereum network.
 * @property {ExecutorFile | undefined} userFile - User provided file for execution.
 * @property {BytecodeStructure | undefined} _bytecodeStructure - Internal representation of the bytecode structure.
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
   * - Other possible values are based on the {@link BytecodeCompilerStatus} enum,
   *   which may include statuses like "compiling", "failed", or "completed".
   */
  public compilerStatus?: BytecodeCompilerStatus;

  /**
   * Represents the current status of the contract transaction.
   *
   * - `undefined` indicates that no transaction process has started.
   * - Other possible values are based on the {@link ContractTransactionStatus} enum,
   *   which may include statuses like "sending", "sent", or "error".
   */
  public contractTransactionStatus?: ContractTransactionStatus;

  /**
   * Holds the current file being processed for bytecode compilation and execution.
   *
   * - `undefined` indicates that there's no file currently selected or being processed.
   * - Otherwise, the value will be an object representation of the file, based on the {@link ExecutorFile} type.
   */
  public currentFile?: ExecutorFile;

  /**
   * A boolean flag indicating if the gas estimation process is currently ongoing.
   *
   * - `true` means the gas estimation is in progress.
   * - `false` means no estimation is currently happening.
   */
  public estimating = false;

  /**
   * Represents the estimated amount of gas required to execute the bytecode.
   *
   * - `undefined` indicates that no gas estimation has been computed yet.
   * - Otherwise, it's a string representation of the estimated gas amount in wei.
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
   * Represents the output data after executing the bytecode.
   *
   * - `undefined` means no output has been generated or the bytecode has not been executed yet.
   * - Otherwise, it will contain the output data in bytes format.
   */
  public output?: Bytes;

  /**
   * Represents the hash of the transaction after it's broadcasted to the Ethereum network.
   *
   * - `undefined` indicates that the transaction has not been broadcasted yet.
   * - Otherwise, it will contain the hash of the transaction.
   */
  public transactionHash?: Bytes;

  /**
   * Represents the user-provided file for bytecode execution.
   *
   * - `undefined` indicates that the user hasn't provided any file yet.
   * - Otherwise, the value will be an object representation of the user's file, based on the {@link ExecutorFile} type.
   */
  public userFile?: ExecutorFile;

  /**
   * Holds the structure of the bytecode to be executed.
   *
   * The structure includes information required to correctly compile and execute the bytecode.
   *
   * - `undefined` means the bytecode structure has not been determined yet.
   * - Otherwise, it's based on the {@link BytecodeStructure} type, which may include fields like `key`, `nargs`, and the actual `bytecode`.
   */
  private _bytecodeStructure?: BytecodeStructure;

  /**
   * Constructs a new instance of the ExecutorModel class.
   *
   * Initializes the base EventEmitter class.
   */
  constructor() {
    super();
  }

  /**
   * Cancels the current bytecode execution process.
   *
   * This method resets various properties to indicate that the bytecode execution
   * has been stopped or hasn't started. It doesn't have any direct side effects
   * on the Ethereum network or contracts, but rather affects the internal state of the class.
   */
  public cancelExecution = (): void => {
    this.compilerStatus = undefined;
    this.contractTransactionStatus = undefined;
    this.gasEstimate = undefined;
  };

  /**
   * Compiles the bytecode based on the provided number of arguments.
   *
   * This method initiates the compilation process for the bytecode associated with the user file.
   * It sets the internal state to indicate the start of the compilation process, emits relevant events,
   * and finally retrieves and sets the bytecode structure once compilation is complete.
   *
   * @param nargs - The number of arguments that the bytecode is expected to take.
   * @returns A promise that resolves once the compilation is completed.
   *
   * @throws {Error} - Throws an error if no user file is present or if any other unexpected issue occurs.
   *
   * @emits ExecutorModelEvent.WAITING_BYTECODE_STRUCTURE - Emitted to indicate that the system is waiting for the bytecode structure.
   * @emits ExecutorModelEvent.SYNC - Emitted after the bytecode has been compiled to synchronize the state.
   */
  public compileBytecode = async (nargs: number): Promise<void> =>
    withErrorHandling(async () => {
      if (!this.userFile) {
        throw new Error(ERROR_MESSAGE.INVALID_FILE);
      }

      this._bytecodeStructure = undefined;
      this.compilerStatus = "compiling";
      this.currentFile = undefined;
      this.nargs = undefined;

      this.emit(
        ExecutorModelEvent.WAITING_BYTECODE_STRUCTURE,
        this.userFile,
        nargs,
      );

      this._bytecodeStructure = await this._getBytecodeStructure();
      this.compilerStatus = "done";
      this.currentFile = this.userFile;
      this.nargs = nargs;

      this.emit(ExecutorModelEvent.SYNC);
    })();

  /**
   * Runs the bytecode by invoking the appropriate contract method on the blockchain.
   *
   * This method initiates the process to execute the bytecode on the blockchain.
   * After validating the bytecode structure, it composes the input for the bytecode,
   * estimates the gas required for the transaction, and sends the transaction.
   * It also handles various transaction events like sending, confirmation, and errors.
   *
   * @param args - An array of arguments required by the bytecode.
   * @param from - The Ethereum address from which the transaction is sent.
   * @param vUnitAddress - The Ethereum address of the virtual unit contract.
   * @param web3 - An instance of the Web3 library to interact with the Ethereum blockchain.
   *
   * @returns A promise that resolves once the bytecode has been executed.
   *
   * @throws {Error}
   * - Throws an error if the bytecode structure is invalid or not set.
   * - Throws an error if there is any issue with the transaction or the returned data is invalid.
   *
   * @emits ExecutorModelEvent.SYNC - Emitted to indicate synchronization with the current state.
   * @emits ExecutorModelEvent.WAITING_GAS - Emitted when the system is waiting for the gas estimate.
   *
   * @example
   * executorModel.runBytecode(args, fromAddress, contractAddress, web3Instance);
   */
  public runBytecode = async (
    args: BytecodeArg[],
    from: string,
    vUnitAddress: string,
    web3: Web3,
  ): Promise<void> =>
    withErrorHandling(async () => {
      if (!this._bytecodeStructure) {
        throw new Error(ERROR_MESSAGE.INVALID_BYTECODE_STRUCTURE);
      }

      this.estimating = true;

      this.emit(ExecutorModelEvent.SYNC);

      const contractInstance = new web3.eth.Contract(V_UNIT_ABI, vUnitAddress);

      const inputBytecode = await this._composeInput(
        this._bytecodeStructure,
        args,
      );

      const call = contractInstance.methods.runBytecode(inputBytecode);

      this.gasEstimate = (await call.estimateGas({ from })).toString();

      this.estimating = false;

      this.emit(ExecutorModelEvent.WAITING_GAS);

      const gas = await this._getGas();

      const tx = {
        to: contractInstance.options.address,
        data: call.encodeABI(),
        gas,
        from,
      };

      await web3.eth
        .sendTransaction(tx)
        .on("sending", () => {
          this.contractTransactionStatus = "sending";
          this.emit(ExecutorModelEvent.SYNC);
        })
        .on("sent", () => {
          this.contractTransactionStatus = "sent";
          this.emit(ExecutorModelEvent.SYNC);
        })
        .on("confirmation", async ({ receipt }) => {
          this.emit(ExecutorModelEvent.EXECUTION_CONFIRMED);

          this.contractTransactionStatus = undefined;

          const { logs, transactionHash } = receipt;

          const eventAbi = contractInstance.options.jsonInterface.find(
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

          const output = await contractInstance.methods
            .getRuntimeReturn(bytecodeAddress as string)
            .call();

          if (output && transactionHash) {
            this.output = output;
            this.transactionHash = transactionHash;

            this.emit(ExecutorModelEvent.SYNC);
          } else {
            throw new Error(ERROR_MESSAGE.INVALID_TRANSACTION_DATA);
          }
        })
        .on("error", (e) => {
          this.contractTransactionStatus = "error";
          this.emit(ExecutorModelEvent.SYNC);

          throw e;
        });
    })();

  // -------------------- Private --------------------
  /**
   * Composes the final bytecode by replacing placeholders with the provided input arguments.
   *
   * This method takes the base bytecode structure and substitutes the placeholders with
   * the actual values provided in `inputArgs`. The placeholders are determined using the
   * `key` from the `bytecodeStructure` and the index of the argument in `inputArgs`.
   *
   * @param bytecodeStructure - The structure of the bytecode that contains placeholders for arguments.
   * @param inputArgs - An array of arguments to replace the placeholders in the bytecode.
   *
   * @returns The final composed bytecode string, prefixed with "0x".
   *
   * @throws {Error}
   * - Throws an error if the number of arguments provided in `inputArgs` does not match the
   *   expected number of arguments (`nargs`) in `bytecodeStructure`.
   */
  private _composeInput = (
    bytecodeStructure: BytecodeStructure,
    inputArgs: BytecodeArg[],
  ): string => {
    const key = BigInt(bytecodeStructure.key);
    const nargs = bytecodeStructure.nargs;

    let bytecode = bytecodeStructure.bytecode;

    if (nargs !== inputArgs.length) {
      throw new Error(ERROR_MESSAGE.ARGS_MISMATCH);
    }

    for (let i = 0; i < nargs; i++) {
      const lookup = (key + BigInt(i)).toString(16);
      const replacement = BigInt(inputArgs[i]).toString(16).padStart(32, "0");

      if (bytecode.includes(lookup)) {
        bytecode = bytecode.replace(lookup, replacement);
      }
    }

    return `0x${bytecode}`;
  };

  /**
   * Retrieves the bytecode structure when the corresponding event is emitted.
   *
   * This method waits for the `ExecutorModelEvent.BYTECODE_STRUCTURE_RECEIVED` event to be emitted
   * and then resolves the promise with the received bytecode structure.
   *
   * @returns A promise that resolves with the received bytecode structure.
   */
  private _getBytecodeStructure = (): Promise<BytecodeStructure> => {
    return new Promise((resolve) => {
      this.once(
        ExecutorModelEvent.BYTECODE_STRUCTURE_RECEIVED,
        (bytecodeStructure: BytecodeStructure) => {
          resolve(bytecodeStructure);
        },
      );
    });
  };

  /**
   * Retrieves the gas estimate when the corresponding event is emitted.
   *
   * This method waits for the `ExecutorModelEvent.GAS_RECEIVED` event to be emitted
   * and then resolves the promise with the received gas estimate.
   *
   * @returns A promise that resolves with the received gas estimate.
   */
  private _getGas = (): Promise<string> => {
    return new Promise((resolve) => {
      this.once(ExecutorModelEvent.GAS_RECEIVED, (gas: string) => {
        resolve(gas);
      });
    });
  };
}
