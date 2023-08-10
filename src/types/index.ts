import { Chain } from "@wagmi/chains";
import { ProviderAccounts } from "@walletconnect/universal-provider";
import { WebviewView } from "vscode";

type ViewMap = Record<ViewType, WebviewView>;

type ViewType = "executor" | "history" | "virtualizationUnit" | "wallet";

type VirtualizationUnitData = {
  contracts: string[];
  currentContract?: string;
  disabled: boolean;
  gasEstimate?: string;
};

type VsCodeApi = {
  postMessage(message: { type: string; value?: any }): void;
};

type WalletData = {
  accounts?: ProviderAccounts;
  chain: Chain;
  balance?: string;
  chains: Chain[];
  currentAccount?: string;
  isConnected?: boolean;
  uri?: string;
};

export { ViewMap, ViewType, VirtualizationUnitData, VsCodeApi, WalletData };
