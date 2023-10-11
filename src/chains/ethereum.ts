import type { Chain } from "../types";

export const ethereum: Chain = {
  namespace: "eip155",
  id: 1,
  name: "Ethereum",
  transactionExplorerUrl: "https://etherscan.io/tx/{txHash}",
};
