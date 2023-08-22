import EventEmitter from "events";
import { FMT_BYTES, FMT_NUMBER, type Web3 } from "web3";
import { V_UNIT_ABI, V_UNIT_BYTECODE } from "../constants";
import { ContractTransactionStatus } from "../types";

class VirtualizationUnit extends EventEmitter {
  public contracts: string[] = [];
  public contractTransactionStatus?: ContractTransactionStatus;
  public currentContract?: string;
  public estimating = false;
  public gasEstimate?: string;

  constructor() {
    super();
  }

  public deploy = async (from: string, web3: Web3): Promise<void> => {
    try {
      this.estimating = true;

      this.emit("sync");

      const contract = new web3.eth.Contract(V_UNIT_ABI);

      const deployment = contract.deploy({ data: V_UNIT_BYTECODE });

      this.gasEstimate = await deployment.estimateGas(
        { from },
        { number: FMT_NUMBER.STR, bytes: FMT_BYTES.HEX },
      );

      this.estimating = false;

      this.emit("gasEstimated");

      const gas = await this._getUserGas();

      deployment
        .send({ from, gas })
        .on("sending", () => {
          this.contractTransactionStatus = "sending";
          this.emit("sync");
        })
        .on("sent", () => {
          this.contractTransactionStatus = "sent";
          this.emit("sync");
        })
        .on("confirmation", ({ receipt }) => {
          this.clearDeployment();

          const { contractAddress } = receipt;

          if (contractAddress) {
            this.contracts.push(contractAddress);
            this.currentContract = contractAddress;

            this.emit("sync");
          }

          throw new Error("Invalid contract address.");
        })
        .on("error", (e) => {
          this.contractTransactionStatus = "error";
          this.emit("sync");

          throw e;
        });
    } catch (e) {
      if (e instanceof Error) {
        throw e;
      }

      throw new Error(JSON.stringify(e));
    }
  };

  public clearDeployment = (): void => {
    this.gasEstimate = undefined;
    this.contractTransactionStatus = undefined;
  };

  // -------------------- Private --------------------

  private _getUserGas = (): Promise<string> => {
    return new Promise((resolve) => {
      this.once("userGasReceived", (gas: string) => {
        resolve(gas);
      });
    });
  };
}

export default VirtualizationUnit;
