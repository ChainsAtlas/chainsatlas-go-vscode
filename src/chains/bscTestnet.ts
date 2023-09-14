import { Chain } from "../types";

export const bscTestnet: Chain = {
  namespace: "eip155",
  id: 97,
  name: "Binance Smart Chain Testnet",
  blockExplorer: "https://testnet.bscscan.com/tx/{{TX_HASH}}",
  httpRpc: "https://data-seed-prebsc-1-s1.binance.org:8545",
};
