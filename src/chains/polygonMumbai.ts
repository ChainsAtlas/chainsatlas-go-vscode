import type { Chain } from "../types";

export const polygonMumbai: Chain = {
  namespace: "eip155",
  id: 80_001,
  name: "Polygon Mumbai",
  transactionExplorerUrl: "https://mumbai.polygonscan.com/tx/{txHash}",
};
