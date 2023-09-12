import { ERROR_MESSAGE } from "../constants";
import { ViewMessageHandler, ViewType } from "../types";
import { withErrorHandling } from "../utils";

export const switchTelemetry: ViewMessageHandler = (
  data,
  update,
  client,
  _api,
) => {
  withErrorHandling(() => {
    if (!data) {
      throw new Error(ERROR_MESSAGE.INVALID_VALUE);
    }

    client.settings.telemetry = JSON.parse(data);

    update(ViewType.SETTINGS);
  })();
};

export const settingsReady: ViewMessageHandler = (
  _data,
  update,
  _client,
  _api,
) => {
  withErrorHandling(() => {
    update(ViewType.SETTINGS);
  })();
};
