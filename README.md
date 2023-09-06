# **ChainsAtlas GO VSCode**

Bring your favorite programming languages to any blockchain.

## Beta version disclaimer

By using the beta version of ChainsAtlas GO, you acknowledge and understand the potential risks and the unfinished state of the product.

While we strive to offer a seamless experience, unexpected issues might occur. We highly recommend not using the beta version for critical tasks and always maintaining backups of your data.

## **Table of Contents**

- [Usage](#usage)
  - [1. Login](#1-login)
  - [2. Connecting crypto wallet](#2-connecting-crypto-wallet)
  - [3. Deploying a Virtualization Unit](#3-deploying-a-virtualization-unit)
  - [4. Compiling web2 code](#4-compiling-web2-code)
  - [5. Executing web2 code](#5-executing-web2-code)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

## **Usage**

### **1. Login**

You should have received your credentials in your email if you subscribed to the ChainsAtlas GO Early Access list.

If you are not subscribed, [subscribe here](https://chainsatlas.com).

If you are subscribed but did not receive your credentials yet, please wait. We are releasing the early access in batches.

Once you have your credentials at hand, use them to login.

![Login](./assets/img/docs/login.png)

### **2. Connecting crypto wallet**

ChainsAtlas GO uses [WalletConnect](https://walletconnect.com/) to sign transactions and [supports more than 300 crypto wallets](https://walletconnect.com/explorer?type=wallet).

Once you are logged in, a QR code will be displayed. Scan it using one of the supported mobile wallets to connect your wallet.

You can switch chains by selecting an option in the Chain dropdown. Once a new chain is selected, the QR code will be updated and displayed again.

![QR code WalletConnect](./assets/img/docs/qr-code-walletconnect.png)

When you scan the QR code with your mobile wallet, you will be prompted for a confirmation of the wallet connection. Below is an example of a [Metamask](https://metamask.io/) prompt.

![WalletConnect Metamask](./assets/img/docs/walletconnect-metamask.jpeg)

After confirming the connection, you will be able to see your wallet accounts and balance in wei.

![Wallet data](./assets/img/docs/wallet-data.png)

### **3. Deploying a Virtualization Unit**

After connecting your wallet, you are enabled to deploy a ChainsAtlas Virtualzation Unit.

Virtualization Units are smart contracts with an integrated virtual machine capable of executing web2 code on any blockchain.

![Virtualization Unit View](./assets/img/docs/virtualization-unit-view.png)

Click on the deploy button to initiate the deployment process.

![Virtualization Unit Gas Options](./assets/img/docs/virtualization-unit-gas.png)

You will be prompted to choose a gas option. You can choose one of the estimated ones, or enter your custom gas amount. **Remember that the gas amount is measured in wei**.

After choosing an option, click "Send" and confirm the Virtualizatioon Unit deployment through your mobile crypto wallet.

![Virtualization Unit Waiting Approval](./assets/img/docs/virtualization-unit-waiting-approval.png)

![Metamask Virtualization Unit Deployment Confirmation](./assets/img/docs/metamask-v-unit-deploy.jpeg)

![Virtualization Unit Waiting Confirmation](./assets/img/docs/virtualization-unit-waiting-confirmation.png)

Once confirmed, your newly deployed Virtualization Unit will be selected by default.

![Virtualization Unit Contract Selected](./assets/img/docs/virtualization-unit-contract-selected.png)

### **4. Compiling web2 code**

Now, you will need to compile your web2 code to a specific bytecode structure to send it as input to the Virtualization Unit to execute it.

> **Important**: ChainsAtlas GO is in beta. We are continuously supporting more language features and blockchains to improve user experience. Please [check our documentation](https://docs.chainsatlas.com/) to see currently available language features. Using unsupported language features will cause the compiling process to fail.

Click on the "Compile" button to get started.

![Executor View](./assets/img/docs/executor-view.png)

If you have an active file in your editor that is from one of the Virtualization Unit supported programming languages, it will be selected by default. If that is not the case or, if you want to change the file to be compiled, click on the "Upload" button to choose a file from your system.

After selecting a file, you need to input the number of arguments required for your file code execution. You will be setting each argument value in the next step.

Click on "Compile" to send your file content and number of arguments to the ChainsAtlas API to compile them to a Virtualization Unit supported bytecode structure.

![Executor Bytecode Compile](./assets/img/docs/executor-compile.png)

### **5. Executing web2 code**

If you have done all the previous steps correctly, you will see a new form with your uploaded file path and text inputs for your arguments values. Fill them and click on "Estimate Gas" to move forward.

![Executor Estimate Gas](./assets/img/docs/executor-estimated-gas.png)

You will be prompted to choose a gas option. You can choose one of the estimated ones, or enter your custom gas amount. **Remember that the gas amount is measured in wei**.

After choosing an option, click "Execute" and confirm the smart contract interaction through your mobile crypto wallet.

![Executor Gas Options](./assets/img/docs/executor-gas-option.png)

![Executor Waiting Approval](./assets/img/docs/executor-waiting-approval.png)

![Metamask Bytecode Execution](./assets/img/docs/metamask-bytecode-execution.jpeg)

![Executor Waiting Confirmation](./assets/img/docs/executor-waiting-confirmation.png)

Once your transaction is confirmed, the transaction hash and output will be displayed in the Transaction History View. Clicking on the transaction hash value will forward you the selected chain block explorer to visualize the transaction details.

![Transaction History View](./assets/img/docs/transaction-history-view.png)

## **Troubleshooting**

If you encounter issues:

- Check the error message for guidance.
- Ensure login credentials are correct.
- Try disconnecting your wallet and connecting again (could be a problem on your wallet).
- Make sure you are not using a language feature that has not been added yet. [See our docs on available language features](https://docs.chainsatlas.com/).
- Contact us at info@chainsatlas.com

## **Contributing**

We welcome contributions! If you have suggestions, bug reports, or feature requests, please open an issue on our GitHub repository.

---
