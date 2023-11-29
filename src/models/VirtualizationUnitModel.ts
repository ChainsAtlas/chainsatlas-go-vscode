import { BrowserProvider, ContractFactory } from "ethers";
import EventEmitter from "events";
import type { ExtensionContext } from "vscode";
import { V_UNIT_ABI, V_UNIT_BYTECODE } from "../constants";
import { VirtualizationUnitModelEvent } from "../enums";
import type { ContractTransactionStatus } from "../types";

/**
 * Represents the model for managing the deployment and interaction with
 * virtualization unit smart contracts.
 *
 * This class provides functionalities for deploying a smart contract, managing
 * its transaction status, and tracking the deployed contracts' addresses.
 *
 * @example
 * const virtualizationUnit = new VirtualizationUnitModel();
 * virtualizationUnit.deploy(gasLimit, provider);
 */
export class VirtualizationUnitModel extends EventEmitter {
  /**
   * An array containing the addresses of the deployed contracts.
   * Each address is expected to be a valid address string.
   */
  public contracts: string[] = [];

  /**
   * Represents the status of the current contract transaction. This could be
   * any of the states like 'sending', 'sent', 'error', etc.
   */
  public contractTransactionStatus?: ContractTransactionStatus;

  /**
   * The address of the current active deployed contract.
   */
  public currentContract?: string;

  /**
   * Indicates whether the gas estimation for the deployment is in progress.
   */
  public estimating = false;

  /**
   * Represents the estimated gas required for deploying the contract. This
   * value is set after estimating the gas and before the deployment transaction
   * is sent.
   */
  public gasEstimate?: string;

  /**
   * Represents the current active chain. It is the combination of the chain
   * namespace and id, separated by `:`. Example: `eip155:1`.
   */
  private _chainKey?: string;

  /**
   * Initializes a new instance of the `VirtualizationUnitModel` class.
   */
  constructor(private readonly _globalState: ExtensionContext["globalState"]) {
    super();
  }

  /**
   * Estimates the gas required for deploying the virtualization unit contract.
   *
   * @param {BrowserProvider} provider
   * An instance of an ethers provider to interact with the active chain.
   *
   * @returns {Promise<void>}
   * A Promise that resolves when the gas estimation is complete.
   */
  public async estimateGas(provider: BrowserProvider): Promise<void> {
    const data = (
      await new ContractFactory(
        V_UNIT_ABI,
        V_UNIT_BYTECODE,
      ).getDeployTransaction()
    ).data;

    this.gasEstimate = (await provider.estimateGas({ data })).toString();
  }

  /**
   * Deploys the virtualization unit smart contract to the active chain.
   *
   * This method initiates the deployment, estimates the gas required, and sends
   * the transaction. It emits various events during the process to provide
   * real-time feedback.
   *
   * @param gasLimit
   * The gas limit in wei to be used to deploy the contract.
   *
   * @param provider
   * An instance of an ethers provider to interact with the active chain.
   *
   *  @emits {@link VirtualizationUnitModelEvent.UPDATE}
   * Emitted to indicate synchronization with the current state.
   *
   * @emits {@link VirtualizationUnitModelEvent.TRANSACTION_CONFIRMED}
   * Emitted when the deployment of the contract is confirmed.
   *
   * @emits {@link VirtualizationUnitModelEvent.TRANSACTION_ERROR}
   * Emitted when there is an error with the contract deployment.
   */
  public async deploy(
    gasLimit: string,
    provider: BrowserProvider,
  ): Promise<void> {
    try {
      const factory = new ContractFactory(
        V_UNIT_ABI,
        V_UNIT_BYTECODE,
        await provider.getSigner(),
      );

      this.contractTransactionStatus = "sending";
      this.emit(VirtualizationUnitModelEvent.UPDATE);

      const contract = await factory.deploy({ gasLimit });

      this.contractTransactionStatus = "sent";
      this.emit(VirtualizationUnitModelEvent.UPDATE);

      await contract.waitForDeployment();

      const contractAddress = await contract.getAddress();

      this.contractTransactionStatus = undefined;
      this.gasEstimate = undefined;
      this.contracts.push(contractAddress);
      this._globalState.update(
        `vUnitContracts-${this._chainKey}`,
        this.contracts,
      );
      this.currentContract = contractAddress;

      this.emit(VirtualizationUnitModelEvent.TRANSACTION_CONFIRMED);
    } catch (error) {
      this.contractTransactionStatus = undefined;
      this.emit(VirtualizationUnitModelEvent.TRANSACTION_ERROR, error);
    }
  }

  /**
   * Updates the data variables to comply with the current active chain. In case
   * of no chainKey or an invalid chainKey, data variables are set to default
   * values.
   *
   * @param chainKey
   * The key of the chain or network to search for when updating and saving data
   * to the global state. The chainKey is composed by the namespace and id of a
   * chain separated by `:`. Example: `eip155:1`
   */
  public useChain(chainKey?: string): void {
    this.contractTransactionStatus = undefined;
    this.contracts = this._globalState.get(`vUnitContracts-${chainKey}`, []);
    this.currentContract = this.contracts[0];
    this.gasEstimate = undefined;
    this._chainKey = chainKey;
  }
}
