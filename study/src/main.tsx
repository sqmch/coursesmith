import React from "react";
import { createRoot } from "react-dom/client";
// Fonts, bundled offline (no network at runtime). Two families, two roles: Geist
// Sans for humans (prose and chrome alike) and Geist Mono for data. Geist ships
// no italics — the browser synthesizes an oblique for prose `em`, which suits the
// face. Only the weights/subsets actually used are imported — see styles.css.
import "@fontsource/geist-sans/latin-400.css";
import "@fontsource/geist-sans/latin-500.css";
import "@fontsource/geist-sans/latin-600.css";
import "@fontsource/geist-mono/latin-400.css";
import "@fontsource/geist-mono/latin-500.css";
import "@fontsource/geist-mono/latin-600.css";
import App from "./App";
import { migrateLegacyKeys } from "./storage";
import "./styles.css";

// Adopt any cockpit-era ck.* layout keys before App reads study.* (see storage.ts).
migrateLegacyKeys();

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
