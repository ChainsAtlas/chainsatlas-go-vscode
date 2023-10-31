import type { Chain } from "../types";

export const bscTestnet: Chain = {
  namespace: "eip155",
  id: 97,
  name: "BNB Smart Chain Testnet",
  httpRpcUrl: "https://binance-testnet.rpc.thirdweb.com",
  transactionExplorerUrl: "https://testnet.bscscan.com/tx/{txHash}",
};
