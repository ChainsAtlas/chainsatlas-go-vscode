import UniversalProvider from "@walletconnect/universal-provider";
import { ExtensionContext, Webview, WebviewView } from "vscode";
import { ChainsAtlasGOApi, ViewStateGenerator } from ".";
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
  ControllerEvent,
  ExecutorControllerModelMap,
  ViewMap,
  ViewType,
  VirtualizationUnitControllerModelMap,
  WalletControllerModelMap,
} from "../types";
import { withErrorHandling } from "../utils";

/**
 * Defines keys for accessing private members of the ChainsAtlasGO class.
 * These keys correlate with private member variables within the class.
 */
export enum PrivateMemberKey {
  EXECUTOR = "_executor",
  EXECUTOR_CONTROLLER = "_executorController",
  PROVIDER = "_provider",
  TRANSACTION_HISTORY = "_transactionHistory",
  TRANSACTION_HISTORY_CONTROLLER = "_transactionHistoryController",
  VIEW_STATE_GENERATOR = "_viewStateGenerator",
  VIRTUALIZATION_UNIT = "_virtualizationUnit",
  VIRTUALIZATION_UNIT_CONTROLLER = "_virtualizationUnitController",
  WALLET = "_wallet",
  WALLET_CONTROLLER = "_walletController",
}

/**
 * Type mapping to associate each `PrivateMemberKey` with its corresponding data type.
 * Ensures the expected type for each private member can be inferred from its key.
 */
export type MemberTypeMap = {
  [PrivateMemberKey.EXECUTOR]: ExecutorModel;
  [PrivateMemberKey.EXECUTOR_CONTROLLER]: ExecutorController;
  [PrivateMemberKey.PROVIDER]: UniversalProvider;
  [PrivateMemberKey.TRANSACTION_HISTORY]: TransactionHistoryModel;
  [PrivateMemberKey.TRANSACTION_HISTORY_CONTROLLER]: TransactionHistoryController;
  [PrivateMemberKey.VIEW_STATE_GENERATOR]: ViewStateGenerator;
  [PrivateMemberKey.VIRTUALIZATION_UNIT]: VirtualizationUnitModel;
  [PrivateMemberKey.VIRTUALIZATION_UNIT_CONTROLLER]: VirtualizationUnitController;
  [PrivateMemberKey.WALLET]: WalletModel;
  [PrivateMemberKey.WALLET_CONTROLLER]: WalletController;
};

/**
 * Contains metadata information for ChainsAtlas GO.
 * Provides branding and web-related details for the ChainsAtlas GO client.
 */
const METADATA = {
  DESCRIPTION: "ChainsAtlas GO VSCode",
  ICONS: [
    "https://chainsatlas.com/wp-content/uploads/2022/08/ChainsAtlas-logo.png",
  ],
  NAME: "ChainsAtlas GO",
  URL: "https://chainsatlas.com/",
};

/**
 * `ChainsAtlasGO` is the primary class for the ChainsAtlas GO VS Code extension.
 *
 * This class manages the core functionalities of the extension, including:
 * - Models: Represents the application's state and logic for different components like the executor, transaction history, virtualization units, and the user's wallet.
 * - Controllers: Provides the logic to interact with the corresponding models, facilitating operations and user interactions.
 * - Views: Manages different views within the extension, including rendering and handling interactions.
 * - Provider: Facilitates blockchain interactions, transactions, and other related operations using the UniversalProvider.
 * - ViewStateGenerator: Utility for generating the state of views based on model data.
 *
 * The class also provides methods to initialize the components, add views, dispose of resources, and synchronize views. The constructor takes an extension context as its only argument, ensuring that the instance has the necessary context to operate within the VS Code environment.
 *
 * @class
 * @public
 *
 * @example
 * const client = new ChainsAtlasGOClient(extensionContext);
 * await client.init();
 * client.addView(someView);
 */
class ChainsAtlasGOClient {
  // ---------------------- Private Model Instance Variables ----------------------
  /**
   * Represents the executor's state and logic.
   * Used for managing and manipulating the executor's data.
   */
  private _executor?: ExecutorModel;

  /**
   * Represents the history of transactions.
   * Used for logging and tracking transaction events.
   */
  private _transactionHistory?: TransactionHistoryModel;

  /**
   * Represents the virtualization unit's state and logic.
   * Used for managing and manipulating virtualization unit contracts.
   */
  private _virtualizationUnit?: VirtualizationUnitModel;

  /**
   * Represents the user's wallet state and logic.
   * Used for managing transactions and wallet-related operations.
   */
  private _wallet?: WalletModel;

  // ---------------------- Private Controller Instance Variables ----------------------
  /**
   * Controller for the executor model.
   * Provides methods and logic to interact with the executor.
   */
  private _executorController?: ExecutorController;

  /**
   * Controller for the transaction history model.
   * Provides methods and logic to interact with the transaction logs.
   */
  private _transactionHistoryController?: TransactionHistoryController;

  /**
   * Controller for the virtualization unit model.
   * Provides methods and logic to interact with the virtualization unit.
   */
  private _virtualizationUnitController?: VirtualizationUnitController;

  /**
   * Controller for the wallet model.
   * Provides methods and logic to manage the user's wallet.
   */
  private _walletController?: WalletController;

  // ---------------------- Private Provider Instance Variable ----------------------
  /**
   * Instance of the UniversalProvider for blockchain interactions.
   * Facilitates transactions and other blockchain-related operations.
   */
  private _provider?: UniversalProvider;
  // ---------------------- Private Utility Variables ----------------------
  /**
   * An instance of the ChainsAtlasGOApi class.
   *
   * This private member is responsible for interfacing with the ChainsAtlas GO API.
   * It provides methods to authenticate the client and generate bytecode structure
   * compatible with ChainsAtlas Virtualization Unit.
   *
   * @private
   * @type {ChainsAtlasGOApi}
   */
  private _api = new ChainsAtlasGOApi();

  /**
   * Represents a map of views available for the extension.
   * Used to manage and render different views within the extension.
   */
  private _viewMap: Partial<ViewMap> = {};

  /**
   * Utility for generating view states.
   * Helps in creating the state of the view based on model data.
   */
  private _viewStateGenerator?: ViewStateGenerator;

  // ---------------------- Constructor ----------------------
  /**
   * Constructs a ChainsAtlasGO instance.
   * Sets up the necessary models, controllers, and utilities based on the provided context.
   *
   * @param _context - Context of the VS Code extension.
   */
  constructor(private readonly _context: ExtensionContext) {}

  // ---------------------- Public Methods ----------------------
  /**
   * Adds a view to the ChainsAtlasGO instance.
   *
   * This method ensures necessary members are initialized, validates the view type,
   * and then sets up the corresponding controller for the provided view.
   *
   * @public
   * @method
   * @async
   * @param {WebviewView} view - The webview view to be added.
   * @returns {Promise<void>} A promise that resolves when the view is added and the corresponding controller is initialized.
   * @throws {Error} Throws an error if any of the required members are not initialized or if the view type is invalid.
   */
  public addView = async (view: WebviewView): Promise<void> =>
    withErrorHandling(() => {
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
            break;
          default:
            break;
        }
      }
    })();

  /**
   * Disposes resources and connections when the extension is deactivated.
   *
   * This method ensures the provider and wallet are initialized, then disconnects them to release resources.
   *
   * @public
   * @async
   * @returns {Promise<void>} A promise that resolves when the disconnection is complete.
   * @throws {Error} Throws an error if the provider or wallet fails to disconnect.
   */
  public dispose = async (): Promise<void> =>
    withErrorHandling(async () => {
      if (
        this._ensureInitialized(
          PrivateMemberKey.PROVIDER,
          PrivateMemberKey.WALLET,
        )
      ) {
        await this._wallet.disconnect();
        await this._provider.disconnect();
      }

      if (
        this._ensureInitialized(
          PrivateMemberKey.EXECUTOR_CONTROLLER,
          PrivateMemberKey.TRANSACTION_HISTORY_CONTROLLER,
          PrivateMemberKey.VIRTUALIZATION_UNIT_CONTROLLER,
          PrivateMemberKey.WALLET_CONTROLLER,
        )
      ) {
        this._executorController.off(ControllerEvent.SYNC, this._syncView);
        this._transactionHistoryController.off(
          ControllerEvent.SYNC,
          this._syncView,
        );
        this._virtualizationUnitController.off(
          ControllerEvent.SYNC,
          this._syncView,
        );
        this._walletController.off(ControllerEvent.SYNC, this._syncView);
      }
    })();

  /**
   * Initializes the ChainsAtlasGOClient instance.
   *
   * This method sets up the provider using the UniversalProvider's `init` method with necessary metadata.
   * It also initializes models for the executor, transaction history, virtualization unit, and wallet.
   * Additionally, a view state generator is set up using the initialized models.
   *
   * @public
   * @async
   * @returns {Promise<void>} A promise that resolves when the initialization is complete.
   * @throws {Error} Throws an error if the UniversalProvider fails to initialize or any models fail to instantiate.
   */
  public init = async (): Promise<void> =>
    withErrorHandling(async () => {
      this._provider = await UniversalProvider.init({
        projectId: WALLETCONNECT_PROJECT_ID,
        metadata: {
          description: METADATA.DESCRIPTION,
          icons: METADATA.ICONS,
          name: METADATA.NAME,
          url: METADATA.URL,
        },
      });
      this._api = new ChainsAtlasGOApi();
      this._executor = new ExecutorModel();
      this._transactionHistory = new TransactionHistoryModel();
      this._virtualizationUnit = new VirtualizationUnitModel();
      this._wallet = new WalletModel(this._provider);
      this._viewStateGenerator = new ViewStateGenerator(
        this._api,
        this._executor,
        this._transactionHistory,
        this._virtualizationUnit,
        this._wallet,
      );
    })();

  // ---------------------- Private Methods - Utilities ----------------------
  /**
   * Ensures that the specified private members are initialized.
   *
   * Iterates through the provided keys of private members and checks if each member is initialized.
   * If any of the specified members are not initialized, an error is thrown.
   *
   * @private
   * @param {...PrivateMemberKey[]} keys - An array of keys representing the private members to check.
   * @returns {boolean} Returns true if all specified members are initialized, otherwise throws an error.
   * @throws {Error} Throws an error if any of the specified private members are not initialized.
   */
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

  /**
   * Initializes the ExecutorController.
   *
   * Creates a new instance of the ExecutorController, using the provided webview and model map.
   * Additionally, it attaches a "sync" event listener to the controller that triggers the `_syncView` method.
   *
   * @private
   * @param {Webview} webview - The Webview instance for the ExecutorController.
   * @param {ExecutorControllerModelMap} modelMap - The model mapping for the ExecutorController.
   */
  private _initExecutorController = (
    webview: Webview,
    modelMap: ExecutorControllerModelMap,
  ) => {
    this._executorController = new ExecutorController(
      webview,
      this._context.subscriptions,
      modelMap,
      this._api,
    );
    this._executorController.on(ControllerEvent.SYNC, this._syncView);
  };

  /**
   * Initializes the TransactionHistoryController.
   *
   * Creates a new instance of the TransactionHistoryController using the provided webview.
   * Additionally, it attaches a "sync" event listener to the controller that triggers the `_syncView` method.
   *
   * @private
   * @param {Webview} webview - The Webview instance for the TransactionHistoryController.
   */
  private _initTransactionHistoryController = (webview: Webview) => {
    this._transactionHistoryController = new TransactionHistoryController(
      webview,
      this._context.subscriptions,
    );
    this._transactionHistoryController.on("sync", this._syncView);
  };

  /**
   * Initializes the VirtualizationUnitController.
   *
   * Creates a new instance of the VirtualizationUnitController, using the provided webview and model map.
   * Additionally, it attaches a "sync" event listener to the controller that triggers the `_syncView` method.
   *
   * @private
   * @param {Webview} webview - The Webview instance for the VirtualizationUnitController.
   * @param {VirtualizationUnitControllerModelMap} modelMap - The model mapping for the VirtualizationUnitController.
   */
  private _initVirtualizationUnitController = (
    webview: Webview,
    modelMap: VirtualizationUnitControllerModelMap,
  ) => {
    this._virtualizationUnitController = new VirtualizationUnitController(
      webview,
      this._context.subscriptions,
      modelMap,
    );
    this._virtualizationUnitController.on(ControllerEvent.SYNC, this._syncView);
  };

  /**
   * Initializes the WalletController.
   *
   * This method creates a new instance of the WalletController, passing in the necessary parameters,
   * and attaches a "sync" event listener to it which triggers the `_syncView` method.
   *
   * @private
   * @param {Webview} webview - The Webview instance for the WalletController.
   * @param {WalletControllerModelMap} modelMap - The model mapping for the WalletController.
   * @param {UniversalProvider} provider - The UniversalProvider instance for the WalletController.
   */
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
      this._api,
    );
    this._walletController.on(ControllerEvent.SYNC, this._syncView);
  };

  /**
   * Synchronizes the view based on the provided view types.
   *
   * Iterates through the provided view types and sends a postMessage to the corresponding
   * webview with the generated view state. The view state is generated using the `_viewStateGenerator`.
   *
   * @private
   * @async
   * @param {...ViewType[]} viewTypes - An array of view types to be synchronized.
   * @returns {Promise<void>} A promise that resolves when the views have been synchronized.
   * @throws {Error} Throws an error if the view state generator fails to generate a state.
   */
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

export default ChainsAtlasGOClient;
