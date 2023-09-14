import { Chain } from "../types";

export const ethereumSepolia: Chain = {
  namespace: "eip155",
  id: 11_155_111,
  name: "Ethereum Sepolia",
  blockExplorer: "https://sepolia.etherscan.io/tx/{{TX_HASH}}",
  httpRpc: "https://rpc.sepolia.org",
};
