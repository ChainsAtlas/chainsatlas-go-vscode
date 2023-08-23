import { ExtensionContext, Uri, window } from "vscode";
import { VIEWS } from "./constants";
import ChainsAtlasGO from "./lib/ChainsAtlasGO";
import CustomViewProvider from "./lib/CustomViewProvider";
import { ViewType } from "./types";

/**
 * Initializes the ChainsAtlasGO instance.
 * @param context - The extension context.
 * @returns The initialized ChainsAtlasGO instance.
 */
const initializeChainsAtlasGO = async (
  context: ExtensionContext,
): Promise<ChainsAtlasGO> => {
  const chainsAtlasGO = new ChainsAtlasGO(context);
  await chainsAtlasGO.init();
  return chainsAtlasGO;
};

/**
 * Sets up the view providers for the extension.
 * @param extensionUri - The extension URI.
 * @returns An object containing the initialized view providers.
 */
const setupViewProviders = (
  extensionUri: Uri,
): Record<ViewType, CustomViewProvider> => {
  const viewProviders: Partial<Record<ViewType, CustomViewProvider>> = {};

  for (const view of VIEWS) {
    viewProviders[view] = new CustomViewProvider(extensionUri, view);
  }

  return viewProviders as Record<ViewType, CustomViewProvider>;
};

/**
 * Activates the extension.
 * @param context - The extension context.
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
  } catch (e) {
    if (e instanceof Error) {
      window.showErrorMessage(`Extension activation failed: ${e.message}`);
    } else {
      window.showErrorMessage(
        `Unexpected error during activation: ${JSON.stringify(e)}`,
      );
    }
  }
};

export { activate };
