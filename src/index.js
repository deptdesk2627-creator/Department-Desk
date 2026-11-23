import React from "react";
import ReactDOM from "react-dom/client";
import "./styles/index.css";
import "./styles/layout.css";
import "./styles/components.css";
import App from "./App";
import { ErrorBoundary } from "./components/ui";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);
