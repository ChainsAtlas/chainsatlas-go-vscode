import {
  VSCodeButton,
  VSCodeDropdown,
  VSCodeOption,
  VSCodeProgressRing,
  VSCodeTextField,
} from "@vscode/webview-ui-toolkit/react";
import type { ProviderAccounts } from "@walletconnect/universal-provider";
import { ReactElement, useCallback, useEffect, useState } from "react";
import { vscodeApi } from "..";
import { WalletCommand } from "../../../enums";

interface IWalletData {
  accounts?: ProviderAccounts;
  balance: string;
  currentAccount?: string;
}

export const WalletData = ({
  accounts,
  balance,
  currentAccount,
}: IWalletData): ReactElement => {
  const [loading, setLoading] = useState<boolean>(false);

  const disconnect = (): void => {
    vscodeApi.postMessage({ command: WalletCommand.DISCONNECT });
  };

  const onAccountChange = useCallback(
    (account: string): void => {
      if (account !== currentAccount) {
        setLoading(true);

        vscodeApi.postMessage({
          command: WalletCommand.CHANGE_ACCOUNT,
          data: account,
        });
      }
    },
    [currentAccount],
  );

  useEffect(() => {
    if (accounts || balance || currentAccount) {
      setLoading(false);
    }
  }, [accounts, balance, currentAccount]);

  return (
    <>
      <div className="field-container">
        <label htmlFor="account">Account</label>
        {loading ? (
          <VSCodeProgressRing />
        ) : (
          <VSCodeDropdown
            className="width-constraint"
            disabled={!accounts?.length}
            id="account"
            onChange={(e) =>
              onAccountChange((e.target as HTMLSelectElement).value)
            }
            value={accounts?.length ? currentAccount : "empty"}
          >
            {accounts && accounts.length > 0 ? (
              accounts.map((acc) => (
                <VSCodeOption key={acc} value={acc}>
                  {acc}
                </VSCodeOption>
              ))
            ) : (
              <VSCodeOption value="empty">No accounts available.</VSCodeOption>
            )}
          </VSCodeDropdown>
        )}
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
