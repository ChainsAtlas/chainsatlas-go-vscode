import { Chain } from "../types";

export const polygon: Chain = {
  namespace: "eip155",
  id: 137,
  name: "Polygon",
  blockExplorer: "https://polygonscan.com/tx/{{TX_HASH}}",
  httpRpc: "https://polygon-rpc.com",
};
