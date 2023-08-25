import EventEmitter from "events";
import Web3, { AbiFragment, AbiParameter, Bytes } from "web3";
import { ERROR_MESSAGE, V_UNIT_ABI } from "../constants";
import {
  BytecodeArg,
  BytecodeCompilerStatus,
  BytecodeStructure,
  ContractTransactionStatus,
  ExecutorFile,
  ExecutorModelEvent,
} from "../types";

class ExecutorModel extends EventEmitter {
  public compilerStatus?: BytecodeCompilerStatus;
  public contractTransactionStatus?: ContractTransactionStatus;
  public currentFile?: ExecutorFile;
  public estimating = false;
  public gasEstimate?: string;
  public nargs?: number;
  public output?: Bytes;
  public transactionHash?: Bytes;
  public userFile?: ExecutorFile;

  private _bytecodeStructure?: BytecodeStructure;

  constructor() {
    super();
  }

  public cancelExecution = (): void => {
    this.compilerStatus = undefined;
    this.contractTransactionStatus = undefined;
    this.gasEstimate = undefined;
  };

  public compileBytecode = async (nargs: number): Promise<void> => {
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
  };

  public runBytecode = async (
    args: BytecodeArg[],
    from: string,
    vUnitAddress: string,
    web3: Web3,
  ): Promise<void> => {
    try {
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
    } catch (e) {
      if (e instanceof Error) {
        throw e;
      }

      throw new Error(JSON.stringify(e));
    }
  };

  // -------------------- Private --------------------

  private _composeInput = (
    bytecodeStruct: BytecodeStructure,
    inputArgs: BytecodeArg[],
  ): string => {
    const key = BigInt(bytecodeStruct.key);
    const nargs = bytecodeStruct.nargs;

    let bytecode = bytecodeStruct.bytecode;

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

  private _getGas = (): Promise<string> => {
    return new Promise((resolve) => {
      this.once(ExecutorModelEvent.GAS_RECEIVED, (gas: string) => {
        resolve(gas);
      });
    });
  };
}

export default ExecutorModel;
