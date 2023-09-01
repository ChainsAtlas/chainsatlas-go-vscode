import { ExtensionContext, Uri, window } from "vscode";
import { ChainsAtlasGOClient, CustomViewProvider } from "../lib";
import { ViewType } from "../types";

/**
 * @module Utilities
 *
 * This module provides utility functions for the VS Code extension:
 *
 * - `initializeClient`: Initializes the `ChainsAtlasGOClient` instance for the extension.
 * - `setupViewProviders`: Sets up view providers for different types of views.
 * - `withErrorHandling`: A higher-order function that wraps another function with error handling capabilities.
 *
 * @see {@link ChainsAtlasGOClient} for details on the client initialization.
 * @see {@link CustomViewProvider} for details on the view provider.
 * @see {@link ViewType} for the different types of views that can be set up.
 */

/**
 * Initializes the `ChainsAtlasGOClient` instance.
 *
 * @remarks
 * This function creates an instance of the `ChainsAtlasGOClient` using the provided context and initializes it.
 *
 * @param context - The context in which the extension operates.
 * Provides utilities to perform operations like storage, retrieve the extension's URI, etc.
 *
 * @returns A promise that resolves to the initialized `ChainsAtlasGO` instance.
 */
export const initializeClient = async (
  context: ExtensionContext,
): Promise<ChainsAtlasGOClient> => {
  const client = new ChainsAtlasGOClient(context);
  await client.init();
  return client;
};

/**
 * Sets up the view providers for the extension.
 *
 * This function initializes view providers for different types of views defined in `ViewType`.
 *
 * @param extensionUri - The unique identifier for the extension,
 * used to locate resources within the extension.
 *
 * @returns An object where each key is a type of view (from `ViewType`)
 * and its corresponding value is the initialized view provider for that type.
 */
export const setupViewProviders = (
  extensionUri: Uri,
): Record<ViewType, CustomViewProvider> => {
  const viewProviders: Partial<Record<ViewType, CustomViewProvider>> = {};

  for (const view of Object.values(ViewType)) {
    viewProviders[view] = new CustomViewProvider(extensionUri, view);
  }

  return viewProviders as Record<ViewType, CustomViewProvider>;
};

/**
 * A higher-order function that wraps another function with error handling.
 *
 * When the wrapped function throws an error, this error is caught and displayed
 * as an error message in the VS Code window. The function then returns `undefined`.
 *
 * @template T - A generic type that extends a function type, allowing this function
 * to wrap functions with any signature.
 *
 * @param func - The function to be wrapped with error handling.
 *
 * @returns A new async function that wraps the original function. When this new function
 * encounters an error during execution, it displays an error message and returns `undefined`.
 */
export const withErrorHandling = <T extends (...args: any[]) => any>(
  func: T,
) => {
  return async (...args: Parameters<T>): Promise<ReturnType<T> | undefined> => {
    try {
      return await func(...args);
    } catch (error) {
      if (error instanceof Error) {
        window.showErrorMessage(error.message);
      } else {
        window.showErrorMessage(JSON.stringify(error));
      }
      return undefined;
    }
  };
};
