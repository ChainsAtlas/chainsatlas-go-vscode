import EventEmitter from "events";
import { FMT_BYTES, FMT_NUMBER, type Web3 } from "web3";
import { ERROR_MESSAGE, V_UNIT_ABI, V_UNIT_BYTECODE } from "../constants";
import {
  ContractTransactionStatus,
  VirtualizationUnitModelEvent,
} from "../types";

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
export class VirtualizationUnitModel extends EventEmitter {
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

  public async estimateGas(from: string, web3: Web3): Promise<void> {
    const contract = new web3.eth.Contract(V_UNIT_ABI);

    const deployment = contract.deploy({ data: V_UNIT_BYTECODE });

    this.gasEstimate = await deployment.estimateGas(
      { from },
      { number: FMT_NUMBER.STR, bytes: FMT_BYTES.HEX },
    );
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
  public async deploy(from: string, gas: string, web3: Web3): Promise<void> {
    const contract = new web3.eth.Contract(V_UNIT_ABI);

    const deployment = contract.deploy({ data: V_UNIT_BYTECODE });

    deployment
      .send({ from, gas })
      .on("sending", () => {
        this.contractTransactionStatus = "sending";

        this.emit(VirtualizationUnitModelEvent.UPDATE);
      })
      .on("sent", () => {
        this.contractTransactionStatus = "sent";

        this.emit(VirtualizationUnitModelEvent.UPDATE);
      })
      .on("confirmation", ({ receipt }) => {
        const { contractAddress } = receipt;

        if (!contractAddress) {
          this.contractTransactionStatus = "error";

          this.emit(
            VirtualizationUnitModelEvent.TRANSACTION_ERROR,
            new Error(ERROR_MESSAGE.INVALID_CONTRACT_ADDRESS),
          );
        } else {
          this.contractTransactionStatus = undefined;
          this.gasEstimate = undefined;
          this.contracts.push(contractAddress);
          this.currentContract = contractAddress;

          this.emit(VirtualizationUnitModelEvent.TRANSACTION_CONFIRMED);
        }
      })
      .on("error", (error) => {
        this.contractTransactionStatus = "error";

        this.emit(VirtualizationUnitModelEvent.TRANSACTION_ERROR, error);
      });
  }
}
