import {
  ExecutorCommand,
  TransactionHistoryCommand,
  VirtualizationUnitCommand,
  WalletCommand,
} from "../enums";
import type { ViewMessageHandler } from "../types";
import * as executorHandlers from "./executorHandlers";
import * as transactionHistoryHandlers from "./transactionHistoryHandlers";
import * as virtualizationUnitHandlers from "./virtualizationUnitHandlers";
import * as walletHandlers from "./walletHandlers";

export const executorCommandHandler: Record<
  ExecutorCommand,
  ViewMessageHandler
> = {
  [ExecutorCommand.CANCEL_COMPILE]:
    executorHandlers[ExecutorCommand.CANCEL_COMPILE],
  [ExecutorCommand.CANCEL_EXECUTION]:
    executorHandlers[ExecutorCommand.CANCEL_EXECUTION],
  [ExecutorCommand.CLEAR_FILE]: executorHandlers[ExecutorCommand.CLEAR_FILE],
  [ExecutorCommand.COMPILE_BYTECODE]:
    executorHandlers[ExecutorCommand.COMPILE_BYTECODE],
  [ExecutorCommand.ESTIMATE_GAS]:
    executorHandlers[ExecutorCommand.ESTIMATE_GAS],
  [ExecutorCommand.EXECUTE_BYTECODE]:
    executorHandlers[ExecutorCommand.EXECUTE_BYTECODE],
  [ExecutorCommand.GET_ACTIVE_FILE]:
    executorHandlers[ExecutorCommand.GET_ACTIVE_FILE],
  [ExecutorCommand.READY]: executorHandlers[ExecutorCommand.READY],
  [ExecutorCommand.SELECT_FILE]: executorHandlers[ExecutorCommand.SELECT_FILE],
};

export const transactionHistoryCommandHandler: Record<
  TransactionHistoryCommand,
  ViewMessageHandler
> = {
  [TransactionHistoryCommand.READY]:
    transactionHistoryHandlers[TransactionHistoryCommand.READY],
};

export const virtualizationUnitCommandHandler: Record<
  VirtualizationUnitCommand,
  ViewMessageHandler
> = {
  [VirtualizationUnitCommand.CHANGE_CONTRACT]:
    virtualizationUnitHandlers[VirtualizationUnitCommand.CHANGE_CONTRACT],
  [VirtualizationUnitCommand.CLEAR_DEPLOYMENT]:
    virtualizationUnitHandlers[VirtualizationUnitCommand.CLEAR_DEPLOYMENT],
  [VirtualizationUnitCommand.DEPLOY]:
    virtualizationUnitHandlers[VirtualizationUnitCommand.DEPLOY],
  [VirtualizationUnitCommand.ESTIMATE_GAS]:
    virtualizationUnitHandlers[VirtualizationUnitCommand.ESTIMATE_GAS],
  [VirtualizationUnitCommand.READY]:
    virtualizationUnitHandlers[VirtualizationUnitCommand.READY],
};

export const walletCommandHandler: Record<WalletCommand, ViewMessageHandler> = {
  [WalletCommand.ADD_CHAIN]: walletHandlers[WalletCommand.ADD_CHAIN],
  [WalletCommand.CONNECT]: walletHandlers[WalletCommand.CONNECT],
  [WalletCommand.DISCONNECT]: walletHandlers[WalletCommand.DISCONNECT],
  [WalletCommand.EDIT_CHAIN]: walletHandlers[WalletCommand.EDIT_CHAIN],
  [WalletCommand.LOGIN]: walletHandlers[WalletCommand.LOGIN],
  [WalletCommand.LOGOUT]: walletHandlers[WalletCommand.LOGOUT],
  [WalletCommand.READY]: walletHandlers[WalletCommand.READY],
};
