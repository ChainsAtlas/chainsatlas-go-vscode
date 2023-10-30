import TelemetryReporter from "@vscode/extension-telemetry";
import { UniversalProvider } from "@walletconnect/universal-provider";
import { ExtensionContext, window } from "vscode";
import { PROVIDER_OPTIONS } from "./constants";
import { TelemetryEventName } from "./enums";
import { init } from "./helpers";
import { Api, Client } from "./lib";
import { withErrorHandling } from "./utils";

/**
 * @module Extension
 *
 * This module provides the activation logic for the ChainsAtlas GO extension.
 */

/**
 * The Application Insights Key (also known as Instrumentation Key).
 *
 * Not sensitive.
 */
const key = "c5d18b8f-b22a-4c26-a676-2e08ebe92d7a";

/**
 * @instance {@link TelemetryReporter}
 *
 * The {@link TelemetryReporter} module provides a consistent way for extensions
 * to report telemetry over Application Insights. The module respects the user's
 * decision about whether or not to send telemetry data. See telemetry extension
 * guidelines (https://code.visualstudio.com/api/extension-guides/telemetry)
 * for more information on using telemetry in your extension.
 */
export const reporter = new TelemetryReporter(key);

/**
 * Activates the ChainsAtlas GO extension.
 *
 * This asynchronous function is triggered when the extension is activated,
 * i.e., when its functionality is first accessed after the editor starts up.
 * It takes care of initializing the client, setting up view providers,
 * registering event listeners, and pushing necessary entities to the context's
 * subscription list for proper lifecycle management.
 *
 * Additionally, it informs the user about the beta nature of the extension with
 * a disclaimer message.
 *
 * An error message will be displayed to the user if an error is thrown.
 *
 * @param {ExtensionContext} context
 * The context in which the extension operates. It contains utilities to perform
 * operations like storage, retrieve the extension's URI, etc.
 *
 * @returns {Promise<void>}
 * A promise that resolves once the activation process is completed.
 *
 * @example
 * vscode.extensions.getExtension('chainsatlas.chainsatlas-go').activate();
 */
export const activate = async (context: ExtensionContext): Promise<void> => {
  withErrorHandling(async () => {
    reporter.sendTelemetryEvent(TelemetryEventName.EXTENSION_ACTIVATION);

    const provider = await UniversalProvider.init(PROVIDER_OPTIONS);
    const client = new Client(provider);
    const api = new Api();

    init(client, api, context);

    window.showInformationMessage(
      `Disclaimer: By using the beta version of ChainsAtlas GO, you
      acknowledge and understand the potential risks and the unfinished
      state of the product. While we strive to offer a seamless experience,
      unexpected issues might occur. We highly recommend not using the beta
      version for critical tasks and always maintaining backups of your data.`
        .replace(/\s+/g, " ") // To match test mock
        .trim(),
    );

    context.subscriptions.push(client, reporter);
  })();
};

/**
 * Deactivates the ChainsAtlas GO extension.
 *
 * This asynchronous function is triggered when the extension is deactivated.
 */
export const deactivate = (): void => {
  reporter.sendTelemetryEvent(TelemetryEventName.EXTENSION_DEACTIVATION);
};
