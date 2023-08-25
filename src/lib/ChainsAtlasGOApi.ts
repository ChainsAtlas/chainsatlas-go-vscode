import fetch from "cross-fetch";
import { AuthStatus, BytecodeStructure, ExecutorFile } from "../types";
import { withErrorHandling } from "../utils";

class ChainsAtlasGOApi {
  private static _URL = "https://api.chainsatlas.com";

  public authStatus?: AuthStatus;

  private _authToken = ""; //"rBzCg5dLhoBdXdC15vNa2";

  constructor() {}

  public authenticate = async (body: string): Promise<void> =>
    withErrorHandling(async () => {
      const response = await fetch(`${ChainsAtlasGOApi._URL}/login`, {
        method: "POST",
        body,
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        if (response.status === 401) {
          this._authToken = "";
        }

        this.authStatus = undefined;

        throw new Error(
          `HTTP error! [${response.status}]: ${response.statusText}`,
        );
      }

      this._authToken = (await response.json()).token as string;
      this.authStatus = "authenticated";
    })();

  public generateBytecodeStructure = async (
    file: ExecutorFile,
    nargs: number,
  ): Promise<BytecodeStructure | undefined> =>
    withErrorHandling(async () => {
      const data = {
        entrypoint_nargs: nargs,
        language: file.extension,
        source_code: file.content,
      };

      const response = await fetch(`${ChainsAtlasGOApi._URL}/build/generate`, {
        method: "POST",
        body: JSON.stringify(data),
        headers: {
          "Content-Type": "application/json",
          "x-access-tokens": this._authToken,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          this._authToken = "";
        }

        throw new Error(
          `HTTP error! [${response.status}]: ${response.statusText}`,
        );
      }

      const bytecodeStructure = (await response.json())
        .data as BytecodeStructure;

      return bytecodeStructure;
    })();

  public logout = (): void => {
    this._authToken = "";
    this.authStatus = undefined;
  };
}

export default ChainsAtlasGOApi;
