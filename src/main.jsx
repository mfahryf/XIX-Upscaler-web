
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./styles.css";

// Keeps the browser-visible bundle versioned after the gateway encoding fix.
document.documentElement.dataset.xixVectorizerBuild = "20260919-encoding-fix";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
