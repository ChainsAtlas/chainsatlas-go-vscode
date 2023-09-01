import { SettingsController } from "../controllers";
import { SettingsModel } from "../models";
import { SettingsView } from "../views";

/**
 * Enum representing possible commands sent from {@link SettingsView}
 * to the {@link SettingsController}
 */
export enum SettingsCommand {
  READY = "ready",
  SWITCH_TELEMETRY = "switchTelemetry",
}

/**
 * Represents a mapping of models required
 * for the {@link SettingsController} constructor.
 */
export type SettingsControllerModelMap = {
  settings: SettingsModel;
};

/**
 * Represents the state of the {@link SettingsView}
 */
export type SettingsViewState = {
  disabled: boolean;
  telemetry: boolean;
};
