import { VSCodeCheckbox } from "@vscode/webview-ui-toolkit/react";
import { JSX, useCallback, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { SettingsCommand, SettingsViewState, VsCodeApi } from "../types";

declare const acquireVsCodeApi: () => VsCodeApi;
const vscodeApi = acquireVsCodeApi();

export const SettingsView = (): JSX.Element => {
  const [_telemetry, setTelemetry] =
    useState<SettingsViewState["telemetry"]>(true);

  const onTelemetryChange = (value: boolean): void => {
    vscodeApi.postMessage({
      command: SettingsCommand.SWITCH_TELEMETRY,
      data: JSON.stringify(value),
    });
  };

  const updateState = useCallback((data: SettingsViewState): void => {
    const { telemetry } = data;

    setTelemetry(telemetry);
  }, []);

  useEffect(() => {
    window.addEventListener("message", (event) => updateState(event.data));
    vscodeApi.postMessage({ command: SettingsCommand.READY });

    return () => {
      window.removeEventListener("message", (event) => updateState(event.data));
    };
  }, [updateState]);

  return (
    <div className="container">
      <div className="width-constraint">
        <VSCodeCheckbox
          checked={_telemetry}
          onChange={(e) =>
            onTelemetryChange((e.target as HTMLInputElement).checked)
          }
        >
          Enable telemetry collection
        </VSCodeCheckbox>
      </div>
      <div className="width-constraint">
        <span className="disabled-text">
          By checking this box, you consent to the collection of anonymous usage
          data to help us improve ChainsAtlas GO.
        </span>
      </div>
    </div>
  );
};

const root = createRoot(document.getElementById("root") as HTMLElement);
root.render(<SettingsView />);
