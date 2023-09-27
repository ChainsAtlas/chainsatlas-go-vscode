import { WebviewView } from "vscode";
import { Api, Client, Controller } from "../lib";
import { ExecutorModel, VirtualizationUnitModel } from "../models";
import { ExecutorView, VirtualizationUnitView } from "../views";
import { ExecutorCommand, ExecutorViewState } from "./executor.types";
import { SettingsCommand, SettingsViewState } from "./settings.type";
import {
  TransactionHistoryCommand,
  TransactionHistoryViewState,
} from "./transactionHistory.type";
import {
  VirtualizationUnitCommand,
  VirtualizationUnitViewState,
} from "./virtualizationUnit.type";
import { WalletCommand, WalletViewState } from "./wallet.type";

/**
 * Represents required chain data for the {@link WalletModel} to work correctly
 * with `@walletconnect/universal-provider`
 */
export type Chain = {
  namespace: string;
  id: number;
  name: string;
  transactionExplorerUrl: string;
  httpRpcUrl: string;
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
 * Enum representing common {@link Controller} subclasses events.
 */
export enum ControllerEvent {
  SYNC = "sync",
}

/**
 * Enum representing gas options for the {@link VirtualizationUnitView} and
 * {@link ExecutorView} transaction forms.
 */
export enum GasOption {
  BUFFER = "buffer",
  CUSTOM = "custom",
  ESTIMATE = "estimate",
}

/**
 * Represents all command enums to facilitate the {@link Controller} management
 * of handlers.
 */
export type ViewCommand =
  | ExecutorCommand
  | SettingsCommand
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
  | SettingsViewState
  | TransactionHistoryViewState
  | VirtualizationUnitViewState
  | Promise<WalletViewState>;

/**
 * Enum representing types of views to avoid hardcoded string values when
 * managing view's initialization, state and communication.
 */
export enum ViewType {
  EXECUTOR = "executor",
  SETTINGS = "settings",
  TRANSACTION_HISTORY = "transactionHistory",
  VIRTUALIZATION_UNIT = "virtualizationUnit",
  WALLET = "wallet",
}

/**
 * Represents the VS Code API for a webview view to communicate with a
 * {@link Controller} subclass.
 */
export type VsCodeApi = {
  postMessage(message: ViewMessage): void;
};
