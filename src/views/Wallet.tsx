import {
  VSCodeButton,
  VSCodeDropdown,
  VSCodeLink,
  VSCodeOption,
  VSCodeProgressRing,
  VSCodeTextField,
} from "@vscode/webview-ui-toolkit/react";
import { QRCodeSVG } from "qrcode.react";
import { useCallback, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { VsCodeApi, WalletData } from "../types/types";

declare const acquireVsCodeApi: () => VsCodeApi;
const vscodeApi = acquireVsCodeApi();

const Wallet = (): JSX.Element => {
  const [_accounts, setAccounts] = useState<WalletData["accounts"]>();
  const [_chain, setChain] = useState<WalletData["chain"]>();
  const [_balance, setBalance] = useState<WalletData["balance"]>();
  const [_chains, setChains] = useState<WalletData["chains"]>([]);
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
    (chainId: number): void => {
      if (chainId !== _chain?.id) {
        const chain = _chains.find((c) => c.id === chainId);

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

  const addEventListeners = useCallback((): void => {
    window.addEventListener("message", (event) => updateState(event.data));
  }, [updateState]);

  useEffect(() => {
    addEventListeners();
    vscodeApi.postMessage({ type: "sync" });
  }, [addEventListeners]);

  return (
    <div className="container">
      <div className="dropdown-container">
        <label htmlFor="chain">Chain</label>
        <VSCodeDropdown
          disabled={!_chains.length}
          id="chain"
          value={_chain?.id.toString()}
        >
          {_chains.length > 0 ? (
            _chains.map((chain) => (
              <VSCodeOption
                key={chain.id}
                value={chain.id.toString()}
                onClick={() => onChainChange(chain.id)}
              >
                {chain.name}
              </VSCodeOption>
            ))
          ) : (
            <VSCodeOption selected>No chains available.</VSCodeOption>
          )}
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
          <div className="walletconnect-link-container">
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
              disabled={!_accounts?.length}
              id="account"
              value={_currentAccount}
            >
              {_accounts && _accounts.length > 0 ? (
                _accounts.map((acc) => (
                  <VSCodeOption
                    key={acc}
                    value={acc}
                    onClick={() => onAccountChange(acc)}
                  >
                    {acc}
                  </VSCodeOption>
                ))
              ) : (
                <VSCodeOption selected>No accounts available.</VSCodeOption>
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
                className="balance-text-field"
                readOnly
                value={_balance ?? "0"}
              >
                Balance (wei)
              </VSCodeTextField>
            )}
          </div>
          {_accounts && _chain ? (
            <div>
              <VSCodeButton
                appearance="primary"
                aria-label="Disconnect"
                onClick={disconnect}
              >
                Disconnect
              </VSCodeButton>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
};

const root = createRoot(document.getElementById("root") as HTMLElement);
root.render(<Wallet />);
