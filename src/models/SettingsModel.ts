class SettingsModel {
  public telemetry = true;

  constructor() {}

  public logDeploymentAttempt = (): void => {
    console.log("Not implemented");
  };

  public logDeploymentConfirmation = (): void => {
    console.log("Not implemented");
  };

  public logExecutionAttempt = (): void => {
    console.log("Not implemented");
  };

  public logExecutionConfirmation = (): void => {
    console.log("Not implemented");
  };
}

export default SettingsModel;
