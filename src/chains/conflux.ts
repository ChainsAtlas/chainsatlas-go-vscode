import type { Chain } from "../types";

export const conflux: Chain = {
  namespace: "eip155",
  id: 1_030,
  name: "Conflux eSpace",
  httpRpcUrl: "https://conflux-espace.rpc.thirdweb.com",
  transactionExplorerUrl: "https://evm.confluxscan.net/tx/{txHash}",
};
