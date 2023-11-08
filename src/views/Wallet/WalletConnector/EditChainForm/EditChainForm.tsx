import {
  VSCodeButton,
  VSCodeTextField,
} from "@vscode/webview-ui-toolkit/react";
import { ReactElement, useEffect, useState } from "react";
import { vscodeApi } from "../..";
import { WalletCommand } from "../../../../enums";
import { isChain } from "../../../../typeguards";
import type { Chain } from "../../../../types";

export interface IEditChainForm {
  chain: Chain;
  loading: boolean;
  onCancel?: () => void;
  saveCallback: (chain: Chain) => void;
}

export const EditChainForm = ({
  chain,
  loading,
  onCancel,
  saveCallback,
}: IEditChainForm): ReactElement => {
  const [namespace, setNamespace] = useState<Chain["namespace"] | undefined>();
  const [id, setId] = useState<Chain["id"] | undefined>();
  const [blockExplorerUrl, setBlockExplorerUrl] = useState<
    Chain["blockExplorerUrl"] | undefined
  >();
  const [httpRpcUrl, setHttpRpcUrl] = useState<
    Chain["httpRpcUrl"] | undefined
  >();

  const isValid = (): boolean => {
    const newChain = {
      name: chain.name,
      namespace,
      id,
      blockExplorerUrl,
      httpRpcUrl,
    } as Chain;

    return isChain(newChain);
  };

  const onSave = (chain: Chain): void => {
    vscodeApi.postMessage({
      command: WalletCommand.EDIT_CHAIN,
      data: JSON.stringify(chain),
    });
    saveCallback(chain);
  };

  useEffect(() => {
    setNamespace(chain.namespace);
    setId(chain.id);
    setBlockExplorerUrl(chain.blockExplorerUrl);
    setHttpRpcUrl((chain as Chain).httpRpcUrl || undefined);
  }, [chain]);

  return (
    <>
      <div className="field-container">
        <VSCodeTextField
          className="width-constraint"
          disabled
          onInput={(e) => setNamespace((e.target as HTMLInputElement).value)}
          value={namespace || ""}
        >
          Namespace
        </VSCodeTextField>
      </div>
      <div className="field-container">
        <VSCodeTextField
          className="width-constraint"
          disabled
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
            setBlockExplorerUrl((e.target as HTMLInputElement).value)
          }
          value={blockExplorerUrl || ""}
        >
          Block Explorer URL
        </VSCodeTextField>
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
        {onCancel ? (
          <VSCodeButton
            appearance="secondary"
            disabled={loading}
            onClick={onCancel}
          >
            Cancel
          </VSCodeButton>
        ) : null}
        <VSCodeButton
          appearance="primary"
          disabled={!isValid() || loading}
          onClick={() =>
            onSave({
              namespace,
              id,
              name: chain.name,
              blockExplorerUrl,
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
