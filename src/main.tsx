import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// preview a suggested colourway with ?theme=<name>; otherwise the page follows the system's
// light or dark setting (index.html sets it before first paint; this keeps it in step after)
const theme = new URLSearchParams(location.search).get("theme");
if (theme) document.documentElement.dataset.theme = theme;
else
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
    if (e.matches) document.documentElement.dataset.theme = "nightshift";
    else delete document.documentElement.dataset.theme;
  });

createRoot(document.getElementById("root")!).render(<App />);
