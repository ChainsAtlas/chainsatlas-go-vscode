import {
  VSCodeButton,
  VSCodeDivider,
  VSCodeRadio,
  VSCodeRadioGroup,
  VSCodeTextField,
} from "@vscode/webview-ui-toolkit/react";
import { useCallback, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { ExecutorData, VsCodeApi } from "../types";

declare const acquireVsCodeApi: () => VsCodeApi;
const vscodeApi = acquireVsCodeApi();

type GasOption = "buffer" | "custom" | "estimate";

const Executor = (): JSX.Element => {
  const [_currentFile, setCurrentFile] =
    useState<ExecutorData["currentFile"]>();
  const [_disabled, setDisabled] = useState<ExecutorData["disabled"]>(true);
  const [_gasEstimate, setGasEstimate] =
    useState<ExecutorData["gasEstimate"]>();
  const [_nargs, setNargs] = useState<ExecutorData["nargs"]>();
  const [_userFile, setUserFile] = useState<ExecutorData["userFile"]>();
  const [args, setArgs] = useState<string[]>([]);
  const [compileFormOpen, setCompileFormOpen] = useState<boolean>(false);
  const [gas, setGas] = useState<string>("");
  const [gasEstimated, setGasEstimated] = useState<boolean>(false);
  const [gasOption, setGasOption] = useState<GasOption>("buffer");
  const [userNargs, setUserNargs] = useState<string>("0");

  const calculateBuffer = (gas: string): string =>
    ((BigInt(gas) * BigInt(115)) / BigInt(100)).toString();

  const onCompile = (): void => {
    vscodeApi.postMessage({ type: "compile", value: userNargs });
    setArgs(Array(Number(userNargs)).fill(""));
    setCompileFormOpen(false);
  };

  const onCompileCancel = (): void => {
    setCompileFormOpen(false);
    setUserNargs("0");
    vscodeApi.postMessage({ type: "cancelCompile" });
  };

  const onEstimate = (): void => {
    vscodeApi.postMessage({ type: "estimate", value: JSON.stringify(args) });
  };

  const onExecute = (): void => {
    vscodeApi.postMessage({ type: "execute", value: gas });
  };

  const onExecuteCancel = (): void => {
    setArgs(Array.from({ length: Number(_nargs) }));
    setGas("");
    setGasEstimated(false);
    setGasOption("buffer");
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

  const selectFile = (): void => {
    vscodeApi.postMessage({ type: "selectFile" });
  };

  const updateState = useCallback((data: ExecutorData): void => {
    const { currentFile, disabled, gasEstimate, nargs, userFile } = data;

    setCurrentFile(currentFile);
    setDisabled(disabled);
    setGasEstimate(gasEstimate);
    setNargs(nargs);
    setUserFile(userFile);

    if (gasEstimate) {
      setGasEstimated(true);
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
    vscodeApi.postMessage({ type: "ready" });

    return () => {
      window.removeEventListener("message", (event) => updateState(event.data));
    };
  }, [updateState]);

  return _disabled ? (
    <div className="container">
      <div className="width-constraints">
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
            <VSCodeButton appearance="secondary" onClick={onCompileCancel}>
              Cancel
            </VSCodeButton>
            <VSCodeButton appearance="primary" onClick={onCompile}>
              Compile
            </VSCodeButton>
          </div>
        </>
      ) : (
        <div className="width-constraint">
          <VSCodeButton
            appearance="primary"
            className="block-width"
            onClick={() => {
              setCompileFormOpen(true);
              selectFile();
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
                onClick={onEstimate}
              >
                Estimate Gas
              </VSCodeButton>
            </div>
          ) : (
            <>
              {_gasEstimate ? (
                <>
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
                    <VSCodeRadio value="estimate">
                      Estimated gas{" "}
                      <span className="disabled-text">{_gasEstimate}</span>
                    </VSCodeRadio>
                    <VSCodeRadio value="buffer">
                      Estimated gas + 15% buffer{" "}
                      <span className="disabled-text">
                        {calculateBuffer(_gasEstimate)}
                      </span>
                    </VSCodeRadio>
                    <VSCodeRadio value="custom">Custom</VSCodeRadio>
                  </VSCodeRadioGroup>
                  {gasOption === "custom" ? (
                    <VSCodeTextField
                      className="custom-gas-field width-constraint"
                      onInput={(e) =>
                        setGas((e.target as HTMLInputElement).value)
                      }
                      value={gas}
                    />
                  ) : null}
                  <div className="width-constraint action-button-container">
                    <VSCodeButton
                      appearance="secondary"
                      onClick={onExecuteCancel}
                    >
                      Cancel
                    </VSCodeButton>
                    <VSCodeButton
                      appearance="primary"
                      disabled={!gas}
                      onClick={onExecute}
                    >
                      Execute
                    </VSCodeButton>
                  </div>
                </>
              ) : null}
            </>
          )}
        </>
      ) : (
        <div className="width-constraints">
          <span className="disabled-text">
            You need to compile your file before executing it.
          </span>
        </div>
      )}
    </div>
  );
};

const root = createRoot(document.getElementById("root") as HTMLElement);
root.render(<Executor />);
