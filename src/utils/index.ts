import { ExtensionContext, Uri, window } from "vscode";
import { ChainsAtlasGOClient, CustomViewProvider } from "../lib";
import { ViewType } from "../types";

/**
 * Initializes the ChainsAtlasGO instance.
 *
 * @param {ExtensionContext} context - The context in which the extension operates.
 * This contains utilities to perform operations like storage, retrieve the extension's URI, etc.
 *
 * @returns {Promise<ChainsAtlasGOClient>} Returns a promise that resolves to the initialized ChainsAtlasGO instance.
 */
export const initializeChainsAtlasGO = async (
  context: ExtensionContext,
): Promise<ChainsAtlasGOClient> => {
  const client = new ChainsAtlasGOClient(context);
  await client.init();
  return client;
};

/**
 * Sets up the view providers for the extension.
 *
 * @param {Uri} extensionUri - The unique identifier for the extension,
 * typically used to locate resources within the extension.
 *
 * @returns {Record<ViewType, CustomViewProvider>} Returns an object where each key is a type of view (from `ViewType`)
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
 * If the wrapped function throws an error, this error is caught and displayed
 * as an error message in the VS Code window. The function then returns `undefined`.
 *
 * @template T - A generic type that extends a function type. This allows the
 * `withErrorHandling` function to wrap functions with any signature.
 *
 * @param {T} func - The function to be wrapped with error handling.
 *
 * @returns {(args: Parameters<T>) => Promise<ReturnType<T> | undefined>}
 * A new async function that wraps the original function. When this new function
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
