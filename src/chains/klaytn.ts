import { Chain } from "../types";

export const klaytn: Chain = {
  namespace: "eip155",
  id: 8_217,
  name: "Klaytn",
  blockExplorer: "https://scope.klaytn.com/tx/{{TX_HASH}}",
  httpRpc: "https://cypress.fautor.app/archive",
};
