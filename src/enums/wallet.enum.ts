import type { Controller } from "../lib";

/**
 * Represents the supported blockchain namespaces
 */
export enum ChainNamespace {
  EIP155 = "eip155",
}

/**
 * Enum representing possible commands sent from the Wallet View
 * to the {@link Controller}
 */
export enum WalletCommand {
  ADD_CHAIN = "addChain",
  CONNECT = "connect",
  DISCONNECT = "disconnect",
  EDIT_CHAIN = "editChain",
  LOGIN = "login",
  LOGOUT = "logout",
  READY = "walletReady",
}
