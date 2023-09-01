import { ProviderAccounts } from "@walletconnect/universal-provider";
import UniversalProvider from "@walletconnect/universal-provider/dist/types/UniversalProvider";
import Web3 from "web3";
import { withErrorHandling } from "../Utils";
import { SUPPORTED_CHAINS } from "../constants";

/**
 * Represents a model for managing the wallet connection, including chain and account management.
 *
 * This class provides functionalities for connecting to a wallet, switching chains, and managing account states.
 *
 * @example
 * const walletModel = new WalletModel(universalProviderInstance);
 * walletModel.connect(11155111);
 */
export class WalletModel {
  /**
   * An instance of the Web3 library, initialized after connecting to the provider.
   */
  public web3?: Web3;

  /**
   * A static list of events related to the EIP155 standard.
   */
  private static readonly _EIP155_EVENTS = ["chainChanged", "accountsChanged"];

  /**
   * A static list of methods related to the EIP155 standard.
   */
  private static readonly _EIP155_METHODS = [
    "eth_sendTransaction",
    "eth_signTransaction",
    "eth_sign",
    "personal_sign",
    "eth_signTypedData",
  ];

  /**
   * The list of accounts available in the connected wallet provider.
   */
  public accounts?: ProviderAccounts;

  /**
   * Represents the current chain or network the wallet is connected to.
   */
  public chain = SUPPORTED_CHAINS.find((chain) => chain.id === 11_155_111); // sepolia

  /**
   * The account address of the currently selected account in the connected wallet.
   */
  public currentAccount?: string;

  /**
   * Indicates whether the wallet is currently connected to the provider.
   */
  public connected?: boolean;

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
   * @param _provider - An instance of the UniversalProvider to manage the wallet connection.
   */
  constructor(private readonly _provider: UniversalProvider) {}

  /**
   * Connects the wallet to the specified chain or network.
   *
   * This method initiates the connection, sets the selected chain, and fetches the available accounts.
   *
   * @param id - The ID of the chain or network to connect to.
   * @throws Will throw an error if the chain ID is invalid or the connection fails.
   */
  public connect = async (id: number): Promise<void> =>
    withErrorHandling(async () => {
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
            rpcMap: { [chain.id]: chain.rpc },
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
    })();

  /**
   * Disconnects the wallet from the current provider and resets the state.
   *
   * This method ensures a clean state after disconnection by also resetting account and connection information.
   *
   * @throws Will throw an error if the disconnection process encounters any issues.
   */
  public disconnect = async (): Promise<void> =>
    withErrorHandling(async () => {
      if (this._provider.session) {
        await this._provider.disconnect();
      }

      if (this.web3) {
        this.web3.currentProvider?.disconnect();
      }

      this.accounts = undefined;
      this.currentAccount = undefined;
      this.connected = false;
    })();
}
