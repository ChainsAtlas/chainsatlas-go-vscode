import fetch from "cross-fetch";
import { AuthStatus, BytecodeStructure, ExecutorFile } from "../types";

/**
 * Represents the API client.
 * It handles authentication and bytecode structure generation.
 */
export class Api {
  /**
   * The base URL for the API.
   */
  private static _URL = "https://api.chainsatlas.com";

  /**
   * Represents the current authentication status of the user.
   * The status can be "authenticated", "authenticating" or undefined.
   */
  public authStatus?: AuthStatus;

  /**
   * Stores the authentication token received after a successful login.
   */
  private _authToken = "";

  /**
   * Constructs a new instance of the `Api` class.
   *
   * @param _fetch A fetch function, primarily used for test stubbing. Defaults to the global fetch function.
   */
  constructor(private readonly _fetch = fetch) {}

  /**
   * The `authenticate` method attempts to authenticate a user with the ChainsAtlas GO API.
   *
   * @param body - The request payload for authentication. Should be a `{username: string, password: string}`
   * stringified object
   *
   * @returns A promise that resolves when authentication is successful.
   *
   * @throws An error if the authentication fails.
   */
  public async authenticate(body: string): Promise<void> {
    const response = await this._fetch(`${Api._URL}/login`, {
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

    const json = await response.json();

    this._authToken = json.token as string;
    this.authStatus = "authenticated";
  }

  /**
   * Sends a request to generate a {@link BytecodeStructure} for a given {@link ExecutorFile}.
   *
   * @param file The executor file containing details like extension and content.
   * @param nargs Number of arguments for the bytecode.
   *
   * @returns A promise that resolves to a bytecode structure object or is undefined if the generation fails.
   *
   * @throws An error if the request fails.
   */
  public async generateBytecodeStructure(
    file: ExecutorFile,
    nargs: number,
  ): Promise<BytecodeStructure | undefined> {
    const data = {
      entrypoint_nargs: nargs,
      language: file.extension,
      source_code: file.content,
    };

    const response = await this._fetch(`${Api._URL}/build/generate`, {
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

    const bytecodeStructure = (await response.json()).data as BytecodeStructure;

    return bytecodeStructure;
  }

  /**
   * The `logout` method clears the stored authentication token
   * and sets the `authStatus` to undefined.
   */
  public logout(): void {
    this._authToken = "";
    this.authStatus = undefined;
  }

  /**
   * The `telemetry` method sends usage info to the ChainsAtlas API
   * to provide user feedback and help improve ChainsAtlas GO.
   */
  public async sendTelemetry(body: string): Promise<void> {
    console.log("TELEMETRY: ", body);
    await this._fetch(`${Api._URL}/telemetry`, {
      method: "POST",
      body,
      headers: {
        "Content-Type": "application/json",
        "x-access-tokens": this._authToken,
      },
    });
  }
}
