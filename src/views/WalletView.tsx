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
import { ReactElement, useCallback, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { isChain } from "../typeguards";
import { Chain, VsCodeApi, WalletCommand, WalletViewState } from "../types";

declare const acquireVsCodeApi: () => VsCodeApi;
const vscodeApi = acquireVsCodeApi();
const version = require("../../package.json").version;

interface IChainForm {
  chain?: Chain;
  loading?: boolean;
  onCancel: () => void;
  onSave: (chain: Chain) => void;
}

export const ChainForm = ({
  chain,
  loading,
  onCancel,
  onSave,
}: IChainForm): ReactElement => {
  const [namespace, setNamespace] = useState<Chain["namespace"] | undefined>(
    chain?.namespace,
  );
  const [id, setId] = useState<Chain["id"] | undefined>(chain?.id);
  const [name, setName] = useState<Chain["name"] | undefined>(chain?.name);
  const [transactionExplorerUrl, setTransactionExplorerUrl] = useState<
    Chain["transactionExplorerUrl"] | undefined
  >(chain?.transactionExplorerUrl);
  const [httpRpcUrl, setHttpRpcUrl] = useState<Chain["httpRpcUrl"] | undefined>(
    chain?.httpRpcUrl,
  );

  const isValid = (): boolean => {
    const newChain = {
      namespace,
      id,
      name,
      transactionExplorerUrl,
      httpRpcUrl,
    } as Chain;

    return isChain(newChain);
  };

  return (
    <>
      <div className="field-container">
        <VSCodeTextField
          className="width-constraint"
          disabled={!!chain}
          onInput={(e) => setName((e.target as HTMLInputElement).value)}
          value={name || ""}
        >
          Name
        </VSCodeTextField>
      </div>
      <div className="field-container">
        <VSCodeTextField
          className="width-constraint"
          disabled={!!chain}
          onInput={(e) => setNamespace((e.target as HTMLInputElement).value)}
          value={namespace || ""}
        >
          Namespace
        </VSCodeTextField>
      </div>
      <div className="field-container">
        <VSCodeTextField
          className="width-constraint"
          disabled={!!chain}
          onInput={(e) => setId(Number((e.target as HTMLInputElement).value))}
          value={id?.toString() || ""}
        >
          ID
        </VSCodeTextField>
      </div>
      <div className="field-container">
        <VSCodeTextField
          className="width-constraint"
          onInput={(e) =>
            setTransactionExplorerUrl((e.target as HTMLInputElement).value)
          }
          value={transactionExplorerUrl || ""}
        >
          Transaction Explorer URL
        </VSCodeTextField>
        <span className="disabled-text width-constraint">
          Required: add the {"{txHash}"} placeholder where you want the
          transaction hash to be included.
        </span>
      </div>
      <div className="field-container">
        <VSCodeTextField
          className="width-constraint"
          onInput={(e) => setHttpRpcUrl((e.target as HTMLInputElement).value)}
          value={httpRpcUrl || ""}
        >
          HTTP RPC URL
        </VSCodeTextField>
      </div>
      <div className="width-constraint action-button-container">
        <VSCodeButton
          appearance="secondary"
          disabled={loading}
          onClick={onCancel}
        >
          Cancel
        </VSCodeButton>
        <VSCodeButton
          appearance="primary"
          disabled={!isValid() || loading}
          onClick={() =>
            onSave({
              namespace,
              id,
              name,
              transactionExplorerUrl,
              httpRpcUrl,
            } as Chain)
          }
        >
          {loading ? "Loading..." : "Save"}
        </VSCodeButton>
      </div>
    </>
  );
};

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
export const WalletView = (): JSX.Element => {
  const [_accounts, setAccounts] = useState<WalletViewState["accounts"]>();
  const [_authStatus, setAuthStatus] =
    useState<WalletViewState["authStatus"]>(undefined);
  const [_chain, setChain] = useState<WalletViewState["chain"]>();
  const [_balance, setBalance] = useState<WalletViewState["balance"]>();
  const [_chains, setChains] = useState<WalletViewState["chains"]>();
  const [_currentAccount, setCurrentAccount] =
    useState<WalletViewState["currentAccount"]>();
  const [_connected, setConnected] = useState<WalletViewState["connected"]>();
  const [_chainUpdateStatus, setChainUpdateStatus] =
    useState<WalletViewState["chainUpdateStatus"]>();
  const [_uri, setUri] = useState<WalletViewState["uri"]>();
  const [isAddingChain, setIsAddingChain] = useState(false);
  const [isEditingChain, setIsEditingChain] = useState(false);
  const [loadingBalance, setLoadingBalance] = useState<boolean>(false);
  const [password, setPassword] = useState<string>("");
  const [username, setUsername] = useState<string>("");

  const connect = useCallback((chainId: number) => {
    setUri(undefined);

    vscodeApi.postMessage({
      command: WalletCommand.CONNECT,
      data: chainId.toString(),
    });
  }, []);

  const disconnect = (): void => {
    vscodeApi.postMessage({ command: WalletCommand.DISCONNECT });
  };

  const login = (): void => {
    vscodeApi.postMessage({
      command: WalletCommand.LOGIN,
      data: JSON.stringify({ username, password }),
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
          data: account,
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

  const onFormCancel = (): void => {
    setIsAddingChain(false);
    setIsEditingChain(false);
  };

  const onFormSave = useCallback(
    (chain: Chain) => {
      if (isAddingChain) {
        vscodeApi.postMessage({
          command: WalletCommand.ADD_CHAIN,
          data: JSON.stringify(chain),
        });
      } else if (isEditingChain) {
        vscodeApi.postMessage({
          command: WalletCommand.EDIT_CHAIN,
          data: JSON.stringify(chain),
        });
      }
    },
    [isAddingChain, isEditingChain],
  );

  const updateState = useCallback(
    (data: WalletViewState): void => {
      const {
        accounts,
        authStatus,
        balance,
        chain,
        chainUpdateStatus,
        chains,
        currentAccount,
        connected,
        uri,
      } = data;

      setAccounts(accounts);
      setAuthStatus(authStatus);
      setBalance(balance);
      setChain(chain);
      setChainUpdateStatus(chainUpdateStatus);
      setChains(chains);
      setCurrentAccount(currentAccount);
      setConnected(connected);
      setUri(uri);
      setLoadingBalance(false);

      if (chain && !connected && !uri) {
        connect(chain.id);
      }

      if (chainUpdateStatus === "done") {
        setIsAddingChain(false);
        setIsEditingChain(false);
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

  /* eslint-disable max-len */
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
      <div className="width-constraint">
        <span className="disabled-text">Version {version}</span>
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
          {isAddingChain || isEditingChain ? (
            <ChainForm
              chain={isEditingChain ? _chain : undefined}
              loading={_chainUpdateStatus === "updating"}
              onCancel={onFormCancel}
              onSave={onFormSave}
            />
          ) : (
            <>
              <div className="field-container width-constraint">
                <label htmlFor="chain">Chain</label>
                <div className="chain-dropdown-container">
                  <VSCodeDropdown
                    className="chain-dropdown"
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
                  <VSCodeButton
                    appearance="secondary"
                    className="chain-action-button"
                    onClick={() => setIsEditingChain(true)}
                  >
                    Edit
                  </VSCodeButton>
                  <VSCodeButton
                    appearance="primary"
                    className="chain-action-button"
                    onClick={() => setIsAddingChain(true)}
                  >
                    Add
                  </VSCodeButton>
                </div>
              </div>
              {!_connected ? (
                <>
                  <div className="qrcode-container">
                    {_uri ? (
                      <QRCodeSVG includeMargin size={380} value={_uri} />
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
                  <div className="field-container">
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
  /* eslint-enable max-len */
};

const root = createRoot(document.getElementById("root") as HTMLElement);
root.render(<WalletView />);
