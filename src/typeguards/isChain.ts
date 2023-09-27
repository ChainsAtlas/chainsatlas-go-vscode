import { Chain } from "../types";

export const isChain = (obj: any): obj is Chain => {
  return (
    typeof obj === "object" &&
    obj !== null &&
    typeof obj.namespace === "string" &&
    typeof obj.id === "number" &&
    typeof obj.name === "string" &&
    typeof obj.transactionExplorerUrl === "string" &&
    obj.transactionExplorerUrl.includes("{txHash}") &&
    typeof obj.httpRpcUrl === "string"
  );
};
