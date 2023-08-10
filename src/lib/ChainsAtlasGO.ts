import UniversalProvider from "@walletconnect/universal-provider";
import { ExtensionContext, WebviewView } from "vscode";
import Web3, { FMT_BYTES, FMT_NUMBER } from "web3";
import {
  ViewMap,
  ViewType,
  VirtualizationUnitData,
  WalletData,
} from "../types";
import VirtualizationUnit from "./VirtualizationUnit";
import Wallet from "./Wallet";

class ChainsAtlasGO {
  private static readonly _WALLETCONNECT_PROJECT_ID =
    "7b1ecd906a131e3a323a225589f75287";

  private _gasResolver?: (value: string | PromiseLike<string>) => void;
  private _provider?: UniversalProvider;
  private _userGas?: string;
  private _viewMap: Partial<ViewMap> = {};
  private _virtualizationUnit?: VirtualizationUnit;
  private _wallet?: Wallet;
  private _web3?: Web3;

  constructor(private readonly _context: ExtensionContext) {
    this._VUnitViewMsgHandler = this._VUnitViewMsgHandler.bind(this);
    this._WalletViewMsgHandler = this._WalletViewMsgHandler.bind(this);
  }

  public async addView(view: WebviewView): Promise<void> {
    try {
      if (!this._provider || !this._wallet || !this._virtualizationUnit) {
        throw new Error("Call init() before adding views.");
      }

      if (!this._isValidViewType(view.viewType)) {
        throw new Error("Invalid view type.");
      }

      this._viewMap[view.viewType] = view;

      switch (view.viewType) {
        case "virtualizationUnit":
          try {
            view.webview.onDidReceiveMessage(
              this._VUnitViewMsgHandler,
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
              this._WalletViewMsgHandler,
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

      this._wallet = new Wallet(this._provider);
      this._virtualizationUnit = new VirtualizationUnit();
    } catch (e) {
      console.error(e);
    }
  }

  // -------------------- Private --------------------

  private async _VUnitViewMsgHandler(message: {
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
              this._syncView(["wallet", "virtualizationUnit"]);
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

              this._syncView(["virtualizationUnit"]);
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

  private async _WalletViewMsgHandler(message: {
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

              this._syncView(["wallet", "virtualizationUnit"]);
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

            this._syncView(["wallet", "virtualizationUnit"]);
          } catch (e) {
            console.error(e);
          }
          break;
        case "disconnect":
          try {
            await this._wallet.disconnect();

            this._syncView(["wallet", "virtualizationUnit"]);
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

  private _getUserGas(): Promise<string> {
    return new Promise((resolve, reject) => {
      // If userGasPrice is already set, resolve immediately.
      if (this._userGas) {
        resolve(this._userGas);
      } else {
        // Otherwise, store the resolve function to be called later.
        this._gasResolver = resolve;
      }
    });
  }

  private _handleUserGas(gas: string) {
    this._userGas = gas;
    if (this._gasResolver) {
      this._gasResolver(gas);
      this._gasResolver = undefined;
    }
  }

  private _isValidViewType(value: string): value is ViewType {
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
