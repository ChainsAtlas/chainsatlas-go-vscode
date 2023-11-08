import type { Chain } from "../types";

export const isChain = (obj: any): obj is Chain => {
  return (
    typeof obj === "object" &&
    obj !== null &&
    typeof obj.namespace === "string" &&
    obj.namespace.length > 0 &&
    typeof obj.id === "number" &&
    typeof obj.name === "string" &&
    obj.name.length > 0 &&
    typeof obj.blockExplorerUrl === "string" &&
    obj.blockExplorerUrl.length > 0 &&
    typeof obj.httpRpcUrl === "string" &&
    obj.httpRpcUrl.length > 0
  );
};
