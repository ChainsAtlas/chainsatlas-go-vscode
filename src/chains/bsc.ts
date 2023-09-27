import { Chain } from "../types";

export const bsc: Chain = {
  namespace: "eip155",
  id: 56,
  name: "BNB Smart Chain",
  transactionExplorerUrl: "https://bscscan.com/tx/{{TX_HASH}}",
  httpRpcUrl: "https://rpc.ankr.com/bsc",
};
