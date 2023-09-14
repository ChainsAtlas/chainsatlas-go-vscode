import { Chain } from "../types";

export const polygonMumbai: Chain = {
  namespace: "eip155",
  id: 80_001,
  name: "Polygon Mumbai",
  blockExplorer: "https://mumbai.polygonscan.com/tx/{{TX_HASH}}",
  httpRpc: "https://rpc.ankr.com/polygon_mumbai",
};
