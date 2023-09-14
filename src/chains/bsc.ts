import { Chain } from "../types";

export const bsc: Chain = {
  namespace: "eip155",
  id: 56,
  name: "BNB Smart Chain",
  blockExplorer: "https://bscscan.com/tx/{{TX_HASH}}",
  httpRpc: "https://rpc.ankr.com/bsc",
};
