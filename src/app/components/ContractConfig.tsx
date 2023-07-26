import React from "react";

import WalletConnectProvider from "@walletconnect/web3-provider";
import BigNumber from "bignumber.js";
import {
  useAccount,
  useContractWrite,
  useNetwork,
  usePrepareContractWrite,
  useWaitForTransaction,
} from "wagmi";
import type { Contract } from "web3";
import Web3 from "web3";
import executor from "../sdk/executor";

interface DeployProps {
  abi: any;
  account: `0x${string}`;
  bytecode: string;
  contract: Contract<any>;
}

const ExecuteBytecode = ({
  abi,
  account,
  bytecode,
  contract,
}: DeployProps): JSX.Element => {
  const {
    config,
    error: prepareError,
    isError: isPrepareError,
  } = usePrepareContractWrite({
    abi,
    account,
    address: contract.options.address as `0x${string}` | undefined,
    functionName: "runBytecode",
    args: [bytecode],
  });

  const { data, error, isError, write } = useContractWrite(config);

  const { isLoading, isSuccess } = useWaitForTransaction({
    hash: data?.hash,
  });

  return (
    <div>
      {write && (
        <button className="border-2 rounded p-2" onClick={() => write()}>
          {isLoading ? "Deploying..." : "Deploy"}
        </button>
      )}
      {isSuccess && (
        <div>
          Successfully deployed your contract!
          <div>
            <a href={`https://etherscan.io/tx/${data?.hash}`}>Etherscan</a>
          </div>
        </div>
      )}
      {(isPrepareError || isError) && (
        <div>Error: {(prepareError || error)?.message}</div>
      )}
    </div>
  );
};

const ContractConfig = (): JSX.Element => {
  const [abi, setAbi] = React.useState<any>();
  const [account, setAccount] = React.useState<`0x${string}` | undefined>();
  const [bytecode, setBytecode] = React.useState<string>();
  const [contract, setContract] = React.useState<Contract<any> | undefined>();

  const { isConnected } = useAccount({
    onConnect({ address }) {
      setAccount(address);
    },
  });
  const { chains } = useNetwork();

  const deployContract = React.useCallback(async (): Promise<void> => {
    if (account && chains) {
      const rpc = {};

      chains.forEach((chain) => {
        Object.defineProperty(rpc, chain.id, {
          value: chain.rpcUrls.default.http[0],
          writable: false,
        });
      });

      const provider = new WalletConnectProvider({ rpc });

      await provider.enable();

      const web3 = new Web3(provider);

      const chainId = await web3.eth.getChainId();

      const contract = new web3.eth.Contract(executor.interface);

      const contractDeployment = contract.deploy({ data: executor.bytecode });

      const gasEstimate = await contractDeployment.estimateGas({
        from: account,
      });

      const gasWithBuffer = Math.floor(
        new BigNumber(gasEstimate.toString()).multipliedBy(1.15).toNumber(),
      ).toString();
      const contractInstance = await contractDeployment.send({
        from: account,
        gas: gasWithBuffer,
      });

      setAbi(executor.interface);
      setBytecode(executor.bytecode);
      setContract(contractInstance);
    }
  }, [account, chains]);

  return (
    <>
      {account && chains && (
        <button onClick={() => deployContract()}>Deploy</button>
      )}
      {isConnected && abi && account && bytecode && contract && (
        <ExecuteBytecode
          abi={abi}
          bytecode={bytecode}
          account={account}
          contract={contract}
        />
      )}
    </>
  );
};

export default ContractConfig;
