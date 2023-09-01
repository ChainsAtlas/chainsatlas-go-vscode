/**
 * @module Utils
 *
 * This module provides utility functions for the VS Code extension:
 *
 * @see {@link initClient} for details on the `ChainsAtlasGOClient` initialization.
 * @see {@link initViewProviders} for details on the view providers initialization.
 * @see {@link withErrorHandling} for details on error handling.
 */

import { ExtensionContext, Uri, window } from "vscode";
import { ChainsAtlasGOClient, CustomViewProvider } from "./lib";
import { ViewType } from "./types";

/**
 * Initializes the `ChainsAtlasGOClient` instance.
 *
 * This function creates an instance of the `ChainsAtlasGOClient` using the provided context and initializes it.
 *
 * @param context - The context in which the extension operates. Provides utilities
 * to perform operations like storage, retrieve the extension's URI, etc.
 *
 * @returns A promise that resolves to the initialized `ChainsAtlasGO` instance.
 *
 * @example
 * const client = await initClient(context);
 *
 * @see {@link ChainsAtlasGOClient} for details on the client class.
 */
export const initClient = async (
  context: ExtensionContext,
): Promise<ChainsAtlasGOClient> => {
  const client = new ChainsAtlasGOClient(context);
  await client.init();
  return client;
};

/**
 * Initializes the view providers for the extension.
 *
 * This function initializes view providers for different types of views defined in `ViewType`.
 *
 * @param extensionUri - The unique identifier for the extension,
 * used to locate resources within the extension.
 *
 * @returns An object where each key is a type of view (from `ViewType`)
 * and its corresponding value is the initialized `CustomViewProvider` for that type.
 *
 * @example
 * const viewProviders = initViewProviders(context.extensionUri);
 *
 * @see {@link CustomViewProvider} for details on the view provider .
 * @see {@link ViewType} for details on the supported views.
 */
export const initViewProviders = (
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
 * @returns A new async function that wraps the original function.
 *
 * @throws When the wrapper function encounters an error during execution,
 * it displays an error message and returns `undefined`.
 *
 * @example
 * public async init(): Promise<void> {
 *     withErrorHandling(async () => {
 *         // ...method logic
 *     })();
 * }
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
