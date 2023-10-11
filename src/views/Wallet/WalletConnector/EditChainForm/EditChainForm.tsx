import {
  VSCodeButton,
  VSCodeTextField,
} from "@vscode/webview-ui-toolkit/react";
import { ReactElement, useEffect, useState } from "react";
import { vscodeApi } from "../..";
import { WalletCommand } from "../../../../enums";
import { isValidChain } from "../../../../typeguards";
import type { Chain, ValidChain } from "../../../../types";

interface IEditChainForm {
  chain: Chain | ValidChain;
  loading: boolean;
  onCancel?: () => void;
  saveCallback: (chain: ValidChain) => void;
}

export const EditChainForm = ({
  chain,
  loading,
  onCancel,
  saveCallback,
}: IEditChainForm): ReactElement => {
  const [namespace, setNamespace] = useState<
    ValidChain["namespace"] | undefined
  >();
  const [id, setId] = useState<ValidChain["id"] | undefined>();
  const [transactionExplorerUrl, setTransactionExplorerUrl] = useState<
    ValidChain["transactionExplorerUrl"] | undefined
  >();
  const [httpRpcUrl, setHttpRpcUrl] = useState<
    ValidChain["httpRpcUrl"] | undefined
  >();

  const isValid = (): boolean => {
    const newChain = {
      name: chain.name,
      namespace,
      id,
      transactionExplorerUrl,
      httpRpcUrl,
    } as ValidChain;

    return isValidChain(newChain);
  };

  const onSave = (chain: ValidChain): void => {
    vscodeApi.postMessage({
      command: WalletCommand.EDIT_CHAIN,
      data: JSON.stringify(chain),
    });
    saveCallback(chain);
  };

  useEffect(() => {
    setNamespace(chain.namespace);
    setId(chain.id);
    setTransactionExplorerUrl(chain.transactionExplorerUrl);
    setHttpRpcUrl((chain as ValidChain).httpRpcUrl || undefined);
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
              transactionExplorerUrl,
              httpRpcUrl,
            } as ValidChain)
          }
        >
          {loading ? "Loading..." : "Save"}
        </VSCodeButton>
      </div>
    </>
  );
};
