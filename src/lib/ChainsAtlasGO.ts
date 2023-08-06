import UniversalProvider from "@walletconnect/universal-provider";
import vscode from "vscode";
import Web3, { FMT_BYTES, FMT_NUMBER } from "web3";
import { WalletData } from "../types/types";
import { vUnitAbi, vUnitBytecode } from "./VirtualizationUnit";
import Wallet from "./Wallet";

class ChainsAtlasGO {
  private static readonly _API_TOKEN = "rBzCg5dLhoBdXdC15vNa2";
  private static readonly _V_UNIT_ABI = vUnitAbi;
  private static readonly _V_UNIT_BYTECODE = vUnitBytecode;
  private static readonly _WALLETCONNECT_PROJECT_ID =
    "7b1ecd906a131e3a323a225589f75287";

  private _provider?: UniversalProvider;
  private _wallet?: Wallet;
  private _web3?: Web3;

  constructor(
    private readonly _context: vscode.ExtensionContext,
    private readonly _views: vscode.WebviewView[],
  ) {}

  // Called when the extension is deactivated
  public async dispose(): Promise<void> {
    try {
      await this._provider?.disconnect();

      this._web3?.currentProvider?.disconnect();
    } catch (e) {
      console.error(e);
    }
  }

  public async init(): Promise<void> {
    try {
      this._provider = await UniversalProvider.init({
        logger: "info",
        projectId: ChainsAtlasGO._WALLETCONNECT_PROJECT_ID,
        metadata: {
          name: "ChainsAtlas GO",
          description: "ChainsAtlas GO VS Code",
          url: "https://chainsatlas.com/",
          icons: [
            "https://chainsatlas.com/wp-content/uploads/2022/08/ChainsAtlas-logo.png",
          ],
        },
      });

      this._wallet = new Wallet(this._provider);

      this._views.forEach(async (view) => {
        switch (view.viewType) {
          case "wallet":
            if (this._provider && this._wallet) {
              await this._addWalletViewEventListeners(
                this._provider,
                view,
                this._wallet,
              );
            }
            break;
        }
      });
    } catch (e) {
      console.error(e);
    }
  }

  // -------------------- Private --------------------

  private async _addWalletViewEventListeners(
    provider: UniversalProvider,
    view: vscode.WebviewView,
    wallet: Wallet,
  ): Promise<void> {
    provider.on("display_uri", async (uri: string) => {
      view.webview.postMessage({ type: "uri", value: uri });
    });

    const sync = async (
      view: vscode.WebviewView,
      wallet: Wallet,
      web3?: Web3,
    ): Promise<void> => {
      view.webview.postMessage({
        type: "sync",
        value: await this._generateWalletDataState(wallet, web3),
      });
    };

    view.webview.onDidReceiveMessage(
      async (message: { type: string; value?: string }) => {
        switch (message.type) {
          case "changeAccount":
            try {
              if (wallet.accounts?.includes(String(message.value))) {
                wallet.currentAccount = message.value;

                sync(view, wallet, this._web3);
              } else {
                console.error("Invalid account.");
              }
            } catch (e) {
              console.error(e);
            }
            break;
          case "connect":
            try {
              await wallet.connect(Number(message.value));

              this._web3 = new Web3(provider);

              sync(view, wallet, this._web3);
            } catch (e) {
              console.error(e);
            }
            break;
          case "disconnect":
            try {
              await wallet.disconnect();

              sync(view, wallet, this._web3);
            } catch (e) {
              console.error(e);
            }
            break;
          case "sync":
            try {
              sync(view, wallet, this._web3);
            } catch (e) {
              console.error(e);
            }
            break;
          default:
            break;
        }
      },
      undefined,
      this._context.subscriptions,
    );

    await sync(view, wallet, this._web3);
  }

  private async _generateWalletDataState(
    wallet: Wallet,
    web3?: Web3,
  ): Promise<WalletData> {
    return {
      accounts: wallet.accounts,
      balance: await this._getBalance(
        wallet.currentAccount,
        wallet.chain?.id.toString(),
        web3,
      ),
      chain: wallet.chain,
      chains: Wallet.CHAINS,
      currentAccount: wallet.currentAccount,
      isConnected: wallet.isConnected,
    };
  }

  private async _getBalance(
    account?: string | null,
    chainId?: string,
    web3?: Web3 | null,
  ): Promise<string | undefined> {
    try {
      if (account && chainId && web3) {
        const web3ChainId = (await web3.eth.getChainId()).toString();

        return chainId === web3ChainId
          ? await web3.eth.getBalance(account, undefined, {
              number: FMT_NUMBER.STR,
              bytes: FMT_BYTES.HEX,
            })
          : undefined;
      }

      return undefined;
    } catch (e) {
      if (e instanceof Error) {
        throw e;
      }

      throw new Error(JSON.stringify(e));
    }
  }

  // private async _getBytecodeAndKey(
  //   filePath: string,
  //   nargs: number,
  //   language = "c",
  // ): Promise<any | unknown> {
  //   try {
  //     let srcCode = `
  //     long sum(long x, long y) {
  //       return x + y;
  //   }

  //   long main() {
  //       long x, y, z;
  //       x = __chainsatlas_evm_sload(1);
  //       y = __chainsatlas_evm_sload(2);
  //       z = sum(x, y);
  //       __chainsatlas_evm_sstore(3, z);
  //       return z;
  //   }
  //   `;
  //     let data = {
  //       source_code: srcCode,
  //       language: language,
  //       entrypoint_nargs: nargs,
  //     };

  //     let response = await fetch("https://api.chainsatlas.com/build/generate", {
  //       method: "POST",
  //       body: JSON.stringify(data),
  //       headers: {
  //         "Content-Type": "application/json",
  //         "x-access-tokens": ChainsAtlasGO._API_TOKEN,
  //       },
  //     });
  //     if (!response.ok) {
  //       throw new Error(`HTTP error! status: ${response.status}`);
  //     }

  //     return await response.json();
  //   } catch (error) {
  //     console.error(`Error: ${error}`);
  //     return error;
  //   }
  // }

  // private _composeInput(bytecodeStruct: any, inputData: any[]) {
  //   try {
  //     let bytecode = bytecodeStruct.data.bytecode;
  //     let key = BigInt(bytecodeStruct.data.key);
  //     let nargs = bytecodeStruct.data.nargs;
  //     if (nargs !== inputData.length) {
  //       throw new Error(
  //         `The number of argument is a constant, to update it please generate new bytecodeStruct through the API`,
  //       );
  //     }

  //     for (let i = 0; i < nargs; i++) {
  //       let lookup = (key + BigInt(i)).toString(16);
  //       let replacement = BigInt(inputData[i]).toString(16).padStart(32, "0");

  //       if (bytecode.includes(lookup)) {
  //         bytecode = bytecode.replace(lookup, replacement);
  //       } else {
  //         throw new Error(`Failed to adjust the bytecode.`);
  //       }
  //     }

  //     return "0x" + bytecode;
  //   } catch (error) {
  //     console.error(`Error: ${error}`);
  //   }
  // }

  // private async _deployVUnit(): Promise<void> {
  //   if (!this._web3) {
  //     throw new Error("web3 not initialized.");
  //   }

  //   if (!this._accounts || this._accounts.length === 0) {
  //     throw new Error("no account available.");
  //   }

  //   const account = this._accounts[0];
  //   console.log("account: ", account);
  //   // const contract = new this._web3.eth.Contract(ChainsAtlasGO._V_UNIT_ABI);
  //   // const contractDeployment = contract.deploy({
  //   //   data: ChainsAtlasGO._V_UNIT_BYTECODE,
  //   // });

  //   // console.log("contract deployed: ", contractDeployment);

  //   // const gasEstimate = await contractDeployment.estimateGas({
  //   //   from: account,
  //   // });

  //   // const gasWithBuffer = (
  //   //   (gasEstimate * BigInt(115)) /
  //   //   BigInt(100)
  //   // ).toString();

  //   // const contractInstance = await contractDeployment.send({
  //   //   from: account,
  //   //   gas: gasWithBuffer,
  //   // });

  //   // console.log("contract address: ", contractInstance.options.address);

  //   // this._viewMap.wallet.webview.postMessage({
  //   //   type: "vUnitDeployed",
  //   //   value: contractInstance.options.address,
  //   // });

  //   const contractAddress = "0xFCf5c84d9ED313059998d7720E6F149069C17622";

  //   const contractInstance = new this._web3.eth.Contract(
  //     vUnitAbi,
  //     contractAddress,
  //   );

  //   console.log("contract instance created");

  //   let bytecodeStruct = await this._getBytecodeAndKey(
  //     "./examples/sum.c",
  //     2,
  //     "c",
  //   );

  //   let userBytecode = await this._composeInput(bytecodeStruct, [3, 4]);

  //   console.log("userBYtecode: ", userBytecode);

  //   const runBytecodeCall =
  //     // @ts-ignore
  //     contractInstance.methods.runBytecode(userBytecode);

  //   const runBytecodeGasEstimate = await runBytecodeCall.estimateGas({
  //     from: account,
  //   });

  //   const runBytecodeGasWithBuffer = (
  //     (runBytecodeGasEstimate * BigInt(115)) /
  //     BigInt(100)
  //   ).toString();

  //   const runBytecodeTransaction = {
  //     to: contractInstance.options.address,
  //     data: runBytecodeCall.encodeABI(),
  //     gas: runBytecodeGasWithBuffer,
  //     from: account,
  //   };

  //   console.log("sending transaction");

  //   const receipt = await this._web3.eth.sendTransaction(
  //     runBytecodeTransaction,
  //   );

  //   console.log("receipt: ", receipt);

  //   const receiptFromTxHash = await this._web3.eth.getTransactionReceipt(
  //     receipt.transactionHash,
  //   );

  //   console.log("transaction receipt:", receiptFromTxHash);

  //   const eventABI = contractInstance.options.jsonInterface.find(
  //     (jsonInterface) =>
  //       jsonInterface.type === "event" &&
  //       // @ts-ignore
  //       jsonInterface.name === "ContractDeployed",
  //   );

  //   console.log("found event abi:", eventABI);

  //   const decodedLogs = receiptFromTxHash.logs.map((log) => {
  //     if (!this._web3) {
  //       throw new Error("web3 not initialized");
  //     }

  //     if (eventABI && eventABI.inputs && log.topics) {
  //       const decodedLog = this._web3.eth.abi.decodeLog(
  //         eventABI.inputs as AbiParameter[],
  //         log.data as string,
  //         log.topics.slice(1) as string | string[],
  //       );

  //       return decodedLog;
  //     }
  //   });

  //   const bytecodeAddress = decodedLogs[0]?.bytecodeAddress;

  //   console.log("bytecode address: ", bytecodeAddress);

  //   const returnValue = await contractInstance.methods
  //     // @ts-ignore
  //     .getRuntimeReturn(bytecodeAddress)
  //     .call();
  //   console.log("Result: ", returnValue);
  // }
}

export default ChainsAtlasGO;
