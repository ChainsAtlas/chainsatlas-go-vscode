import {
  VSCodeDataGrid,
  VSCodeDataGridCell,
  VSCodeDataGridRow,
  VSCodeLink,
} from "@vscode/webview-ui-toolkit/react";
import { ReactElement, useCallback, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { TransactionHistoryCommand } from "../enums";
import type { TransactionHistoryViewState, VsCodeApi } from "../types";

declare const acquireVsCodeApi: () => VsCodeApi;
const vscodeApi = acquireVsCodeApi();

/**
 * `TransactionHistoryView` component provides the user interface for displaying
 * a list of past transactions. It fetches and renders the transaction history
 * from the extension environment using the `vscodeApi`.
 *
 * The component provides functionalities such as:
 * - Displaying a list of past transactions with their hash and output
 * - Linking to the transaction on a block explorer
 * - Informing the user to connect their wallet to view the transaction history
 * - Handling empty transaction history state
 *
 * This component communicates with the extension environment using the
 * `vscodeApi` to fetch and update the transaction history view state.
 *
 * @returns {JSX.Element}
 * A React element that renders the transaction history view.
 */
export const TransactionHistoryView = (): ReactElement => {
  const [_disabled, setDisabled] =
    useState<TransactionHistoryViewState["disabled"]>(true);
  const [_rows, setRows] = useState<TransactionHistoryViewState["rows"]>([]);

  const updateState = useCallback((data: TransactionHistoryViewState): void => {
    const { disabled, rows } = data;

    setDisabled(disabled);
    setRows(rows);
  }, []);

  useEffect(() => {
    window.addEventListener("message", (event) => updateState(event.data));
    vscodeApi.postMessage({ command: TransactionHistoryCommand.READY });

    return () => {
      window.removeEventListener("message", (event) => updateState(event.data));
    };
  }, [updateState]);

  return _disabled ? (
    <div className="container">
      <div className="width-constraint">
        <span className="disabled-text">
          Connect wallet to see transaction history.
        </span>
      </div>
    </div>
  ) : (
    <div className="container">
      {_rows?.length > 0 ? (
        <div className="width-constraint">
          <VSCodeDataGrid id="tx-data-grid">
            <VSCodeDataGridRow row-type="sticky-header">
              <VSCodeDataGridCell cell-type="columnheader" grid-column="1">
                Transaction Hash
              </VSCodeDataGridCell>
              <VSCodeDataGridCell cell-type="columnheader" grid-column="2">
                Output
              </VSCodeDataGridCell>
            </VSCodeDataGridRow>
            {_rows.map((row) => (
              <VSCodeDataGridRow key={row.transactionHash.toString()}>
                <VSCodeDataGridCell grid-column="1">
                  <VSCodeLink href={row.transactionUrl}>
                    {row.transactionHash.toString()}
                  </VSCodeLink>
                </VSCodeDataGridCell>
                <VSCodeDataGridCell grid-column="2">
                  {parseInt(row.output.toString(), 16)}
                </VSCodeDataGridCell>
              </VSCodeDataGridRow>
            ))}
          </VSCodeDataGrid>
        </div>
      ) : (
        <div className="width-constraint">
          <span className="disabled-text">Transaction history is empty.</span>
        </div>
      )}
    </div>
  );
};

const root = createRoot(document.getElementById("root") as HTMLElement);
root.render(<TransactionHistoryView />);
