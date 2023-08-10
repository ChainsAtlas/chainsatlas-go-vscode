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
import { VirtualizationUnitData, VsCodeApi } from "../types";

declare const acquireVsCodeApi: () => VsCodeApi;
const vscodeApi = acquireVsCodeApi();

type GasOption = "buffer" | "custom" | "estimate";

const VirtualizationUnit = (): JSX.Element => {
  const [_contracts, setContracts] = useState<
    VirtualizationUnitData["contracts"]
  >([]);
  const [_currentContract, setCurrentContract] =
    useState<VirtualizationUnitData["currentContract"]>();
  const [_disabled, setDisabled] =
    useState<VirtualizationUnitData["disabled"]>(true);
  const [_gasEstimate, setGasEstimate] =
    useState<VirtualizationUnitData["gasEstimate"]>();
  const [gas, setGas] = useState<string>();
  const [gasOption, setGasOption] = useState<GasOption>("buffer");

  const calculateBuffer = (gas: string): string =>
    ((BigInt(gas) * BigInt(115)) / BigInt(100)).toString();

  const onCancel = (): void => {
    vscodeApi.postMessage({ type: "clearDeployment" });
  };

  const onContractChange = (contract: string): void => {
    vscodeApi.postMessage({ type: "setContract", value: contract });
  };

  const onDeploy = (): void => {
    vscodeApi.postMessage({ type: "deploy" });
  };

  const onGasOptionChange = useCallback(
    (option: GasOption) => {
      setGasOption(option);

      if (_gasEstimate) {
        switch (option) {
          case "buffer":
            setGas(calculateBuffer(_gasEstimate));
            break;
          case "custom":
            setGas(_gasEstimate);
            break;
          case "estimate":
            setGas(_gasEstimate);
            break;
          default:
            break;
        }
      }
    },
    [_gasEstimate],
  );

  const onSend = useCallback((): void => {
    vscodeApi.postMessage({ type: "send", value: gas });
  }, [gas]);

  const updateState = useCallback(
    (data: VirtualizationUnitData): void => {
      const { contracts, currentContract, disabled, gasEstimate } = data;

      setContracts(contracts);
      setCurrentContract(currentContract);
      setDisabled(disabled);
      setGasEstimate(gasEstimate);

      if (!gas) {
        setGas(gasEstimate);
      }
    },
    [gas],
  );

  const initMessageHandler = useCallback((): void => {
    window.addEventListener("message", (event) => updateState(event.data));
    vscodeApi.postMessage({ type: "ready" });
  }, [updateState]);

  useEffect(() => {
    initMessageHandler();
  }, [initMessageHandler]);

  return _disabled ? (
    <div className="container">
      <div className="width-constraints">
        <span className="disabled-text">
          Connect wallet to deploy virtualization units.
        </span>
      </div>
    </div>
  ) : (
    <div className="container">
      {_gasEstimate ? (
        <>
          <div className="width-constraints">
            <p className="disabled-text">Estimated gas: {_gasEstimate}</p>
            <p className="disabled-text">
              Estimated gas + 15% buffer: {calculateBuffer(_gasEstimate)}
            </p>
          </div>

          <VSCodeRadioGroup
            onChange={(e) => {
              onGasOptionChange(
                (e.target as HTMLInputElement).value as GasOption,
              );
            }}
            orientation="vertical"
            value={gasOption}
          >
            <label slot="label">Gas</label>
            <VSCodeRadio value="estimate">Estimated gas</VSCodeRadio>
            <VSCodeRadio value="buffer">Estimated gas + 15% buffer</VSCodeRadio>
            <VSCodeRadio value="custom">Custom</VSCodeRadio>
            {gasOption === "custom" ? (
              <VSCodeTextField
                className="custom-gas-field width-constraint"
                value={gas}
                onChange={(e) => setGas((e.target as HTMLInputElement).value)}
              />
            ) : null}
          </VSCodeRadioGroup>
          <div className="width-constraint action-button-container">
            <VSCodeButton appearance="secondary" onClick={onCancel}>
              Cancel
            </VSCodeButton>
            <VSCodeButton appearance="primary" onClick={onSend}>
              Send
            </VSCodeButton>
          </div>
        </>
      ) : (
        <div className="width-constraint">
          <VSCodeButton
            appearance="primary"
            className="block-width"
            onClick={onDeploy}
          >
            Deploy
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
root.render(<VirtualizationUnit />);
