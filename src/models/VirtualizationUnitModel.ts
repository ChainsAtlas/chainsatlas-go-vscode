import EventEmitter from "events";
import { FMT_BYTES, FMT_NUMBER, type Web3 } from "web3";
import { ERROR_MESSAGE, V_UNIT_ABI, V_UNIT_BYTECODE } from "../constants";
import {
  ContractTransactionStatus,
  VirtualizationUnitModelEvent,
} from "../types";
import { withErrorHandling } from "../utils";

/**
 * Represents the model for managing the deployment and interaction with
 * Ethereum smart contracts, specifically the virtualization unit.
 *
 * This class provides functionalities for deploying a smart contract, managing
 * its transaction status, and tracking the deployed contracts' addresses.
 *
 * @example
 * const virtualizationUnit = new VirtualizationUnitModel();
 * virtualizationUnit.deploy('0xYourAddress', web3Instance);
 */
class VirtualizationUnitModel extends EventEmitter {
  /**
   * An array containing the Ethereum addresses of the deployed contracts.
   * Each address is expected to be a valid Ethereum address string.
   */
  public contracts: string[] = [];

  /**
   * Represents the status of the current contract transaction. This could be
   * any of the states like 'sending', 'sent', 'error', etc.
   */
  public contractTransactionStatus?: ContractTransactionStatus;

  /**
   * The Ethereum address of the current active or recently deployed contract.
   */
  public currentContract?: string;

  /**
   * Indicates whether the gas estimation for the deployment is currently in progress.
   */
  public estimating = false;

  /**
   * Represents the estimated gas required for deploying the contract. This value
   * is set after estimating the gas and before the deployment transaction is sent.
   */
  public gasEstimate?: string;

  /**
   * Initializes a new instance of the `VirtualizationUnitModel` class.
   *
   * Upon instantiation, the `contracts` property is initialized as an empty array.
   */
  constructor() {
    super();
  }

  /**
   * Deploys the virtualization unit smart contract to the active chain.
   *
   * This method initiates the deployment, estimates the gas required, and sends
   * the transaction. It emits various events during the process to provide real-time feedback.
   *
   * @param from - The account address from which the deployment transaction will be sent.
   * @param web3 - An instance of web3.js library to interact with the active chain.
   */
  public deploy = async (from: string, web3: Web3): Promise<void> =>
    withErrorHandling(async () => {
      this.estimating = true;

      this.emit(VirtualizationUnitModelEvent.SYNC);

      const contract = new web3.eth.Contract(V_UNIT_ABI);

      const deployment = contract.deploy({ data: V_UNIT_BYTECODE });

      this.gasEstimate = await deployment.estimateGas(
        { from },
        { number: FMT_NUMBER.STR, bytes: FMT_BYTES.HEX },
      );

      this.estimating = false;

      this.emit(VirtualizationUnitModelEvent.WAITING_GAS);

      const gas = await this._getGas();

      deployment
        .send({ from, gas })
        .on("sending", () => {
          this.contractTransactionStatus = "sending";
          this.emit(VirtualizationUnitModelEvent.SYNC);
        })
        .on("sent", () => {
          this.contractTransactionStatus = "sent";
          this.emit(VirtualizationUnitModelEvent.SYNC);
        })
        .on("confirmation", ({ receipt }) => {
          this.emit(VirtualizationUnitModelEvent.DEPLOYMENT_CONFIRMED);
          this.clearDeployment();

          const { contractAddress } = receipt;

          if (contractAddress) {
            this.contracts.push(contractAddress);
            this.currentContract = contractAddress;

            this.emit(VirtualizationUnitModelEvent.SYNC);
          }

          throw new Error(ERROR_MESSAGE.INVALID_CONTRACT_ADDRESS);
        })
        .on("error", (e) => {
          this.contractTransactionStatus = "error";
          this.emit(VirtualizationUnitModelEvent.SYNC);

          throw e;
        });
    })();

  /**
   * Clears the deployment-related properties, resetting them to their initial states.
   *
   * This method is useful after a successful deployment or in scenarios where the deployment
   * process needs to be reset.
   */
  public clearDeployment = (): void => {
    this.gasEstimate = undefined;
    this.contractTransactionStatus = undefined;
  };

  // -------------------- Private --------------------
  /**
   * A private method that waits for the `GAS_RECEIVED` event to be emitted and
   * then resolves the promise with the received gas value.
   *
   * @returns A promise that resolves with the received gas value as a string.
   */
  private _getGas = (): Promise<string> => {
    return new Promise((resolve) => {
      this.once(VirtualizationUnitModelEvent.GAS_RECEIVED, (gas: string) => {
        resolve(gas);
      });
    });
  };
}

export default VirtualizationUnitModel;
