import { ExtensionContext } from "vscode";
import ChainsAtlasGO from "./lib/ChainsAtlasGO";
import CustomViewProvider from "./lib/CustomViewProvider";

const activate = async (context: ExtensionContext): Promise<void> => {
  const chainsAtlasGO = new ChainsAtlasGO(context);
  await chainsAtlasGO.init();

  const viewProviders = {
    virtualizationUnit: new CustomViewProvider(
      context.extensionUri,
      "virtualizationUnit",
    ),
    wallet: new CustomViewProvider(context.extensionUri, "wallet"),
  };

  Object.values(viewProviders).forEach((vProvider) => {
    vProvider.register();
    vProvider.on("viewResolved", (view) => chainsAtlasGO.addView(view));
    context.subscriptions.push(vProvider);
  });

  context.subscriptions.push(chainsAtlasGO);
};

export { activate };
