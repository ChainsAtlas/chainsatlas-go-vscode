import type { Chain } from "../types";

export const confluxTestnet: Chain = {
  namespace: "eip155",
  id: 71,
  name: "Conflux eSpace Testnet",
  httpRpcUrl: "https://conflux-espace-testnet.rpc.thirdweb.com",
  transactionExplorerUrl: "https://evmtestnet.confluxscan.net/tx/{txHash}",
};
