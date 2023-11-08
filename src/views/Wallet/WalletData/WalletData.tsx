import {
  VSCodeButton,
  VSCodeProgressRing,
  VSCodeTextField,
} from "@vscode/webview-ui-toolkit/react";
import { ReactElement, useEffect, useState } from "react";
import { vscodeApi } from "..";
import { WalletCommand } from "../../../enums";

export interface IWalletData {
  account?: string;
  balance: string;
}

export const WalletData = ({ account, balance }: IWalletData): ReactElement => {
  const [loading, setLoading] = useState<boolean>(true);

  const disconnect = (): void => {
    vscodeApi.postMessage({ command: WalletCommand.DISCONNECT });
  };

  useEffect(() => {
    if (account && balance) {
      setLoading(false);
    }
  }, [account, balance]);

  return (
    <>
      <div className="field-container">
        <VSCodeTextField
          className="width-constraint"
          readOnly
          value={account || "Loading..."}
        >
          Account
        </VSCodeTextField>
      </div>
      <div className="field-container">
        {loading ? (
          <>
            <label>Balance (wei)</label>
            <VSCodeProgressRing />
          </>
        ) : (
          <VSCodeTextField
            className="width-constraint"
            readOnly
            value={balance}
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
  );
};
