import type { Chain } from "../types";

export const arbitrumSepolia: Chain = {
  namespace: "eip155",
  id: 421_614,
  name: "Arbitrum Sepolia",
  httpRpcUrl: "https://arbitrum-sepolia.rpc.thirdweb.com",
  transactionExplorerUrl: "https://sepolia-explorer.arbiscan.io/tx/{txHash}",
};
