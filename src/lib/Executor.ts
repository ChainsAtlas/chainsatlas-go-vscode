import EventEmitter from "events";
import Web3, { AbiFragment, AbiParameter, Bytes } from "web3";
import { V_UNIT_ABI } from "../constants";
import {
  BytecodeStructure,
  ExecutorFile,
  VirtualizationUnitMethods,
} from "../types";

import fetch from "cross-fetch";

class Executor extends EventEmitter {
  private static readonly _API_TOKEN = "rBzCg5dLhoBdXdC15vNa2";

  public currentFile?: ExecutorFile;
  public gasEstimate?: string;
  public nargs?: number;

  private _bytecodeStruct?: BytecodeStructure;

  constructor() {
    super();
  }

  public async compileBytecode(
    file: ExecutorFile,
    nargs: number,
  ): Promise<void> {
    try {
      const data = {
        entrypoint_nargs: nargs,
        language: file.extension,
        source_code: file.content,
      };

      const response = await fetch(
        "https://api.chainsatlas.com/build/generate",
        {
          method: "POST",
          body: JSON.stringify(data),
          headers: {
            "Content-Type": "application/json",
            "x-access-tokens": Executor._API_TOKEN,
          },
        },
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      this._bytecodeStruct = (await response.json()).data;

      this.currentFile = file;
      this.nargs = nargs;
    } catch (e) {
      if (e instanceof Error) {
        throw e;
      }

      throw new Error(JSON.stringify(e));
    }
  }

  public async runBytecode(
    args: any[],
    from: string,
    vUnitAddress: string,
    web3: Web3,
  ): Promise<{ transactionHash: Bytes; output: string }> {
    try {
      if (!this._bytecodeStruct) {
        throw new Error("Invalid bytecode structure.");
      }

      const contractInstance = new web3.eth.Contract(V_UNIT_ABI, vUnitAddress);

      const inputBytecode = await this._composeInput(
        this._bytecodeStruct,
        args.map((arg) => Number(arg)),
      );

      const call = (
        contractInstance.methods as unknown as VirtualizationUnitMethods
      ).runBytecode(inputBytecode);

      this.gasEstimate = (await call.estimateGas({ from })).toString();

      this.emit("gasEstimated");

      const gas = await this._getUserGas();

      const tx = {
        to: contractInstance.options.address,
        data: call.encodeABI(),
        gas,
        from,
      };

      const { transactionHash, logs } = await web3.eth.sendTransaction(tx);

      const eventAbi = contractInstance.options.jsonInterface.find(
        (jsonInterface) =>
          jsonInterface.type === "event" &&
          (jsonInterface as AbiFragment & { name: string; signature: string })
            .name === "ContractDeployed",
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
      });

      const bytecodeAddress = decodedLogs[0]?.bytecodeAddress;

      const output = await (
        contractInstance.methods as unknown as VirtualizationUnitMethods
      )
        .getRuntimeReturn(bytecodeAddress as string)
        .call();

      return { transactionHash, output };
    } catch (e) {
      if (e instanceof Error) {
        throw e;
      }

      throw new Error(JSON.stringify(e));
    }
  }

  // -------------------- Private --------------------

  private _composeInput(
    bytecodeStruct: BytecodeStructure,
    inputData: any[],
  ): string {
    try {
      const key = BigInt(bytecodeStruct.key);
      const nargs = bytecodeStruct.nargs;

      let bytecode = bytecodeStruct.bytecode;

      if (nargs !== inputData.length) {
        throw new Error(
          `The number of argument is a constant, to update it please generate a new bytecodeStruct through the API`,
        );
      }

      for (let i = 0; i < nargs; i++) {
        const lookup = (key + BigInt(i)).toString(16);
        const replacement = BigInt(inputData[i]).toString(16).padStart(32, "0");

        if (bytecode.includes(lookup)) {
          bytecode = bytecode.replace(lookup, replacement);
        } else {
          throw new Error(`Failed to adjust the bytecode.`);
        }
      }

      return "0x" + bytecode;
    } catch (e) {
      if (e instanceof Error) {
        throw e;
      }

      throw new Error(JSON.stringify(e));
    }
  }

  private _getUserGas(): Promise<string> {
    return new Promise((resolve) => {
      this.once("userGasReceived", (gas: string) => {
        resolve(gas);
      });
    });
  }
}

export default Executor;
