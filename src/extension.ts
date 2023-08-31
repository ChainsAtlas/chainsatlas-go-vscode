import { ExtensionContext, window } from "vscode";
import { initializeChainsAtlasGO, setupViewProviders } from "./utils";

/**
 * Activates the extension.
 *
 * This function is called when the extension is activated, i.e.,
 * when its functionality is first accessed after the editor starts up.
 * The function sets up necessary initializations for the extension to function properly.
 *
 * @param {ExtensionContext} context - The context in which the extension operates.
 * Contains utilities to perform operations like storage, retrieve the extension's URI, etc.
 *
 * @returns {Promise<void>} Returns a promise that resolves when the activation process is complete.
 */
export const activate = async (context: ExtensionContext): Promise<void> => {
  try {
    const chainsAtlasGO = await initializeChainsAtlasGO(context);
    const viewProviders = setupViewProviders(context.extensionUri);

    Object.values(viewProviders).forEach((vProvider) => {
      vProvider.register();
      vProvider.on("viewResolved", (view) => chainsAtlasGO.addView(view));
      context.subscriptions.push(vProvider);
    });

    context.subscriptions.push(chainsAtlasGO);

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
