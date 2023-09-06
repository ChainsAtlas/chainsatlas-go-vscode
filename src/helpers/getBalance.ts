import Web3, { FMT_BYTES, FMT_NUMBER } from "web3";

export const getBalance = async (
  account?: string,
  chainId?: number,
  web3?: Web3,
): Promise<string | undefined> => {
  if (account && chainId && web3) {
    const web3ChainId = await web3.eth.getChainId({
      number: FMT_NUMBER.NUMBER,
      bytes: FMT_BYTES.HEX,
    });

    return chainId === web3ChainId
      ? await web3.eth.getBalance(account, undefined, {
          number: FMT_NUMBER.STR,
          bytes: FMT_BYTES.HEX,
        })
      : undefined;
  }

  return undefined;
};
