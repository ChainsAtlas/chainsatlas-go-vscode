import type { WalletModel } from "../models";
import type { WalletView } from "../views/Wallet";
import type { AuthStatus } from "./auth.type";
import type { Chain } from "./common.type";

/**
 * Represents the chain update status for {@link WalletModel}
 * required to manage the state of the Wallet view.
 */
export type ChainUpdateStatus = "done" | "updating";

/**
 * Represents the state of the {@link WalletView}
 */
export type WalletViewState = {
  account?: string;
  authStatus?: AuthStatus;
  balance: string;
  chain: Chain;
  chainUpdateStatus?: ChainUpdateStatus;
  chains: Chain[];
  connected: boolean;
  uri?: string;
};
