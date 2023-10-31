import type { Chain } from "../types";

export const polygonMumbai: Chain = {
  namespace: "eip155",
  id: 80_001,
  name: "Polygon Mumbai",
  httpRpcUrl: "https://mumbai.rpc.thirdweb.com",
  transactionExplorerUrl: "https://mumbai.polygonscan.com/tx/{txHash}",
};
