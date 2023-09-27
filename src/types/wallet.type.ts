import { ProviderAccounts } from "web3";
import { Controller } from "../lib";
import { WalletModel } from "../models";
import { WalletView } from "../views";
import { AuthStatus } from "./auth.type";
import { Chain } from "./common.type";

/**
 * Represents the supported blockchain namespaces
 */
export enum ChainNamespace {
  EIP155 = "eip155",
}

/**
 * Represents the chain update status for {@link WalletModel}
 * required to manage the state of the Wallet view.
 */
export type ChainUpdateStatus = "done" | "updating";

/**
 * Enum representing possible commands sent from {@link WalletView}
 * to the {@link Controller}
 */
export enum WalletCommand {
  ADD_CHAIN = "addChain",
  CHANGE_ACCOUNT = "changeAccount",
  CONNECT = "connect",
  DISCONNECT = "disconnect",
  EDIT_CHAIN = "editChain",
  LOGIN = "login",
  LOGOUT = "logout",
  READY = "walletReady",
}

/**
 * Represents the state of the {@link WalletView}
 */
export type WalletViewState = {
  accounts?: ProviderAccounts;
  authStatus?: AuthStatus;
  balance?: string;
  chain: Chain;
  chainUpdateStatus?: ChainUpdateStatus;
  chains: Chain[];
  currentAccount?: string;
  connected?: boolean;
  uri?: string;
};
