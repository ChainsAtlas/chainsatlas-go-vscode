import { Chain } from "../types";

export const celo: Chain = {
  namespace: "eip155",
  id: 42_220,
  name: "Celo",
  blockExplorer: "https://explorer.celo.org/mainnet/tx/{{TX_HASH}}",
  httpRpc: "https://forno.celo.org",
};
