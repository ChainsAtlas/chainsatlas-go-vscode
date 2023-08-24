import {
  VSCodeButton,
  VSCodeDivider,
  VSCodeDropdown,
  VSCodeOption,
  VSCodeRadio,
  VSCodeRadioGroup,
  VSCodeTextField,
} from "@vscode/webview-ui-toolkit/react";
import { useCallback, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { TRANSACTION_STATUS_LABEL } from "../constants";
import {
  GasOption,
  VirtualizationUnitCommand,
  VirtualizationUnitViewState,
  VsCodeApi,
} from "../types";

declare const acquireVsCodeApi: () => VsCodeApi;
const vscodeApi = acquireVsCodeApi();

const VirtualizationUnitView = (): JSX.Element => {
  const [_contracts, setContracts] = useState<
    VirtualizationUnitViewState["contracts"]
  >([]);
  const [_contractTransactionStatus, setContractTransactionStatus] =
    useState<VirtualizationUnitViewState["contractTransactionStatus"]>(
      undefined,
    );
  const [_currentContract, setCurrentContract] =
    useState<VirtualizationUnitViewState["currentContract"]>(undefined);
  const [_disabled, setDisabled] =
    useState<VirtualizationUnitViewState["disabled"]>(true);
  const [_estimating, setEstimating] =
    useState<VirtualizationUnitViewState["estimating"]>(false);
  const [_gasEstimate, setGasEstimate] =
    useState<VirtualizationUnitViewState["gasEstimate"]>("");
  const [gas, setGas] = useState<string>("");
  const [gasOption, setGasOption] = useState<GasOption>(GasOption.BUFFER);

  const calculateBuffer = (gas: string): string =>
    ((BigInt(gas) * BigInt(115)) / BigInt(100)).toString();

  const onCancel = (): void => {
    vscodeApi.postMessage({
      command: VirtualizationUnitCommand.CLEAR_DEPLOYMENT,
    });
  };

  const onContractChange = (contract: string): void => {
    vscodeApi.postMessage({
      command: VirtualizationUnitCommand.SET_CONTRACT,
      value: contract,
    });
  };

  const onDeploy = (): void => {
    vscodeApi.postMessage({ command: VirtualizationUnitCommand.DEPLOY });
  };

  const onGasOptionChange = useCallback(
    (option: GasOption) => {
      setGasOption(option);

      if (_gasEstimate) {
        switch (option) {
          case GasOption.BUFFER:
            setGas(calculateBuffer(_gasEstimate));
            break;
          case GasOption.CUSTOM:
            setGas(_gasEstimate);
            break;
          case GasOption.ESTIMATE:
            setGas(_gasEstimate);
            break;
          default:
            break;
        }
      }
    },
    [_gasEstimate],
  );

  const onSend = useCallback(() => {
    vscodeApi.postMessage({
      command: VirtualizationUnitCommand.SEND,
      value: gas,
    });
  }, [gas]);

  const updateState = useCallback((data: VirtualizationUnitViewState): void => {
    const {
      contracts,
      contractTransactionStatus,
      currentContract,
      disabled,
      estimating,
      gasEstimate,
    } = data;

    setContracts(contracts);
    setContractTransactionStatus(contractTransactionStatus);
    setCurrentContract(currentContract);
    setDisabled(disabled);
    setEstimating(estimating);
    setGasEstimate(gasEstimate);

    setGas((prevGas) => {
      if (!prevGas && gasEstimate) {
        return gasEstimate;
      }
      return prevGas;
    });
  }, []);

  useEffect(() => {
    window.addEventListener("message", (event) => updateState(event.data));
    vscodeApi.postMessage({ command: VirtualizationUnitCommand.READY });

    return () => {
      window.removeEventListener("message", (event) => updateState(event.data));
    };
  }, [updateState]);

  return _disabled ? (
    <div className="container">
      <div className="width-constraint">
        <span className="disabled-text">
          Connect wallet to deploy virtualization units.
        </span>
      </div>
    </div>
  ) : (
    <div className="container">
      {_gasEstimate ? (
        <>
          <VSCodeRadioGroup
            disabled={
              _contractTransactionStatus === "sending" ||
              _contractTransactionStatus === "sent"
            }
            onChange={(e) => {
              onGasOptionChange(
                (e.target as HTMLInputElement).value as GasOption,
              );
            }}
            orientation="vertical"
            value={gasOption}
          >
            <label slot="label">Gas</label>
            <VSCodeRadio value={GasOption.ESTIMATE}>
              Estimated gas{" "}
              <span className="disabled-text">{_gasEstimate}</span>
            </VSCodeRadio>
            <VSCodeRadio value={GasOption.BUFFER}>
              Estimated gas + 15% buffer{" "}
              <span className="disabled-text">
                {calculateBuffer(_gasEstimate)}
              </span>
            </VSCodeRadio>
            <VSCodeRadio value={GasOption.CUSTOM}>Custom</VSCodeRadio>
          </VSCodeRadioGroup>
          {gasOption === GasOption.CUSTOM ? (
            <VSCodeTextField
              className="custom-gas-field width-constraint"
              disabled={
                _contractTransactionStatus === "sending" ||
                _contractTransactionStatus === "sent"
              }
              onInput={(e) => setGas((e.target as HTMLInputElement).value)}
              value={gas}
            />
          ) : null}
          <div className="width-constraint action-button-container">
            <VSCodeButton
              appearance="secondary"
              disabled={
                _contractTransactionStatus === "sending" ||
                _contractTransactionStatus === "sent"
              }
              onClick={onCancel}
            >
              Cancel
            </VSCodeButton>
            <VSCodeButton
              appearance="primary"
              disabled={_contractTransactionStatus !== undefined}
              onClick={onSend}
            >
              {_contractTransactionStatus
                ? TRANSACTION_STATUS_LABEL[_contractTransactionStatus]
                : "Send"}
            </VSCodeButton>
          </div>
        </>
      ) : (
        <div className="width-constraint">
          <VSCodeButton
            appearance="primary"
            className="block-width"
            disabled={_estimating}
            onClick={onDeploy}
          >
            {_estimating ? "Estimating Gas" : "Deploy"}
          </VSCodeButton>
        </div>
      )}
      <VSCodeDivider className="width-constraint" />
      <div className="dropdown-container">
        <label htmlFor="contract">Contract</label>
        <VSCodeDropdown
          className="width-constraint"
          disabled={!_contracts?.length}
          id="contract"
          onChange={(e) =>
            onContractChange((e.target as HTMLSelectElement).value)
          }
          value={_contracts?.length ? _currentContract : "empty"}
        >
          {_contracts.length ? (
            _contracts.map((contract) => (
              <VSCodeOption key={contract} value={contract}>
                {contract}
              </VSCodeOption>
            ))
          ) : (
            <VSCodeOption value="empty">No contracts available.</VSCodeOption>
          )}
        </VSCodeDropdown>
      </div>
    </div>
  );
};

const root = createRoot(document.getElementById("root") as HTMLElement);
root.render(<VirtualizationUnitView />);
