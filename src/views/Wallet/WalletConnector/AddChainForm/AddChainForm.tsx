import {
  VSCodeButton,
  VSCodeTextField,
} from "@vscode/webview-ui-toolkit/react";
import { ReactElement, useState } from "react";
import { vscodeApi } from "../..";
import { WalletCommand } from "../../../../enums";
import { isValidChain } from "../../../../typeguards";
import type { Chain } from "../../../../types";

interface IAddChainForm {
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
  const [transactionExplorerUrl, setTransactionExplorerUrl] = useState<
    Chain["transactionExplorerUrl"] | undefined
  >();
  const [httpRpcUrl, setHttpRpcUrl] = useState<
    Chain["httpRpcUrl"] | undefined
  >();

  const isValid = (): boolean => {
    const newChain = {
      namespace,
      id,
      name,
      transactionExplorerUrl,
      httpRpcUrl,
    } as Chain;

    return isValidChain(newChain);
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
        <span className="disabled-text width-constraint">
          Unstable RPC might cause errors. Please, use a stable RPC for a smooth
          experience.
        </span>
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
