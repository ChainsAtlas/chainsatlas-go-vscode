import React from "react";

import { configureChains } from "@wagmi/core";
import type { EthereumClient as TEthereumClient } from "@web3modal/ethereum";
import {
  EthereumClient,
  w3mConnectors,
  w3mProvider,
} from "@web3modal/ethereum";
import { Web3Button, Web3Modal } from "@web3modal/react";
import type { Config, PublicClient, WebSocketPublicClient } from "wagmi";
import { WagmiConfig, createConfig, useAccount } from "wagmi";
import { bsc, bscTestnet, goerli, mainnet, sepolia } from "wagmi/chains";
import ContractConfig from "./ContractConfig";

const Test = (): React.ReactElement => {
  const { address, isConnecting, isDisconnected } = useAccount();

  if (isConnecting) {
    return <div>Connecting…</div>;
  }
  if (isDisconnected) {
    return <div>Disconnected</div>;
  }
  return <div>{address}</div>;
};

const WalletConnect = (): React.ReactElement => {
  const [ethereumClient, setEthereumClient] =
    React.useState<TEthereumClient | null>(null);
  const [wagmiConfig, setWagmiConfig] = React.useState<Config<
    PublicClient,
    WebSocketPublicClient
  > | null>(null);

  const themeVariables = {
    // General
    "--w3m-font-family": "Roboto, sans-serif",
    "--w3m-accent-color": "#07004d",
    "--w3m-accent-fill-color": "#FFFFFF",
    "--w3m-background-color": "#07004d",
    "--w3m-background-border-radius": "0.375rem",
    "--w3m-container-border-radius": "0.5rem",
    "--w3m-wallet-icon-border-radius": "0.25rem",
    "--w3m-wallet-icon-large-border-radius": "0.5rem",
    "--w3m-wallet-icon-small-border-radius": "0.125rem",
    "--w3m-input-border-radius": "0.25rem",
    "--w3m-notification-border-radius": "0.25rem",
    "--w3m-button-border-radius": "0.25rem",
    "--w3m-secondary-button-border-radius": "0.25rem",
    "--w3m-button-hover-highlight-border-radius": "0.25rem",
    // Text
    "--w3m-text-big-bold-size": "1.25rem",
    "--w3m-text-big-bold-weight": "700",
    "--w3m-text-big-bold-line-height": "1.75rem",
    "--w3m-text-big-bold-font-family": "Roboto, sans-serif",
    "--w3m-text-medium-regular-size": "1rem",
    "--w3m-text-medium-regular-weight": "400",
    "--w3m-text-medium-regular-line-height": "1.5rem",
    "--w3m-text-medium-regular-font-family": "Roboto, sans-serif",
    "--w3m-text-small-regular-size": "0.875rem",
    "--w3m-text-small-regular-weight": "400",
    "--w3m-text-small-regular-line-height": "1.125rem",
    "--w3m-text-small-regular-font-family": "Roboto, sans-serif",
    "--w3m-text-small-thin-size": "0.875rem",
    "--w3m-text-small-thin-weight": "100",
    "--w3m-text-small-thin-line-height": "1.125rem",
    "--w3m-text-small-thin-font-family": "Roboto, sans-serif",
    "--w3m-text-xsmall-bold-size": "0.75rem",
    "--w3m-text-xsmall-bold-weight": "700",
    "--w3m-text-xsmall-bold-line-height": "1rem",
    "--w3m-text-xsmall-bold-font-family": "Roboto, sans-serif",
    "--w3m-text-xsmall-regular-size": "0.75rem",
    "--w3m-text-xsmall-regular-weight": "400",
    "--w3m-text-xsmall-regular-line-height": "1rem",
    "--w3m-text-xsmall-regular-font-family": "Roboto, sans-serif",
  };

  const init = React.useCallback(() => {
    const chains = [bsc, bscTestnet, goerli, mainnet, sepolia];
    const { publicClient } = configureChains(chains, [
      w3mProvider({
        projectId: "7b1ecd906a131e3a323a225589f75287",
      }),
    ]);

    const wagmiC = createConfig({
      autoConnect: false,
      connectors: w3mConnectors({
        projectId: "7b1ecd906a131e3a323a225589f75287",
        chains,
      }),
      publicClient,
    });
    const ethClient = new EthereumClient(wagmiC, chains);

    setWagmiConfig(wagmiC as Config<PublicClient, WebSocketPublicClient>);
    setEthereumClient(ethClient);
  }, []);

  React.useEffect(() => {
    (async () => {
      init();
    })();
  }, [init]);

  return (
    <>
      {ethereumClient && wagmiConfig ? (
        <>
          <Web3Modal
            projectId="7b1ecd906a131e3a323a225589f75287"
            ethereumClient={ethereumClient}
            themeVariables={themeVariables}
          />
          <WagmiConfig config={wagmiConfig}>
            <Web3Button label="Connect wallet" />
            <Test />
            <ContractConfig />
          </WagmiConfig>
        </>
      ) : (
        <p>Loading...</p>
      )}
    </>
  );
};

export default WalletConnect;
