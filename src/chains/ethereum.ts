import { Chain } from "../types";

export const ethereum: Chain = {
  namespace: "eip155",
  id: 1,
  name: "Ethereum",
  blockExplorer: "https://etherscan.io/tx/{{TX_HASH}}",
  httpRpc: "https://cloudflare-eth.com",
};
