import type { Chain } from "../types";

export const arbitrum: Chain = {
  namespace: "eip155",
  id: 42_161,
  name: "Arbitrum One",
  httpRpcUrl: "https://arbitrum.rpc.thirdweb.com",
  transactionExplorerUrl: "https://arbiscan.io/tx/{txHash}",
};
