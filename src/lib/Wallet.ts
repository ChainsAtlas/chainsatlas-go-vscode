import { Chain, bscTestnet, sepolia } from "@wagmi/chains";
import { ProviderAccounts } from "@walletconnect/universal-provider";
import UniversalProvider from "@walletconnect/universal-provider/dist/types/UniversalProvider";

class Wallet {
  public static readonly CHAINS: Chain[] = [bscTestnet, sepolia];

  private static readonly _EIP155_EVENTS = ["chainChanged", "accountsChanged"];
  private static readonly _EIP155_METHODS = [
    "eth_sendTransaction",
    "eth_signTransaction",
    "eth_sign",
    "personal_sign",
    "eth_signTypedData",
  ];

  public accounts?: ProviderAccounts;
  public chain?: Chain = sepolia;
  public currentAccount?: string;
  public isConnected?: boolean;

  private _controller = new AbortController();

  constructor(private readonly _provider: UniversalProvider) {}

  public async connect(id: number): Promise<{
    accounts?: ProviderAccounts;
    chain?: Chain;
    currentAccount?: string;
  }> {
    this._controller.abort();

    try {
      this._controller.signal.addEventListener("abort", () => {
        this._provider.abortPairingAttempt();
        this._provider.cleanupPendingPairings({ deletePairings: true });

        this.isConnected = false;

        throw new Error("Aborted!");
      });

      const chain = Wallet.CHAINS.find((c) => c.id === id);

      if (!chain) {
        throw new Error("invalid chain id.");
      }

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

      if (this.accounts.length > 0) {
        this.currentAccount = this.accounts[0];
      }
    } catch (e) {
      if (e instanceof Error) {
        throw e;
      }

      throw new Error(JSON.stringify(e));
    }

    return {
      accounts: this.accounts,
      chain: this.chain,
      currentAccount: this.currentAccount,
    };
  }

  public async disconnect(): Promise<void> {
    try {
      await this._provider.disconnect();
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
