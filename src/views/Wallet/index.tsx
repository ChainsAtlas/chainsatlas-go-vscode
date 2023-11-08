import { ReactElement, useCallback, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { WalletCommand } from "../../enums";
import type { VsCodeApi, WalletViewState } from "../../types";
import { LoginForm } from "./LoginForm/LoginForm";
import { WalletConnector } from "./WalletConnector/WalletConnector";
import { WalletData } from "./WalletData/WalletData";

declare const acquireVsCodeApi: () => VsCodeApi;

export const vscodeApi = acquireVsCodeApi();

/**
 * `WalletView` component provides a user interface for managing the connected
 * wallet. It offers functionalities like:
 * - Logging into the wallet interface.
 * - Displaying available chains and selecting a chain.
 * - Connecting to and disconnecting from a wallet.
 * - Displaying available accounts and selecting an account.
 * - Viewing the balance of the selected account.
 * - Displaying QR codes for WalletConnect-enabled connections.
 *
 * This component communicates with the extension environment using the
 * `vscodeApi` to fetch and update the wallet view state.
 *
 * @returns {JSX.Element}
 * A React element that renders the wallet view.
 */
export const WalletView = (): ReactElement => {
  const [_account, setAccount] = useState<WalletViewState["account"]>();
  const [_authStatus, setAuthStatus] =
    useState<WalletViewState["authStatus"]>(undefined);
  const [_balance, setBalance] = useState<WalletViewState["balance"]>("0");
  const [_chain, setChain] = useState<WalletViewState["chain"]>();
  const [_chainUpdateStatus, setChainUpdateStatus] =
    useState<WalletViewState["chainUpdateStatus"]>();
  const [_chains, setChains] = useState<WalletViewState["chains"]>();
  const [_connectionStatus, setConnectionStatus] =
    useState<WalletViewState["connectionStatus"]>("disconnected");
  const [_uri, setUri] = useState<WalletViewState["uri"]>();
  const [showWalletData, setShowWalletData] = useState<boolean>(true);

  const showWalletDataCallback = (show: boolean): void => {
    setShowWalletData(show);
  };

  const updateState = useCallback((data: WalletViewState): void => {
    const {
      account,
      authStatus,
      balance,
      chain,
      chainUpdateStatus,
      chains,
      connectionStatus,
      uri,
    } = data;

    setAccount(account);
    setAuthStatus(authStatus);
    setBalance(balance);
    setChain(chain);
    setChainUpdateStatus(chainUpdateStatus);
    setChains(chains);
    setConnectionStatus(connectionStatus);
    setUri(uri);
  }, []);

  useEffect(() => {
    window.addEventListener("message", (event) => updateState(event.data));
    vscodeApi.postMessage({ command: WalletCommand.READY });

    return () => {
      window.removeEventListener("message", (event) => updateState(event.data));
    };
  }, [updateState]);

  return (
    <div className="container">
      <LoginForm authStatus={_authStatus} />
      {_authStatus === "authenticated" ? (
        <>
          <WalletConnector
            chain={_chain}
            chainUpdateStatus={_chainUpdateStatus}
            chains={_chains}
            connectionStatus={_connectionStatus}
            showWalletDataCallback={showWalletDataCallback}
            uri={_uri}
          />
          {_connectionStatus === "connected" && showWalletData ? (
            <WalletData account={_account} balance={_balance} />
          ) : null}
        </>
      ) : null}
    </div>
  );
};

const root = createRoot(document.getElementById("root") as HTMLElement);
root.render(<WalletView />);
