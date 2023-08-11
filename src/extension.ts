import { ExtensionContext, window, workspace } from "vscode";
import ChainsAtlasGO from "./lib/ChainsAtlasGO";
import CustomViewProvider from "./lib/CustomViewProvider";

const activate = async (context: ExtensionContext): Promise<void> => {
  const chainsAtlasGO = new ChainsAtlasGO(context);
  await chainsAtlasGO.init();

  const viewProviders = {
    executor: new CustomViewProvider(context.extensionUri, "executor"),
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

  // Prompt user to select a file
  const uris = await window.showOpenDialog({
    canSelectMany: false,
    openLabel: "Open test",
    filters: {
      "JavaScript Files": ["js"],
      // "C++ Files": ["cpp"],
    },
  });

  if (uris && uris.length > 0) {
    const selectedFileUri = uris[0];

    // Read the file content
    const fileData = await workspace.fs.readFile(selectedFileUri);

    // Convert buffer to string
    const fileContent = fileData.toString();

    // Do something with the content, e.g., display it in an information message
    window.showInformationMessage(fileContent);
  } else {
    window.showWarningMessage("No file selected.");
  }
};

export { activate };
