import {
  VSCodeButton,
  VSCodeDivider,
  VSCodeRadio,
  VSCodeRadioGroup,
  VSCodeTextField,
} from "@vscode/webview-ui-toolkit/react";
import { useCallback, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { TRANSACTION_STATUS_LABEL } from "../constants";
import {
  ExecutorCommand,
  ExecutorViewState,
  GasOption,
  VsCodeApi,
} from "../types";

declare const acquireVsCodeApi: () => VsCodeApi;
const vscodeApi = acquireVsCodeApi();

const ExecutorView = (): JSX.Element => {
  const [_compiling, setCompiling] =
    useState<ExecutorViewState["compiling"]>(false);
  const [_contractTransactionStatus, setContractTransactionStatus] =
    useState<ExecutorViewState["contractTransactionStatus"]>(undefined);
  const [_currentFile, setCurrentFile] =
    useState<ExecutorViewState["currentFile"]>();
  const [_disabled, setDisabled] =
    useState<ExecutorViewState["disabled"]>(true);
  const [_estimating, setEstimating] =
    useState<ExecutorViewState["estimating"]>(false);
  const [_gasEstimate, setGasEstimate] =
    useState<ExecutorViewState["gasEstimate"]>();
  const [_nargs, setNargs] = useState<ExecutorViewState["nargs"]>();
  const [_userFile, setUserFile] = useState<ExecutorViewState["userFile"]>();
  const [args, setArgs] = useState<string[]>([]);
  const [compileFormOpen, setCompileFormOpen] = useState<boolean>(false);
  const [gas, setGas] = useState<string>("");
  const [gasEstimated, setGasEstimated] = useState<boolean>(false);
  const [gasOption, setGasOption] = useState<GasOption>(GasOption.BUFFER);
  const [userNargs, setUserNargs] = useState<string>("0");

  const calculateBuffer = (gas: string): string =>
    ((BigInt(gas) * BigInt(115)) / BigInt(100)).toString();

  const getActiveFile = (): void => {
    vscodeApi.postMessage({ command: ExecutorCommand.GET_ACTIVE_FILE });
  };

  const onCompile = (): void => {
    vscodeApi.postMessage({
      command: ExecutorCommand.COMPILE,
      value: userNargs,
    });
    setArgs(Array(Number(userNargs)).fill(""));
    setCompileFormOpen(false);
  };

  const onCompileCancel = (): void => {
    setCompileFormOpen(false);
    setUserNargs("0");
    vscodeApi.postMessage({ command: ExecutorCommand.CANCEL_COMPILE });
  };

  const onEstimate = (): void => {
    vscodeApi.postMessage({
      command: ExecutorCommand.ESTIMATE,
      value: JSON.stringify(args),
    });
  };

  const onExecute = (): void => {
    vscodeApi.postMessage({ command: ExecutorCommand.EXECUTE, value: gas });
  };

  const onExecuteCancel = (): void => {
    vscodeApi.postMessage({ command: ExecutorCommand.CANCEL_EXECUTION });
    setArgs(Array.from({ length: Number(_nargs) }));
    setGas("");
    setGasEstimated(false);
    setGasOption(GasOption.BUFFER);
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

  const selectFile = (): void => {
    vscodeApi.postMessage({ command: ExecutorCommand.SELECT_FILE });
  };

  const updateState = useCallback((data: ExecutorViewState): void => {
    const {
      compiling,
      contractTransactionStatus,
      currentFile,
      disabled,
      gasEstimate,
      nargs,
      userFile,
    } = data;

    setCompiling(compiling);
    setContractTransactionStatus(contractTransactionStatus);
    setCurrentFile(currentFile);
    setDisabled(disabled);
    setGasEstimate(gasEstimate);
    setNargs(nargs);
    setUserFile(userFile);

    if (gasEstimate) {
      setGasEstimated(true);
    }

    if (compiling) {
      setCompileFormOpen((prevOpen) => {
        if (compiling) {
          return true;
        }

        return prevOpen;
      });
    } else {
      setCompiling((prevCompiling) => {
        if (prevCompiling && !compiling && userFile) {
          setCompileFormOpen(false);
          return false;
        }

        return compiling;
      });
    }

    setGas((prevGas) => {
      if (!prevGas && gasEstimate) {
        return gasEstimate;
      }

      return prevGas;
    });
  }, []);

  useEffect(() => {
    window.addEventListener("message", (event) => updateState(event.data));
    vscodeApi.postMessage({ command: ExecutorCommand.READY });

    return () => {
      window.removeEventListener("message", (event) => updateState(event.data));
    };
  }, [updateState]);

  return _disabled ? (
    <div className="container">
      <div className="width-constraint">
        <span className="disabled-text">
          You need to select an account and a virtualization unit to execute
          code.
        </span>
      </div>
    </div>
  ) : (
    <div className="container">
      {compileFormOpen ? (
        <>
          <VSCodeTextField
            className="width-constraint"
            placeholder={_userFile ? _userFile.path : "Upload file"}
            readOnly
            title={_userFile?.path || undefined}
          >
            File
            <section slot="end">
              <VSCodeButton
                appearance="icon"
                className="button-codicon"
                onClick={selectFile}
                title="Upload file"
              >
                <i className="codicon codicon-cloud-upload" />
              </VSCodeButton>
            </section>
          </VSCodeTextField>
          <VSCodeTextField
            className="width-constraint"
            onInput={(e) => setUserNargs((e.target as HTMLInputElement).value)}
            value={userNargs}
          >
            Number of arguments
          </VSCodeTextField>
          <div className="width-constraint action-button-container">
            <VSCodeButton
              appearance="secondary"
              disabled={_compiling}
              onClick={onCompileCancel}
            >
              Cancel
            </VSCodeButton>
            <VSCodeButton
              appearance="primary"
              disabled={_compiling}
              onClick={onCompile}
            >
              {_compiling ? "Compiling..." : "Compile"}
            </VSCodeButton>
          </div>
        </>
      ) : (
        <div className="width-constraint">
          <VSCodeButton
            appearance="primary"
            className="block-width"
            disabled={
              _contractTransactionStatus === "sending" ||
              _contractTransactionStatus === "sent"
            }
            onClick={() => {
              setCompileFormOpen(true);
              getActiveFile();
            }}
          >
            Compile Bytecode
          </VSCodeButton>
        </div>
      )}
      <VSCodeDivider className="width-constraint" />
      {_currentFile && _nargs ? (
        <>
          <VSCodeTextField
            className="width-constraint"
            readOnly
            title={_currentFile.path}
            value={_currentFile.path}
          >
            File
          </VSCodeTextField>
          {args.map((_, i) => (
            <VSCodeTextField
              className="width-constraint"
              disabled={
                _contractTransactionStatus === "sending" ||
                _contractTransactionStatus === "sent"
              }
              key={i}
              onInput={(e) => {
                setArgs((currentArgs) => {
                  const newArgs = [...currentArgs];
                  newArgs[i] = (e.target as HTMLInputElement).value;
                  return newArgs;
                });
                setGasEstimated(false);
              }}
              value={args[i]}
            >
              Argument {i + 1}
            </VSCodeTextField>
          ))}
          {!gasEstimated ? (
            <div className="width-constraint">
              <VSCodeButton
                appearance="primary"
                className="block-width"
                disabled={_estimating}
                onClick={onEstimate}
              >
                {_estimating ? "Estimating Gas" : "Estimate Gas"}
              </VSCodeButton>
            </div>
          ) : (
            <>
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
                      onInput={(e) =>
                        setGas((e.target as HTMLInputElement).value)
                      }
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
                      onClick={onExecuteCancel}
                    >
                      Cancel
                    </VSCodeButton>
                    <VSCodeButton
                      appearance="primary"
                      disabled={
                        !gas || _contractTransactionStatus !== undefined
                      }
                      onClick={onExecute}
                    >
                      {_contractTransactionStatus
                        ? TRANSACTION_STATUS_LABEL[_contractTransactionStatus]
                        : "Execute"}
                    </VSCodeButton>
                  </div>
                </>
              ) : null}
            </>
          )}
        </>
      ) : (
        <div className="width-constraint">
          <span className="disabled-text">
            You need to compile your file before executing it.
          </span>
        </div>
      )}
    </div>
  );
};

const root = createRoot(document.getElementById("root") as HTMLElement);
root.render(<ExecutorView />);