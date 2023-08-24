import { ProviderAccounts } from "@walletconnect/universal-provider";
import UniversalProvider from "@walletconnect/universal-provider/dist/types/UniversalProvider";
import Web3 from "web3";
import { SUPPORTED_CHAINS } from "../constants";

class WalletModel {
  public web3?: Web3;

  private static readonly _EIP155_EVENTS = ["chainChanged", "accountsChanged"];
  private static readonly _EIP155_METHODS = [
    "eth_sendTransaction",
    "eth_signTransaction",
    "eth_sign",
    "personal_sign",
    "eth_signTypedData",
  ];

  public accounts?: ProviderAccounts;
  public chain = SUPPORTED_CHAINS.find((chain) => chain.id === 11_155_111); // sepolia
  public currentAccount?: string;
  public isConnected?: boolean;
  public uri?: string;

  private _controller = new AbortController();

  constructor(private readonly _provider: UniversalProvider) {}

  public connect = async (id: number): Promise<void> => {
    try {
      this._controller.abort();

      this._controller.signal.addEventListener("abort", () => {
        this._provider.abortPairingAttempt();
        this._provider.cleanupPendingPairings({ deletePairings: true });

        this.uri = undefined;

        throw new Error("Aborted!");
      });

      await this.disconnect();

      const chain = SUPPORTED_CHAINS.find((c) => c.id === id);

      if (!chain) {
        throw new Error("invalid chain id.");
      }

      this.chain = chain; // important to sync correct state when provider emits uri

      await this._provider.connect({
        namespaces: {
          eip155: {
            methods: WalletModel._EIP155_METHODS,
            chains: [`eip155:${chain.id}`],
            events: WalletModel._EIP155_EVENTS,
            rpcMap: {
              [chain.id]: chain.rpcUrls.infura
                ? `${chain.rpcUrls.infura.http[0]}/293dd006da85467bbcb9ee8fd02cb40b`
                : chain.rpcUrls.default.http[0],
            },
          },
        },
      });

      this.accounts = await this._provider.enable();
      this.chain = chain;
      this.isConnected = true;
      this.uri = undefined;

      if (this.accounts.length > 0) {
        this.currentAccount = this.accounts[0];
      }
    } catch (e) {
      if (e instanceof Error) {
        throw e;
      }

      throw new Error(JSON.stringify(e));
    }
  };

  public disconnect = async (): Promise<void> => {
    try {
      if (this._provider.session) {
        await this._provider.disconnect();
      }

      if (this.web3) {
        this.web3.currentProvider?.disconnect();
      }

      this.isConnected = false;
    } catch (e) {
      if (e instanceof Error) {
        throw e;
      }

      throw new Error(JSON.stringify(e));
    }

    this.accounts = undefined;
    this.currentAccount = undefined;
    this.isConnected = false;
  };
}

export default WalletModel;
