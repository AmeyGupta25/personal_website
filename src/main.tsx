import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// preview a suggested colourway with ?theme=<name>; the default needs nothing
const theme = new URLSearchParams(location.search).get("theme");
if (theme) document.documentElement.dataset.theme = theme;

createRoot(document.getElementById("root")!).render(<App />);
