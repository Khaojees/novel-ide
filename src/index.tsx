// src/index.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { initializeMockData } from "./api/mockFileAPI";
import { Buffer } from "buffer";
window.Buffer = Buffer;

// Initialize mock data for browser testing
if (!window.electronAPI) {
  initializeMockData();
  console.log("🚀 Novel IDE running in browser mode with mock data");
} else {
  console.log("🚀 Novel IDE running in Electron mode");
}

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
