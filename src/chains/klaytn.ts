import { Chain } from "../types";

export const klaytn: Chain = {
  namespace: "eip155",
  id: 8_217,
  name: "Klaytn",
  transactionExplorerUrl: "https://scope.klaytn.com/tx/{{TX_HASH}}",
  httpRpcUrl: "https://cypress.fautor.app/archive",
};
