import { ExtensionContext, WebviewView } from "vscode";
import { ViewType } from "../enums";
import { Api, Client, Controller, CustomViewProvider } from "../lib";

/**
 * Initializes the view providers for the extension.
 *
 * This function initializes view providers for different types of views defined
 * in `ViewType`.
 *
 * @param extensionUri
 * The unique resource identifier of the extension.
 *
 * @returns An object where each key is a type of view (from `ViewType`) and its
 * corresponding value is the initialized `CustomViewProvider` for that type.
 *
 * @example
 * const viewProviders = initViewProviders(context.extensionUri);
 *
 * @see {@link CustomViewProvider} for details on the view provider .
 * @see {@link ViewType} for details on the supported views.
 */
export const init = async (
  client: Client,
  api: Api,
  context: ExtensionContext,
): Promise<void> => {
  const controller = new Controller(client, api, context.subscriptions);

  for (const type of Object.values(ViewType)) {
    const viewProvider = new CustomViewProvider(context.extensionUri, type);

    viewProvider.once("viewResolved", (view: WebviewView) => {
      controller.addView(view);
    });

    viewProvider.register();

    context.subscriptions.push(viewProvider);
  }
};
