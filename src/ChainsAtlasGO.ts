import { Chain, bscTestnet, mainnet, sepolia } from "@wagmi/chains";
import Client from "@walletconnect/sign-client";
import { SessionTypes } from "@walletconnect/types";
import UniversalProvider, {
  ProviderAccounts,
} from "@walletconnect/universal-provider";
import BigNumber from "bignumber.js";
import vscode from "vscode";
import Web3, { FMT_BYTES, FMT_NUMBER } from "web3";
import executor from "./sdk/executor";

class ChainsAtlasGO {
  public accounts: ProviderAccounts = [];

  private _panel: vscode.WebviewPanel;
  private _walletConnectProjectId: string;
  private _client!: Client;
  private _universalProvider!: UniversalProvider;
  private _web3Provider!: Web3;

  constructor(walletConnectProjectId: string, panel: vscode.WebviewPanel) {
    this._walletConnectProjectId = walletConnectProjectId;
    this._panel = panel;
  }

  public async initializeWalletConnectClient(): Promise<void> {
    this._universalProvider = await UniversalProvider.init({
      logger: "info",
      projectId: this._walletConnectProjectId,
      metadata: {
        name: "React App",
        description: "React App for WalletConnect",
        url: "https://walletconnect.com/",
        icons: ["https://avatars.githubusercontent.com/u/37784886"],
      },
    });

    this._client = this._universalProvider.client;

    this._addUniversalProviderEventListeners();

    await this._initializeWeb3Provider();

    this._deployContract();
  }

  private _addUniversalProviderEventListeners() {
    if (!this._universalProvider) {
      throw new Error("Universal provider not initiallized.");
    }

    this._universalProvider.on("display_uri", async (uri: string) => {
      console.log("EVENT", "QR Code Modal open");
      this._panel.webview.postMessage({ command: "openModal", value: uri });
    });

    this._universalProvider.on(
      "session_ping",
      ({ id, topic }: { id: number; topic: string }) => {
        console.log("EVENT", "session_ping");
        console.log(id, topic);
      },
    );

    this._universalProvider.on(
      "session_event",
      ({ event, chainId }: { event: any; chainId: string }) => {
        console.log("EVENT", "session_event");
        console.log(event, chainId);
      },
    );

    this._universalProvider.on(
      "session_update",
      ({ topic, session }: { topic: string; session: SessionTypes.Struct }) => {
        console.log("EVENT", "session_updated", session);
      },
    );

    this._universalProvider.on(
      "session_delete",
      ({ id, topic }: { id: number; topic: string }) => {
        console.log("EVENT", "session_deleted");
        console.log(id, topic);
      },
    );
  }

  private async _initializeWeb3Provider() {
    const wagmiChains = [bscTestnet, mainnet, sepolia];

    // const chains = wagmiChains.map((chain) => `eip155:${chain.id}`);

    const rpcMap = wagmiChains.reduce(
      (rpcs: Record<string, string>, chain: Chain) => {
        rpcs[chain.id] = chain.rpcUrls.default.http[0];
        return rpcs;
      },
      {},
    );

    const session = await this._universalProvider.connect({
      namespaces: {
        eip155: {
          methods: [
            "eth_sendTransaction",
            "eth_signTransaction",
            "eth_sign",
            "personal_sign",
            "eth_signTypedData",
          ],
          chains: ["eip155:11155111"],
          events: ["chainChanged", "accountsChanged"],
          rpcMap,
        },
      },
    });

    console.log("connected session: ", session);

    this._web3Provider = new Web3(this._universalProvider);
    this.accounts = await this._universalProvider.enable();
    console.log("accounts: ", this.accounts);

    this._panel.webview.postMessage({ command: "closeModal", value: "" });
  }

  private async _deployContract() {
    const chainId = await this._web3Provider.eth.getChainId({
      number: FMT_NUMBER.NUMBER,
      bytes: FMT_BYTES.HEX,
    });
    if (chainId !== 1) {
      const contract = new this._web3Provider.eth.Contract(executor.interface);
      console.log("contract instance created");

      const contractDeployment = contract.deploy({ data: executor.bytecode });
      console.log("contract deployed");

      const gasEstimate = await contractDeployment.estimateGas({
        from: this.accounts[0],
      });
      console.log("gas estimated");

      const gasWithBuffer = Math.floor(
        new BigNumber(gasEstimate.toString()).multipliedBy(1.15).toNumber(),
      ).toString();
      console.log("gas buffer calculated");
      const contractInstance = await contractDeployment.send({
        from: this.accounts[0],
        gas: gasWithBuffer,
      });

      console.log("contract sent");
    } else {
      console.log("did not work. chain Id: ", chainId);
    }
  }
}

export default ChainsAtlasGO;
