import { window } from "vscode";

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
