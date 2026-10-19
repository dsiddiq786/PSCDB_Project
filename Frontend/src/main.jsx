import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import CatalogueProvider from "../Modules/Catalogue/CatalogueProvider.jsx";

// Scroll reveals only apply when JavaScript runs, so content stays visible otherwise.
document.documentElement.classList.add("js");

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <CatalogueProvider>
      <App />
    </CatalogueProvider>
  </StrictMode>,
);
