import fetch from "cross-fetch";
import { AuthStatus, BytecodeStructure, ExecutorFile } from "../types";
import { withErrorHandling } from "../utils";

/**
 * `ChainsAtlasGOApi` provides methods to interact with the ChainsAtlas GO API.
 * It handles authentication, bytecode structure generation, and other possible interactions.
 */
class ChainsAtlasGOApi {
  /**
   * Static property `_URL` holds the base URL for the ChainsAtlas GO API.
   */
  private static _URL = "https://api.chainsatlas.com";

  /**
   * `authStatus` is an optional property that represents the current authentication status of the user.
   * The status could be "authenticated" or undefined.
   */
  public authStatus?: AuthStatus;

  /**
   * `_authToken` is a private property to store the authentication token received after a successful login.
   */
  private _authToken = "";

  /**
   * Constructor for the `ChainsAtlasGOApi` class.
   * Initializes the ChainsAtlasGOApi instance.
   */
  constructor() {}

  /**
   * The `authenticate` method attempts to authenticate a user with the ChainsAtlas GO API.
   * @param body - The request payload for authentication.
   * @returns A promise that resolves when authentication is successful.
   * @throws An error if the authentication fails.
   */
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

  /**
   * The `generateBytecodeStructure` method sends a request to generate bytecode structure for a given file.
   * @param file - The executor file containing details like extension and content.
   * @param nargs - Number of arguments.
   * @returns A promise that resolves to a `BytecodeStructure` object or is undefined if the generation fails.
   * @throws An error if the request fails.
   */
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

  /**
   * The `logout` method clears the stored authentication token and sets the `authStatus` to undefined.
   * It essentially represents a "logout" action.
   */
  public logout = (): void => {
    this._authToken = "";
    this.authStatus = undefined;
  };
}

export default ChainsAtlasGOApi;
