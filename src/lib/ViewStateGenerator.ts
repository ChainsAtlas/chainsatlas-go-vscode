import { FMT_BYTES, FMT_NUMBER } from "web3";
import { withErrorHandling } from "../Utils";
import { ERROR_MESSAGE, SUPPORTED_CHAINS } from "../constants";
import {
  ExecutorModel,
  SettingsModel,
  TransactionHistoryModel,
  VirtualizationUnitModel,
  WalletModel,
} from "../models";
import {
  ExecutorViewState,
  SettingsViewState,
  TransactionHistoryViewState,
  ViewType,
  VirtualizationUnitViewState,
  WalletViewState,
} from "../types";
import { ChainsAtlasGOApi } from "./ChainsAtlasGOApi";

/**
 * Represents a generator that produces different types of view states based on the given ViewType.
 *
 * This class consolidates data from various models to generate view states for different components in the application.
 *
 * @example
 * const viewStateGenerator = new ViewStateGenerator(api, executor, transactionHistory, virtualizationUnit, wallet);
 * const walletViewState = viewStateGenerator.generateViewState(ViewType.WALLET);
 */
export class ViewStateGenerator {
  /**
   * Initializes a new instance of the `ViewStateGenerator` class.
   *
   * @param _api - An instance of the ChainsAtlasGOApi to fetch authentication status.
   * @param _executor - An instance of the ExecutorModel to fetch compiler and execution data.
   * @param _transactionHistory - An instance of the TransactionHistoryModel to fetch transaction history.
   * @param _virtualizationUnit - An instance of the VirtualizationUnitModel to fetch virtualization unit data.
   * @param _wallet - An instance of the WalletModel to fetch wallet data.
   */
  constructor(
    private readonly _api: ChainsAtlasGOApi,
    private readonly _executor: ExecutorModel,
    private readonly _settings: SettingsModel,
    private readonly _transactionHistory: TransactionHistoryModel,
    private readonly _virtualizationUnit: VirtualizationUnitModel,
    private readonly _wallet: WalletModel,
  ) {}

  /**
   * Generates a view state based on the provided `ViewType`.
   *
   * This method consolidates data from various models to produce a state that corresponds to a specific view.
   * It returns the view state after handling any potential errors that might occur during generation.
   *
   * @param viewType - The type of view for which the state needs to be generated.
   * @returns A Promise resolving to the corresponding view state based on the provided `ViewType`.
   *
   * @example
   * const viewState = await generator.generateViewState(ViewType.EXECUTOR);
   */
  public generateViewState = (
    viewType: ViewType,
  ): Promise<
    | Promise<
        | ExecutorViewState
        | SettingsViewState
        | TransactionHistoryViewState
        | VirtualizationUnitViewState
        | WalletViewState
        | undefined
      >
    | undefined
  > =>
    withErrorHandling(async () => {
      switch (viewType) {
        case ViewType.EXECUTOR:
          return this._generateExecutorViewState();
        case ViewType.SETTINGS:
          return this._generateSettingsViewState();
        case ViewType.TRANSACTION_HISTORY:
          return this._generateTransactionHistoryViewState();
        case ViewType.VIRTUALIZATION_UNIT:
          return this._generateVirtualizationUnitViewState();
        case ViewType.WALLET:
          return this._generateWalletViewState();
        default:
          return undefined;
      }
    })();

  /**
   * Generates the state for the executor view.
   *
   * It aggregates relevant data from the executor model, virtualization unit model, and wallet model.
   * The resulting state provides information like the compiler status, current file, and gas estimate among others.
   *
   * @returns The executor view state or `undefined` if the required data is not available.
   */
  private _generateExecutorViewState = (): ExecutorViewState => {
    const {
      compilerStatus,
      contractTransactionStatus,
      currentFile,
      estimating,
      gasEstimate,
      nargs,
      userFile,
    } = this._executor;
    const { currentContract } = this._virtualizationUnit;
    const { currentAccount } = this._wallet;

    return {
      compilerStatus,
      contractTransactionStatus,
      currentFile,
      disabled: !Boolean(currentAccount && currentContract),
      estimating,
      gasEstimate,
      nargs,
      userFile,
    };
  };

  private _generateSettingsViewState = (): SettingsViewState => {
    const { authStatus } = this._api;
    const { telemetry } = this._settings;

    return { telemetry, disabled: authStatus !== "authenticated" };
  };

  /**
   * Generates the state for the transaction history view.
   *
   * It primarily fetches the transaction rows from the transaction history model.
   * The resulting state provides information about the transactions and a flag to determine if the view is disabled.
   *
   * @returns The transaction history view state or `undefined` if the required data is not available.
   */
  private _generateTransactionHistoryViewState =
    (): TransactionHistoryViewState => {
      const { rows } = this._transactionHistory;
      const { currentAccount } = this._wallet;

      return {
        disabled: !Boolean(currentAccount),
        rows,
      };
    };

  /**
   * Generates the state for the virtualization unit view.
   *
   * It aggregates relevant data from the virtualization unit model and wallet model.
   * The resulting state provides information about the contracts, current contract, and gas estimate among others.
   *
   * @returns The virtualization unit view state or `undefined` if the required data is not available.
   */
  private _generateVirtualizationUnitViewState =
    (): VirtualizationUnitViewState => {
      const {
        contracts,
        contractTransactionStatus,
        currentContract,
        estimating,
        gasEstimate,
      } = this._virtualizationUnit;
      const { currentAccount } = this._wallet;

      return {
        contracts,
        contractTransactionStatus,
        currentContract,
        disabled: !Boolean(currentAccount),
        estimating,
        gasEstimate,
      };
    };

  /**
   * Asynchronously generates the state for the wallet view.
   *
   * It aggregates relevant data from the wallet model and makes an API call to fetch the authentication status.
   * The resulting state provides detailed information about the wallet, including accounts, chain, and connection status.
   *
   * @returns A Promise that resolves to the wallet view state or `undefined` if the required data is not available.
   */
  private _generateWalletViewState = async (): Promise<WalletViewState> => {
    const { accounts, currentAccount, chain, connected, uri } = this._wallet;
    const { authStatus } = this._api;

    if (!chain) {
      throw new Error(ERROR_MESSAGE.INVALID_CHAIN);
    }

    return {
      accounts,
      authStatus,
      balance: await this._getBalance(currentAccount, chain?.id.toString()),
      chain,
      chains: SUPPORTED_CHAINS,
      currentAccount,
      connected,
      uri,
    };
  };

  /**
   * Asynchronously fetches the balance for a given account and chain ID.
   *
   * This method uses the wallet's web3 instance to query the balance for the specified account on the provided chain.
   * If the provided chain ID doesn't match the wallet's web3 instance chain ID, it returns `undefined`.
   *
   * @param account - The account address for which the balance needs to be fetched.
   * @param chainId - The chain ID on which the balance query should be made.
   * @returns A Promise resolving to the balance in the specified format or `undefined` if the chain IDs don't match or other data is missing.
   */
  private _getBalance = async (
    account?: string,
    chainId?: string,
  ): Promise<string | undefined> => {
    if (account && chainId && this._wallet.web3) {
      const web3ChainId = (await this._wallet.web3.eth.getChainId()).toString();

      return chainId === web3ChainId
        ? await this._wallet.web3.eth.getBalance(account, undefined, {
            number: FMT_NUMBER.STR,
            bytes: FMT_BYTES.HEX,
          })
        : undefined;
    }

    return undefined;
  };
}
