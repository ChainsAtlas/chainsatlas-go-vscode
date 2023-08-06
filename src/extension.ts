import vscode from "vscode";
import ChainsAtlasGO from "./lib/ChainsAtlasGO";
import CustomViewProvider from "./lib/CustomViewProvider";

const waitForViewResolvedEvent = (
  viewProvider: CustomViewProvider,
): Promise<vscode.WebviewView> =>
  new Promise((resolve) => {
    viewProvider.on("viewResolved", (view) => resolve(view));
  });

const activate = (context: vscode.ExtensionContext): void => {
  const walletViewProvider = new CustomViewProvider(
    context.extensionUri,
    "wallet",
  );

  const wallletViewResolved = waitForViewResolvedEvent(walletViewProvider);

  walletViewProvider.register();

  Promise.all([wallletViewResolved]).then(async (views) => {
    const chainsAtlasGO = new ChainsAtlasGO(context, views);
    await chainsAtlasGO.init();

    context.subscriptions.push(chainsAtlasGO);
  });

  context.subscriptions.push(walletViewProvider);
};

export { activate };
