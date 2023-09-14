import { ProviderAccounts } from "web3";
import { Controller } from "../lib";
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
 * Enum representing possible commands sent from {@link WalletView}
 * to the {@link Controller}
 */
export enum WalletCommand {
  CHANGE_ACCOUNT = "changeAccount",
  CONNECT = "connect",
  DISCONNECT = "disconnect",
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
  chain: Chain;
  balance?: string;
  chains: Chain[];
  currentAccount?: string;
  connected?: boolean;
  uri?: string;
};
