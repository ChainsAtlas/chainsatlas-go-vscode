import type { Chain } from "../types";

export const ethereumSepolia: Chain = {
  namespace: "eip155",
  id: 11_155_111,
  name: "Ethereum Sepolia",
  transactionExplorerUrl: "https://sepolia.etherscan.io/tx/{txHash}",
};
