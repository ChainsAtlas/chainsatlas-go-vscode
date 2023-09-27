import { Chain } from "../types";

export const polygonMumbai: Chain = {
  namespace: "eip155",
  id: 80_001,
  name: "Polygon Mumbai",
  transactionExplorerUrl: "https://mumbai.polygonscan.com/tx/{{TX_HASH}}",
  httpRpcUrl: "https://rpc.ankr.com/polygon_mumbai",
};
