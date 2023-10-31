import type { ProviderAccounts } from "@walletconnect/universal-provider";
// eslint-disable-next-line max-len
import type { UniversalProvider } from "@walletconnect/universal-provider/dist/types/UniversalProvider";
import { ExtensionContext } from "vscode";
import * as chains from "../chains";
import { EIP155_EVENTS, EIP155_METHODS, ERROR_MESSAGE } from "../constants";
import { ChainNamespace } from "../enums";
import { isValidChain } from "../typeguards";
import type { Chain, ChainUpdateStatus } from "../types";

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
  public chains: Chain[];

  /**
   * The list of accounts available in the connected wallet provider.
   */
  public accounts?: ProviderAccounts;

  /**
   * Represents the current chain or network the wallet is connected to.
   */
  public chain?: Chain;

  /**
   * The address of the selected account in the connected wallet.
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
  constructor(
    private readonly _provider: UniversalProvider,
    private readonly _globalState: ExtensionContext["globalState"],
  ) {
    this.chains = this._loadChains();
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
    const chain = this.chains.find((c) => c.id === id);

    if (!chain) {
      throw new Error(ERROR_MESSAGE.INVALID_CHAIN_ID);
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

  /**
   * Adds a new chain to the chain list and sets the new chain as the
   * active chain.
   *
   * @param chain
   * The new chain object to be added.
   */
  public addChain(chain: Chain): void {
    this.chain = chain;
    this.chains.push(chain);
    this.chains.sort((a, b) => a.name.localeCompare(b.name));
    this.chainUpdateStatus = "done";
    this.uri = undefined;
    this._globalState.update("chains", this.chains);
  }

  /**
   * Updates chain and chain list and sets the updated chain as the
   * active chain.
   *
   * @param chain
   * The updated chain object to be added.
   *
   * @param index
   * The index of the chain to update.
   */
  public editChain(chain: Chain, index: number): void {
    this.chain = chain;
    this.chains[index] = chain;
    this.chains.sort((a, b) => a.name.localeCompare(b.name));
    this.chainUpdateStatus = "done";
    this.uri = undefined;
    this._globalState.update("chains", this.chains);
  }

  /**
   * Loads chains saved in global state if any, then adds default chains
   * that aren't duplicates of the chains saved in state before returning
   * the loaded chains.
   *
   * @returns
   * Array with combination of unique global state and default chains.
   */
  private _loadChains(): Chain[] {
    const loadedChains: Chain[] = [];

    const stateChains = this._globalState.get("chains", []);

    for (const chain of stateChains) {
      if (isValidChain(chain)) {
        loadedChains.push(chain);
      }
    }

    for (const chain of Object.values(chains)) {
      const found = loadedChains.find(
        (c) => c.namespace === chain.namespace && c.id === chain.id,
      );

      if (!found) {
        loadedChains.push(chain);
      }
    }

    loadedChains.sort((a, b) => a.name.localeCompare(b.name));

    return loadedChains;
  }
}
