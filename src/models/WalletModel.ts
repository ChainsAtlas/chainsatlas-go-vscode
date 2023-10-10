import type { ProviderAccounts } from "@walletconnect/universal-provider";
// eslint-disable-next-line max-len
import type { UniversalProvider } from "@walletconnect/universal-provider/dist/types/UniversalProvider";
import * as chains from "../chains";
import { EIP155_EVENTS, EIP155_METHODS, ERROR_MESSAGE } from "../constants";
import { ChainNamespace } from "../enums";
import type { Chain, ChainUpdateStatus, ValidChain } from "../types";

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
  /**
   * The list of supported chains.
   */
  public chains: (Chain | ValidChain)[];

  /**
   * The list of accounts available in the connected wallet provider.
   */
  public accounts?: ProviderAccounts;

  /**
   * Represents the current chain or network the wallet is connected to.
   */
  public chain?: ValidChain;

  /**
   * The address of the currently selected account in the connected wallet.
   */
  public currentAccount?: string;

  /**
   * Indicates whether the wallet is currently connected to the provider.
   */
  public connected: boolean;

  /**
   * Indicates whether the chain list is being updated.
   */
  public chainUpdateStatus?: ChainUpdateStatus;

  /**
   * Represents the URI used for the wallet connection.
   */
  public uri?: string;

  /**
   * Initializes a new instance of the `WalletModel` class.
   *
   * @param _provider
   * An instance of UniversalProvider.
   */
  constructor(private readonly _provider: UniversalProvider) {
    this.chains = Object.values(chains);
    this.connected = false;
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
    const chain = this.chains.find((c) => c.id === id) as ValidChain;

    if (!chain) {
      throw new Error(ERROR_MESSAGE.INVALID_CHAIN_ID);
    }

    if (!chain.httpRpcUrl) {
      throw new Error(ERROR_MESSAGE.INVALID_CHAIN_RPC);
    }

    // important to sync correct state when provider emits uri
    this.chain = chain;

    await this._provider.connect({
      namespaces: {
        [chain.namespace]: {
          methods:
            chain.namespace === ChainNamespace.EIP155 ? EIP155_METHODS : [],
          chains: [`${chain.namespace}:${chain.id}`],
          events:
            chain.namespace === ChainNamespace.EIP155 ? EIP155_EVENTS : [],
          rpcMap: { [chain.id]: chain.httpRpcUrl },
        },
      },
    });

    this.accounts = await this._provider.enable();
    this.chain = chain;
    this.connected = true;

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
    if (this._provider.session?.topic) {
      await this._provider.disconnect();
    }

    this._provider.abortPairingAttempt();
    this._provider.cleanupPendingPairings({ deletePairings: true });

    this.accounts = undefined;
    this.currentAccount = undefined;
    this.connected = false;
    this.uri = undefined;
  }
}
