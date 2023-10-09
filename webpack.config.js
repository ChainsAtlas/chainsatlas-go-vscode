//@ts-check
"use strict";

const path = require("path");
const webpack = require("webpack");

//@ts-check
/** @typedef {import('webpack').Configuration} WebpackConfig **/

/** @type WebpackConfig */
const extensionConfig = {
  devtool: "nosources-source-map",
  entry: "./src/extension.ts",
  externals: [
    {
      // the vscode-module is created on-the-fly and must be excluded.
      // Add other modules that cannot be webpack'ed
      // https://webpack.js.org/configuration/externals/
      vscode: "commonjs vscode",
      // modules added here also need to be added in the .vscodeignore file
    },
  ],
  externalsPresets: { node: true },
  // enables logging required for problem matchers
  infrastructureLogging: { level: "log" },
  // this leaves the source code as close as possible to the original
  // (when packaging we set this to 'production')
  mode: "none",
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [
          {
            loader: "ts-loader",
          },
        ],
      },
    ],
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "extension.js",
    libraryTarget: "commonjs2",
  },
  resolve: {
    extensions: [".ts", ".js"],
    modules: [path.resolve(__dirname, "node_modules"), "node_modules"],
  },
  // VS Code extensions run in a Node.js-context
  // https://webpack.js.org/configuration/node/
  target: "node",
};

const viewsConfig = {
  entry: {
    executor: {
      import: "./src/views/ExecutorView.tsx",
      dependOn: "vendors",
    },
    transactionHistory: {
      import: "./src/views/TransactionHistoryView.tsx",
      dependOn: "vendors",
    },
    virtualizationUnit: {
      import: "./src/views/VirtualizationUnitView.tsx",
      dependOn: "vendors",
    },
    wallet: {
      import: "./src/views/WalletView.tsx",
      dependOn: "vendors",
    },
    vendors: ["react", "react-dom", "@vscode/webview-ui-toolkit"],
  },
  output: {
    filename: "[name].js",
    path: path.resolve(__dirname, "dist"),
  },
  mode: "production",
  module: {
    rules: [
      {
        test: /\.(ts|js)x?$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: [
              "@babel/preset-env",
              ["@babel/preset-react", { runtime: "automatic" }],
              "@babel/preset-typescript",
            ],
          },
        },
      },
    ],
  },
  resolve: { extensions: [".tsx", ".ts", ".js", ".json"] },
  target: "web",
};

module.exports = [extensionConfig, viewsConfig];
