import { useCallback, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { VsCodeApi } from "../types";

declare const acquireVsCodeApi: () => VsCodeApi;
const vscodeApi = acquireVsCodeApi();

const History = (): JSX.Element => {
  const updateState = useCallback((data: any): void => {}, []);

  useEffect(() => {
    window.addEventListener("message", (event) => updateState(event.data));
    vscodeApi.postMessage({ type: "ready" });

    return () => {
      window.removeEventListener("message", (event) => updateState(event.data));
    };
  }, [updateState]);

  return <div />;
};

const root = createRoot(document.getElementById("root") as HTMLElement);
root.render(<History />);
