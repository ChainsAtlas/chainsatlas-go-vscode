import type { ValidChain } from "../types";

export const isValidChain = (obj: any): obj is ValidChain => {
  return (
    typeof obj === "object" &&
    obj !== null &&
    typeof obj.namespace === "string" &&
    typeof obj.id === "number" &&
    typeof obj.name === "string" &&
    typeof obj.transactionExplorerUrl === "string" &&
    obj.transactionExplorerUrl.includes("{txHash}") &&
    typeof obj.httpRpcUrl === "string" &&
    obj.httpRpcUrl.length > 0
  );
};
