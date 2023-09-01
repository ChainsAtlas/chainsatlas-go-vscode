import { ProviderAccounts } from "web3";
import { WalletController } from "../controllers";
import {
  ExecutorModel,
  TransactionHistoryModel,
  VirtualizationUnitModel,
  WalletModel,
} from "../models";
import { WalletView } from "../views";
import { AuthStatus } from "./auth.type";
import { SupportedChain } from "./common.type";

/**
 * Enum representing possible commands sent from {@link WalletView}
 * to the {@link WalletController}
 */
export enum WalletCommand {
  CHANGE_ACCOUNT = "changeAccount",
  CONNECT = "connect",
  DISCONNECT = "disconnect",
  LOGIN = "login",
  LOGOUT = "logout",
  READY = "ready",
}

/**
 * Represents a mapping of models required
 * for the {@link WalletController} constructor.
 */
export type WalletControllerModelMap = {
  executor: ExecutorModel;
  transactionHistory: TransactionHistoryModel;
  virtualizationUnit: VirtualizationUnitModel;
  wallet: WalletModel;
};

/**
 * Represents the state of the {@link WalletView}
 */
export type WalletViewState = {
  accounts?: ProviderAccounts;
  authStatus?: AuthStatus;
  chain: SupportedChain;
  balance?: string;
  chains: SupportedChain[];
  currentAccount?: string;
  connected?: boolean;
  uri?: string;
};
