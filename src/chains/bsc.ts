import type { Chain } from "../types";

export const bsc: Chain = {
  namespace: "eip155",
  id: 56,
  name: "BNB Smart Chain",
  httpRpcUrl: "https://binance.rpc.thirdweb.com",
  transactionExplorerUrl: "https://bscscan.com/tx/{txHash}",
};
