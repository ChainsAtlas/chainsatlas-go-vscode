import { Chain } from "../types";

export const arbitrum: Chain = {
  namespace: "eip155",
  id: 42_161,
  name: "Arbitrum One",
  transactionExplorerUrl: "https://arbiscan.io/tx/{{TX_HASH}}",
  httpRpcUrl: "https://arb1.arbitrum.io/rpc",
};
