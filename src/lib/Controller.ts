import { Disposable, WebviewView } from "vscode";
import { ViewType } from "../enums";
import {
  executorCommandHandler,
  transactionHistoryCommandHandler,
  virtualizationUnitCommandHandler,
  walletCommandHandler,
} from "../handlers";
import {
  generateExecutorViewState,
  generateTransactionHistoryViewState,
  generateVirtualizationUnitViewState,
  generateWalletViewState,
} from "../helpers";
import type {
  ViewMessage,
  ViewMessageHandler,
  ViewStateGenerator,
} from "../types";
import type { Api } from "./Api";
import type { Client } from "./Client";

export class Controller {
  private readonly _viewStateGenerators: Record<ViewType, ViewStateGenerator> =
    {
      [ViewType.EXECUTOR]: generateExecutorViewState,
      [ViewType.TRANSACTION_HISTORY]: generateTransactionHistoryViewState,
      [ViewType.VIRTUALIZATION_UNIT]: generateVirtualizationUnitViewState,
      [ViewType.WALLET]: generateWalletViewState,
    };

  private readonly _viewTypeCommandHandlers: Record<
    ViewType,
    Record<string, ViewMessageHandler>
  > = {
    [ViewType.EXECUTOR]: executorCommandHandler,
    [ViewType.TRANSACTION_HISTORY]: transactionHistoryCommandHandler,
    [ViewType.VIRTUALIZATION_UNIT]: virtualizationUnitCommandHandler,
    [ViewType.WALLET]: walletCommandHandler,
  };

  private _views: Partial<Record<ViewType, WebviewView>> = {};

  constructor(
    private readonly _client: Client,
    private readonly _api: Api,
    private readonly _disposables: Disposable[],
  ) {
    this._update = this._update.bind(this);
  }

  public addView(view: WebviewView): void {
    this._views[view.viewType as ViewType] = view;

    if (view.viewType === ViewType.WALLET) {
      this._client.on("uriChange", () => {
        this._update(ViewType.WALLET);
      });
    }

    const disposable = view.webview.onDidReceiveMessage(
      (viewMessage: ViewMessage) => {
        const { command, data } = viewMessage;
        this._viewTypeCommandHandlers[view.viewType as ViewType][command](
          data,
          this._update,
          this._client,
          this._api,
        );
      },
      this,
      this._disposables,
    );

    this._disposables.push(disposable);
  }

  private async _update(...viewTypes: ViewType[]): Promise<void> {
    for (const type of viewTypes) {
      const generator = this._viewStateGenerators[type];
      const state = await generator(this._client, this._api);

      this._views[type]?.webview.postMessage(state);
    }
  }
}
