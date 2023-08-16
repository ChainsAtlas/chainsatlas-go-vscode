import UniversalProvider from "@walletconnect/universal-provider";
import { extname } from "path";
import { ExtensionContext, WebviewView, window, workspace } from "vscode";
import Web3, { FMT_BYTES, FMT_NUMBER } from "web3";
import { SUPPORTED_LANGUAGES } from "../constants";
import {
  ExecutorData,
  ExecutorFile,
  SupportedLanguage,
  ViewMap,
  ViewType,
  VirtualizationUnitData,
  WalletData,
} from "../types";
import Executor from "./Executor";
import VirtualizationUnit from "./VirtualizationUnit";
import Wallet from "./Wallet";

class ChainsAtlasGO {
  private static readonly _WALLETCONNECT_PROJECT_ID =
    "7b1ecd906a131e3a323a225589f75287";

  private _executor?: Executor;
  private _gasResolver?: (value: string | PromiseLike<string>) => void;
  private _provider?: UniversalProvider;
  private _userFile?: ExecutorFile;
  private _userGas?: string;
  private _viewMap: Partial<ViewMap> = {};
  private _virtualizationUnit?: VirtualizationUnit;
  private _wallet?: Wallet;
  private _web3?: Web3;

  constructor(private readonly _context: ExtensionContext) {
    this._executorViewMsgHandler = this._executorViewMsgHandler.bind(this);
    this._vUnitViewMsgHandler = this._vUnitViewMsgHandler.bind(this);
    this._walletViewMsgHandler = this._walletViewMsgHandler.bind(this);
  }

  public async addView(view: WebviewView): Promise<void> {
    try {
      if (
        !this._provider ||
        !this._wallet ||
        !this._virtualizationUnit ||
        !this._executor
      ) {
        throw new Error("Call init() before adding views.");
      }

      if (!this._isViewType(view.viewType)) {
        throw new Error("Invalid view type.");
      }

      this._viewMap[view.viewType] = view;

      switch (view.viewType) {
        case "executor":
          try {
            view.webview.onDidReceiveMessage(
              this._executorViewMsgHandler,
              undefined,
              this._context.subscriptions,
            );
          } catch (e) {
            console.error(e);
          }
        case "virtualizationUnit":
          try {
            view.webview.onDidReceiveMessage(
              this._vUnitViewMsgHandler,
              undefined,
              this._context.subscriptions,
            );
          } catch (e) {
            console.error(e);
          }
          break;
        case "wallet":
          try {
            this._provider.on("display_uri", async (uri: string) => {
              if (!this._wallet) {
                throw new Error("Wallet not initialized.");
              }

              this._wallet.uri = uri;
              this._syncView(["wallet"]);
            });

            view.webview.onDidReceiveMessage(
              this._walletViewMsgHandler,
              undefined,
              this._context.subscriptions,
            );
          } catch (e) {
            console.error(e);
          }
          break;
        default:
          break;
      }
    } catch (e) {
      console.error(e);
    }
  }

  // Called when the extension is deactivated
  public async dispose(): Promise<void> {
    try {
      await this._wallet?.disconnect();
      this._web3?.currentProvider?.disconnect();
      await this._provider?.disconnect();
    } catch (e) {
      console.error(e);
    }
  }

  public async init(): Promise<void> {
    try {
      this._provider = await UniversalProvider.init({
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

      this._executor = new Executor();
      this._virtualizationUnit = new VirtualizationUnit();
      this._wallet = new Wallet(this._provider);
    } catch (e) {
      console.error(e);
    }
  }

  // -------------------- Private --------------------

  private async _executorViewMsgHandler(message: {
    type: string;
    value?: string;
    args?: any[];
  }): Promise<void> {
    try {
      switch (message.type) {
        case "compile":
          try {
            if (!this._executor) {
              throw new Error("Executor not initialized.");
            }

            if (!message.value) {
              throw new Error("Invalid number of arguments.");
            }

            if (!this._userFile) {
              throw new Error("Invalid file.");
            }

            console.log(
              "FILE:",
              this._userFile,
              "NARGS:",
              Number(message.value),
            );

            await this._executor.compileBytecode(
              this._userFile,
              Number(message.value),
            );

            this._syncView(["executor"]);
          } catch (e) {
            console.error(e);
          }
          break;
        case "cancelCompile":
          try {
            this._userFile = undefined;

            this._syncView(["executor"]);
          } catch (e) {
            console.error(e);
          }
          break;
        case "clearFile":
          try {
            if (!this._executor) {
              throw new Error("Executor not initialized.");
            }

            this._executor.currentFile = undefined;
            this._executor.nargs = undefined;

            this._syncView(["executor"]);
          } catch (e) {
            console.error(e);
          }
          break;
        case "estimate":
          try {
            if (!this._executor) {
              throw new Error("Executor not initialized.");
            }

            if (!this._virtualizationUnit) {
              throw new Error("VirtualizationUnit not initialized.");
            }

            if (!this._virtualizationUnit.currentContract) {
              throw new Error("Invalid virtualization unit.");
            }

            if (!this._wallet) {
              throw new Error("Wallet not initialized");
            }

            if (!this._wallet.currentAccount) {
              throw new Error("Invalid account.");
            }

            if (!this._web3) {
              throw new Error("Web3 not initialized.");
            }

            if (!message.value) {
              throw new Error("Invalid arguments.");
            }

            this._userGas = undefined;

            this._executor.on("gasEstimated", async () => {
              if (!this._executor) {
                throw new Error("Executor not initialized.");
              }

              this._syncView(["executor"]);

              const userGas = await this._getUserGas();

              this._executor.emit("userGasReceived", userGas);
            });

            const { transactionHash, output } =
              await this._executor.runBytecode(
                JSON.parse(message.value),
                this._wallet?.currentAccount,
                this._virtualizationUnit?.currentContract,
                this._web3,
              );

            console.log(transactionHash, output);

            this._syncView(["wallet", "executor"]);
          } catch (e) {
            console.error(e);
          }
          break;
        case "execute":
          try {
            if (!message.value) {
              throw new Error("Invalid user gas.");
            }

            this._handleUserGas(message.value);
          } catch (e) {
            console.error(e);
          }
          break;
        case "selectFile":
          try {
            await this._getUserFile();

            this._syncView(["executor"]);
          } catch (e) {
            console.error(e);
          }
          break;
        default:
          break;
      }
    } catch (e) {
      if (e instanceof Error) {
        throw e;
      }

      throw new Error(JSON.stringify(e));
    }
  }

  private async _vUnitViewMsgHandler(message: {
    type: string;
    value?: string;
  }): Promise<void> {
    try {
      if (!this._virtualizationUnit) {
        throw new Error("VirtualizationUnit not initialized.");
      }

      if (!this._wallet) {
        throw new Error("Wallet not initialized.");
      }

      switch (message.type) {
        case "clearDeployment":
          try {
            this._virtualizationUnit.clearDeployment();
            this._syncView(["virtualizationUnit"]);
          } catch (e) {
            console.error(e);
          }
          break;
        case "deploy":
          try {
            if (!this._virtualizationUnit) {
              throw new Error("Invalid virtualization unit.");
            }

            if (!this._wallet.currentAccount) {
              throw new Error("Invalid account.");
            }

            if (!this._web3) {
              throw new Error("Invalid web3 provider.");
            }

            this._virtualizationUnit.on("contractDeployed", async () => {
              if (!this._virtualizationUnit) {
                throw new Error("Invalid virtualization unit.");
              }

              this._syncView(["virtualizationUnit"]);

              const userGas = await this._getUserGas();

              this._virtualizationUnit.emit("userGasReceived", userGas);
            });

            this._virtualizationUnit.on("contractSent", () => {
              this._syncView(["wallet", "virtualizationUnit", "executor"]);
            });

            this._virtualizationUnit.deploy(
              this._wallet.currentAccount,
              this._web3,
            );
          } catch (e) {
            console.error(e);
          }
          break;
        case "ready":
          try {
            this._syncView(["virtualizationUnit"]);
          } catch (e) {
            console.error(e);
          }
          break;
        case "send":
          try {
            if (message.value) {
              this._handleUserGas(message.value);
            } else {
              throw new Error("Invalid user gas.");
            }
          } catch (e) {
            console.error(e);
          }
          break;
        case "setContract":
          try {
            if (
              message.value &&
              this._virtualizationUnit.contracts?.includes(message.value)
            ) {
              this._virtualizationUnit.currentContract = message.value;

              this._syncView(["virtualizationUnit", "executor"]);
            } else {
              throw new Error("Invalid contract address.");
            }
          } catch (e) {
            console.error(e);
          }
          break;
        case "sync":
          try {
            this._syncView(["virtualizationUnit"]);
          } catch (e) {
            console.error(e);
          }
        default:
          break;
      }
    } catch (e) {
      if (e instanceof Error) {
        throw e;
      }

      throw new Error(JSON.stringify(e));
    }
  }

  private async _walletViewMsgHandler(message: {
    type: string;
    value?: string;
  }): Promise<void> {
    try {
      if (!this._provider) {
        throw new Error("UniversalProvider not initialized.");
      }

      if (!this._wallet) {
        throw new Error("Wallet not initialized.");
      }

      switch (message.type) {
        case "changeAccount":
          try {
            if (
              message.value &&
              this._wallet.accounts?.includes(message.value)
            ) {
              this._wallet.currentAccount = message.value;

              this._syncView(["wallet", "virtualizationUnit", "executor"]);
            } else {
              throw new Error("Invalid account.");
            }
          } catch (e) {
            console.error(e);
          }
          break;
        case "connect":
          try {
            await this._wallet.connect(Number(message.value));

            this._web3 = new Web3(this._provider);

            if (this._virtualizationUnit) {
              this._virtualizationUnit.clearDeployment();
              this._virtualizationUnit.contracts = [];
              this._virtualizationUnit.currentContract = undefined;
            }

            this._syncView(["wallet", "virtualizationUnit", "executor"]);
          } catch (e) {
            console.error(e);
          }
          break;
        case "disconnect":
          try {
            await this._wallet.disconnect();

            if (this._virtualizationUnit) {
              this._virtualizationUnit.clearDeployment();
              this._virtualizationUnit.contracts = [];
              this._virtualizationUnit.currentContract = undefined;
            }

            this._syncView(["wallet", "virtualizationUnit", "executor"]);
          } catch (e) {
            console.error(e);
          }
          break;
        case "ready":
          try {
            this._syncView(["wallet"]);
          } catch (e) {
            console.error(e);
          }
          break;
        case "sync":
          try {
            this._syncView(["wallet"]);
          } catch (e) {
            console.error(e);
          }
          break;
        default:
          break;
      }
    } catch (e) {
      if (e instanceof Error) {
        throw e;
      }

      throw new Error(JSON.stringify(e));
    }
  }

  private _generateExecutorData(): ExecutorData {
    try {
      if (!this._executor) {
        throw new Error("Executor not initialized.");
      }

      if (!this._virtualizationUnit) {
        throw new Error("VirtualizationUnit not initialized.");
      }

      if (!this._wallet) {
        throw new Error("Wallet not initialized.");
      }

      const { currentFile, gasEstimate, nargs } = this._executor;

      return {
        currentFile,
        disabled: !Boolean(
          this._wallet.currentAccount &&
            this._virtualizationUnit.currentContract,
        ),
        gasEstimate,
        nargs,
        userFile: this._userFile,
      };
    } catch (e) {
      if (e instanceof Error) {
        throw e;
      }

      throw new Error(JSON.stringify(e));
    }
  }

  private async _generateVUnitData(): Promise<VirtualizationUnitData> {
    try {
      if (!this._virtualizationUnit) {
        throw new Error("VirtualizationUnit not initialized.");
      }

      if (!this._wallet) {
        throw new Error("Wallet not initialized.");
      }

      const { contracts, currentContract, gasEstimate } =
        this._virtualizationUnit;

      return {
        contracts,
        currentContract,
        disabled: !Boolean(this._wallet.currentAccount),
        gasEstimate,
      };
    } catch (e) {
      if (e instanceof Error) {
        throw e;
      }

      throw new Error(JSON.stringify(e));
    }
  }

  private async _generateWalletData(): Promise<WalletData> {
    try {
      if (!this._wallet) {
        throw new Error("Wallet not initialized.");
      }

      const { accounts, currentAccount, chain, isConnected, uri } =
        this._wallet;

      return {
        accounts,
        balance: await this._getBalance(currentAccount, chain?.id.toString()),
        chain,
        chains: Wallet.CHAINS,
        currentAccount,
        isConnected,
        uri,
      };
    } catch (e) {
      if (e instanceof Error) {
        throw e;
      }

      throw new Error(JSON.stringify(e));
    }
  }

  private async _getBalance(
    account?: string,
    chainId?: string,
  ): Promise<string | undefined> {
    try {
      if (account && chainId && this._web3) {
        const web3ChainId = (await this._web3.eth.getChainId()).toString();

        return chainId === web3ChainId
          ? await this._web3.eth.getBalance(account, undefined, {
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

  private async _getUserFile(): Promise<void> {
    try {
      if (!this._executor) {
        throw new Error("Executor not initialized.");
      }
      const uris = await window.showOpenDialog({
        canSelectMany: false,
        openLabel: "Open",
        filters: { "Supported files": SUPPORTED_LANGUAGES },
      });

      if (uris && uris.length > 0) {
        const selectedFileUri = uris[0];

        this._userFile = {
          content: (await workspace.fs.readFile(selectedFileUri)).toString(),
          extension: extname(selectedFileUri.fsPath).slice(
            1,
          ) as SupportedLanguage,
          path: selectedFileUri.fsPath,
        };
      } else {
        window.showWarningMessage("No file selected.");
      }
    } catch (e) {
      if (e instanceof Error) {
        throw e;
      }

      throw new Error(JSON.stringify(e));
    }
  }

  private _getUserGas(): Promise<string> {
    return new Promise((resolve) => {
      if (this._userGas) {
        resolve(this._userGas);
      } else {
        this._gasResolver = resolve;
      }
    });
  }

  private _handleUserGas(gas: string): void {
    this._userGas = gas;
    if (this._gasResolver) {
      this._gasResolver(gas);
      this._gasResolver = undefined;
    }
  }

  private _isViewType(value: any): value is ViewType {
    return (
      value === "executor" ||
      value === "history" ||
      value === "virtualizationUnit" ||
      value === "wallet"
    );
  }

  private async _syncView(viewTypes: ViewType[]): Promise<void> {
    for (const type of viewTypes) {
      switch (type) {
        case "history":
          break;
        case "executor":
          this._viewMap.executor?.webview.postMessage(
            await this._generateExecutorData(),
          );
          break;
        case "virtualizationUnit":
          this._viewMap.virtualizationUnit?.webview.postMessage(
            await this._generateVUnitData(),
          );
          break;
        case "wallet":
          this._viewMap.wallet?.webview.postMessage(
            await this._generateWalletData(),
          );
          break;
        default:
          break;
      }
    }
  }
}

export default ChainsAtlasGO;
