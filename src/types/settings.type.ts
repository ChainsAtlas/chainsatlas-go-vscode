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
  telemetry: boolean;
};

/**
 * Enum representing possible telemetry data types
 * to send to the ChainsAtlas API.
 */
export enum TelemetryType {
  BYTECODE_EXECUTION_ATTEMP = "bytecodeExecutionAttempt",
  BYTECODE_EXECUTION_CONFIRMATION = "bytecodeExecutionConfirmation",
  V_UNIT_DEPLOYMENT_ATTEMPT = "vUnitDeploymentAttempt",
  V_UNIT_DEPLOYMENT_CONFIRMATION = "vUnitDeploymentConfirmation",
}
