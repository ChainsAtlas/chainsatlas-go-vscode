import type { Chain } from "@wagmi/chains";
import * as chains from "@wagmi/chains";
import { ProviderAccounts } from "@walletconnect/universal-provider";
import UniversalProvider from "@walletconnect/universal-provider/dist/types/UniversalProvider";

class Wallet {
  public static readonly CHAINS: Chain[] = Object.values(chains);

  private static readonly _EIP155_EVENTS = ["chainChanged", "accountsChanged"];
  private static readonly _EIP155_METHODS = [
    "eth_sendTransaction",
    "eth_signTransaction",
    "eth_sign",
    "personal_sign",
    "eth_signTypedData",
  ];

  public accounts?: ProviderAccounts;
  public chain: Chain = chains.sepolia;
  public currentAccount?: string;
  public isConnected?: boolean;
  public uri?: string;

  private _controller = new AbortController();

  constructor(private readonly _provider: UniversalProvider) {}

  public async connect(id: number): Promise<void> {
    this._controller.abort();

    try {
      this._controller.signal.addEventListener("abort", () => {
        this._provider.abortPairingAttempt();
        this._provider.cleanupPendingPairings({ deletePairings: true });

        this.uri = undefined;

        throw new Error("Aborted!");
      });

      await this.disconnect();

      const chain = Wallet.CHAINS.find((c) => c.id === id);

      if (!chain) {
        throw new Error("invalid chain id.");
      }

      this.chain = chain; // important to sync correct state when provider emits uri

      await this._provider.connect({
        namespaces: {
          eip155: {
            methods: Wallet._EIP155_METHODS,
            chains: [`eip155:${chain.id}`],
            events: Wallet._EIP155_EVENTS,
            rpcMap: { [chain.id]: chain.rpcUrls.default.http[0] },
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
  }

  public async disconnect(): Promise<void> {
    try {
      if (this._provider.session) {
        await this._provider.disconnect();
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
  }
}

export default Wallet;
