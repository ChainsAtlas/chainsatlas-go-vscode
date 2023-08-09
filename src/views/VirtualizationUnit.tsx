import { createRoot } from "react-dom/client";

const VirtualizationUnit = (): JSX.Element => <div />;

const root = createRoot(document.getElementById("root") as HTMLElement);
root.render(<VirtualizationUnit />);
// const buffer = (
//   (estimate * BigInt(100 + bufferRate)) /
//   BigInt(100)
// ).toString();
