import type { ContractAbi } from "web3";

const vUnitAbi: ContractAbi = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "bytecodeAddress",
        type: "address",
      },
    ],
    name: "ContractDeployed",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_contract",
        type: "address",
      },
    ],
    name: "getRuntimeReturn",
    outputs: [
      {
        internalType: "bytes",
        name: "",
        type: "bytes",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes",
        name: "bytecode",
        type: "bytes",
      },
    ],
    name: "runBytecode",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
];

const vUnitBytecode =
  "608060405234801561001057600080fd5b50610523806100206000396000f3fe608060405234801561001057600080fd5b50600436106100365760003560e01c80632fdf8a9f1461003b578063a32cc87c1461006b575b600080fd5b61005560048036038101906100509190610213565b61009b565b6040516100629190610303565b60405180910390f35b6100856004803603810190610080919061023c565b6100ad565b60405161009291906102e8565b60405180910390f35b60606100a68261016b565b9050919050565b6000808251602084016000f09050600073ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff16141561012b576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161012290610325565b60405180910390fd5b7f8ffcdc15a283d706d38281f500270d8b5a656918f555de0913d7455e3e6bc1bf8160405161015a91906102e8565b60405180910390a180915050919050565b6060813b6040519150601f19601f602083010116820160405280825280600060208401853c50919050565b60006101a96101a48461036a565b610345565b9050828152602081018484840111156101c157600080fd5b6101cc8482856103fa565b509392505050565b6000813590506101e3816104d6565b92915050565b600082601f8301126101fa57600080fd5b813561020a848260208601610196565b91505092915050565b60006020828403121561022557600080fd5b6000610233848285016101d4565b91505092915050565b60006020828403121561024e57600080fd5b600082013567ffffffffffffffff81111561026857600080fd5b610274848285016101e9565b91505092915050565b610286816103c8565b82525050565b60006102978261039b565b6102a181856103a6565b93506102b1818560208601610409565b6102ba8161049c565b840191505092915050565b60006102d26018836103b7565b91506102dd826104ad565b602082019050919050565b60006020820190506102fd600083018461027d565b92915050565b6000602082019050818103600083015261031d818461028c565b905092915050565b6000602082019050818103600083015261033e816102c5565b9050919050565b600061034f610360565b905061035b828261043c565b919050565b6000604051905090565b600067ffffffffffffffff8211156103855761038461046d565b5b61038e8261049c565b9050602081019050919050565b600081519050919050565b600082825260208201905092915050565b600082825260208201905092915050565b60006103d3826103da565b9050919050565b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b82818337600083830152505050565b60005b8381101561042757808201518184015260208101905061040c565b83811115610436576000848401525b50505050565b6104458261049c565b810181811067ffffffffffffffff821117156104645761046361046d565b5b80604052505050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b6000601f19601f8301169050919050565b7f436f6e7472616374206372656174696f6e206661696c65640000000000000000600082015250565b6104df816103c8565b81146104ea57600080fd5b5056fea2646970667358221220922ec0bb8d08ef926ec84ffcb7c0d7e4be47d4fa02c1a386ecdf703e8dd2136c64736f6c63430008040033";

export { vUnitAbi, vUnitBytecode };