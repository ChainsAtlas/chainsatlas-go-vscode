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
import { VsCodeApi, WalletData } from "../types";

declare const acquireVsCodeApi: () => VsCodeApi;
const vscodeApi = acquireVsCodeApi();

const Wallet = (): JSX.Element => {
  const [_accounts, setAccounts] = useState<WalletData["accounts"]>();
  const [_chain, setChain] = useState<WalletData["chain"]>();
  const [_balance, setBalance] = useState<WalletData["balance"]>();
  const [_chains, setChains] = useState<WalletData["chains"]>();
  const [_currentAccount, setCurrentAccount] =
    useState<WalletData["currentAccount"]>();
  const [_isConnected, setIsConnected] = useState<WalletData["isConnected"]>();
  const [_uri, setUri] = useState<string | undefined>();
  const [loadingBalance, setLoadingBalance] = useState<boolean>(false);

  const connect = useCallback((chainId: number) => {
    setUri(undefined);

    vscodeApi.postMessage({
      type: "connect",
      value: chainId,
    });
  }, []);

  const disconnect = (): void => {
    vscodeApi.postMessage({ type: "disconnect" });
  };

  const onAccountChange = useCallback(
    (account: string): void => {
      if (account !== _currentAccount) {
        setCurrentAccount(account);
        setLoadingBalance(true);

        vscodeApi.postMessage({ type: "changeAccount", value: account });
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
          setIsConnected(false);
          connect(chain.id);
        } else {
          console.error("Invalid chain option.");
        }
      }
    },
    [_chain?.id, _chains, connect],
  );

  const updateState = useCallback(
    (data: WalletData): void => {
      const {
        accounts,
        balance,
        chain,
        chains,
        currentAccount,
        isConnected,
        uri,
      } = data;

      setAccounts(accounts);
      setBalance(balance);
      setChain(chain);
      setChains(chains);
      setCurrentAccount(currentAccount);
      setIsConnected(isConnected);
      setUri(uri);
      setLoadingBalance(false);

      if (chain && !isConnected && !uri) {
        connect(chain.id);
      }
    },
    [connect],
  );

  useEffect(() => {
    window.addEventListener("message", (event) => updateState(event.data));
    vscodeApi.postMessage({ type: "ready" });

    return () => {
      window.removeEventListener("message", (event) => updateState(event.data));
    };
  }, [updateState]);

  return _chains && _chain ? (
    <div className="container">
      <div className="dropdown-container">
        <label htmlFor="chain">Chain</label>
        <VSCodeDropdown
          className="width-constraint"
          disabled={!_chains.length}
          id="chain"
          onChange={(e) => onChainChange((e.target as HTMLSelectElement).value)}
          value={_chain.id.toString()}
        >
          {_chains.map((chain) => (
            <VSCodeOption key={chain.id} value={chain.id.toString()}>
              {chain.name}
            </VSCodeOption>
          ))}
        </VSCodeDropdown>
      </div>
      {!_isConnected ? (
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
          <VSCodeDivider className="width-constraint" />
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
  );
};

const root = createRoot(document.getElementById("root") as HTMLElement);
root.render(<Wallet />);
