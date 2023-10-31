import type { Chain } from "../types";

export const polygon: Chain = {
  namespace: "eip155",
  id: 137,
  name: "Polygon",
  httpRpcUrl: "https://polygon.rpc.thirdweb.com",
  transactionExplorerUrl: "https://polygonscan.com/tx/{txHash}",
};
