import type { ProviderAccounts } from "@walletconnect/universal-provider";
import type { WalletModel } from "../models";
import type { WalletView } from "../views/Wallet";
import type { AuthStatus } from "./auth.type";
import type { Chain, ValidChain } from "./common.type";

/**
 * Represents the chain update status for {@link WalletModel}
 * required to manage the state of the Wallet view.
 */
export type ChainUpdateStatus = "done" | "updating";

/**
 * Represents the state of the {@link WalletView}
 */
export type WalletViewState = {
  accounts?: ProviderAccounts;
  authStatus?: AuthStatus;
  balance: string;
  chainUpdateStatus?: ChainUpdateStatus;
  chains: (Chain | ValidChain)[];
  currentAccount?: string;
  connected: boolean;
  uri?: string;
};
