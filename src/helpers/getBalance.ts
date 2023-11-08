import { BrowserProvider } from "ethers";
export const getBalance = async (
  account: string,
  provider: BrowserProvider,
): Promise<string> => {
  return (await provider.getBalance(account)).toString();
};
