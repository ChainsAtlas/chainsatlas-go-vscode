import { ExtensionContext } from "vscode";

export class SettingsModel {
  constructor(private readonly _context: ExtensionContext) {
    this._context.globalState.setKeysForSync(["telemetry"]);
  }

  /**
   * Get telemetry setting from the extension global state.
   */
  get telemetry(): boolean {
    return this._context.globalState.get("telemetry", true);
  }

  /**
   * Set telemetry setting in the extension global state to persist across all
   * workspaces and sessions.
   */
  set telemetry(value: boolean) {
    this._context.globalState.update("telemetry", value);
  }
}
