import UniversalProvider from "@walletconnect/universal-provider";
import { ExtensionContext, Webview, WebviewView } from "vscode";
import { ERROR_MESSAGE, WALLETCONNECT_PROJECT_ID } from "../constants";

import {
  ExecutorController,
  TransactionHistoryController,
  VirtualizationUnitController,
  WalletController,
} from "../controllers";
import {
  ExecutorModel,
  TransactionHistoryModel,
  VirtualizationUnitModel,
  WalletModel,
} from "../models";
import {
  ExecutorControllerModelMap,
  ViewMap,
  ViewType,
  VirtualizationUnitControllerModelMap,
  WalletControllerModelMap,
} from "../types";
import { withErrorHandling } from "../utils";
import ViewStateGenerator from "./ViewStateGenerator";

enum PrivateMemberKey {
  EXECUTOR = "_executor",
  EXECUTOR_CONTROLLER = "_executorController",
  PROVIDER = "_provider",
  TRANSACTION_HISTORY = "_transactionHistory",
  VIEW_STATE_GENERATOR = "_viewStateGenerator",
  VIRTUALIZATION_UNIT = "_virtualizationUnit",
  WALLET = "_wallet",
}

type MemberTypeMap = {
  [PrivateMemberKey.EXECUTOR]: ExecutorModel;
  [PrivateMemberKey.EXECUTOR_CONTROLLER]: ExecutorController;
  [PrivateMemberKey.PROVIDER]: UniversalProvider;
  [PrivateMemberKey.TRANSACTION_HISTORY]: TransactionHistoryModel;
  [PrivateMemberKey.VIEW_STATE_GENERATOR]: ViewStateGenerator;
  [PrivateMemberKey.VIRTUALIZATION_UNIT]: VirtualizationUnitModel;
  [PrivateMemberKey.WALLET]: WalletModel;
};

const METADATA = {
  DESCRIPTION: "ChainsAtlas GO VS Code",
  ICONS: [
    "https://chainsatlas.com/wp-content/uploads/2022/08/ChainsAtlas-logo.png",
  ],
  NAME: "ChainsAtlas GO",
  URL: "https://chainsatlas.com/",
};

class ChainsAtlasGO {
  // ---------------------- Private Model Instance Variables ----------------------
  private _executor?: ExecutorModel;
  private _transactionHistory?: TransactionHistoryModel;
  private _virtualizationUnit?: VirtualizationUnitModel;
  private _wallet?: WalletModel;

  // ---------------------- Private Controller Instance Variables ----------------------
  private _executorController?: ExecutorController;
  private _transactionHistoryController?: TransactionHistoryController;
  private _virtualizationUnitController?: VirtualizationUnitController;
  private _walletController?: WalletController;

  // ---------------------- Private Web3/Provider Instance Variables ----------------------
  private _provider?: UniversalProvider;

  // ---------------------- Private Helper Variables ----------------------
  private _viewMap: Partial<ViewMap> = {};
  private _viewStateGenerator?: ViewStateGenerator;

  // ---------------------- Constructor ----------------------
  constructor(private readonly _context: ExtensionContext) {}

  // ---------------------- Public Methods ----------------------
  public addView = withErrorHandling(
    async (view: WebviewView): Promise<void> => {
      if (
        this._ensureInitialized(
          PrivateMemberKey.EXECUTOR,
          PrivateMemberKey.PROVIDER,
          PrivateMemberKey.TRANSACTION_HISTORY,
          PrivateMemberKey.VIEW_STATE_GENERATOR,
          PrivateMemberKey.VIRTUALIZATION_UNIT,
          PrivateMemberKey.WALLET,
        )
      ) {
        if (!Object.values(ViewType).includes(view.viewType as ViewType)) {
          throw new Error(ERROR_MESSAGE.INVALID_VIEW_TYPE);
        }

        this._viewMap[view.viewType as keyof ViewMap] = view;

        const executor = this._executor;
        const transactionHistory = this._transactionHistory;
        const virtualizationUnit = this._virtualizationUnit;
        const wallet = this._wallet;
        const { EXECUTOR, TRANSACTION_HISTORY, VIRTUALIZATION_UNIT, WALLET } =
          ViewType;
        const { webview } = view;

        switch (view.viewType) {
          case EXECUTOR:
            this._initExecutorController(webview, {
              executor,
              transactionHistory,
              virtualizationUnit,
              wallet,
            });
            break;
          case TRANSACTION_HISTORY:
            this._initTransactionHistoryController(webview);
            break;
          case VIRTUALIZATION_UNIT:
            this._initVirtualizationUnitController(webview, {
              virtualizationUnit,
              wallet,
            });
            break;
          case WALLET:
            this._initWalletController(
              webview,
              { executor, transactionHistory, virtualizationUnit, wallet },
              this._provider,
            );
          default:
            break;
        }
      }
    },
  );

  // Called when the extension is deactivated
  public dispose = withErrorHandling(async (): Promise<void> => {
    if (
      this._ensureInitialized(
        PrivateMemberKey.PROVIDER,
        PrivateMemberKey.WALLET,
      )
    ) {
      await this._wallet.disconnect();
      await this._provider.disconnect();
    }
  });

  public init = withErrorHandling(async (): Promise<void> => {
    this._provider = await UniversalProvider.init({
      projectId: WALLETCONNECT_PROJECT_ID,
      metadata: {
        description: METADATA.DESCRIPTION,
        icons: METADATA.ICONS,
        name: METADATA.NAME,
        url: METADATA.URL,
      },
    });
    this._executor = new ExecutorModel();
    this._transactionHistory = new TransactionHistoryModel();
    this._virtualizationUnit = new VirtualizationUnitModel();
    this._wallet = new WalletModel(this._provider);

    this._viewStateGenerator = new ViewStateGenerator(
      this._executor,
      this._transactionHistory,
      this._virtualizationUnit,
      this._wallet,
    );
  });

  // ---------------------- Private Methods - Utilities ----------------------
  private _ensureInitialized = (
    ...keys: PrivateMemberKey[]
  ): this is this & Pick<MemberTypeMap, (typeof keys)[number]> => {
    for (const key of keys) {
      if (!this[key as keyof this]) {
        throw new Error(`Member ${key} is not initialized.`);
      }
    }
    return true;
  };

  private _initExecutorController = (
    webview: Webview,
    modelMap: ExecutorControllerModelMap,
  ) => {
    this._executorController = new ExecutorController(
      webview,
      this._context.subscriptions,
      modelMap,
    );
    this._executorController.on("sync", this._syncView);
  };

  private _initTransactionHistoryController = (webview: Webview) => {
    this._transactionHistoryController = new TransactionHistoryController(
      webview,
      this._context.subscriptions,
    );
    this._transactionHistoryController.on("sync", this._syncView);
  };

  private _initVirtualizationUnitController = (
    webview: Webview,
    modelMap: VirtualizationUnitControllerModelMap,
  ) => {
    this._virtualizationUnitController = new VirtualizationUnitController(
      webview,
      this._context.subscriptions,
      modelMap,
    );
    this._virtualizationUnitController.on("sync", this._syncView);
  };

  private _initWalletController = (
    webview: Webview,
    modelMap: WalletControllerModelMap,
    provider: UniversalProvider,
  ) => {
    this._walletController = new WalletController(
      webview,
      this._context.subscriptions,
      modelMap,
      provider,
    );
    this._walletController.on("sync", this._syncView);
  };

  private _syncView = async (...viewTypes: ViewType[]): Promise<void> => {
    for (const type of viewTypes) {
      switch (type) {
        case ViewType.EXECUTOR:
          this._viewMap.executor?.webview.postMessage(
            this._viewStateGenerator?.generateViewState(ViewType.EXECUTOR),
          );
          break;
        case ViewType.TRANSACTION_HISTORY:
          this._viewMap.transactionHistory?.webview.postMessage(
            this._viewStateGenerator?.generateViewState(
              ViewType.TRANSACTION_HISTORY,
            ),
          );
          break;
        case ViewType.VIRTUALIZATION_UNIT:
          this._viewMap.virtualizationUnit?.webview.postMessage(
            this._viewStateGenerator?.generateViewState(
              ViewType.VIRTUALIZATION_UNIT,
            ),
          );
          break;
        case ViewType.WALLET:
          this._viewMap.wallet?.webview.postMessage(
            await this._viewStateGenerator?.generateViewState(ViewType.WALLET),
          );
          break;
        default:
          break;
      }
    }
  };
}

export default ChainsAtlasGO;
