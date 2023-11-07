import type { Chain } from "../types";

export const arbitrum: Chain = {
  namespace: "eip155",
  id: 42_161,
  name: "Arbitrum One",
  httpRpcUrl: "https://arb1.arbitrum.io/rpc",
  blockExplorerUrl: "https://arbiscan.io",
};
