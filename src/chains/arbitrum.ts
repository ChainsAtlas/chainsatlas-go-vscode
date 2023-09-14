import { Chain } from "../types";

export const arbitrum: Chain = {
  namespace: "eip155",
  id: 42_161,
  name: "Arbitrum One",
  blockExplorer: "https://arbiscan.io/tx/{{TX_HASH}}",
  httpRpc: "https://arb1.arbitrum.io/rpc",
};
