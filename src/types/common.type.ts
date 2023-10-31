import type { WebviewView } from "vscode";
import type {
  ExecutorCommand,
  TransactionHistoryCommand,
  ViewType,
  VirtualizationUnitCommand,
  WalletCommand,
} from "../enums";
import type { Api, Client, Controller } from "../lib";
import type {
  ExecutorModel,
  VirtualizationUnitModel,
  WalletModel,
} from "../models";
import type { ExecutorViewState } from "./executor.type";
import type { TransactionHistoryViewState } from "./transactionHistory.type";
import type { VirtualizationUnitViewState } from "./virtualizationUnit.type";
import type { WalletViewState } from "./wallet.type";

/**
 * Represents valid chain data to enable the {@link WalletModel} to connect
 * correctly.
 */
export type Chain = {
  namespace: string;
  id: number;
  name: string;
  httpRpcUrl: string;
  transactionExplorerUrl: string;
};

/**
 * Represents the status of web3.js contract transactions of the
 * {@link VirtualizationUnitModel} and {@link ExecutorModel}.
 *
 * The status is emitted to their respective controllers so they can update
 * their respective views accordingly.
 */
export type ContractTransactionStatus =
  | "confirmation"
  | "error"
  | "receipt"
  | "sending"
  | "sent"
  | "transactionHash";

/**
 * Represents all command enums to facilitate the {@link Controller} management
 * of handlers.
 */
export type ViewCommand =
  | ExecutorCommand
  | TransactionHistoryCommand
  | VirtualizationUnitCommand
  | WalletCommand;

/**
 * Represents a map of webview views used to manage each view's Controller
 * initialization and state sync.
 */
export type ViewMap = Record<ViewType, WebviewView>;

/**
 * Represents a message from any webview view to a {@link Controller} subclass.
 *
 * Stringify `value` for values of types other than `string` and parse them in
 * the respective Controller for consistency.
 */
export type ViewMessage = {
  command: ViewCommand;
  data?: string;
};

/**
 * Represents a handler function required to manage commmunications and
 * operations between models and their respective views.`
 */
export type ViewMessageHandler = (
  data: string | undefined,
  update: (...viewTypes: ViewType[]) => Promise<void>,
  client: Client,
  api: Api,
) => void | Promise<void>;

/**
 * Represents the union type of all view state generators.
 */
export type ViewStateGenerator = (
  client: Client,
  api: Api,
) =>
  | ExecutorViewState
  | TransactionHistoryViewState
  | VirtualizationUnitViewState
  | Promise<WalletViewState>;

/**
 * Represents the VS Code API for a webview view to communicate with a
 * {@link Controller} subclass.
 */
export type VsCodeApi = {
  postMessage(message: ViewMessage): void;
};
