import {
  VSCodeButton,
  VSCodeTextField,
} from "@vscode/webview-ui-toolkit/react";
import { ReactElement, useState } from "react";
import { vscodeApi } from "../..";
import { WalletCommand } from "../../../../enums";
import { isChain } from "../../../../typeguards";
import type { Chain } from "../../../../types";

export interface IAddChainForm {
  loading: boolean;
  onCancel: () => void;
  saveCallback: (chain: Chain) => void;
}

export const AddChainForm = ({
  loading,
  onCancel,
  saveCallback,
}: IAddChainForm): ReactElement => {
  const [namespace, setNamespace] = useState<Chain["namespace"] | undefined>(
    "eip155",
  );
  const [id, setId] = useState<Chain["id"] | undefined>();
  const [name, setName] = useState<Chain["name"] | undefined>();
  const [blockExplorerUrl, setBlockExplorerUrl] = useState<
    Chain["blockExplorerUrl"] | undefined
  >();
  const [httpRpcUrl, setHttpRpcUrl] = useState<
    Chain["httpRpcUrl"] | undefined
  >();

  const isValid = (): boolean => {
    const newChain = {
      namespace,
      id,
      name,
      blockExplorerUrl,
      httpRpcUrl,
    } as Chain;

    return isChain(newChain);
  };

  const onSave = (chain: Chain): void => {
    vscodeApi.postMessage({
      command: WalletCommand.ADD_CHAIN,
      data: JSON.stringify(chain),
    });
    saveCallback(chain);
  };

  return (
    <>
      <div className="field-container">
        <VSCodeTextField
          className="width-constraint"
          onInput={(e) => setName((e.target as HTMLInputElement).value)}
          value={name || ""}
        >
          Name
        </VSCodeTextField>
      </div>
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
