import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import "./styles/index.css";
import { initAppVersionGuard } from "./utils/appVersion.js";

// Empêche définitivement l'affichage d'une ancienne version de l'application.
initAppVersionGuard();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
