import React from "react";
import { createRoot } from "react-dom/client";
import WalletConnect from "./components/WalletConnect";

const App = (): React.ReactElement => {
  return <WalletConnect />;
};

const root = createRoot(document.getElementById("root") as HTMLElement);
root.render(<App />);
