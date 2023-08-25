import { window } from "vscode";

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
const withErrorHandling = <T extends (...args: any[]) => any>(func: T) => {
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

export { withErrorHandling };
