import { Chain } from "../types";

export const ethereumSepolia: Chain = {
  namespace: "eip155",
  id: 11_155_111,
  name: "Ethereum Sepolia",
  transactionExplorerUrl: "https://sepolia.etherscan.io/tx/{{TX_HASH}}",
  httpRpcUrl: "https://rpc.sepolia.org",
};
