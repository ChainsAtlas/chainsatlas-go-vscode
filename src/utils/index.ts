import { window } from "vscode";

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
