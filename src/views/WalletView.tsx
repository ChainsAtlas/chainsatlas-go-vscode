import {
  VSCodeButton,
  VSCodeDivider,
  VSCodeDropdown,
  VSCodeLink,
  VSCodeOption,
  VSCodeProgressRing,
  VSCodeTextField,
} from "@vscode/webview-ui-toolkit/react";
import { QRCodeSVG } from "qrcode.react";
import { useCallback, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { VsCodeApi, WalletCommand, WalletViewState } from "../types";

declare const acquireVsCodeApi: () => VsCodeApi;
const vscodeApi = acquireVsCodeApi();

const WalletView = (): JSX.Element => {
  const [_accounts, setAccounts] = useState<WalletViewState["accounts"]>();
  const [_authStatus, setAuthStatus] =
    useState<WalletViewState["authStatus"]>(undefined);
  const [_chain, setChain] = useState<WalletViewState["chain"]>();
  const [_balance, setBalance] = useState<WalletViewState["balance"]>();
  const [_chains, setChains] = useState<WalletViewState["chains"]>();
  const [_currentAccount, setCurrentAccount] =
    useState<WalletViewState["currentAccount"]>();
  const [_connected, setConnected] = useState<WalletViewState["connected"]>();
  const [_uri, setUri] = useState<string | undefined>();
  const [loadingBalance, setLoadingBalance] = useState<boolean>(false);
  const [password, setPassword] = useState<string>("");
  const [username, setUsername] = useState<string>("");

  const connect = useCallback((chainId: number) => {
    setUri(undefined);

    vscodeApi.postMessage({
      command: WalletCommand.CONNECT,
      value: chainId.toString(),
    });
  }, []);

  const disconnect = (): void => {
    vscodeApi.postMessage({ command: WalletCommand.DISCONNECT });
  };

  const login = (): void => {
    vscodeApi.postMessage({
      command: WalletCommand.LOGIN,
      value: JSON.stringify({ username, password }),
    });
  };

  const logout = (): void => {
    vscodeApi.postMessage({ command: WalletCommand.LOGOUT });
    setUsername("");
    setPassword("");
  };

  const onAccountChange = useCallback(
    (account: string): void => {
      if (account !== _currentAccount) {
        setCurrentAccount(account);
        setLoadingBalance(true);

        vscodeApi.postMessage({
          command: WalletCommand.CHANGE_ACCOUNT,
          value: account,
        });
      }
    },
    [_currentAccount],
  );

  const onChainChange = useCallback(
    (chainId: string): void => {
      if (chainId !== _chain?.id.toString()) {
        const chain = _chains?.find((c) => c.id.toString() === chainId);

        if (chain) {
          setChain(chain);
          setConnected(false);
          connect(chain.id);
        }
      }
    },
    [_chain?.id, _chains, connect],
  );

  const updateState = useCallback(
    (data: WalletViewState): void => {
      const {
        accounts,
        authStatus,
        balance,
        chain,
        chains,
        currentAccount,
        connected,
        uri,
      } = data;

      setAccounts(accounts);
      setAuthStatus(authStatus);
      setBalance(balance);
      setChain(chain);
      setChains(chains);
      setCurrentAccount(currentAccount);
      setConnected(connected);
      setUri(uri);
      setLoadingBalance(false);

      if (chain && !connected && !uri) {
        connect(chain.id);
      }
    },
    [connect],
  );

  useEffect(() => {
    window.addEventListener("message", (event) => updateState(event.data));
    vscodeApi.postMessage({ command: WalletCommand.READY });

    return () => {
      window.removeEventListener("message", (event) => updateState(event.data));
    };
  }, [updateState]);

  return _authStatus !== "authenticated" ? (
    <div className="container">
      <VSCodeTextField
        className="width-constraint"
        onInput={(e) => setUsername((e.target as HTMLInputElement).value)}
        type="email"
        value={username || ""}
      >
        Username
      </VSCodeTextField>
      <VSCodeTextField
        className="width-constraint"
        onInput={(e) => setPassword((e.target as HTMLInputElement).value)}
        type="password"
        value={password || ""}
      >
        Password
      </VSCodeTextField>
      <div className="width-constraint">
        <VSCodeButton
          appearance="primary"
          disabled={_authStatus === "authenticating"}
          className="block-width"
          onClick={login}
        >
          {_authStatus === "authenticating" ? "Authenticating..." : "Login"}
        </VSCodeButton>
      </div>
    </div>
  ) : (
    <>
      {_chains && _chain ? (
        <div className="container">
          <div className="width-constraint">
            <VSCodeButton
              appearance="primary"
              className="block-width"
              onClick={logout}
            >
              Logout
            </VSCodeButton>
          </div>
          <VSCodeDivider className="width-constraint" />
          <div className="dropdown-container">
            <label htmlFor="chain">Chain</label>
            <VSCodeDropdown
              className="width-constraint"
              disabled={!_chains.length}
              id="chain"
              onChange={(e) =>
                onChainChange((e.target as HTMLSelectElement).value)
              }
              value={_chain.id.toString()}
            >
              {_chains.map((chain) => (
                <VSCodeOption key={chain.id} value={chain.id.toString()}>
                  {chain.name}
                </VSCodeOption>
              ))}
            </VSCodeDropdown>
          </div>
          {!_connected ? (
            <>
              <div className="qrcode-container">
                {_uri ? (
                  <QRCodeSVG
                    className="qrcode-svg"
                    includeMargin
                    size={380}
                    value={_uri}
                  />
                ) : (
                  <VSCodeProgressRing />
                )}
              </div>
              <div className="width-constraint">
                <span>
                  <VSCodeLink href="https://walletconnect.com/explorer?type=wallet&chains=eip155%3A1">
                    View list of 300+ supported wallets
                  </VSCodeLink>{" "}
                  through the WalletConnect protocol.
                </span>
              </div>
            </>
          ) : (
            <>
              <div className="dropdown-container">
                <label htmlFor="account">Account</label>
                <VSCodeDropdown
                  className="width-constraint"
                  disabled={!_accounts?.length}
                  id="account"
                  onChange={(e) =>
                    onAccountChange((e.target as HTMLSelectElement).value)
                  }
                  value={_accounts?.length ? _currentAccount : "empty"}
                >
                  {_accounts && _accounts.length > 0 ? (
                    _accounts.map((acc) => (
                      <VSCodeOption key={acc} value={acc}>
                        {acc}
                      </VSCodeOption>
                    ))
                  ) : (
                    <VSCodeOption value="empty">
                      No accounts available.
                    </VSCodeOption>
                  )}
                </VSCodeDropdown>
              </div>
              <div>
                {loadingBalance ? (
                  <>
                    <label>Balance (wei)</label>
                    <VSCodeProgressRing />
                  </>
                ) : (
                  <VSCodeTextField
                    className="width-constraint"
                    readOnly
                    value={_balance ?? "0"}
                  >
                    Balance (wei)
                  </VSCodeTextField>
                )}
              </div>
              <div className="width-constraint">
                <VSCodeButton
                  appearance="primary"
                  className="block-width"
                  onClick={disconnect}
                >
                  Disconnect
                </VSCodeButton>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="progress-ring-container">
          <VSCodeProgressRing />
        </div>
      )}
    </>
  );
};

const root = createRoot(document.getElementById("root") as HTMLElement);
root.render(<WalletView />);
