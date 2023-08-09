import UniversalProvider from "@walletconnect/universal-provider";
import vscode from "vscode";
import Web3, { FMT_BYTES, FMT_NUMBER } from "web3";
import { WalletData } from "../types/types";
import Wallet from "./Wallet";

class ChainsAtlasGO {
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
          case "virtualizationUnit":
            // Add event listeners for virtualization unit view
            // Decide which state to hold where
            break;
          case "wallet":
            if (this._provider && this._wallet) {
              await this._addWalletViewEventListeners(
                this._provider,
                view,
                this._wallet,
              );
            }
            break;
          default:
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
    const sync = async (
      view: vscode.WebviewView,
      wallet: Wallet,
      web3?: Web3,
    ): Promise<void> => {
      view.webview.postMessage(
        await this._generateWalletDataState(wallet, web3),
      );
    };

    provider.on("display_uri", async (uri: string) => {
      wallet.uri = uri;
      sync(view, wallet, this._web3);
    });

    view.onDidChangeVisibility(
      () => {
        if (view.visible) {
          // delay sync message to wait for the view rendering
          setTimeout(() => sync(view, wallet, this._web3), 1000);
        }
      },
      undefined,
      this._context.subscriptions,
    );

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
      uri: wallet.uri,
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
}

export default ChainsAtlasGO;
