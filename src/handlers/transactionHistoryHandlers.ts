import { ViewMessageHandler, ViewType } from "../types";
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
