import {
  VSCodeButton,
  VSCodeDropdown,
  VSCodeLink,
  VSCodeOption,
  VSCodeProgressRing,
} from "@vscode/webview-ui-toolkit/react";
import { QRCodeSVG } from "qrcode.react";
import { ReactElement, useCallback, useEffect, useState } from "react";
import { vscodeApi } from "..";
import { WalletCommand } from "../../../enums";
import { isValidChain } from "../../../typeguards";
import type { Chain, ChainUpdateStatus, ValidChain } from "../../../types";
import { AddChainForm } from "./AddChainForm/AddChainForm";
import { EditChainForm } from "./EditChainForm/EditChainForm";

interface IWalletConnector {
  chainUpdateStatus?: ChainUpdateStatus;
  chains?: (Chain | ValidChain)[];
  connected: boolean;
  showWalletDataCallback: (show: boolean) => void;
  uri?: string;
}

export const WalletConnector = ({
  chainUpdateStatus,
  chains,
  connected,
  showWalletDataCallback,
  uri,
}: IWalletConnector): ReactElement => {
  const [allowConnect, setAllowConnect] = useState<boolean>(false);
  const [selectedChainUri, setSelectedChainUri] = useState<string | undefined>(
    uri,
  );
  const [displayQRCode, setDisplayQRCode] = useState<boolean>(false);
  const [isAddingChain, setIsAddingChain] = useState<boolean>(false);
  const [isEditingChain, setIsEditingChain] = useState<boolean>(false);
  const [selectedChain, setSelectedChain] = useState<
    Chain | ValidChain | undefined
  >();

  const chainSaveCallback = (chain: ValidChain) => {
    setSelectedChain(chain);
    setAllowConnect(true);
    showWalletDataCallback(true);
    vscodeApi.postMessage({ command: WalletCommand.DISCONNECT });
  };

  const connect = useCallback((chainId: number) => {
    vscodeApi.postMessage({
      command: WalletCommand.CONNECT,
      data: chainId.toString(),
    });
  }, []);

  const onChainAction = (action: "add" | "edit"): void => {
    if (action === "add") {
      setIsAddingChain(true);
      setIsEditingChain(false);
    } else {
      setIsAddingChain(false);
      setIsEditingChain(true);
    }

    showWalletDataCallback(false);
  };

  const onChainChange = useCallback(
    (chainId: string): void => {
      if (chainId !== selectedChain?.id.toString()) {
        const chain = chains?.find((c) => c.id.toString() === chainId);

        if (chain) {
          setAllowConnect(true);
          setSelectedChain(chain);
          setSelectedChainUri(undefined);
          showWalletDataCallback(false);

          vscodeApi.postMessage({ command: WalletCommand.DISCONNECT });
        }
      }
    },
    [chains, selectedChain?.id, showWalletDataCallback],
  );

  const onFormCancel = (): void => {
    setIsAddingChain(false);
    setIsEditingChain(false);
    showWalletDataCallback(true);
  };

  useEffect(() => {
    if (!selectedChain && chains && chains.length > 0) {
      const defaultChain = chains.find((c) => c.id === 11_155_111) || chains[0];

      setSelectedChain(defaultChain);
    }

    if (chainUpdateStatus === "done") {
      setIsAddingChain(false);
      setIsEditingChain(false);
    }

    if (isValidChain(selectedChain)) {
      if (allowConnect && chainUpdateStatus !== "updating") {
        connect(selectedChain.id);
        setAllowConnect(false);
        setDisplayQRCode(true);
      }
    }

    if (
      !isValidChain(selectedChain) ||
      (isValidChain(selectedChain) && connected)
    ) {
      setDisplayQRCode(false);
    }

    if (uri) {
      setSelectedChainUri(uri);
    }
  }, [
    allowConnect,
    chainUpdateStatus,
    chains,
    connect,
    connected,
    selectedChain,
    uri,
  ]);

  return (
    <>
      <div className="field-container width-constraint">
        <label htmlFor="chain">Chain</label>
        {!isAddingChain ? (
          <div className="chain-dropdown-container">
            <VSCodeDropdown
              className="chain-dropdown"
              disabled={!chains?.length || chainUpdateStatus === "updating"}
              id="chain"
              onChange={(e) =>
                onChainChange((e.target as HTMLSelectElement).value)
              }
              value={selectedChain?.id.toString()}
            >
              {chains?.map((chain) => (
                <VSCodeOption key={chain.id} value={chain.id.toString()}>
                  {chain.name}
                </VSCodeOption>
              ))}
            </VSCodeDropdown>
            {isValidChain(selectedChain) ? (
              <VSCodeButton
                appearance="secondary"
                className="chain-action-button"
                onClick={() => onChainAction("edit")}
              >
                Edit
              </VSCodeButton>
            ) : null}
            <VSCodeButton
              appearance="primary"
              className="chain-action-button"
              onClick={() => onChainAction("add")}
            >
              Add
            </VSCodeButton>
          </div>
        ) : null}
      </div>
      {(isEditingChain || (!isAddingChain && !isValidChain(selectedChain))) &&
      selectedChain ? (
        <EditChainForm
          chain={selectedChain}
          loading={chainUpdateStatus === "updating" ? true : false}
          onCancel={isValidChain(selectedChain) ? onFormCancel : undefined}
          saveCallback={chainSaveCallback}
        />
      ) : null}
      {isAddingChain ? (
        <AddChainForm
          loading={chainUpdateStatus === "updating" ? true : false}
          onCancel={onFormCancel}
          saveCallback={chainSaveCallback}
        />
      ) : null}
      {displayQRCode ? (
        <>
          <div className="qrcode-container">
            {selectedChainUri ? (
              <QRCodeSVG includeMargin size={380} value={selectedChainUri} />
            ) : (
              <VSCodeProgressRing />
            )}
          </div>
          <div className="width-constraint">
            <span>
              {/* eslint-disable max-len */}
              <VSCodeLink href="https://walletconnect.com/explorer?type=wallet&chains=eip155%3A1">
                {/* eslint-enable max-len */}
                View list of 300+ supported wallets
              </VSCodeLink>{" "}
              through the WalletConnect protocol.
            </span>
          </div>
        </>
      ) : null}
    </>
  );
};
