import { FMT_BYTES, FMT_NUMBER } from "web3";
import { SUPPORTED_CHAINS } from "../constants";
import {
  ExecutorModel,
  TransactionHistoryModel,
  VirtualizationUnitModel,
  WalletModel,
} from "../models";
import {
  ExecutorViewState,
  TransactionHistoryViewState,
  ViewType,
  VirtualizationUnitViewState,
  WalletViewState,
} from "../types";
import ChainsAtlasGOApi from "./ChainsAtlasGOApi";

const ERROR_MESSAGE = {
  INVALID_CHAIN: "Invalid chain.",
};

class ViewStateGenerator {
  constructor(
    private readonly _api: ChainsAtlasGOApi,
    private readonly _executor: ExecutorModel,
    private readonly _transactionHistory: TransactionHistoryModel,
    private readonly _virtualizationUnit: VirtualizationUnitModel,
    private readonly _wallet: WalletModel,
  ) {}

  public generateViewState = (
    viewType: ViewType,
  ):
    | ExecutorViewState
    | TransactionHistoryViewState
    | VirtualizationUnitViewState
    | Promise<WalletViewState | undefined>
    | undefined => {
    switch (viewType) {
      case ViewType.EXECUTOR:
        return this._executorViewState();
      case ViewType.TRANSACTION_HISTORY:
        return this._generateTransactionHistoryViewState();
      case ViewType.VIRTUALIZATION_UNIT:
        return this._generateVirtualizationUnitViewState();
      case ViewType.WALLET:
        return this._generateWalletViewState();
      default:
        return undefined;
    }
  };

  private _executorViewState = (): ExecutorViewState | undefined => {
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

  private _generateTransactionHistoryViewState = ():
    | TransactionHistoryViewState
    | undefined => {
    const { rows } = this._transactionHistory;
    const { currentAccount } = this._wallet;

    return {
      disabled: !Boolean(currentAccount),
      rows,
    };
  };

  private _generateVirtualizationUnitViewState = ():
    | VirtualizationUnitViewState
    | undefined => {
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

  private _generateWalletViewState = async (): Promise<
    WalletViewState | undefined
  > => {
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

export default ViewStateGenerator;
