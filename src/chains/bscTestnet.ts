import type { Chain } from "../types";

export const bscTestnet: Chain = {
  namespace: "eip155",
  id: 97,
  name: "Binance Smart Chain Testnet",
  transactionExplorerUrl: "https://testnet.bscscan.com/tx/{txHash}",
};
