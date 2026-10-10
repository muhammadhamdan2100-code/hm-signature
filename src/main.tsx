import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { installGlobalErrorHandlers } from "./lib/observability";

// Register process-wide error capture before the first render so a failure during mount is seen.
installGlobalErrorHandlers();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
