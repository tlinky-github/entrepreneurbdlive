import React from "react";
import ReactDOM from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import "@/index.css";
import App from "@/App";

// Suppress ResizeObserver loop limit exceeded error
const resizeObserverErr = "ResizeObserver loop completed with undelivered notifications.";
window.addEventListener("error", (e) => {
  if (e.message === resizeObserverErr || e.message === "ResizeObserver loop limit exceeded") {
    const resizeObserverErrDiv = document.getElementById("webpack-dev-server-client-overlay-div");
    const resizeObserverErrAnchor = document.getElementById("webpack-dev-server-client-overlay");
    if (resizeObserverErrDiv) resizeObserverErrDiv.setAttribute("style", "display: none");
    if (resizeObserverErrAnchor) resizeObserverErrAnchor.setAttribute("style", "display: none");
  }
});

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </React.StrictMode>,
);
