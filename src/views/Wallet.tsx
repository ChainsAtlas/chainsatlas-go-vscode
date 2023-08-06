import { Chain } from "@wagmi/chains";
import { QRCodeSVG } from "qrcode.react";
import {
  CSSProperties,
  ChangeEvent,
  useCallback,
  useEffect,
  useState,
} from "react";
import { createRoot } from "react-dom/client";
import { VsCodeApi, WalletData } from "../types/types";

const containerStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 12,
};
const qrCodeWrapperStyle: CSSProperties = {
  alignItems: "center",
  display: "flex",
  justifyContent: "flex-start",
  width: "100%",
};

declare const acquireVsCodeApi: () => VsCodeApi;
const vscodeApi = acquireVsCodeApi();

const App = (): JSX.Element => {
  const [_accounts, setAccounts] = useState<WalletData["accounts"]>();
  const [_isConnected, setIsConnected] = useState<WalletData["isConnected"]>();
  const [_chain, setChain] = useState<WalletData["chain"]>();
  const [_balance, setBalance] = useState<WalletData["balance"]>();
  const [_chains, setChains] = useState<WalletData["chains"]>([]);
  const [_currentAccount, setCurrentAccount] =
    useState<WalletData["currentAccount"]>();
  const [loadingBalance, setLoadingBalance] = useState<boolean>(false);
  const [uri, setUri] = useState<string | undefined>();

  const connect = useCallback(
    (chain?: Chain) => {
      setUri(undefined);

      const chainId =
        chain?.id || _chains.find((c) => c.name === "Sepolia")?.id;

      setChain(chain);

      vscodeApi.postMessage({
        type: "connect",
        value: chain?.id,
      });
    },
    [_chains],
  );

  const disconnect = (): void => {
    vscodeApi.postMessage({ type: "disconnect" });
  };

  const onAccountChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement>): void => {
      const { value } = e.target;

      if (value !== _currentAccount) {
        setCurrentAccount(value);
        setLoadingBalance(true);

        vscodeApi.postMessage({ type: "changeAccount", value });
      }
    },
    [_currentAccount],
  );

  const onChainChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement>): void => {
      const { value } = e.target;

      if (value !== String(_chain?.id)) {
        const chain = _chains.find((c) => String(c.id) === value);

        disconnect();
        connect(chain);
      }
    },
    [_chain?.id, _chains, connect],
  );

  const updateState = useCallback(
    (data: WalletData): void => {
      console.log("updated state sync: ", data);
      const { accounts, balance, chain, chains, currentAccount, isConnected } =
        data;

      setAccounts(accounts);
      setBalance(balance);
      setChain(chain);
      setChains(chains);
      setCurrentAccount(currentAccount);
      setIsConnected(isConnected);
      setLoadingBalance(false);

      if (!isConnected) {
        connect(chain);
      }
    },
    [connect],
  );

  const addEventListeners = useCallback((): void => {
    window.addEventListener("message", (event) => {
      const message:
        | { type: "sync"; value: WalletData }
        | { type: "uri"; value: string } = event.data;

      switch (message.type) {
        case "sync":
          updateState(message.value);
          break;
        case "uri":
          setUri(message.value);
          break;
        default:
          break;
      }
    });
  }, [updateState]);

  useEffect(() => {
    addEventListeners();
  }, [addEventListeners]);

  return (
    <div style={containerStyle}>
      {_chains ? (
        <div>
          <label htmlFor="chain">Chain</label>
          <select
            id="chain"
            name="chain"
            value={_chain?.id || "empty"}
            onChange={onChainChange}
          >
            <option disabled value={"empty"}>
              Select a chain
            </option>
            {_chains.map((chain) => (
              <option value={chain.id} key={chain.id}>
                {chain.name}
              </option>
            ))}
          </select>
        </div>
      ) : null}
      {!_isConnected ? (
        <div style={qrCodeWrapperStyle}>
          {uri ? (
            <QRCodeSVG size={200} value={uri} includeMargin />
          ) : (
            <p>Loading...</p>
          )}
        </div>
      ) : (
        <>
          {_accounts ? (
            <div>
              <label htmlFor="account">Account</label>
              <select
                id="account"
                name="account"
                value={_currentAccount}
                onChange={onAccountChange}
              >
                <option disabled value={undefined}>
                  Select an account
                </option>
                {_accounts.map((acc) => (
                  <option value={acc} key={acc}>
                    {acc}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
          {_balance && _chain ? (
            <div>
              <p>
                Balance (wei):{" "}
                <span>{loadingBalance ? "Loading..." : _balance}</span>
              </p>
            </div>
          ) : null}
          {_accounts && _chain ? (
            <div>
              <button onClick={disconnect}>Disconnect</button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
};

const root = createRoot(document.getElementById("root") as HTMLElement);
root.render(<App />);
