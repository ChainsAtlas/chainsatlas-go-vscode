import type { Chain } from "../types";

export const celo: Chain = {
  namespace: "eip155",
  id: 42_220,
  name: "Celo",
  transactionExplorerUrl: "https://explorer.celo.org/mainnet/tx/{txHash}",
};
