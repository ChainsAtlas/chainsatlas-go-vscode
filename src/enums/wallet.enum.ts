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
  ADD_CHAIN = "addChain",
  CHANGE_ACCOUNT = "changeAccount",
  CONNECT = "connect",
  DISCONNECT = "disconnect",
  EDIT_CHAIN = "editChain",
  LOGIN = "login",
  LOGOUT = "logout",
  READY = "walletReady",
}
