import type { Chain } from "../types";

export const ethereum: Chain = {
  namespace: "eip155",
  id: 1,
  name: "Ethereum",
  httpRpcUrl: "https://eth.public-rpc.com",
  blockExplorerUrl: "https://etherscan.io",
};
