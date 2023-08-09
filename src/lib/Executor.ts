class Executor {
  private static readonly _API_TOKEN = "rBzCg5dLhoBdXdC15vNa2";

  constructor() {}

  // -------------------- Private --------------------

  private async _getBytecodeAndKey(
    code: string,
    nargs: number,
    language = "c",
  ): Promise<any | unknown> {
    try {
      const data = {
        entrypoint_nargs: nargs,
        language,
        source_code: code,
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

      return await response.json();
    } catch (e) {
      if (e instanceof Error) {
        throw e;
      }

      throw new Error(JSON.stringify(e));
    }
  }

  private _composeInput(bytecodeStruct: any, inputData: any[]): string {
    try {
      const key = BigInt(bytecodeStruct.data.key);
      const nargs = bytecodeStruct.data.nargs;

      let bytecode = bytecodeStruct.data.bytecode;

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
}

export default Executor;
// console.log("contract address: ", contractInstance.options.address);

// this._viewMap.wallet.webview.postMessage({
//   type: "vUnitDeployed",
//   value: contractInstance.options.address,
// });

// const contractAddress = "0xFCf5c84d9ED313059998d7720E6F149069C17622";

// const contractInstance = new this._web3.eth.Contract(
//   vUnitAbi,
//   contractAddress,
// );

// console.log("contract instance created");

// let bytecodeStruct = await this._getBytecodeAndKey(
//   "./examples/sum.c",
//   2,
//   "c",
// );

// let userBytecode = await this._composeInput(bytecodeStruct, [3, 4]);

// console.log("userBYtecode: ", userBytecode);

// const runBytecodeCall =
//   // @ts-ignore
//   contractInstance.methods.runBytecode(userBytecode);

// const runBytecodeGasEstimate = await runBytecodeCall.estimateGas({
//   from: account,
// });

// const runBytecodeGasWithBuffer = (
//   (runBytecodeGasEstimate * BigInt(115)) /
//   BigInt(100)
// ).toString();

// const runBytecodeTransaction = {
//   to: contractInstance.options.address,
//   data: runBytecodeCall.encodeABI(),
//   gas: runBytecodeGasWithBuffer,
//   from: account,
// };

// console.log("sending transaction");

// const receipt = await this._web3.eth.sendTransaction(
//   runBytecodeTransaction,
// );

// console.log("receipt: ", receipt);

// const receiptFromTxHash = await this._web3.eth.getTransactionReceipt(
//   receipt.transactionHash,
// );

// console.log("transaction receipt:", receiptFromTxHash);

// const eventABI = contractInstance.options.jsonInterface.find(
//   (jsonInterface) =>
//     jsonInterface.type === "event" &&
//     // @ts-ignore
//     jsonInterface.name === "ContractDeployed",
// );

// console.log("found event abi:", eventABI);

// const decodedLogs = receiptFromTxHash.logs.map((log) => {
//   if (!this._web3) {
//     throw new Error("web3 not initialized");
//   }

//   if (eventABI && eventABI.inputs && log.topics) {
//     const decodedLog = this._web3.eth.abi.decodeLog(
//       eventABI.inputs as AbiParameter[],
//       log.data as string,
//       log.topics.slice(1) as string | string[],
//     );

//     return decodedLog;
//   }
// });

// const bytecodeAddress = decodedLogs[0]?.bytecodeAddress;

// console.log("bytecode address: ", bytecodeAddress);

// const returnValue = await contractInstance.methods
//   // @ts-ignore
//   .getRuntimeReturn(bytecodeAddress)
//   .call();
// console.log("Result: ", returnValue);
// }

// -------------------- Private --------------------
