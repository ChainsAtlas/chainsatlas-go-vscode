import { ViewType } from "../enums";
import type { ViewMessageHandler } from "../types";
import { withErrorHandling } from "../utils";

export const transactionHistoryReady: ViewMessageHandler = (
  _data,
  update,
  _client,
  _api,
) => {
  withErrorHandling(() => {
    update(ViewType.TRANSACTION_HISTORY);
  })();
};
