import EventEmitter from "events";
import { FMT_BYTES, FMT_NUMBER, type Web3 } from "web3";
import { V_UNIT_ABI, V_UNIT_BYTECODE } from "../constants";

class VirtualizationUnit extends EventEmitter {
  public contracts: string[] = [];
  public currentContract?: string;
  public gasEstimate?: string;

  private _controller = new AbortController();

  constructor() {
    super();
  }

  public async deploy(from: string, web3: Web3): Promise<void> {
    try {
      this._controller.abort();

      this._controller.signal.addEventListener("abort", () => {
        this.clearDeployment();

        throw new Error("Aborted!");
      });

      const contract = new web3.eth.Contract(V_UNIT_ABI);

      console.log("Contract created");

      const deployment = contract.deploy({
        data: V_UNIT_BYTECODE,
      });

      console.log("contract deployed");

      this.gasEstimate = await deployment.estimateGas(
        { from },
        { number: FMT_NUMBER.STR, bytes: FMT_BYTES.HEX },
      );

      this.emit("contractDeployed");

      const gas = await this._getUserGas();

      const contractInstance = await deployment.send({ from, gas });

      contractInstance;

      const { address } = contractInstance.options;

      if (address) {
        this.contracts.push(address);
        this.currentContract = address;
      } else {
        throw new Error("Invalid contract address.");
      }

      this.clearDeployment();

      this.emit("contractSent");
    } catch (e) {
      if (e instanceof Error) {
        throw e;
      }

      throw new Error(JSON.stringify(e));
    }
  }

  public clearDeployment(): void {
    this.gasEstimate = undefined;
  }

  // -------------------- Private --------------------

  private _getUserGas(): Promise<string> {
    return new Promise((resolve) => {
      this.once("userGasReceived", (gas: string) => {
        resolve(gas);
      });
    });
  }
}

export default VirtualizationUnit;
