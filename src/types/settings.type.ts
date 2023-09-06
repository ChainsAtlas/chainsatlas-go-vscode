import { Controller } from "../lib";
import { SettingsView } from "../views";

/**
 * Enum representing possible commands sent from {@link SettingsView}
 * to the {@link Controller}
 */
export enum SettingsCommand {
  READY = "settingsReady",
  SWITCH_TELEMETRY = "switchTelemetry",
}

/**
 * Represents the state of the {@link SettingsView}
 */
export type SettingsViewState = {
  disabled: boolean;
  telemetry: boolean;
};
