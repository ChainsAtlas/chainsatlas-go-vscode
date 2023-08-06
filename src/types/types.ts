import { Chain } from "@wagmi/chains";
import { ProviderAccounts } from "@walletconnect/universal-provider";

type ViewType = "executor" | "history" | "vUnit" | "wallet";

type VsCodeApi = {
  postMessage(message: { type: string; value?: any }): void;
};

type WalletData = {
  accounts?: ProviderAccounts;
  chain?: Chain;
  balance?: string;
  chains: Chain[];
  currentAccount?: string;
  isConnected?: boolean;
};

export { ViewType, VsCodeApi, WalletData };
