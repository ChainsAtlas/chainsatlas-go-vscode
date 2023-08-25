import { ExtensionContext, Uri, window } from "vscode";
import ChainsAtlasGOClient from "./lib/ChainsAtlasGOClient";
import CustomViewProvider from "./lib/CustomViewProvider";
import { ViewType } from "./types";

/**
 * Initializes the ChainsAtlasGO instance.
 *
 * @param {ExtensionContext} context - The context in which the extension operates.
 * This contains utilities to perform operations like storage, retrieve the extension's URI, etc.
 *
 * @returns {Promise<ChainsAtlasGOClient>} Returns a promise that resolves to the initialized ChainsAtlasGO instance.
 */
const initializeChainsAtlasGO = async (
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
const setupViewProviders = (
  extensionUri: Uri,
): Record<ViewType, CustomViewProvider> => {
  const viewProviders: Partial<Record<ViewType, CustomViewProvider>> = {};

  for (const view of Object.values(ViewType)) {
    viewProviders[view] = new CustomViewProvider(extensionUri, view);
  }

  return viewProviders as Record<ViewType, CustomViewProvider>;
};

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
const activate = async (context: ExtensionContext): Promise<void> => {
  try {
    const chainsAtlasGO = await initializeChainsAtlasGO(context);
    const viewProviders = setupViewProviders(context.extensionUri);

    Object.values(viewProviders).forEach((vProvider) => {
      vProvider.register();
      vProvider.on("viewResolved", (view) => chainsAtlasGO.addView(view));
      context.subscriptions.push(vProvider);
    });

    context.subscriptions.push(chainsAtlasGO);
  } catch {
    window.showErrorMessage(`Extension activation failed.`);
  }
};

export { activate };
