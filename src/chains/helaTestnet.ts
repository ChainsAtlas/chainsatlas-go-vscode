import type { Chain } from "../types";

export const helaTestnet: Chain = {
  namespace: "eip155",
  id: 666_888,
  name: "Hela Official Runtime Testnet",
  httpRpcUrl: "https://hela-official-runtime-testnet.rpc.thirdweb.com",
  transactionExplorerUrl:
    "https://testnet-blockexplorer.helachain.com/tx/{txHash}",
};
