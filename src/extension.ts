import { ExtensionContext, window } from "vscode";
import { initClient, initViewProviders } from "./Utils";

/**
 * @module Extension
 *
 * This module provides the activation logic for the ChainsAtlas GO extension.
 */

/**
 * Activates the ChainsAtlas GO extension.
 *
 * This asynchronous function is triggered when the extension is activated,
 * i.e., when its functionality is first accessed after the editor starts up.
 * It takes care of initializing the client, setting up view providers,
 * registering event listeners, and pushing necessary entities to the context's
 * subscription list for proper lifecycle management.
 *
 * Additionally, it informs the user about the beta nature of the extension with a
 * disclaimer message.
 *
 * If there's any error during activation, an error message will be displayed to the user.
 *
 * @param {ExtensionContext} context - The context in which the extension operates.
 *                                     It contains utilities to perform operations like
 *                                     storage, retrieve the extension's URI, etc.
 *
 * @returns {Promise<void>} A promise that resolves once the activation process is completed.
 *
 * @throws Will show an error message if the activation process fails.
 *
 * @example
 * vscode.extensions.getExtension('chainsatlas.chainsatlas-go').activate();
 */
export const activate = async (context: ExtensionContext): Promise<void> => {
  try {
    const client = await initClient(context);
    const viewProviders = initViewProviders(context.extensionUri);

    for (const vProvider of Object.values(viewProviders)) {
      vProvider.register();
      vProvider.once("viewResolved", (view) => client.addView(view));
      context.subscriptions.push(vProvider);
    }

    context.subscriptions.push(client);

    window.showInformationMessage(
      `Disclaimer: By using the beta version of ChainsAtlas GO, you acknowledge and 
  understand the potential risks and the unfinished state of the product. While we 
  strive to offer a seamless experience, unexpected issues might occur. We highly 
  recommend not using the beta version for critical tasks and always maintaining 
  backups of your data.`,
    );
  } catch {
    window.showErrorMessage(`Extension activation failed.`);
  }
};
