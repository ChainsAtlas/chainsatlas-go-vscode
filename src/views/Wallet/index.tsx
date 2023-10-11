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
  const [_accounts, setAccounts] = useState<WalletViewState["accounts"]>();
  const [_authStatus, setAuthStatus] =
    useState<WalletViewState["authStatus"]>(undefined);
  const [_balance, setBalance] = useState<WalletViewState["balance"]>("0");
  const [_chainUpdateStatus, setChainUpdateStatus] =
    useState<WalletViewState["chainUpdateStatus"]>();
  const [_chains, setChains] = useState<WalletViewState["chains"]>();
  const [_connected, setConnected] =
    useState<WalletViewState["connected"]>(false);
  const [_currentAccount, setCurrentAccount] =
    useState<WalletViewState["currentAccount"]>();
  const [_uri, setUri] = useState<WalletViewState["uri"]>();
  const [showWalletData, setShowWalletData] = useState<boolean>(false);

  const showWalletDataCallback = (show: boolean): void => {
    setShowWalletData(show);
  };

  const updateState = useCallback((data: WalletViewState): void => {
    const {
      accounts,
      authStatus,
      balance,
      chainUpdateStatus,
      chains,
      connected,
      currentAccount,
      uri,
    } = data;

    setAccounts(accounts);
    setAuthStatus(authStatus);
    setBalance(balance);
    setChainUpdateStatus(chainUpdateStatus);
    setChains(chains);
    setConnected(connected);
    setCurrentAccount(currentAccount);
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
            chainUpdateStatus={_chainUpdateStatus}
            chains={_chains}
            connected={_connected}
            showWalletDataCallback={showWalletDataCallback}
            uri={_uri}
          />
          {_connected && showWalletData ? (
            <WalletData
              accounts={_accounts}
              balance={_balance}
              currentAccount={_currentAccount}
            />
          ) : null}
        </>
      ) : null}
    </div>
  );
};

const root = createRoot(document.getElementById("root") as HTMLElement);
root.render(<WalletView />);
