import { Chain } from "../types";

export const ethereum: Chain = {
  namespace: "eip155",
  id: 1,
  name: "Ethereum",
  transactionExplorerUrl: "https://etherscan.io/tx/{{TX_HASH}}",
  httpRpcUrl: "https://cloudflare-eth.com",
};
