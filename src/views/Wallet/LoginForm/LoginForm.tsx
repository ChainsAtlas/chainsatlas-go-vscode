import {
  VSCodeButton,
  VSCodeDivider,
  VSCodeTextField,
} from "@vscode/webview-ui-toolkit/react";
import { ReactElement, useLayoutEffect, useState } from "react";
import { vscodeApi } from "..";
import { WalletCommand } from "../../../enums";
import type { AuthStatus } from "../../../types";

const version = require("../../../../package.json").version;

export interface ILoginForm {
  authStatus?: AuthStatus;
}

export const LoginForm = ({ authStatus }: ILoginForm): ReactElement => {
  const [password, setPassword] = useState<string>("");
  const [username, setUsername] = useState<string>("");

  const login = (): void => {
    vscodeApi.postMessage({
      command: WalletCommand.LOGIN,
      data: JSON.stringify({ username, password }),
    });
  };

  const logout = (): void => {
    vscodeApi.postMessage({ command: WalletCommand.LOGOUT });
    setUsername("");
    setPassword("");
  };

  useLayoutEffect(() => {
    document.getElementById("username-input")?.focus();
  }, []);

  return (
    <>
      {authStatus !== "authenticated" ? (
        <>
          <VSCodeTextField
            className="width-constraint"
            id="username-input"
            onInput={(e) => setUsername((e.target as HTMLInputElement).value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                document.getElementById("password-input")?.focus();
              }
            }}
            type="email"
            value={username || ""}
          >
            Username
          </VSCodeTextField>
          <VSCodeTextField
            className="width-constraint"
            id="password-input"
            onInput={(e) => setPassword((e.target as HTMLInputElement).value)}
            type="password"
            value={password || ""}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                document.getElementById("login-button")?.focus();
                login();
              }
            }}
          >
            Password
          </VSCodeTextField>
          <div className="width-constraint">
            <VSCodeButton
              appearance="primary"
              disabled={authStatus === "authenticating"}
              className="block-width"
              id="login-button"
              onClick={login}
            >
              {authStatus === "authenticating" ? "Authenticating..." : "Login"}
            </VSCodeButton>
          </div>
          <div className="width-constraint">
            <span className="disabled-text">Version {version}</span>
          </div>
        </>
      ) : (
        <div className="width-constraint">
          <VSCodeButton
            appearance="primary"
            className="block-width"
            onClick={logout}
          >
            Logout
          </VSCodeButton>
        </div>
      )}
      <VSCodeDivider className="width-constraint" />
    </>
  );
};
