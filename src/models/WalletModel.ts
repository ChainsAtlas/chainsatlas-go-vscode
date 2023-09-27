import { ProviderAccounts } from "@walletconnect/universal-provider";
// eslint-disable-next-line max-len
import type { UniversalProvider } from "@walletconnect/universal-provider/dist/types/UniversalProvider";
import * as chains from "../chains";
import { EIP155_EVENTS, EIP155_METHODS } from "../constants";
import { Chain, ChainNamespace, ChainUpdateStatus } from "../types";

/**
 * Represents a model for managing the wallet connection, including chain and
 * account management.
 *
 * This class provides functionalities for connecting to a wallet, switching
 * chains, and managing account states.
 *
 * @example
 * const walletModel = new WalletModel(universalProviderInstance);
 * walletModel.connect(11155111);
 */
export class WalletModel {
  public chains = Object.values(chains);

  /**
   * The list of accounts available in the connected wallet provider.
   */
  public accounts?: ProviderAccounts;

  /**
   * Represents the current chain or network the wallet is connected to.
   *
   * Default is Ethereum Sepolia.
   */
  public chain: Chain;

  /**
   * The address of the currently selected account in the connected wallet.
   */
  public currentAccount?: string;

  /**
   * Indicates whether the wallet is currently connected to the provider.
   */
  public connected?: boolean;

  /**
   * Indicates whether the chain list is being updated.
   */
  public chainUpdateStatus?: ChainUpdateStatus;

  /**
   * Represents the URI used for the wallet connection.
   */
  public uri?: string;

  /**
   * A controller used to manage abortable operations.
   */
  private _controller = new AbortController();

  /**
   * Initializes a new instance of the `WalletModel` class.
   *
   * @param _provider
   * An instance of UniversalProvider.
   */
  constructor(private readonly _provider: UniversalProvider) {
    // Set Ethereum Sepolia as default chain
    this.chain = this.chains.find((chain) => chain.id === 11_155_111) as Chain;
  }

  /**
   * Connects the wallet to the specified chain or network.
   *
   * This method initiates the connection, sets the selected chain,
   * and fetches the available accounts.
   *
   * @param id
   * The ID of the chain or network to connect to.
   *
   * @throws
   * Throws an error if the chain ID is invalid or the connection fails.
   */
  public async connect(id: number): Promise<void> {
    this._controller.abort();

    this._controller.signal.addEventListener("abort", () => {
      this._provider.abortPairingAttempt();
      this._provider.cleanupPendingPairings({ deletePairings: true });

      this.uri = undefined;

      throw new Error("Aborted!");
    });

    await this.disconnect();

    const chain = this.chains.find((c) => c.id === id);

    if (!chain) {
      throw new Error("invalid chain id.");
    }

    // important to sync correct state when provider emits uri
    this.chain = chain;

    await this._provider.connect({
      namespaces: {
        [chain.namespace]: {
          methods:
            chain.namespace === ChainNamespace.EIP155 ? EIP155_METHODS : [],
          chains: [
            chain.namespace === ChainNamespace.EIP155
              ? `${ChainNamespace.EIP155}:${chain.id}`
              : chain.id.toString(),
          ],
          events:
            chain.namespace === ChainNamespace.EIP155 ? EIP155_EVENTS : [],
          rpcMap: { [chain.id]: chain.httpRpcUrl },
        },
      },
    });

    this.accounts = await this._provider.enable();
    this.chain = chain;
    this.connected = true;
    this.uri = undefined;

    if (this.accounts.length > 0) {
      this.currentAccount = this.accounts[0];
    }
  }

  /**
   * Disconnects the wallet from the current provider and resets the state.
   *
   * This method ensures a clean state after disconnection by also resetting
   * account and connection information.
   *
   * @throws
   * Throws an error if the disconnection process encounters any issues.
   */
  public async disconnect(): Promise<void> {
    if (this._provider.session) {
      await this._provider.disconnect();
    }

    this.accounts = undefined;
    this.currentAccount = undefined;
    this.connected = false;
  }
}
