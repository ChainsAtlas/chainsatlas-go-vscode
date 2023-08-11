import { Chain } from "@wagmi/chains";
import { ProviderAccounts } from "@walletconnect/universal-provider";
import { WebviewView } from "vscode";
import { FMT_BYTES, FMT_NUMBER, NonPayableCallOptions } from "web3";

type BytecodeStructure = {
  bytecode: string;
  key: string;
  nargs: number;
};

type ExecutorData = {
  bytecodeStruct?: BytecodeStructure;
  disabled: boolean;
  gasEstimate?: string;
};

type SupportedLanguage = {
  fileExtension: "c" | "js";
  name: "C" | "JavaScript";
};

type ViewMap = Record<ViewType, WebviewView>;

type ViewType = "executor" | "history" | "virtualizationUnit" | "wallet";

type VirtualizationUnitData = {
  contracts: string[];
  currentContract?: string;
  disabled: boolean;
  gasEstimate?: string;
};

type VirtualizationUnitMethods = {
  getRuntimeReturn: (bytecodeAddress: string) => { call: () => string };
  runBytecode: (inputBytecode: string) => {
    encodeABI: () => string;
    estimateGas: (
      options?: NonPayableCallOptions,
      returnFormat?: {
        readonly number: FMT_NUMBER.BIGINT;
        readonly bytes: FMT_BYTES.HEX;
      },
    ) => Promise<BigInt>;
  };
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

export {
  BytecodeStructure,
  ExecutorData,
  SupportedLanguage,
  ViewMap,
  ViewType,
  VirtualizationUnitData,
  VirtualizationUnitMethods,
  VsCodeApi,
  WalletData,
};
