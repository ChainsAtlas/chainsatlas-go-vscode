import {
  VSCodeDataGrid,
  VSCodeDataGridCell,
  VSCodeDataGridRow,
  VSCodeLink,
} from "@vscode/webview-ui-toolkit/react";
import { useCallback, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { TransactionHistoryData, VsCodeApi } from "../types";

declare const acquireVsCodeApi: () => VsCodeApi;
const vscodeApi = acquireVsCodeApi();

const TransactionHistory = (): JSX.Element => {
  const [_disabled, setDisabled] =
    useState<TransactionHistoryData["disabled"]>(true);
  const [_rows, setRows] = useState<TransactionHistoryData["rows"]>([]);

  const updateState = useCallback((data: TransactionHistoryData): void => {
    const { disabled, rows } = data;

    setDisabled(disabled);
    setRows(rows);
  }, []);

  useEffect(() => {
    window.addEventListener("message", (event) => updateState(event.data));
    vscodeApi.postMessage({ type: "ready" });

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
      {_rows.length > 0 ? (
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
root.render(<TransactionHistory />);
